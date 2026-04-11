// lib/hoard.js — The Hoard orchestrator (rewritten).
//
// v2.0 was: spawn 7 LLM calls in different costumes, glue with an 8th call.
// v3.0 is:  fetch real sources, run ONE grounded research call, diff against
//           prior claims, persist structured output. Same theme, no theatre.

import { fetchSources } from './sources.js';
import { research } from './research.js';
import { storage } from './storage.js';
import { safeInt, jaccard, normalizeText } from './util.js';

export class Hoard {
  constructor(config = {}) {
    this.config = {
      maxSources: safeInt(config.maxSources ?? process.env.ZOMBIE_MAX_SOURCES, 5),
      urls: Array.isArray(config.urls) ? config.urls : [],
      ungrounded: !!config.ungrounded,
      maxTokens: safeInt(config.maxTokens ?? process.env.ZOMBIE_MAX_TOKENS, 4000),
      timeout: safeInt(config.timeout ?? process.env.ZOMBIE_TIMEOUT, 180000),
      // Callback hooks for the CLI display layer
      onPriorLoaded: config.onPriorLoaded || null,
      onSourcesStart: config.onSourcesStart || null,
      onSourcesFetched: config.onSourcesFetched || null,
      onResearchStart: config.onResearchStart || null,
      onResearchComplete: config.onResearchComplete || null,
    };
    this._aborted = false;
  }

  abort() { this._aborted = true; }

  async deploy(topic, { save = true } = {}) {
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new Error('Topic must be a non-empty string');
    }
    const safeTopic = topic.trim().substring(0, 500);
    const startTime = Date.now();

    // ── Phase 0: Load prior knowledge (structured claims, not prose) ───────
    const prior = storage.loadPriorKnowledge(safeTopic);
    if (prior && this.config.onPriorLoaded) this.config.onPriorLoaded(prior);

    // ── Phase 1: Fetch real sources ────────────────────────────────────────
    if (this.config.onSourcesStart) this.config.onSourcesStart();
    let sources = [];
    if (!this.config.ungrounded) {
      sources = await fetchSources(safeTopic, {
        maxSources: this.config.maxSources,
        urls: this.config.urls,
      });
    }
    if (this.config.onSourcesFetched) this.config.onSourcesFetched(sources);

    if (this._aborted) throw new Error('Hoard deployment aborted');

    // ── Phase 2: Research (one LLM call, grounded) ─────────────────────────
    if (this.config.onResearchStart) this.config.onResearchStart();
    const result = await research(safeTopic, {
      sources,
      priorKnowledge: prior,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
    });
    if (this.config.onResearchComplete) this.config.onResearchComplete(result);

    if (this._aborted) throw new Error('Hoard deployment aborted');

    // ── Phase 3: Diff new claims against prior knowledge ───────────────────
    const diff = prior ? diffClaims(prior.claims || [], result.claims) : null;

    // ── Phase 4: Persist (structured sidecar + markdown) ───────────────────
    let savedPath = null;
    if (save && !result.failed) {
      const saved = storage.save(safeTopic, result, {
        prior,
        diff,
        totalDuration: ((Date.now() - startTime) / 1000).toFixed(1),
      });
      savedPath = saved.filepath;
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalTokens =
      (result.tokens?.input || 0) + (result.tokens?.output || 0);

    return {
      topic: safeTopic,
      result,
      prior,
      diff,
      meta: {
        totalDuration,
        totalTokens,
        sourcesFetched: result.metrics.sources_fetched,
        sourcesCited: result.metrics.sources_cited,
        sectionsCovered: result.metrics.sections_covered,
        sectionsTotal: result.metrics.sections_total,
        claimsExtracted: result.metrics.claims_extracted,
        claimsGrounded: result.metrics.claims_grounded,
        groundingRatio: result.metrics.grounding_ratio,
        citationsInvalid: result.metrics.citations_invalid,
        savedPath,
        infectedTopics: result.exploreNext || [],
        runFailed: !!result.failed,
        ungrounded: this.config.ungrounded || sources.length === 0,
      },
    };
  }
}

// ── Claim diffing ────────────────────────────────────────────────────────────
//
// Lightweight semantic diff. We use Jaccard similarity over token sets to
// detect "same claim, different wording" without pulling in embeddings.
// Claims with similarity >= 0.6 to a prior claim are treated as "kept".
// Everything else in the new set is "added"; everything else in the old set
// is "removed". This is intentionally cheap and approximate — it surfaces
// CHANGE, which is the only useful signal of a re-run.
const SIMILARITY_THRESHOLD = 0.6;

function diffClaims(oldClaims, newClaims) {
  if (!Array.isArray(oldClaims)) oldClaims = [];
  if (!Array.isArray(newClaims)) newClaims = [];

  const matchedOldIdx = new Set();
  const added = [];
  const kept = [];

  for (const nc of newClaims) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < oldClaims.length; i++) {
      if (matchedOldIdx.has(i)) continue;
      const score = jaccard(nc.text, oldClaims[i].text);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestScore >= SIMILARITY_THRESHOLD && bestIdx >= 0) {
      matchedOldIdx.add(bestIdx);
      kept.push(nc);
    } else {
      added.push(nc);
    }
  }

  const removed = oldClaims.filter((_, i) => !matchedOldIdx.has(i));

  return {
    added: added.length,
    removed: removed.length,
    kept: kept.length,
    added_claims: added.slice(0, 30),
    removed_claims: removed.slice(0, 30),
  };
}

// Re-export for convenience
export { fetchSources, research };
