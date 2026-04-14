// lib/templates.js — HTML page builders for the web UI.
//
// Each function returns a complete HTML string. No template engine — just
// tagged template literals with a tiny `esc` helper for safety. The CSS
// and client JS are injected from lib/assets.js, the character data from
// lib/characters.js. Pages are styled to feel like the CLI: dark purple,
// per-character accent colors, lore commentary woven through.

import { CHARACTERS, NECROMANCER, ROSTER, pickLine, getCharacter, contextualLine, necromancerCommentary } from './characters.js';
import { STYLES, APP_JS } from './assets.js';
import {
  WORLD_LORE,
  HOARD_QUOTES,
  GRAVEYARD_EPITAPHS,
  INFECTION_PHRASES,
  randomLore,
} from './lore.js';
import { SECTIONS } from './research.js';

// ── HTML escape ──────────────────────────────────────────────────────────────
export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Tiny markdown → HTML (server-side, mirrors client markdownLite) ──────────
export function markdownLite(s) {
  if (!s) return '';
  let out = esc(s);
  out = out.replace(/\[S(\d+)\]/g, '<span class="src">[S$1]</span>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  const lines = out.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    if (/^\s*[-*•]\s/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + line.replace(/^\s*[-*•]\s+/, '') + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim()) html += '<p>' + line + '</p>';
    }
  }
  if (inList) html += '</ul>';
  return html;
}

// ── Site shell (header + footer + style + script slot) ───────────────────────
export function layout({ title, body, head = '', script = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · Zombie Hoard</title>
  <style>${STYLES}</style>
  ${head}
</head>
<body>
  <header class="site">
    <div class="container wrap">
      <a class="brand" href="/">
        <span class="brand-logo">🧟</span>
        <span>
          <div class="brand-name">ZOMBIE HOARD</div>
          <div class="brand-sub">v3.0 — one zombie in a trenchcoat</div>
        </span>
      </a>
      <nav>
        <a href="/">Graveyard</a>
        <a href="/zombies">The Hoard</a>
        <a href="/necromancer">Necromancer</a>
        <a href="/lore">The Hollow</a>
        <a href="/search">Search</a>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      ${body}
    </div>
  </main>
  <footer class="site">
    <div class="container">
      Resurrection Cemetery, Louisville, KY. Population: variable.<br>
      Five drums unaccounted for.
    </div>
  </footer>
  ${script ? `<script>${script}</script>` : ''}
</body>
</html>`;
}

// ── Character card (used on home + zombies index) ────────────────────────────
function characterCardCompact(z, href) {
  const h = href || `/zombies/${z.id.toLowerCase()}`;
  return `<a class="character-card-sm" href="${h}" style="--color: ${z.color};">
    <span class="emoji">${z.emoji}</span>
    <span class="name" style="color: ${z.color};">${esc(z.name)}</span>
    <span class="dim">${esc(z.focus)}</span>
  </a>`;
}

function characterCard(z, hrefBase = '/zombies/') {
  return `<a class="character-card" href="${hrefBase}${esc(z.id.toLowerCase())}" style="--color: ${z.color}; --accent: ${z.accent};">
    <div class="portrait-wrap">${z.portrait(z.color)}</div>
    <div class="meta">
      <div class="name">${z.emoji} ${esc(z.name)}</div>
      <div class="title">${esc(z.title)}</div>
      <div class="focus">${esc(z.focus)}</div>
    </div>
  </a>`;
}

// ── Page: home ───────────────────────────────────────────────────────────────
export function homePage({ graveyard, stats, flash }) {
  const s = stats || {};

  const topicsHtml = (graveyard.entries || []).length === 0
    ? `<div class="panel muted center"><em class="dim">The graveyard is empty. Deploy the hoard to fill it.</em></div>`
    : `<ul class="topic-list">${graveyard.entries.slice(0, 30).map(e => topicListItem(e)).join('')}</ul>`;

  const rosterHtml = ROSTER.map(z => characterCard(z)).join('') +
    `<a class="character-card" href="/necromancer" style="--color: ${NECROMANCER.color}; --accent: ${NECROMANCER.accent};">
       <div class="portrait-wrap">${NECROMANCER.portrait(NECROMANCER.color)}</div>
       <div class="meta">
         <div class="name">${NECROMANCER.emoji} ${esc(NECROMANCER.name)}</div>
         <div class="title">${esc(NECROMANCER.title)}</div>
         <div class="focus">${esc(NECROMANCER.focus)}</div>
       </div>
     </a>`;

  const hasStats = s.totalTopics > 0;
  const avgGround = Math.round((s.avgGroundingRatio || 0) * 100);

  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ''}

    <div class="home-grid">
      <div class="home-main">
        <div class="panel deploy-panel">
          <h2 style="margin-top:0;">🧟 Deploy</h2>
          <form class="deploy" method="POST" action="/deploy">
            <div>
              <label for="topic">Topic</label>
              <input id="topic" name="topic" type="text" placeholder='e.g. "TypeScript generics"' required autofocus>
            </div>
            <div class="row">
              <div>
                <label for="max-sources">Max sources</label>
                <input id="max-sources" name="max_sources" type="number" min="1" max="10" value="5">
              </div>
              <div>
                <label for="url">Inject URL (optional)</label>
                <input id="url" name="url" type="text" placeholder="https://...">
              </div>
            </div>
            <div class="checks">
              <label><input type="checkbox" name="ungrounded" value="1"> Ungrounded mode</label>
            </div>
            <button type="submit">RAISE THE HOARD</button>
          </form>
        </div>

        ${hasStats ? `
        <div class="panel search-panel">
          <form class="deploy" method="GET" action="/search">
            <div style="display:flex;gap:10px;">
              <input name="q" type="text" placeholder="Search claims across all topics..." style="flex:1;">
              <button type="submit" style="white-space:nowrap;">Search</button>
            </div>
          </form>
        </div>` : ''}

        <h2>🪦 The Graveyard ${hasStats ? `<span class="dim" style="font-size:14px;font-weight:400;margin-left:8px;">${s.totalTopics} topics · ${s.totalClaims} claims · ${s.totalSources} sources · ${avgGround}% grounded</span>` : ''}</h2>
        ${topicsHtml}
      </div>

      <div class="home-side">
        <h3>The Hoard</h3>
        <div class="roster-compact">
          ${ROSTER.map(z => characterCardCompact(z)).join('')}
          ${characterCardCompact(NECROMANCER, '/necromancer')}
        </div>
      </div>
    </div>
  `;
  return layout({ title: 'Home', body });
}

function topicListItem(entry) {
  const grounded = entry.groundingRatio != null
    ? Math.round(entry.groundingRatio * 100) + '%' : '?';
  const cited = entry.sourcesCited != null
    ? `${entry.sourcesCited}/${entry.sourcesFetched}` : '?';
  const date = new Date(entry.lastRun).toLocaleDateString();
  return `<li>
    <div class="row1">
      <div>
        <div class="topic-name"><a href="/topic/${esc(entry.slug)}">${esc(entry.topic)}</a></div>
        <div class="meta">
          <span><b>Grounded:</b> ${grounded}</span>
          <span><b>Sources:</b> ${cited}</span>
          <span><b>Sections:</b> ${entry.sectionsCovered ?? '?'}/${entry.sectionsTotal ?? 7}</span>
          <span><b>Claims:</b> ${entry.claimsExtracted ?? '?'}</span>
          <span><b>Runs:</b> ${entry.runCount ?? 1}</span>
          <span>${date}</span>
        </div>
      </div>
    </div>
  </li>`;
}

// ── Page: live run (SSE-driven) ──────────────────────────────────────────────
export function runPage({ runId, topic }) {
  // Pre-serialize the roster (with portraits) so client JS can render
  // each section with the right color, portrait, commentary lines.
  const rosterForClient = ROSTER.map((z) => ({
    id: z.id,
    name: z.name,
    emoji: z.emoji,
    title: z.title,
    epitaph: z.epitaph,
    focus: z.focus,
    hunger: z.hunger,
    color: z.color,
    accent: z.accent,
    portrait: z.portrait(z.color),
    onReveal: z.onReveal,
    voiceSamples: z.voiceSamples,
  }));
  const necQuote = pickLine(NECROMANCER.voiceSamples);

  const body = `
    <h1>🧟 Feeding in progress: ${esc(topic)}</h1>
    <p class="subtitle">"${esc(necQuote)}" — ${esc(NECROMANCER.title)}</p>

    <div id="error-area"></div>

    <div class="panel">
      <h2>Phase tracker</h2>
      <div class="phases" id="phases">
        ${phaseRow('prior', '🩸', 'Hivemind memory', 'checking the graveyard for prior runs')}
        ${phaseRow('sources', '📚', 'Source fetching', 'awaiting deploy')}
        ${phaseRow('research', '💀', 'Necromancer synthesis', 'awaiting reports')}
        ${phaseRow('save', '🪦', 'Inter knowledge', 'awaiting result')}
      </div>
    </div>

    <div id="sources-panel"></div>
    <div id="metrics-area"></div>
    <div id="contradictions-area"></div>

    <h2>🧟 The Feeding</h2>
    <p class="subtitle">As each zombie returns from the source material, their findings rise here.</p>
    <div id="feeding-area" class="feeding"></div>

    <div id="explore-area"></div>
    <div id="diff-area"></div>

    <p class="center" style="margin-top:40px;"><a href="/">← back to the graveyard</a></p>
  `;

  const head = `<meta name="run-id" content="${esc(runId)}">`;
  const script = `window.__ZH_ROSTER = ${JSON.stringify(rosterForClient).replace(/</g, '\\u003c')};\n${APP_JS}`;
  return layout({ title: `Feeding: ${topic}`, body, head, script });
}

function phaseRow(id, icon, label, info) {
  return `<div class="phase" id="phase-${id}"><div class="icon">${icon}</div><div class="label">${label}</div><div class="info">${esc(info)}</div></div>`;
}

// ── Page: saved topic (loads from storage, renders the same way) ─────────────
export function topicPage({ entry, sidecar, content }) {
  const topic = entry.topic;
  const m = sidecar?.metrics || {};
  const sources = sidecar?.sources || [];
  const sections = sidecar?.sections || {};
  const claims = sidecar?.claims || [];
  const contradictions = sidecar?.contradictions || null;
  const exploreNext = sidecar?.exploreNext || [];
  const diff = sidecar?.diff || null;

  // Necromancer's contextual take on the whole run (data-driven, not random)
  const necLine = necromancerCommentary(m);

  // ── TOC ────────────────────────────────────────────────────────────────
  const tocEntries = ROSTER
    .filter((z) => sections[z.id])
    .map((z) => {
      const sc = claims.filter((c) => c.section === z.id);
      const gc = sc.filter((c) => c.grounded).length;
      return { z, count: sc.length, grounded: gc };
    });

  const tocHtml = `<nav class="toc">${tocEntries.map(({ z, count, grounded }) =>
    `<a href="#section-${z.id}" class="toc-item" style="--color: ${z.color};">${z.emoji} ${esc(z.name)} <span class="badge">${count}${count > 0 ? ` / ${grounded} cited` : ''}</span></a>`
  ).join('')}</nav>`;

  // ── Sources with claim mapping ─────────────────────────────────────────
  const sourcesHtml = sources.length === 0
    ? `<div class="panel muted"><em class="dim">No sources fetched — this run was ungrounded.</em></div>`
    : `<div class="panel" id="sources"><h2>📚 Sources</h2><ul class="sources-list">${sources.map(s => {
        const citing = claims.filter(c => c.sources?.includes(s.idx));
        return `<li>
          <span class="src-idx">[S${esc(s.idx)}]</span>
          <span class="src-title">${esc(s.title)}</span>
          <span class="tag">${esc(s.kind || 'src')}</span>
          <span class="dim" style="font-size:11px;margin-left:6px;">${citing.length} claim${citing.length !== 1 ? 's' : ''} cite this</span>
          <a class="src-url" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a>
        </li>`;
      }).join('')}</ul></div>`;

  // ── Metrics ────────────────────────────────────────────────────────────
  const groundedPct = Math.round((m.grounding_ratio || 0) * 100);
  const metricsHtml = `<div class="panel"><div class="metrics">
    ${metric('Sources cited', `${m.sources_cited ?? '?'} <span class="total">/ ${m.sources_fetched ?? '?'}</span>`)}
    ${metric('Sections covered', `${m.sections_covered ?? '?'} <span class="total">/ ${m.sections_total ?? 7}</span>`)}
    ${metric('Claims grounded', `${m.claims_grounded ?? '?'} <span class="total">/ ${m.claims_extracted ?? '?'}</span>`)}
    ${metricBar('Grounding ratio', groundedPct + '%', m.grounding_ratio || 0)}
    ${metric('Run #', String(entry.runCount || 1))}
    ${m.citations_invalid > 0 ? metric('Bad citations', String(m.citations_invalid)) : ''}
  </div></div>`;

  // ── Executive summary ──────────────────────────────────────────────────
  const execHtml = sidecar?.executive
    ? `<div class="exec-summary"><div class="content">${markdownLite(sidecar.executive)}</div></div>`
    : '';

  // ── Feeding: each section card with CONTEXTUAL commentary ─────────────
  const feedingHtml = ROSTER.map((z) => {
    const sectionContent = sections[z.id];
    if (!sectionContent) return '';
    const sectionClaims = claims.filter((c) => c.section === z.id);
    const gc = sectionClaims.filter((c) => c.grounded).length;
    // Contextual commentary: character voice + actual data.
    const commentary = contextualLine(z.id, {
      claimCount: sectionClaims.length,
      groundedCount: gc,
      contentLength: sectionContent.length,
      hasContradictions: contradictions?.toUpperCase().includes(z.id),
      exploreCount: z.id === 'SPORE' ? exploreNext.length : 0,
    });
    return `<div class="zombie-card revealed" id="section-${z.id}" style="--color: ${z.color}; --accent: ${z.accent};">
      <div class="head">
        <div class="portrait-wrap">${z.portrait(z.color)}</div>
        <div class="meta">
          <div class="name">${z.emoji} ${esc(z.name)} <span class="badge">${sectionClaims.length} claims · ${gc} cited</span></div>
          <div class="title">${esc(z.title)}</div>
          <div class="hunger">${esc(z.focus)}</div>
        </div>
      </div>
      <div class="commentary">${esc(commentary)}</div>
      <div class="content">${markdownLite(sectionContent)}</div>
      ${sectionClaims.length > 0 ? `
        <div class="claims">
          <h4>Extracted claims</h4>
          ${sectionClaims.slice(0, 10).map(c => `
            <div class="claim">${esc(c.text)}${c.sources?.length ? `<span class="src">${c.sources.map(i => `[S${i}]`).join(' ')}</span>` : `<span class="dim" style="font-size:11px;margin-left:6px;">uncited</span>`}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>`;
  }).join('');

  const contradictionsHtml = contradictions
    ? `<div class="contradictions"><h3>⚠ Contradictions & Open Questions</h3>${markdownLite(contradictions)}</div>`
    : '';

  const exploreHtml = exploreNext.length > 0
    ? `<div class="panel"><h2>🦠 Explore next</h2><ul class="explore">${exploreNext.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`
    : '';

  const diffHtml = (diff && (diff.added || diff.removed))
    ? `<div class="diff-block"><h3>🩻 Diff vs Prior Run</h3>
        <div class="counts">
          <span class="added">+ ${diff.added} added</span>
          <span class="removed">− ${diff.removed} removed</span>
          <span class="kept">${diff.kept} kept</span>
        </div>
        ${diff.added_claims?.length ? `<h4 class="dim">New:</h4><ul>${diff.added_claims.slice(0, 8).map(c => `<li><span class="dim">(${esc(c.section)})</span> ${esc(c.text)}</li>`).join('')}</ul>` : ''}
        ${diff.removed_claims?.length ? `<h4 class="dim">Dropped:</h4><ul>${diff.removed_claims.slice(0, 8).map(c => `<li><span class="dim">(${esc(c.section)})</span> ${esc(c.text)}</li>`).join('')}</ul>` : ''}
      </div>`
    : '';

  const body = `
    <h1>${esc(topic)}</h1>
    <div class="commentary" style="border-left-color: ${NECROMANCER.color};">${NECROMANCER.emoji} ${esc(necLine)}</div>
    <p class="dim" style="margin-top:-8px;font-size:12px;">Last raised: ${new Date(entry.lastRun).toLocaleString()} · Run #${entry.runCount}</p>

    ${metricsHtml}
    ${execHtml}
    ${tocHtml}
    ${sourcesHtml}
    ${contradictionsHtml}

    <div class="feeding">${feedingHtml}</div>

    ${exploreHtml}
    ${diffHtml}

    <div class="panel" style="margin-top:32px;">
      <form class="deploy" method="POST" action="/deploy">
        <input type="hidden" name="topic" value="${esc(topic)}">
        <button type="submit">🦠 INFECT — re-run and diff against this</button>
      </form>
    </div>

    <p class="center" style="margin-top:30px;"><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: topic, body });
}

function metric(label, value) {
  return `<div class="metric"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>`;
}
function metricBar(label, value, ratio) {
  return `<div class="metric"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="bar"><span style="width: ${Math.round(ratio * 100)}%"></span></div></div>`;
}

// ── Page: zombies index ─────────────────────────────────────────────────────
export function zombiesPage() {
  const body = `
    <h1>🧟 The Hoard</h1>
    <p class="subtitle">Seven facets of one mind. Click any of them to read their bio, hunger, and voice.</p>
    <div class="quote">${esc(randomLore(HOARD_QUOTES))}</div>
    <div class="roster">
      ${ROSTER.map(z => characterCard(z)).join('')}
      <a class="character-card" href="/necromancer" style="--color: ${NECROMANCER.color}; --accent: ${NECROMANCER.accent};">
        <div class="portrait-wrap">${NECROMANCER.portrait(NECROMANCER.color)}</div>
        <div class="meta">
          <div class="name">${NECROMANCER.emoji} ${esc(NECROMANCER.name)}</div>
          <div class="title">${esc(NECROMANCER.title)}</div>
          <div class="focus">${esc(NECROMANCER.focus)}</div>
        </div>
      </a>
    </div>
  `;
  return layout({ title: 'The Hoard', body });
}

// ── Page: individual character bio ──────────────────────────────────────────
export function characterPage({ id, aggregateData }) {
  const c = getCharacter(id);
  if (!c) return notFoundPage(`Character "${id}" not found`);

  const sectionDef = SECTIONS.find((s) => s.id === c.id);
  const agg = aggregateData || [];
  const totalClaims = agg.reduce((s, t) => s + t.claims.length, 0);
  const totalGrounded = agg.reduce((s, t) => s + t.groundedCount, 0);

  // ── Aggregate data: what this character has found across the graveyard ──
  const aggHtml = agg.length > 0
    ? `<div class="panel">
        <h2>What ${esc(c.name)} has found across ${agg.length} topic${agg.length !== 1 ? 's' : ''}</h2>
        <p class="dim">${totalClaims} claims total, ${totalGrounded} grounded (${totalClaims ? Math.round(totalGrounded / totalClaims * 100) : 0}%)</p>
        ${agg.slice(0, 10).map(t => `
          <div style="margin: 12px 0;">
            <h4 style="margin:0;"><a href="/topic/${esc(t.slug)}">${esc(t.topic)}</a> <span class="dim" style="font-size:12px;">${t.claims.length} claims · ${t.groundedCount} cited</span></h4>
            <ul style="margin:6px 0 0;padding-left:22px;font-size:13px;">
              ${t.claims.slice(0, 3).map(cl => `<li>${esc(cl.text)}${cl.sources?.length ? `<span class="src" style="margin-left:4px;">${cl.sources.map(i => `[S${i}]`).join(' ')}</span>` : ''}</li>`).join('')}
              ${t.claims.length > 3 ? `<li class="dim">+ ${t.claims.length - 3} more</li>` : ''}
            </ul>
          </div>
        `).join('')}
      </div>`
    : `<div class="panel muted"><em class="dim">${esc(c.name)} hasn't fed yet. Deploy the Hoard to start filling the graveyard.</em></div>`;

  const body = `
    <div class="bio-header" style="--color: ${c.color}; --accent: ${c.accent};">
      <div class="portrait-wrap">${c.portrait(c.color)}</div>
      <div>
        <h1>${c.emoji} ${esc(c.name)}</h1>
        <div class="title">${esc(c.title)}</div>
        <div class="epitaph">${esc(c.epitaph)}</div>
        <div class="hunger-tag">${esc(c.focus)}</div>
      </div>
    </div>

    ${sectionDef ? `<div class="panel"><h3>What ${esc(c.name)} hunts for</h3><p>${esc(sectionDef.focus)}.</p></div>` : ''}

    ${aggHtml}

    <div class="bio-section">
      <h2>Lore</h2>
      <div class="bio-lore">${esc(c.lore.trim())}</div>
    </div>

    <div class="bio-section" style="--color: ${c.color};">
      <h2>Voice samples</h2>
      <ul class="voice-list">
        ${(c.voiceSamples || []).map(v => `<li>${esc(v)}</li>`).join('')}
      </ul>
    </div>

    <p class="center" style="margin-top:40px;"><a href="/zombies">← back to the hoard</a></p>
  `;
  return layout({ title: c.name, body });
}

// ── Page: necromancer bio ───────────────────────────────────────────────────
export function necromancerPage() {
  const c = NECROMANCER;
  const body = `
    <div class="bio-header" style="--color: ${c.color}; --accent: ${c.accent};">
      <div class="portrait-wrap">${c.portrait(c.color)}</div>
      <div>
        <h1>${c.emoji} ${esc(c.name)}</h1>
        <div class="title">${esc(c.title)}</div>
        <div class="epitaph">${esc(c.epitaph)}</div>
        <div class="hunger-tag">${esc(c.focus)}</div>
      </div>
    </div>

    <div class="panel">
      <h3>The role</h3>
      <p>The Necromancer is the lone mind of the Hoard. The seven cognitive facets are facets of him. He receives all the source material, weighs it against the prior knowledge in the graveyard, and returns one synthesized report — cited, structured, honest about what's contradicted and what's missing.</p>
    </div>

    <div class="bio-section">
      <h2>Lore</h2>
      <div class="bio-lore">${esc(c.lore.trim())}</div>
    </div>

    <div class="bio-section" style="--color: ${c.color};">
      <h2>Voice samples</h2>
      <ul class="voice-list">
        ${c.voiceSamples.map(v => `<li>${esc(v)}</li>`).join('')}
      </ul>
    </div>

    <div class="bio-section" style="--color: ${c.color};">
      <h2>When he begins synthesis</h2>
      <ul class="voice-list">
        ${c.onReveal.map(v => `<li>${esc(v)}</li>`).join('')}
      </ul>
    </div>

    <div class="bio-section" style="--color: ${c.color};">
      <h2>When he files the report</h2>
      <ul class="voice-list">
        ${c.onComplete.map(v => `<li>${esc(v)}</li>`).join('')}
      </ul>
    </div>

    <p class="center" style="margin-top:40px;"><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: 'Necromancer', body });
}

// ── Page: world lore ────────────────────────────────────────────────────────
export function lorePage() {
  const body = `
    <h1>📖 The Hollow</h1>
    <p class="subtitle">Uneeda Medical Supply. Louisville, Kentucky. July 3, 1984.</p>
    <div class="panel">
      <div class="bio-lore">${esc(WORLD_LORE.trim())}</div>
    </div>

    <h2>Atmospheric quotes</h2>
    <div class="panel">
      ${HOARD_QUOTES.map(q => `<div class="quote">${esc(q)}</div>`).join('')}
    </div>

    <p class="center" style="margin-top:40px;"><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: 'The Hollow', body });
}

// ── Page: search results ─────────────────────────────────────────────────────
export function searchPage({ query, results }) {
  const q = query || '';
  const r = results || [];
  const body = `
    <h1>🔍 Search claims</h1>
    <div class="panel">
      <form class="deploy" method="GET" action="/search">
        <div style="display:flex;gap:10px;">
          <input name="q" type="text" placeholder="Search across all graveyard claims..." value="${esc(q)}" style="flex:1;" autofocus>
          <button type="submit">Search</button>
        </div>
      </form>
    </div>
    ${q ? `<p class="dim">${r.length} result${r.length !== 1 ? 's' : ''} for "${esc(q)}"</p>` : ''}
    ${r.length > 0 ? `<ul class="topic-list">${r.map(c => {
      const z = CHARACTERS[c.section];
      return `<li style="border-left-color: ${z?.color || '#6b21a8'};">
        <div class="row1">
          <div>
            <span>${z?.emoji || '🧟'}</span>
            <span class="topic-name" style="font-size:14px;">${esc(c.text)}</span>
            ${c.sources?.length ? `<span class="src" style="font-size:11px;">${c.sources.map(i => `[S${i}]`).join(' ')}</span>` : '<span class="dim" style="font-size:11px;">uncited</span>'}
          </div>
          <div class="meta">
            <span><b>${esc(c.section)}</b></span>
            <span><a href="/topic/${esc(c.slug)}">${esc(c.topic)}</a></span>
          </div>
        </div>
      </li>`;
    }).join('')}</ul>` : (q ? '<div class="panel muted center"><em class="dim">No claims match that query.</em></div>' : '')}
    <p class="center" style="margin-top:30px;"><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: q ? `Search: ${q}` : 'Search', body });
}

// ── Page: 404 ────────────────────────────────────────────────────────────────
export function notFoundPage(message = 'Not found') {
  const body = `
    <h1>404 — ${esc(message)}</h1>
    <p class="subtitle">The drum was empty. Or the drum was never logged in the first place.</p>
    <p><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: '404', body });
}

// ── Page: error ──────────────────────────────────────────────────────────────
export function errorPage(message) {
  const body = `
    <h1>⚠ Operation Rainbow failed</h1>
    <div class="flash">${esc(message)}</div>
    <p><a href="/">← back to the graveyard</a></p>
  `;
  return layout({ title: 'Error', body });
}
