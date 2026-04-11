// lib/assets.js — Embedded CSS and client JS for the web UI.
//
// Kept as exported strings (rather than separate files) so the server has
// no filesystem-relative-path issues under ESM. The CSS is hand-tuned for
// the existing CLI palette: deep purples on near-black, with each
// character getting their own accent color used as a CSS custom property.

export const STYLES = `
/* ==== reset / base ==== */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: radial-gradient(ellipse at top, #1a0820 0%, #0a0010 60%, #000 100%);
  color: #e2d6ed;
  min-height: 100vh;
  line-height: 1.55;
}
a { color: #c39bd3; text-decoration: none; }
a:hover { color: #00ffcc; text-decoration: underline; }
code, pre { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; }
pre {
  background: #0f0518;
  border: 1px solid #2a1840;
  padding: 1em;
  overflow-x: auto;
  border-radius: 4px;
  font-size: 13px;
}
hr { border: none; border-top: 1px solid #2a1840; margin: 2em 0; }

/* ==== layout ==== */
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
header.site {
  background: linear-gradient(180deg, #14041e 0%, transparent 100%);
  border-bottom: 1px solid #2a1840;
  padding: 18px 0;
  margin-bottom: 32px;
}
header.site .wrap { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
header.site .brand { display: flex; align-items: center; gap: 12px; }
header.site .brand-logo { font-size: 28px; }
header.site .brand-name { font-size: 20px; font-weight: 700; color: #c39bd3; letter-spacing: 0.05em; }
header.site .brand-sub { color: #6a2a8a; font-size: 12px; font-style: italic; }
header.site nav a {
  margin-left: 18px; font-size: 14px; color: #9b59b6; text-transform: uppercase; letter-spacing: 0.08em;
}
header.site nav a:hover { color: #00ffcc; }

footer.site {
  margin-top: 80px; padding: 30px 0; border-top: 1px solid #2a1840;
  color: #6a2a8a; font-size: 12px; text-align: center; font-style: italic;
}

main { padding-bottom: 60px; }
h1, h2, h3, h4 { color: #e2d6ed; font-weight: 700; }
h1 { font-size: 32px; margin: 0 0 12px; letter-spacing: 0.02em; }
h2 { font-size: 22px; margin: 32px 0 12px; color: #c39bd3; }
h3 { font-size: 17px; margin: 20px 0 8px; }
.subtitle { color: #9b59b6; font-style: italic; margin-top: -8px; margin-bottom: 24px; }

/* ==== panels ==== */
.panel {
  background: #0f0518;
  border: 1px solid #2a1840;
  border-radius: 6px;
  padding: 24px;
  margin-bottom: 24px;
}
.panel.muted { background: transparent; border: 1px dashed #2a1840; }

/* ==== home: deploy form ==== */
form.deploy { display: grid; gap: 14px; }
form.deploy label { display: block; font-size: 12px; color: #9b59b6; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
form.deploy input[type="text"], form.deploy input[type="number"] {
  width: 100%;
  background: #0a0010;
  border: 1px solid #4a0080;
  color: #e2d6ed;
  padding: 12px 14px;
  font-size: 16px;
  border-radius: 4px;
  font-family: inherit;
}
form.deploy input[type="text"]:focus, form.deploy input[type="number"]:focus {
  outline: none; border-color: #c084fc; box-shadow: 0 0 0 3px rgba(192,132,252,0.15);
}
form.deploy .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
form.deploy .checks label { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; color: #c39bd3; font-size: 13px; cursor: pointer; }
form.deploy button {
  background: linear-gradient(180deg, #6b21a8 0%, #4a0080 100%);
  color: #fff;
  border: 1px solid #c084fc;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
form.deploy button:hover { background: linear-gradient(180deg, #7e22ce 0%, #5b1199 100%); transform: translateY(-1px); }
form.deploy button:active { transform: translateY(0); }

/* ==== quote panel ==== */
.quote {
  background: linear-gradient(135deg, #14041e 0%, #1a0820 100%);
  border-left: 3px solid #c084fc;
  padding: 18px 24px;
  margin: 24px 0;
  font-style: italic;
  color: #c39bd3;
  font-size: 14px;
}

/* ==== character roster grid ==== */
.roster { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.character-card {
  background: #0f0518;
  border: 1px solid var(--accent, #2a1840);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: all 0.15s ease;
  text-decoration: none;
}
.character-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); border-color: var(--color, #c084fc); }
.character-card .portrait-wrap { width: 64px; height: 64px; flex-shrink: 0; border-radius: 4px; overflow: hidden; }
.character-card .portrait-wrap svg { width: 100%; height: 100%; }
.character-card .meta { flex: 1; min-width: 0; }
.character-card .meta .name { color: var(--color, #fff); font-weight: 700; font-size: 14px; letter-spacing: 0.05em; }
.character-card .meta .title { color: #c39bd3; font-size: 12px; font-style: italic; }
.character-card .meta .focus { color: #6a2a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

/* ==== topic / graveyard list ==== */
.topic-list { list-style: none; padding: 0; margin: 0; }
.topic-list li {
  background: #0f0518;
  border: 1px solid #2a1840;
  border-left: 3px solid #6b21a8;
  border-radius: 4px;
  padding: 14px 18px;
  margin-bottom: 10px;
  transition: all 0.15s ease;
}
.topic-list li:hover { border-left-color: #c084fc; transform: translateX(2px); }
.topic-list .row1 { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
.topic-list .topic-name { font-weight: 700; color: #fff; font-size: 16px; }
.topic-list .meta { font-size: 12px; color: #6a2a8a; display: flex; gap: 12px; }
.topic-list .meta b { color: #c39bd3; }

/* ==== run page: phases ==== */
.phases { display: grid; gap: 12px; }
.phase {
  background: #0a0010;
  border: 1px solid #2a1840;
  border-radius: 4px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0.4;
  transition: all 0.4s ease;
}
.phase.active { opacity: 1; border-color: #c084fc; box-shadow: 0 0 24px rgba(192,132,252,0.15); }
.phase.done { opacity: 0.85; border-color: #00ffcc; }
.phase.failed { opacity: 1; border-color: #fca5a5; }
.phase .icon { font-size: 22px; }
.phase .label { flex: 1; font-weight: 600; }
.phase .info { font-size: 12px; color: #9b59b6; }

.spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(192,132,252,0.25);
  border-top-color: #c084fc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ==== zombie / section card (the "feeding" reveal) ==== */
.feeding { display: grid; gap: 22px; }
.zombie-card {
  background: #0f0518;
  border: 1px solid var(--accent, #2a1840);
  border-left: 4px solid var(--color, #c084fc);
  border-radius: 6px;
  padding: 24px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.zombie-card.revealed { opacity: 1; transform: translateY(0); }
.zombie-card .head { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 16px; }
.zombie-card .portrait-wrap { width: 90px; height: 90px; flex-shrink: 0; border-radius: 4px; overflow: hidden; border: 1px solid var(--color, #2a1840); }
.zombie-card .portrait-wrap svg { width: 100%; height: 100%; }
.zombie-card .head .meta { flex: 1; min-width: 0; }
.zombie-card .head .name {
  font-size: 22px; font-weight: 800; letter-spacing: 0.06em;
  color: var(--color, #fff); margin: 0 0 4px;
}
.zombie-card .head .title { color: #c39bd3; font-style: italic; font-size: 13px; }
.zombie-card .head .epitaph { color: #6a2a8a; font-size: 11px; font-style: italic; margin-top: 4px; }
.zombie-card .head .hunger {
  display: inline-block; margin-top: 8px; font-size: 11px; padding: 3px 8px; border-radius: 3px;
  background: var(--accent, #2a1840); color: var(--color, #fff); text-transform: uppercase; letter-spacing: 0.06em;
}

.zombie-card .commentary {
  background: #14041e;
  border-left: 2px solid var(--color, #c084fc);
  padding: 10px 14px;
  margin: 10px 0 18px;
  font-style: italic;
  color: #c39bd3;
  font-size: 13px;
}

.zombie-card .content {
  font-size: 14px;
  color: #d8d4e4;
  line-height: 1.7;
}
.zombie-card .content ul { padding-left: 22px; }
.zombie-card .content li { margin-bottom: 6px; }
.zombie-card .content p { margin: 0 0 12px; }
.zombie-card .content a { color: var(--color, #c084fc); }

.zombie-card .claims {
  margin-top: 16px;
  border-top: 1px dashed #2a1840;
  padding-top: 14px;
}
.zombie-card .claims h4 { color: #6a2a8a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px; }
.zombie-card .claim {
  font-size: 13px;
  padding: 6px 10px;
  margin: 4px 0;
  background: #0a0010;
  border-left: 2px solid var(--color, #c084fc);
  border-radius: 0 3px 3px 0;
}
.zombie-card .claim .src { color: #00ffcc; font-size: 11px; margin-left: 6px; }

/* ==== sources panel ==== */
.sources-list { list-style: none; padding: 0; margin: 0; }
.sources-list li {
  background: #0a0010;
  border-left: 2px solid #00ffcc;
  padding: 10px 14px;
  margin-bottom: 6px;
  font-size: 13px;
  border-radius: 0 3px 3px 0;
}
.sources-list .src-idx { color: #00ffcc; font-weight: 700; margin-right: 8px; }
.sources-list .src-title { color: #fff; }
.sources-list .src-url { color: #6a2a8a; font-size: 11px; display: block; margin-top: 2px; word-break: break-all; }

/* ==== metrics ==== */
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.metric {
  background: #0a0010;
  border: 1px solid #2a1840;
  border-radius: 4px;
  padding: 14px 18px;
}
.metric .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6a2a8a; }
.metric .value { font-size: 22px; font-weight: 700; color: #fff; margin-top: 4px; }
.metric .value .total { color: #6a2a8a; font-size: 14px; }
.bar {
  margin-top: 8px;
  background: #14041e;
  border-radius: 2px;
  height: 8px;
  overflow: hidden;
}
.bar > span { display: block; height: 100%; background: linear-gradient(90deg, #c084fc 0%, #00ffcc 100%); transition: width 0.6s ease; }

/* ==== contradictions ==== */
.contradictions {
  background: #2a0a0f;
  border: 1px solid #fca5a5;
  border-left: 4px solid #fca5a5;
  border-radius: 4px;
  padding: 18px 22px;
  margin: 24px 0;
}
.contradictions h3 { color: #fca5a5; margin-top: 0; }
.contradictions p, .contradictions li { color: #f4e0e3; }

/* ==== diff block ==== */
.diff-block {
  background: #14041e;
  border: 1px solid #2a1840;
  border-radius: 4px;
  padding: 18px;
  margin: 20px 0;
}
.diff-block .counts { display: flex; gap: 20px; font-size: 14px; }
.diff-block .added { color: #86efac; }
.diff-block .removed { color: #fca5a5; }
.diff-block .kept { color: #6a2a8a; }
.diff-block ul { margin: 8px 0; padding-left: 22px; font-size: 13px; }

/* ==== character page (full bio) ==== */
.bio-header { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 24px; }
.bio-header .portrait-wrap { width: 200px; height: 200px; flex-shrink: 0; border-radius: 6px; overflow: hidden; border: 2px solid var(--color, #c084fc); }
.bio-header .portrait-wrap svg { width: 100%; height: 100%; }
.bio-header h1 { color: var(--color, #fff); margin: 0; font-size: 36px; }
.bio-header .title { color: #c39bd3; font-style: italic; font-size: 16px; margin-top: 4px; }
.bio-header .epitaph { color: #6a2a8a; font-style: italic; margin-top: 8px; font-size: 14px; }
.bio-header .hunger-tag {
  display: inline-block; margin-top: 12px;
  background: var(--accent, #2a1840); color: var(--color, #fff);
  padding: 4px 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  border-radius: 3px;
}

.bio-section { margin-top: 24px; }
.bio-section h2 { font-size: 16px; color: #6a2a8a; text-transform: uppercase; letter-spacing: 0.1em; }
.bio-lore { font-size: 14px; line-height: 1.8; color: #d8d4e4; white-space: pre-wrap; }
.voice-list { list-style: none; padding: 0; }
.voice-list li {
  background: #0a0010;
  border-left: 2px solid var(--color, #c084fc);
  padding: 10px 16px;
  margin: 6px 0;
  font-style: italic;
  color: #c39bd3;
  border-radius: 0 3px 3px 0;
}

/* ==== explore-next ==== */
.explore { list-style: none; padding: 0; }
.explore li {
  background: #0a0010;
  border: 1px solid #2a1840;
  padding: 8px 14px;
  margin: 4px 0;
  border-radius: 3px;
  font-size: 13px;
}
.explore li::before { content: '🦠 '; }

/* ==== misc helpers ==== */
.dim { color: #6a2a8a; }
.tag { display: inline-block; padding: 2px 7px; font-size: 11px; border-radius: 3px; background: #2a1840; color: #c39bd3; margin-right: 6px; }
.center { text-align: center; }
.flash {
  background: #fca5a5;
  color: #2a0a0f;
  padding: 12px 18px;
  border-radius: 4px;
  font-weight: 700;
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .bio-header { flex-direction: column; }
  .bio-header .portrait-wrap { width: 140px; height: 140px; }
  form.deploy .row { grid-template-columns: 1fr; }
  header.site .wrap { flex-direction: column; align-items: flex-start; }
  header.site nav a { margin-left: 0; margin-right: 14px; }
}
`;

// Client-side JavaScript: SSE handling + section reveal animation.
// Loaded once per run page; the run-page template embeds the runId.
export const APP_JS = `
(function () {
  var runIdMeta = document.querySelector('meta[name="run-id"]');
  if (!runIdMeta) return;
  var runId = runIdMeta.content;
  var phaseList = document.getElementById('phases');
  var sourcesPanel = document.getElementById('sources-panel');
  var feedingArea = document.getElementById('feeding-area');
  var metricsArea = document.getElementById('metrics-area');
  var contradictionsArea = document.getElementById('contradictions-area');
  var exploreArea = document.getElementById('explore-area');
  var diffArea = document.getElementById('diff-area');
  var errorArea = document.getElementById('error-area');

  function setPhase(id, state) {
    var el = document.getElementById('phase-' + id);
    if (!el) return;
    el.classList.remove('active', 'done', 'failed');
    el.classList.add(state);
    var icon = el.querySelector('.icon');
    if (icon && state === 'active') icon.innerHTML = '<span class="spinner"></span>';
    else if (icon && state === 'done') icon.textContent = '✓';
    else if (icon && state === 'failed') icon.textContent = '✗';
  }

  function setPhaseInfo(id, info) {
    var el = document.getElementById('phase-' + id);
    if (!el) return;
    var infoEl = el.querySelector('.info');
    if (infoEl) infoEl.textContent = info;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function renderSources(sources) {
    if (!sourcesPanel) return;
    if (!sources || sources.length === 0) {
      sourcesPanel.innerHTML = '<div class="panel muted"><em class="dim">No sources fetched — this run will be ungrounded.</em></div>';
      return;
    }
    var html = '<div class="panel"><h2>📚 Sources Fed to the Hoard</h2><ul class="sources-list">';
    sources.forEach(function (s) {
      html += '<li>';
      html += '<span class="src-idx">[S' + s.idx + ']</span>';
      html += '<span class="src-title">' + escapeHtml(s.title) + '</span>';
      html += ' <span class="tag">' + escapeHtml(s.kind) + '</span>';
      html += '<a class="src-url" href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.url) + '</a>';
      html += '</li>';
    });
    html += '</ul></div>';
    sourcesPanel.innerHTML = html;
  }

  function renderMetrics(m, totalDuration) {
    if (!metricsArea) return;
    var groundedPct = Math.round((m.grounding_ratio || 0) * 100);
    var html = '<div class="panel"><h2>☠️ Synthesis Report</h2><div class="metrics">';
    html += metricCard('Sources cited', m.sources_cited, m.sources_fetched);
    html += metricCard('Sections covered', m.sections_covered, m.sections_total);
    html += metricCard('Claims grounded', m.claims_grounded, m.claims_extracted);
    html += metricCardBar('Grounding ratio', groundedPct + '%', m.grounding_ratio || 0);
    if (typeof totalDuration !== 'undefined') html += metricCardSimple('Duration', totalDuration + 's');
    if (m.citations_invalid > 0) html += metricCardSimple('Bad citations', m.citations_invalid);
    html += '</div></div>';
    metricsArea.innerHTML = html;
  }

  function metricCard(label, num, denom) {
    return '<div class="metric"><div class="label">' + label + '</div><div class="value">' + num + ' <span class="total">/ ' + denom + '</span></div></div>';
  }
  function metricCardSimple(label, val) {
    return '<div class="metric"><div class="label">' + label + '</div><div class="value">' + val + '</div></div>';
  }
  function metricCardBar(label, val, ratio) {
    return '<div class="metric"><div class="label">' + label + '</div><div class="value">' + val + '</div><div class="bar"><span style="width: ' + (ratio * 100) + '%"></span></div></div>';
  }

  function renderContradictions(text) {
    if (!contradictionsArea || !text) return;
    contradictionsArea.innerHTML = '<div class="contradictions"><h3>⚠ Contradictions & Open Questions</h3><div>' + markdownLite(text) + '</div></div>';
  }

  function renderExplore(items) {
    if (!exploreArea || !items || items.length === 0) return;
    var html = '<div class="panel"><h2>🦠 Send More Paramedics To</h2><ul class="explore">';
    items.forEach(function (t) { html += '<li>' + escapeHtml(t) + '</li>'; });
    html += '</ul></div>';
    exploreArea.innerHTML = html;
  }

  function renderDiff(diff) {
    if (!diffArea || !diff) return;
    if (diff.added === 0 && diff.removed === 0 && diff.kept === 0) return;
    var html = '<div class="diff-block"><h3>🩻 Diff vs Prior Run</h3>';
    html += '<div class="counts">';
    html += '<span class="added">+ ' + diff.added + ' added</span>';
    html += '<span class="removed">− ' + diff.removed + ' removed</span>';
    html += '<span class="kept">' + diff.kept + ' kept</span>';
    html += '</div>';
    if (diff.added_claims && diff.added_claims.length) {
      html += '<h4 class="dim">New since last run:</h4><ul>';
      diff.added_claims.slice(0, 8).forEach(function (c) {
        html += '<li><span class="dim">(' + escapeHtml(c.section) + ')</span> ' + escapeHtml(c.text) + '</li>';
      });
      html += '</ul>';
    }
    if (diff.removed_claims && diff.removed_claims.length) {
      html += '<h4 class="dim">Dropped since last run:</h4><ul>';
      diff.removed_claims.slice(0, 8).forEach(function (c) {
        html += '<li><span class="dim">(' + escapeHtml(c.section) + ')</span> ' + escapeHtml(c.text) + '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';
    diffArea.innerHTML = html;
  }

  // Tiny markdown: handles inline citations [S1], bold **x**, italic *x*, line breaks, lists.
  function markdownLite(s) {
    if (!s) return '';
    s = escapeHtml(s);
    s = s.replace(/\\[S(\\d+)\\]/g, '<span class="src">[S$1]</span>');
    s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    s = s.replace(/(?<!\\*)\\*([^*\\n]+)\\*(?!\\*)/g, '<em>$1</em>');
    var lines = s.split('\\n');
    var html = '';
    var inList = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^\\s*[-*•]\\s/.test(line)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + line.replace(/^\\s*[-*•]\\s+/, '') + '</li>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (line.trim()) html += '<p>' + line + '</p>';
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  function revealZombieCards(researchData) {
    if (!feedingArea) return;
    feedingArea.innerHTML = '';
    var sections = researchData.sections || {};
    var claims = researchData.claims || [];
    var roster = window.__ZH_ROSTER || [];

    roster.forEach(function (z, idx) {
      var content = sections[z.id];
      if (!content) return;
      var commentary = pickRandom(z.onReveal);
      var sectionClaims = claims.filter(function (c) { return c.section === z.id; });
      var card = document.createElement('div');
      card.className = 'zombie-card';
      card.style.setProperty('--color', z.color);
      card.style.setProperty('--accent', z.accent);

      var html = '';
      html += '<div class="head">';
      html += '  <div class="portrait-wrap">' + z.portrait + '</div>';
      html += '  <div class="meta">';
      html += '    <div class="name">' + z.emoji + ' ' + escapeHtml(z.name) + '</div>';
      html += '    <div class="title">' + escapeHtml(z.title) + '</div>';
      html += '    <div class="epitaph">' + escapeHtml(z.epitaph) + '</div>';
      html += '    <div class="hunger">' + escapeHtml(z.focus) + '</div>';
      html += '  </div>';
      html += '</div>';
      if (commentary) html += '<div class="commentary">' + escapeHtml(commentary) + '</div>';
      html += '<div class="content">' + markdownLite(content) + '</div>';

      if (sectionClaims.length > 0) {
        html += '<div class="claims"><h4>What ' + escapeHtml(z.name) + ' brought back</h4>';
        sectionClaims.slice(0, 8).forEach(function (c) {
          var srcs = (c.sources || []).map(function (i) { return '[S' + i + ']'; }).join(' ');
          html += '<div class="claim">' + escapeHtml(c.text);
          if (srcs) html += '<span class="src">' + escapeHtml(srcs) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      card.innerHTML = html;
      feedingArea.appendChild(card);
      // Stagger reveal
      setTimeout(function () { card.classList.add('revealed'); }, 350 + idx * 600);
    });
  }

  function pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── SSE wiring ──
  var es = new EventSource('/run/' + runId + '/events');

  es.addEventListener('prior', function (e) {
    var d = JSON.parse(e.data);
    setPhase('prior', 'done');
    setPhaseInfo('prior', 'run #' + d.runCount + ' · ' + d.claimCount + ' prior claims');
  });

  es.addEventListener('sources_start', function () {
    setPhase('prior', 'done');
    setPhase('sources', 'active');
    setPhaseInfo('sources', 'fetching from Wikipedia...');
  });

  es.addEventListener('sources_fetched', function (e) {
    var d = JSON.parse(e.data);
    setPhase('sources', 'done');
    setPhaseInfo('sources', d.sources.length + ' sources retrieved');
    renderSources(d.sources);
  });

  es.addEventListener('research_start', function () {
    setPhase('research', 'active');
    setPhaseInfo('research', 'Glover is reading the reports...');
  });

  es.addEventListener('research_complete', function (e) {
    var d = JSON.parse(e.data);
    setPhase('research', 'done');
    setPhaseInfo('research', d.duration + 's · ' + d.metrics.claims_extracted + ' claims · ' + Math.round(d.metrics.grounding_ratio * 100) + '% grounded');
    renderMetrics(d.metrics, d.duration);
    revealZombieCards(d);
    renderContradictions(d.contradictions);
    renderExplore(d.exploreNext);
  });

  es.addEventListener('done', function (e) {
    setPhase('save', 'done');
    setPhaseInfo('save', 'knowledge interred in the graveyard');
    var d = {};
    try { d = JSON.parse(e.data); } catch (_) {}
    if (d.diff) renderDiff(d.diff);
    es.close();
  });

  es.addEventListener('error', function (e) {
    var msg = 'Connection lost or run failed';
    try { var d = JSON.parse(e.data); if (d.message) msg = d.message; } catch (_) {}
    if (errorArea) errorArea.innerHTML = '<div class="flash">⚠ ' + escapeHtml(msg) + '</div>';
    ['prior','sources','research','save'].forEach(function (id) {
      var el = document.getElementById('phase-' + id);
      if (el && !el.classList.contains('done')) setPhase(id, 'failed');
    });
    es.close();
  });
})();
`;
