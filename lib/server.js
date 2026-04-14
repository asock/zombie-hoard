// lib/server.js — Web UI server.
//
// Native node http (no express dependency). Serves the templates from
// templates.js, manages in-memory run state for live SSE updates, and
// kicks off Hoard.deploy() asynchronously when a deploy form is posted.
//
// Run state lifecycle:
//   1. POST /deploy creates a runId, stores a RunState in `runs`, kicks off
//      Hoard.deploy() with hooks that push events into the RunState.
//   2. The browser is redirected to /run/<runId>, which renders the live
//      page and opens an EventSource to /run/<runId>/events.
//   3. The SSE handler replays past events first, then subscribes to new
//      ones via the RunState's EventEmitter. The connection closes when
//      the run finishes or fails.
//   4. Completed runs hang around in `runs` for RUN_TTL_MS so the user can
//      reload the page and still get the same data, then are GC'd.

import http from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';
import crypto from 'crypto';

import { Hoard } from './hoard.js';
import { storage } from './storage.js';
import {
  homePage,
  runPage,
  topicPage,
  zombiesPage,
  characterPage,
  necromancerPage,
  lorePage,
  searchPage,
  notFoundPage,
  errorPage,
} from './templates.js';

const RUN_TTL_MS = 30 * 60 * 1000;  // keep finished runs in memory 30min
const RUN_GC_INTERVAL_MS = 5 * 60 * 1000;
const MAX_TOPIC_LEN = 500;

// ── Run state ─────────────────────────────────────────────────────────────────
class RunState extends EventEmitter {
  constructor(runId, topic) {
    super();
    this.setMaxListeners(64);
    this.runId = runId;
    this.topic = topic;
    this.events = [];   // replay buffer
    this.done = false;
    this.error = null;
    this.result = null;
    this.startedAt = Date.now();
    this.finishedAt = null;
  }
  push(type, data = {}) {
    const ev = { type, data, ts: Date.now() };
    this.events.push(ev);
    this.emit('event', ev);
  }
  finish(runResult) {
    this.result = runResult;
    this.done = true;
    this.finishedAt = Date.now();
    this.push('done', { runId: this.runId, diff: runResult.diff || null });
  }
  fail(err) {
    this.error = err.message || String(err);
    this.done = true;
    this.finishedAt = Date.now();
    this.push('error', { message: this.error });
  }
}

const runs = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, st] of runs) {
    if (st.done && st.finishedAt && now - st.finishedAt > RUN_TTL_MS) {
      runs.delete(id);
    }
  }
}, RUN_GC_INTERVAL_MS).unref();

// ── Body parsing for form posts ───────────────────────────────────────────────
function readBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('payload too large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  const out = {};
  for (const [k, v] of params) {
    if (out[k] === undefined) out[k] = v;
    else if (Array.isArray(out[k])) out[k].push(v);
    else out[k] = [out[k], v];
  }
  return out;
}

// ── Sending helpers ───────────────────────────────────────────────────────────
function sendHtml(res, html, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html, 'utf-8'),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(html);
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf-8'),
  });
  res.end(body);
}

function redirect(res, location, status = 303) {
  res.writeHead(status, { Location: location });
  res.end();
}

// ── SSE event writer ──────────────────────────────────────────────────────────
function writeSseEvent(res, ev) {
  res.write(`event: ${ev.type}\n`);
  res.write(`data: ${JSON.stringify(ev.data)}\n\n`);
}

// ── Deploy ────────────────────────────────────────────────────────────────────
function startDeploy({ topic, urls, ungrounded, maxSources }) {
  const runId = crypto.randomUUID();
  const safeTopic = String(topic || '').trim().substring(0, MAX_TOPIC_LEN);
  const state = new RunState(runId, safeTopic);
  runs.set(runId, state);

  // Async — do not await
  (async () => {
    try {
      const hoard = new Hoard({
        urls,
        ungrounded,
        maxSources,
        onPriorLoaded: (prior) => state.push('prior', {
          runCount: prior.runCount,
          claimCount: Array.isArray(prior.claims) ? prior.claims.length : 0,
        }),
        onSourcesStart: () => state.push('sources_start', {}),
        onSourcesFetched: (sources) => state.push('sources_fetched', {
          sources: (sources || []).map((s) => ({
            idx: s.idx,
            title: s.title,
            url: s.url,
            kind: s.kind,
          })),
        }),
        onResearchStart: () => state.push('research_start', {}),
        onResearchComplete: (result) => state.push('research_complete', {
          duration: result.duration,
          metrics: result.metrics,
          executive: result.executive,
          sections: result.sections,
          contradictions: result.contradictions,
          exploreNext: result.exploreNext,
          claims: result.claims,
          sources: result.sources,
        }),
      });
      const runResult = await hoard.deploy(safeTopic);
      if (runResult.meta?.runFailed) {
        // The Necromancer caught its own LLM error and returned an empty
        // result rather than throwing. Pull the message out so the SSE
        // client sees something useful instead of an empty feeding area.
        const md = runResult.result?.markdown || '';
        const m = md.match(/NECROMANCER FAILED:\s*(.+?)(?:\n|$)/);
        state.fail(new Error(m ? m[1].trim() : 'Run failed (see server logs)'));
      } else {
        state.finish(runResult);
      }
    } catch (err) {
      state.fail(err);
    }
  })();

  return runId;
}

// ── Route matching ────────────────────────────────────────────────────────────
function matchRoute(method, pathname) {
  const m = (re) => re.exec(pathname);
  let r;

  if (method === 'GET') {
    if (pathname === '/' || pathname === '') return { name: 'home' };
    if (pathname === '/zombies' || pathname === '/zombies/') return { name: 'zombies' };
    if (pathname === '/necromancer') return { name: 'necromancer' };
    if (pathname === '/lore') return { name: 'lore' };
    if (pathname === '/search') return { name: 'search' };
    if (pathname === '/api/graveyard') return { name: 'apiGraveyard' };

    if ((r = m(/^\/zombies\/([a-zA-Z]+)\/?$/))) return { name: 'zombie', id: r[1] };
    if ((r = m(/^\/topic\/([^/]+)\/?$/))) return { name: 'topic', slug: decodeURIComponent(r[1]) };
    if ((r = m(/^\/api\/topic\/([^/]+)\/?$/))) return { name: 'apiTopic', slug: decodeURIComponent(r[1]) };
    if ((r = m(/^\/run\/([0-9a-f-]{8,})\/events\/?$/))) return { name: 'runEvents', runId: r[1] };
    if ((r = m(/^\/run\/([0-9a-f-]{8,})\/?$/))) return { name: 'run', runId: r[1] };
  }

  if (method === 'POST') {
    if (pathname === '/deploy') return { name: 'deploy' };
  }

  return { name: '404' };
}

// ── Request handler ───────────────────────────────────────────────────────────
async function handle(req, res) {
  let parsed;
  try {
    parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    sendHtml(res, errorPage('Bad request URL'), 400);
    return;
  }
  const route = matchRoute(req.method, parsed.pathname);

  try {
    switch (route.name) {
      case 'home': {
        const graveyard = storage.listGraveyard();
        const stats = storage.aggregateStats();
        sendHtml(res, homePage({ graveyard, stats }));
        return;
      }

      case 'zombies':
        sendHtml(res, zombiesPage());
        return;

      case 'zombie': {
        const aggregateData = storage.aggregateBySection(route.id.toUpperCase(), 15);
        sendHtml(res, characterPage({ id: route.id, aggregateData }));
        return;
      }

      case 'search': {
        const q = parsed.searchParams.get('q') || '';
        const results = q.trim() ? storage.searchClaims(q.trim(), 50) : [];
        sendHtml(res, searchPage({ query: q.trim(), results }));
        return;
      }

      case 'necromancer':
        sendHtml(res, necromancerPage());
        return;

      case 'lore':
        sendHtml(res, lorePage());
        return;

      case 'topic': {
        const recalled = storage.recall(route.slug);
        if (!recalled) { sendHtml(res, notFoundPage(`Topic "${route.slug}" not in the graveyard`), 404); return; }
        // Pull the structured sidecar (the source of truth for the rich UI)
        const sidecar = storage.exportJSON(recalled.entry.topic);
        sendHtml(res, topicPage({
          entry: recalled.entry,
          sidecar,
          content: recalled.content,
        }));
        return;
      }

      case 'apiGraveyard':
        sendJson(res, storage.listGraveyard());
        return;

      case 'apiTopic': {
        const data = storage.exportJSON(route.slug);
        if (!data) { sendJson(res, { error: 'not_found' }, 404); return; }
        sendJson(res, data);
        return;
      }

      case 'deploy': {
        const raw = await readBody(req);
        const form = parseFormBody(raw);
        const topic = (form.topic || '').toString();
        if (!topic.trim()) { sendHtml(res, homePage({ graveyard: storage.listGraveyard(), flash: 'Topic is required.' }), 400); return; }
        const ungrounded = !!form.ungrounded;
        const maxSources = parseInt(form.max_sources, 10);
        const urls = [];
        if (form.url && typeof form.url === 'string' && form.url.trim()) urls.push(form.url.trim());
        const runId = startDeploy({
          topic,
          urls,
          ungrounded,
          maxSources: Number.isFinite(maxSources) && maxSources > 0 ? maxSources : undefined,
        });
        redirect(res, `/run/${runId}`);
        return;
      }

      case 'run': {
        const state = runs.get(route.runId);
        if (!state) {
          sendHtml(res, notFoundPage('Run expired or never existed'), 404);
          return;
        }
        sendHtml(res, runPage({ runId: state.runId, topic: state.topic }));
        return;
      }

      case 'runEvents': {
        const state = runs.get(route.runId);
        if (!state) { sendJson(res, { error: 'run_not_found' }, 404); return; }
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        // Send a comment to flush headers and open the stream
        res.write(': zombie hoard live stream\n\n');

        // Replay buffered events
        for (const ev of state.events) writeSseEvent(res, ev);

        if (state.done) { res.end(); return; }

        const onEvent = (ev) => {
          try {
            writeSseEvent(res, ev);
            if (ev.type === 'done' || ev.type === 'error') {
              state.off('event', onEvent);
              res.end();
            }
          } catch {
            state.off('event', onEvent);
          }
        };
        state.on('event', onEvent);

        // Heartbeat every 15s so proxies don't drop the connection
        const heartbeat = setInterval(() => {
          try { res.write(': ping\n\n'); } catch { /* dead client */ }
        }, 15000);

        req.on('close', () => {
          clearInterval(heartbeat);
          state.off('event', onEvent);
        });
        return;
      }

      default:
        sendHtml(res, notFoundPage('No such page'), 404);
    }
  } catch (err) {
    console.error('Server error:', err);
    sendHtml(res, errorPage(err.message || String(err)), 500);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export function startServer({ port = 7331, host = '127.0.0.1' } = {}) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error('Unhandled in handler:', err);
      try { sendHtml(res, errorPage(err.message || String(err)), 500); } catch { /* */ }
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      resolve({ server, port, host, url: `http://${host}:${port}` });
    });
  });
}
