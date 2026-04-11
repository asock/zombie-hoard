// lib/sources.js — Real-world source fetching.
//
// Context: v2.0 had ZERO grounding. Every "zombie" was the same model's
// training-data priors in a different costume. This module replaces that
// with actual external sources, so the Necromancer has something real
// to chew on.
//
// Default source: Wikipedia (public REST API, no auth, no billing).
// Extensible: any URL you hand it will be fetched, stripped to text, and
// added to the context.
//
// Everything here is best-effort. If Wikipedia is unreachable, if the
// topic has no article, if a URL 404s — we return whatever we got and
// let the research layer decide how to degrade. We never block the
// whole run on a source fetch.

import { safeInt } from './util.js';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'zombie-hoard/3.0 (+https://github.com/asock/zombie-hoard)';

const DEFAULT_MAX_SOURCES = 5;
const DEFAULT_MAX_CHARS_PER_SOURCE = 6000;
const DEFAULT_TIMEOUT_MS = 10_000;

// ── Low-level fetch with timeout ──────────────────────────────────────────────
function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) };
}

async function safeFetch(url, { timeout, headers = {} } = {}) {
  const { signal, clear } = withTimeout(timeout);
  try {
    const res = await fetch(url, {
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/html, */*', ...headers },
    });
    return res;
  } catch {
    return null;
  } finally {
    clear();
  }
}

// ── Wikipedia search → titles ─────────────────────────────────────────────────
async function wikiSearch(query, limit, timeout) {
  const url = new URL(WIKI_API_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('srlimit', String(limit));
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await safeFetch(url.toString(), { timeout });
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    return (data?.query?.search || []).map((r) => r.title);
  } catch {
    return [];
  }
}

// ── Wikipedia extract → plain text ────────────────────────────────────────────
async function wikiExtract(title, timeout) {
  const url = new URL(WIKI_API_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('prop', 'extracts|info');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('exlimit', '1');
  url.searchParams.set('inprop', 'url');
  url.searchParams.set('titles', title);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('redirects', '1');

  const res = await safeFetch(url.toString(), { timeout });
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === '-1') return null;
    const page = pages[pageId];
    if (!page?.extract || page.extract.length < 200) return null;
    return {
      title: page.title,
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      text: page.extract,
      kind: 'wikipedia',
    };
  } catch {
    return null;
  }
}

// ── Arbitrary URL → plain text (best effort) ──────────────────────────────────
export async function fetchUrl(urlStr, timeout = DEFAULT_TIMEOUT_MS) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const res = await safeFetch(parsed.toString(), { timeout });
  if (!res || !res.ok) return null;
  try {
    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();
    const text = contentType.includes('text/html') ? htmlToText(body) : body;
    if (!text || text.length < 100) return null;
    return {
      title: parsed.hostname + parsed.pathname,
      url: parsed.toString(),
      text,
      kind: 'url',
    };
  } catch {
    return null;
  }
}

// ── HTML → plain text (dumb but effective) ────────────────────────────────────
function htmlToText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max) + '\n\n... [source truncated at ' + max + ' chars]';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch real sources for a topic.
 *
 * @param {string} topic
 * @param {object} [opts]
 * @param {number} [opts.maxSources]         - Max total sources to return
 * @param {number} [opts.maxCharsPerSource]  - Per-source text cap
 * @param {number} [opts.timeoutMs]          - Per-request timeout
 * @param {string[]} [opts.urls]             - Explicit URLs to inject before Wikipedia
 * @returns {Promise<Array<{idx:number,title:string,url:string,text:string,kind:string}>>}
 */
export async function fetchSources(topic, opts = {}) {
  const maxSources = opts.maxSources ?? safeInt(process.env.ZOMBIE_MAX_SOURCES, DEFAULT_MAX_SOURCES);
  const maxChars = opts.maxCharsPerSource ?? safeInt(process.env.ZOMBIE_MAX_CHARS_PER_SOURCE, DEFAULT_MAX_CHARS_PER_SOURCE);
  const timeout = opts.timeoutMs ?? safeInt(process.env.ZOMBIE_SOURCE_TIMEOUT, DEFAULT_TIMEOUT_MS);
  const extraUrls = Array.isArray(opts.urls) ? opts.urls : [];

  const sources = [];
  const seenUrls = new Set();

  // 1. User-supplied URLs first (highest priority)
  for (const url of extraUrls) {
    if (sources.length >= maxSources) break;
    const src = await fetchUrl(url, timeout);
    if (src && !seenUrls.has(src.url)) {
      sources.push(src);
      seenUrls.add(src.url);
    }
  }

  // 2. Wikipedia: search then extract top N candidates
  if (sources.length < maxSources) {
    const remaining = maxSources - sources.length;
    // Ask for more than we need, because some won't have usable extracts.
    const titles = await wikiSearch(topic, remaining * 2 + 2, timeout);
    for (const title of titles) {
      if (sources.length >= maxSources) break;
      const src = await wikiExtract(title, timeout);
      if (src && !seenUrls.has(src.url)) {
        sources.push(src);
        seenUrls.add(src.url);
      }
    }
  }

  // 3. Normalize (index + truncate)
  return sources.map((s, i) => ({
    idx: i + 1,
    title: s.title,
    url: s.url,
    text: truncate(s.text, maxChars),
    kind: s.kind,
  }));
}

/**
 * Format a list of sources as a context block to paste into an LLM prompt.
 * Uses [S1], [S2]... conventions that the research prompt references for citations.
 */
export function sourcesToContext(sources) {
  if (!sources || sources.length === 0) {
    return '(no external sources available — answer conservatively from general knowledge and explicitly mark uncited claims as "[uncited — general knowledge]")';
  }
  return sources
    .map((s) => `[S${s.idx}] ${s.title}\nURL: ${s.url}\n---\n${s.text}`)
    .join('\n\n═════════════════════════════════════════\n\n');
}
