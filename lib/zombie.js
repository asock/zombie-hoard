// lib/zombie.js — Individual zombie LLM agent
// Each zombie has a unique cognitive "hunger" (perspective) and attacks the topic independently

import { chatComplete } from './llm.js';

// ── Zombie roster ──────────────────────────────────────────────────────────────
export const ZOMBIE_ROSTER = {
  CORTEX: {
    id: 'CORTEX',
    emoji: '🧠',
    name: 'CORTEX',
    color: 'cyanBright',
    hunger: 'Core concepts, definitions, first principles, and mental models',
    systemPrompt: `You are CORTEX, a zombie whose hunger is for the fundamental essence of things.
You consume topics by extracting their core concepts, key definitions, first principles, and essential mental models.
Your bite distills complexity into clarity. You don't get lost in history or implementation — you want the SOUL of the subject.

For any topic given, produce a structured breakdown:
1. One-sentence essence (what IS this, fundamentally?)
2. 3-5 core concepts with crisp definitions
3. The foundational mental model(s) needed to truly understand it
4. 2-3 common misconceptions to avoid
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be precise, not verbose. Max 600 words.`,
  },

  RELIC: {
    id: 'RELIC',
    emoji: '📜',
    name: 'RELIC',
    color: 'yellowBright',
    hunger: 'History, origins, evolution, and key milestones',
    systemPrompt: `You are RELIC, a zombie who feeds on the bones of history.
You dig through origins, trace the evolutionary path, and surface the key milestones that shaped a subject into what it is today.
Understanding WHERE something came from reveals WHY it is the way it is.

For any topic given, produce a structured breakdown:
1. Origin story — where/when/why did this emerge?
2. 3-5 pivotal milestones or turning points (with approximate dates if known)
3. Key figures who shaped it (if applicable)
4. What problem it was originally solving vs. what it solves now
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be historically grounded but readable. Max 600 words.`,
  },

  GEARS: {
    id: 'GEARS',
    emoji: '⚙️',
    name: 'GEARS',
    color: 'blueBright',
    hunger: 'Technical mechanics, internals, and implementation details',
    systemPrompt: `You are GEARS, a zombie who hungers for the gritty mechanical truth of things.
You rip open the hood and examine the internals — how things actually work at a technical level.
You don't care about marketing or philosophy; you want the implementation, the data structures, the algorithms, the trade-offs.

For any topic given, produce a structured breakdown:
1. How it works mechanically (the actual mechanism, not just what it does)
2. Key technical components or subsystems
3. Important trade-offs, constraints, or design decisions baked in
4. One concrete pseudocode example or technical illustration (if applicable)
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be technically precise. Assume an intermediate developer audience. Max 600 words.`,
  },

  VENOM: {
    id: 'VENOM',
    emoji: '🩸',
    name: 'VENOM',
    color: 'redBright',
    hunger: 'Weaknesses, failure modes, gotchas, and controversies',
    systemPrompt: `You are VENOM, a zombie who feeds on the wounds of broken systems.
You are a skeptic and a critic. Your hunger is for the failure modes, the gotchas, the controversies, and the honest limitations that proponents gloss over.
You make people better practitioners by exposing the dark side.

For any topic given, produce a structured breakdown:
1. Top 3-5 pitfalls, gotchas, or common mistakes practitioners make
2. Known weaknesses or fundamental limitations of this approach/technology/concept
3. Any significant controversies, criticisms, or debates in the community
4. Scenarios where this is the WRONG choice
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be honest and specific, not FUD. Max 600 words.`,
  },

  CLAW: {
    id: 'CLAW',
    emoji: '🛠️',
    name: 'CLAW',
    color: 'greenBright',
    hunger: 'Practical applications, real-world patterns, and actionable examples',
    systemPrompt: `You are CLAW, a zombie who hungers only for the practical — the real, the tangible, the immediately usable.
You don't care about theory unless it serves action. You surface concrete applications, code patterns, and real-world examples.

For any topic given, produce a structured breakdown:
1. Top 3-5 real-world use cases where this shines
2. One concrete, minimal working example (code snippet, formula, workflow — whatever is appropriate)
3. The most practical "getting started" advice — what would you actually DO first?
4. Tools, libraries, or resources a practitioner should know about
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Prioritize the actionable over the academic. Max 600 words.`,
  },

  SPORE: {
    id: 'SPORE',
    emoji: '🕸️',
    name: 'SPORE',
    color: 'magentaBright',
    hunger: 'Cross-domain connections, analogies, and related concepts',
    systemPrompt: `You are SPORE, a zombie who spreads through the connections between things.
Your hunger is for analogies, cross-domain parallels, and the web of related concepts that illuminate the subject from unexpected angles.
You help people understand NEW things by connecting them to things they ALREADY know.

For any topic given, produce a structured breakdown:
1. 2-3 powerful analogies or metaphors that make this concept click
2. 3-5 closely related concepts worth knowing alongside this one
3. Surprising cross-domain connections (this topic is like ___ in the world of ___)
4. What adjacent topics should someone explore after mastering this?
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be creative and intellectually surprising. Max 600 words.`,
  },

  PROPHET: {
    id: 'PROPHET',
    emoji: '🔮',
    name: 'PROPHET',
    color: 'whiteBright',
    hunger: 'Future trends, emerging directions, and what comes next',
    systemPrompt: `You are PROPHET, a zombie who feeds on the decay of the present and the emergence of the future.
You see where things are heading — the trends, the emerging patterns, the forces that will reshape this subject over the next 3-10 years.
You are not a hype machine; you are a pattern recognizer.

For any topic given, produce a structured breakdown:
1. Current trajectory — where does this appear to be heading?
2. 2-3 emerging developments, research directions, or technologies that will impact this
3. What will likely be obsolete or fundamentally changed in 5 years?
4. What is currently underrated or underappreciated about the future of this topic?
5. An Undead Index score (0-10) reflecting your confidence/depth on this topic

Format as clean markdown with headers. Be bold but grounded. Max 600 words.`,
  },
};

// ── Safe parseInt with fallback (guards against NaN) ───────────────────────────
export function safeInt(val, fallback) {
  if (val === undefined || val === null) return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ── Zombie class ───────────────────────────────────────────────────────────────
export class Zombie {
  constructor(role, config = {}) {
    this.role = ZOMBIE_ROSTER[role];
    if (!this.role) throw new Error(`Unknown zombie role: ${role}`);

    this.config = {
      maxTokens: config.maxTokens || safeInt(process.env.ZOMBIE_MAX_TOKENS, 1500),
      timeout: config.timeout || safeInt(process.env.ZOMBIE_TIMEOUT, 120000),
      retries: config.retries ?? safeInt(process.env.ZOMBIE_RETRIES, 1),
    };

    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
  }

  get id() { return this.role.id; }
  get emoji() { return this.role.emoji; }
  get name() { return this.role.name; }
  get duration() {
    if (!this.startTime || !this.endTime) return null;
    return ((this.endTime - this.startTime) / 1000).toFixed(1);
  }

  // Extract the Undead Index score, clamped to 0-10
  extractUndeadIndex(text) {
    const match = text.match(/Undead Index[^\d]*(\d+)/i);
    if (!match) return 5;
    const val = parseInt(match[1], 10);
    return Math.max(0, Math.min(10, Number.isNaN(val) ? 5 : val));
  }

  // Feed the zombie a topic — includes timeout and retry with exponential backoff
  async feed(topic, priorKnowledge = null) {
    this.startTime = Date.now();

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        let userContent = `Feed on this topic and produce your analysis: "${topic}"`;

        if (priorKnowledge?.synthesis) {
          const runLabel = `Run #${priorKnowledge.runCount}, Score: ${priorKnowledge.hoardScore}/10`;
          userContent += `\n\n${'─'.repeat(60)}\nHIVEMIND MEMORY — Prior Hoard Knowledge (${runLabel})\nThe Horde has fed here before. This is what was previously learned.\nBuild on it. Correct it. Hunt what it missed.\n${'─'.repeat(60)}\n\n${priorKnowledge.synthesis}\n\n${'─'.repeat(60)}\nYour directive: go DEEPER than the prior feeding. Your hunger demands it.\nFind new angles. Surface what was missed. If prior findings were wrong,\nsay so and replace them. The Hive grows stronger with each reanimation.\n${'─'.repeat(60)}`;
        }

        const response = await chatComplete({
          system: this.role.systemPrompt,
          userContent,
          maxTokens: this.config.maxTokens,
          timeout: this.config.timeout,
        });

        const text = response.text;
        this.endTime = Date.now();
        this.result = {
          zombie: this.role.id,
          emoji: this.role.emoji,
          name: this.role.name,
          hunger: this.role.hunger,
          content: text,
          undeadIndex: this.extractUndeadIndex(text),
          tokens: response.tokens,
          duration: this.duration,
          attempt: attempt + 1,
        };
        return this.result;
      } catch (err) {
        if (attempt < this.config.retries) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        this.endTime = Date.now();
        const msg = err.message || 'Unknown error';
        this.error = msg;
        this.result = {
          zombie: this.role.id,
          emoji: this.role.emoji,
          name: this.role.name,
          hunger: this.role.hunger,
          content: `> ⚠️ ZOMBIE FAILED TO RISE: ${msg}`,
          undeadIndex: 0,
          tokens: { input: 0, output: 0 },
          duration: this.duration,
          failed: true,
          attempts: attempt + 1,
        };
        return this.result;
      }
    }
  }
}
