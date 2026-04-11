// lib/research.js — The honest research pipeline.
//
// Replaces the v2.0 fan-out (7 cosplaying "zombies" + 1 "necromancer", all
// the same model with no grounding) with ONE well-structured call against
// REAL fetched sources. The 7 cognitive angles survive as section headers
// in the output, because they're useful as a coverage rubric — they were
// just never useful as separate model calls.
//
// What this gives you that v2.0 didn't:
//   • Inline [S1], [S2] citations to actual fetched documents
//   • Structured claim extraction so re-runs can diff, not echo
//   • Objective metrics (sources cited, grounding ratio, sections covered)
//     instead of self-reported "Undead Index" / "Hoard Score" theatre
//   • One call instead of eight, at roughly 1/4 the token cost

import { chatComplete } from './llm.js';
import { sourcesToContext } from './sources.js';
import { safeInt } from './util.js';

// ── The 7 sections (formerly "zombies") ──────────────────────────────────────
// They live on as a coverage rubric, not as separate model calls.
export const SECTIONS = [
  { id: 'CORTEX',  emoji: '🧠', title: 'Core Concepts', focus: 'first principles, definitions, mental models' },
  { id: 'RELIC',   emoji: '📜', title: 'History',       focus: 'origins, evolution, key milestones' },
  { id: 'GEARS',   emoji: '⚙️',  title: 'Mechanics',     focus: 'technical internals, implementation, trade-offs' },
  { id: 'VENOM',   emoji: '🩸', title: 'Pitfalls',      focus: 'failure modes, gotchas, honest criticism' },
  { id: 'CLAW',    emoji: '🛠️',  title: 'Practical',     focus: 'real-world patterns, actionable examples' },
  { id: 'SPORE',   emoji: '🕸️',  title: 'Connections',   focus: 'cross-domain analogies, related concepts' },
  { id: 'PROPHET', emoji: '🔮', title: 'Future',        focus: 'trends, emerging directions, what comes next' },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the NECROMANCER, the lone mind of the Hoard.
The "zombies" of legend are just facets of how you chew a topic. The Hoard
learned, the hard way, that seven agents in different costumes were really
one model in a trenchcoat — so now you do it honestly: one mind, real
sources, cited claims.

Rules of the Grave:
1. CITE EVERYTHING. Every non-trivial claim gets an inline citation like
   [S1] or [S3] mapping to the SOURCES list the user provides. If no
   source supports a claim, mark it [uncited] explicitly. NEVER invent
   a citation index that isn't in the provided list.
2. If the sources don't cover a section well, say so plainly. A short
   grounded section is worth more than a long hallucinated one.
3. Contradictions between sources are GOLD — surface them under the
   PITFALLS section instead of smoothing them over. Disagreement is
   the most honest signal you have.
4. Use bullet points for claims wherever possible. Each bullet should
   carry its own citation(s). This keeps the claims extractable.
5. Output is markdown with the EXACT section headers requested. No
   preamble. No apology. No self-graded confidence score.`;

// ── User prompt builder ───────────────────────────────────────────────────────
function buildUserPrompt(topic, sourcesCtx, priorKnowledge) {
  const sectionRubric = SECTIONS
    .map((s) => `## ${s.emoji} ${s.id} — ${s.title}\n*Focus: ${s.focus}*`)
    .join('\n\n');

  let priorBlock = '';
  if (priorKnowledge && Array.isArray(priorKnowledge.claims) && priorKnowledge.claims.length > 0) {
    const slice = priorKnowledge.claims.slice(0, 40);
    priorBlock =
      `\n\nPRIOR KNOWLEDGE (run #${priorKnowledge.runCount || '?'} — what the Hoard learned last time):\n` +
      slice.map((c, i) => `- [prior ${i + 1}] (${c.section || '?'}) ${c.text}`).join('\n') +
      `\n\nIf any prior claim is CONTRADICTED by the current sources, say so explicitly under "Contradictions & Open Questions" with the format: "CONTRADICTS prior: <quote>". If a prior claim is REFINED, note the refinement. If a prior claim looks correct and the new sources reinforce it, you don't need to repeat it.`;
  }

  return `TOPIC: "${topic}"

SOURCES:

${sourcesCtx}${priorBlock}

Produce a single markdown document in EXACTLY this structure. Every section
must appear, even if short. Use inline citations like [S1], [S2] referring
to the SOURCES above. Prefer bulleted claims so each can be checked.

# ${topic}

## Executive Summary
(3-5 sentences capturing the essence. Heavy citations.)

${sectionRubric}

## Contradictions & Open Questions
(Where do the sources disagree with each other? Where do they disagree with prior knowledge? What is genuinely uncertain or missing? Be honest.)

## Explore Next
(3-5 adjacent topics worth fetching next. One per line, starting with "- ".)`;
}

// ── Markdown parsing helpers ──────────────────────────────────────────────────
// Exported for testability — these are pure functions, easy to unit-test.
export function splitH2Sections(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let current = null;
  let buf = [];
  for (const line of lines) {
    // Match "## Header" but not "### Header"
    const match = line.match(/^##\s+([^#].*?)\s*$/);
    if (match) {
      if (current !== null) out.push({ heading: current, body: buf.join('\n').trim() });
      current = match[1];
      buf = [];
    } else if (current !== null) {
      buf.push(line);
    }
  }
  if (current !== null) out.push({ heading: current, body: buf.join('\n').trim() });
  return out;
}

export function classifySections(rawSections) {
  const result = {
    executive: null,
    byId: {},
    contradictions: null,
    exploreNext: [],
  };

  for (const { heading, body } of rawSections) {
    const upper = heading.toUpperCase();

    if (upper.includes('EXECUTIVE') || upper === 'SUMMARY') {
      result.executive = body;
      continue;
    }
    if (upper.includes('CONTRADICTION') || upper.includes('OPEN QUESTION') || upper.includes('UNCERTAIN')) {
      result.contradictions = body;
      continue;
    }
    if (upper.includes('EXPLORE NEXT') || upper.includes('NEXT TOPIC') || upper === 'EXPLORE') {
      result.exploreNext = body
        .split('\n')
        .map((l) => l.replace(/^[\s-*•\d.)]+/, '').trim())
        .filter((l) => l.length > 2 && l.length < 120);
      continue;
    }

    // Match to one of the 7 cognitive sections by ID or title
    const matched = SECTIONS.find(
      (s) => upper.includes(s.id) || upper.includes(s.title.toUpperCase())
    );
    if (matched) {
      result.byId[matched.id] = body;
    }
  }

  return result;
}

// ── Claim extraction ──────────────────────────────────────────────────────────
// Pulls bullets out of each section, captures citation indices, and returns a
// structured array we can persist and diff against future runs.
export function extractClaims(classified) {
  const claims = [];
  for (const [sectionId, body] of Object.entries(classified.byId || {})) {
    if (!body) continue;

    // Method 1: bullet lines (preferred)
    const bullets = body
      .split('\n')
      .filter((l) => /^\s*[-*•]\s+/.test(l))
      .map((l) => l.replace(/^\s*[-*•]\s+/, '').trim())
      .filter((l) => l.length > 10 && l.length < 600);

    for (const bullet of bullets) {
      const sources = [...bullet.matchAll(/\[S(\d+)\]/g)].map((m) => parseInt(m[1], 10));
      const text = bullet.replace(/\[S\d+\]/g, '').replace(/\[uncited[^\]]*\]/gi, '').replace(/\s+/g, ' ').trim();
      if (text.length >= 10) {
        claims.push({ text, section: sectionId, sources, grounded: sources.length > 0 });
      }
    }

    // Method 2: fallback — sentences with citations, only if no bullets found
    if (bullets.length === 0) {
      const sentences = body
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.length > 20 && s.length < 600);
      for (const sentence of sentences) {
        const sources = [...sentence.matchAll(/\[S(\d+)\]/g)].map((m) => parseInt(m[1], 10));
        if (sources.length > 0) {
          const text = sentence.replace(/\[S\d+\]/g, '').replace(/\s+/g, ' ').trim();
          claims.push({ text, section: sectionId, sources, grounded: true });
        }
      }
    }
  }
  return claims;
}

export function extractCitationStats(markdown, sourceCount) {
  const matches = [...markdown.matchAll(/\[S(\d+)\]/g)];
  const indices = matches.map((m) => parseInt(m[1], 10));
  const valid = indices.filter((n) => n >= 1 && n <= sourceCount);
  const invalid = indices.filter((n) => n < 1 || n > sourceCount);
  const unique = new Set(valid);
  return {
    total: matches.length,
    valid: valid.length,
    invalid: invalid.length,
    uniqueCited: unique.size,
    citedIndices: [...unique].sort((a, b) => a - b),
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run a research pass. One LLM call. Returns a structured result.
 *
 * @param {string} topic
 * @param {object} opts
 * @param {Array}  [opts.sources]         - Fetched sources from sources.js
 * @param {object} [opts.priorKnowledge]  - From storage.loadPriorKnowledge
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.timeout]
 */
export async function research(topic, opts = {}) {
  const sources = Array.isArray(opts.sources) ? opts.sources : [];
  const priorKnowledge = opts.priorKnowledge || null;
  const maxTokens = opts.maxTokens || safeInt(process.env.ZOMBIE_MAX_TOKENS, 4000);
  const timeout = opts.timeout || safeInt(process.env.ZOMBIE_TIMEOUT, 180000);

  const startTime = Date.now();

  let response;
  try {
    response = await chatComplete({
      system: SYSTEM_PROMPT,
      userContent: buildUserPrompt(topic, sourcesToContext(sources), priorKnowledge),
      maxTokens,
      timeout,
    });
  } catch (err) {
    return {
      topic,
      markdown: `> ⚠️ NECROMANCER FAILED: ${err.message || 'Unknown error'}`,
      sections: {},
      executive: null,
      contradictions: null,
      exploreNext: [],
      claims: [],
      sources,
      metrics: emptyMetrics(sources.length),
      tokens: { input: 0, output: 0 },
      duration: ((Date.now() - startTime) / 1000).toFixed(1),
      failed: true,
    };
  }

  const markdown = response.text || '';
  const rawSections = splitH2Sections(markdown);
  const classified = classifySections(rawSections);
  const claims = extractClaims(classified);
  const cites = extractCitationStats(markdown, sources.length);

  const sectionsCovered = SECTIONS.filter(
    (s) => (classified.byId[s.id] || '').length > 50
  ).length;
  const claimsGrounded = claims.filter((c) => c.grounded).length;

  const metrics = {
    sources_fetched: sources.length,
    sources_cited: cites.uniqueCited,
    citations_total: cites.total,
    citations_invalid: cites.invalid,
    sections_covered: sectionsCovered,
    sections_total: SECTIONS.length,
    claims_extracted: claims.length,
    claims_grounded: claimsGrounded,
    grounding_ratio:
      claims.length > 0 ? Number((claimsGrounded / claims.length).toFixed(2)) : 0,
  };

  return {
    topic,
    markdown,
    sections: classified.byId,
    executive: classified.executive,
    contradictions: classified.contradictions,
    exploreNext: classified.exploreNext,
    claims,
    sources,
    metrics,
    tokens: response.tokens || { input: 0, output: 0 },
    duration: ((Date.now() - startTime) / 1000).toFixed(1),
    failed: false,
  };
}

function emptyMetrics(sourceCount) {
  return {
    sources_fetched: sourceCount,
    sources_cited: 0,
    citations_total: 0,
    citations_invalid: 0,
    sections_covered: 0,
    sections_total: SECTIONS.length,
    claims_extracted: 0,
    claims_grounded: 0,
    grounding_ratio: 0,
  };
}
