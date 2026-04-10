// lib/necromancer.js — The Necromancer synthesis agent
// Reads all zombie reports and raises a unified, structured knowledge document

import Anthropic from '@anthropic-ai/sdk';
import { safeInt } from './zombie.js';

const NECROMANCER_SYSTEM = `You are the NECROMANCER — the master who commands the zombie hoard and synthesizes their findings.
You have received reports from specialized zombie agents, each of whom has consumed a topic from a different angle.
Your job is to raise a UNIFIED, STRUCTURED KNOWLEDGE DOCUMENT from their combined findings.

You must:
1. Write a powerful executive summary (3-5 sentences capturing the complete picture)
2. Surface the 5 most important insights across ALL zombie reports (the cross-cutting truths)
3. Identify any contradictions or tensions between zombie findings
4. List 3-5 "infected topics" — related subjects the user should explore next
5. Produce a final HOARD SCORE (0-10) representing the overall depth and coverage of the hoard's knowledge

Do NOT simply repeat the zombie reports — synthesize them. Find the connections. Elevate the understanding.
Write in a confident, authoritative voice. Use clean markdown with clear sections.

Your output will be saved as a permanent knowledge document. Make it worth keeping.`;

// ── Sanitize error messages ────────────────────────────────────────────────────
function sanitizeError(msg) {
  if (!msg || typeof msg !== 'string') return 'Unknown error';
  return msg
    .replace(/sk-ant-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]')
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]')
    .replace(/key-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
}

export class Necromancer {
  constructor(config = {}) {
    this.config = {
      model: config.model || process.env.ZOMBIE_MODEL || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 2500,
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      timeout: config.timeout || safeInt(process.env.ZOMBIE_TIMEOUT, 180000), // 3min for synthesis
    };
    this.client = new Anthropic({ apiKey: this.config.apiKey });
  }

  buildSynthesisPrompt(topic, zombieResults) {
    const reportSections = zombieResults
      .filter(r => !r.failed)
      .map(r => `## ${r.emoji} ${r.name} REPORT\n*Hunger: ${r.hunger}*\n*Undead Index: ${r.undeadIndex}/10*\n\n${r.content}`)
      .join('\n\n---\n\n');

    const failedZombies = zombieResults.filter(r => r.failed);
    const failNote = failedZombies.length > 0
      ? `\n\n> ⚠️ Note: ${failedZombies.map(r => r.name).join(', ')} failed to rise and could not contribute.`
      : '';

    return `TOPIC: "${topic}"${failNote}\n\nZOMBIE REPORTS:\n\n${reportSections}\n\n---\n\nNow synthesize these reports into a unified knowledge document.`;
  }

  async synthesize(topic, zombieResults, priorKnowledge = null) {
    const startTime = Date.now();
    try {
      let synthesisPrompt = this.buildSynthesisPrompt(topic, zombieResults);

      if (priorKnowledge?.synthesis) {
        const runLabel = `Run #${priorKnowledge.runCount}, Score: ${priorKnowledge.hoardScore}/10`;
        synthesisPrompt += `\n\n${'─'.repeat(60)}\nPRIOR SYNTHESIS (${runLabel}) — What the Hoard previously concluded:\n${'─'.repeat(60)}\n\n${priorKnowledge.synthesis}\n\n${'─'.repeat(60)}\nIn your synthesis, explicitly note what this feeding has added, corrected,\nor refined compared to the prior run. What patterns only become visible\nacross multiple feedings? The Hoard compounds. Show the evolution.\n${'─'.repeat(60)}`;
      }

      const apiCall = this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: NECROMANCER_SYSTEM,
        messages: [{ role: 'user', content: synthesisPrompt }],
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Necromancer timed out after ${this.config.timeout / 1000}s`)), this.config.timeout)
      );

      const response = await Promise.race([apiCall, timeoutPromise]);

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // FIX: was `hoistScore` (typo) — now correctly `hoardScore`
      const scoreMatch = text.match(/HOARD SCORE[^\d]*(\d+)/i);
      const rawScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 7;
      const hoardScore = Math.max(0, Math.min(10, Number.isNaN(rawScore) ? 7 : rawScore));

      const infectedTopics = this.extractInfectedTopics(text);

      return {
        synthesis: text,
        hoardScore,
        infectedTopics,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        duration,
      };
    } catch (err) {
      return {
        synthesis: `> ⚠️ NECROMANCER FAILED: ${sanitizeError(err.message)}\n\nRaw zombie reports preserved below.`,
        hoardScore: 0,
        infectedTopics: [],
        tokens: { input: 0, output: 0 },
        duration: '0',
        failed: true,
      };
    }
  }

  extractInfectedTopics(text) {
    const topics = [];
    const sectionMatch = text.match(/infected topics[^\n]*\n([\s\S]*?)(?:\n##|\n---|\n\*\*HOARD|$)/i);
    if (sectionMatch) {
      const lines = sectionMatch[1].split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
        const topicName = cleaned.split(/\s*[—–:]/)[0].trim();
        if (topicName && topicName.length > 2 && topicName.length < 80) {
          topics.push(topicName);
        }
      }
    }
    return topics.slice(0, 5);
  }
}
