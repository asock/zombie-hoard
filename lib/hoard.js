// lib/hoard.js — The Hoard orchestrator
// Spawns zombies in parallel (with concurrency throttle), streams progress, feeds results to the Necromancer

import { Zombie, ZOMBIE_ROSTER, safeInt } from './zombie.js';
import { Necromancer } from './necromancer.js';
import { storage } from './storage.js';

const FULL_HOARD = ['CORTEX', 'RELIC', 'GEARS', 'VENOM', 'CLAW', 'SPORE', 'PROPHET'];
const QUICK_HOARD = ['CORTEX', 'GEARS', 'CLAW'];

// ── Concurrency-limited Promise.all ────────────────────────────────────────────
async function parallelLimit(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = task().then(result => {
      executing.delete(p);
      return result;
    });
    executing.add(p);
    results.push(p);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

export class Hoard {
  constructor(config = {}) {
    this.config = {
      model: config.model || process.env.ZOMBIE_MODEL || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || safeInt(process.env.ZOMBIE_MAX_TOKENS, 1500),
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      hoardSize: config.hoardSize || safeInt(process.env.ZOMBIE_HOARD_SIZE, 7),
      concurrency: config.concurrency || safeInt(process.env.ZOMBIE_CONCURRENCY, 4),
      mode: config.mode || 'full',
      customRoles: config.customRoles || null,
      onZombieStart: config.onZombieStart || null,
      onZombieComplete: config.onZombieComplete || null,
      onHivemindLoaded: config.onHivemindLoaded || null,
      onNecromancerStart: config.onNecromancerStart || null,
      onNecromancerComplete: config.onNecromancerComplete || null,
    };
    this._aborted = false;
  }

  abort() { this._aborted = true; }

  getRoster() {
    if (this.config.mode === 'quick') return QUICK_HOARD;
    if (this.config.customRoles) return this.config.customRoles;
    const size = Math.min(Math.max(1, this.config.hoardSize), 7);
    return FULL_HOARD.slice(0, size);
  }

  async deploy(topic, { save = true } = {}) {
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new Error('Topic must be a non-empty string');
    }
    // Sanitize: cap topic length to prevent prompt injection payload
    const safeTopic = topic.trim().substring(0, 500);

    const roster = this.getRoster();
    const startTime = Date.now();

    // ── Phase 0: Load hivemind memory ───────────────────────────────────────
    const priorKnowledge = storage.loadPriorKnowledge(safeTopic);

    if (priorKnowledge && this.config.onHivemindLoaded) {
      this.config.onHivemindLoaded(priorKnowledge);
    }

    // ── Phase 1: Spawn zombies with concurrency throttle ────────────────────
    const tasks = roster.map((roleId) => async () => {
      if (this._aborted) {
        return {
          zombie: roleId, emoji: '🧟', name: roleId, hunger: '',
          content: '> ⚠️ ABORTED', undeadIndex: 0,
          tokens: { input: 0, output: 0 }, duration: '0', failed: true,
        };
      }

      const zombie = new Zombie(roleId, this.config);

      if (this.config.onZombieStart) {
        this.config.onZombieStart(zombie);
      }

      const result = await zombie.feed(safeTopic, priorKnowledge);

      if (this.config.onZombieComplete) {
        this.config.onZombieComplete(zombie, result);
      }

      return result;
    });

    const zombieResults = await parallelLimit(tasks, this.config.concurrency);

    if (this._aborted) {
      throw new Error('Hoard deployment aborted');
    }

    // ── Phase 2: Necromancer synthesis ──────────────────────────────────────
    if (this.config.onNecromancerStart) {
      this.config.onNecromancerStart();
    }

    const necromancer = new Necromancer(this.config);
    const synthesisResult = await necromancer.synthesize(safeTopic, zombieResults, priorKnowledge);

    if (this.config.onNecromancerComplete) {
      this.config.onNecromancerComplete(synthesisResult);
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    // ── Phase 3: Persist ────────────────────────────────────────────────────
    let savedPath = null;
    if (save) {
      const saved = storage.save(safeTopic, zombieResults, synthesisResult, { totalDuration });
      savedPath = saved.filepath;
    }

    // ── Compile totals ──────────────────────────────────────────────────────
    const totalTokens = zombieResults.reduce((sum, r) =>
      sum + (r.tokens?.input || 0) + (r.tokens?.output || 0), 0
    ) + (synthesisResult.tokens?.input || 0) + (synthesisResult.tokens?.output || 0);

    const successfulZombies = zombieResults.filter(r => !r.failed);
    const avgUndeadIndex = successfulZombies.length > 0
      ? (successfulZombies.reduce((sum, r) => sum + r.undeadIndex, 0) / successfulZombies.length).toFixed(1)
      : 0;

    return {
      topic: safeTopic,
      zombieResults,
      synthesisResult,
      meta: {
        totalDuration,
        totalTokens,
        zombiesDeployed: roster.length,
        zombiesFailed: zombieResults.filter(r => r.failed).length,
        avgUndeadIndex,
        hoardScore: synthesisResult.hoardScore,
        savedPath,
        infectedTopics: synthesisResult.infectedTopics,
        mode: this.config.mode,
        concurrency: this.config.concurrency,
        hivemind: priorKnowledge
          ? { active: true, runCount: priorKnowledge.runCount, priorScore: priorKnowledge.hoardScore }
          : { active: false },
      },
    };
  }
}
