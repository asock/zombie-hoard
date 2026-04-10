// lib/display.js — Terminal UI for the zombie hoard
// Rich, atmospheric CLI output with per-zombie progress tracking

import chalk from 'chalk';
import { HOARD_QUOTES, INFECTION_PHRASES, GRAVEYARD_EPITAPHS, randomLore } from './lore.js';

// ── Theme ──────────────────────────────────────────────────────────────────────
const ZOMBIE_COLORS = {
  CORTEX: chalk.cyanBright,
  RELIC: chalk.yellowBright,
  GEARS: chalk.blueBright,
  VENOM: chalk.redBright,
  CLAW: chalk.greenBright,
  SPORE: chalk.magentaBright,
  PROPHET: chalk.whiteBright,
};

function colorFor(zombieId) {
  return ZOMBIE_COLORS[zombieId] || chalk.white;
}

function scoreBar(score, max = 10, width = 10) {
  const filled = Math.round((score / max) * width);
  const empty = width - filled;
  return chalk.greenBright('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

// ── Display functions ─────────────────────────────────────────────────────────
export const display = {
  banner(topic) {
    const line = '─'.repeat(60);
    const quote = randomLore(HOARD_QUOTES);
    const words = quote.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 56) {
        lines.push(current.trim());
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) lines.push(current.trim());

    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(chalk.hex('#9b59b6').bold('  🧟 ZOMBIE HOARD'));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
    lines.forEach(l => console.log(chalk.hex('#6a2a8a').italic('  ' + l)));
    console.log();
    console.log(chalk.hex('#4a0080')(line));
    console.log(chalk.dim('  Prey: ') + chalk.white.bold(`"${topic}"`));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
  },

  hivemindActive(priorKnowledge) {
    const bar = scoreBar(priorKnowledge.hoardScore);
    const date = new Date(priorKnowledge.lastRun).toLocaleDateString();
    console.log(
      `  📡 ${chalk.hex('#9b59b6').bold('HIVEMIND ACTIVE')} — ${chalk.dim(`Prior run #${priorKnowledge.runCount}, score:`)} ${bar} ${chalk.dim(`${priorKnowledge.hoardScore}/10, ${date}`)}`
    );
    console.log(chalk.hex('#6a2a8a').italic('     The Hoard remembers. Each zombie feeds on what the last left behind.'));
    console.log();
  },

  hoardRoster(roster) {
    console.log(chalk.gray('  Zombies rising:'));
    roster.forEach(({ emoji, name, hunger }) => {
      const col = ZOMBIE_COLORS[name] || chalk.white;
      console.log(`  ${emoji}  ${col.bold(name.padEnd(8))} ${chalk.gray('→')} ${chalk.dim(hunger)}`);
    });
    console.log();
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log();
  },

  zombieStart(zombie) {
    const col = colorFor(zombie.id);
    process.stdout.write(
      `  ${zombie.emoji}  ${col.bold(zombie.id.padEnd(8))} ${chalk.hex('#4a0080')('▶')} ${chalk.dim('feeding...')}\n`
    );
  },

  zombieComplete(zombie, result) {
    const col = colorFor(zombie.id);
    const bar = scoreBar(result.undeadIndex);
    const status = result.failed
      ? chalk.redBright('✗ FAILED')
      : chalk.greenBright('✓ RISEN');
    const retryNote = result.attempt > 1 ? chalk.dim(` (attempt ${result.attempt})`) : '';

    console.log(
      `  ${zombie.emoji}  ${col.bold(zombie.id.padEnd(8))} ${status}  ${bar} ${chalk.dim(`${result.undeadIndex}/10`)}  ${chalk.dim(`${result.duration}s`)}${retryNote}`
    );
  },

  necromancerStart() {
    console.log();
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log();
    console.log(chalk.hex('#9b59b6').bold('  💀 NECROMANCER') + chalk.dim(' raising synthesis...'));
  },

  necromancerComplete(result) {
    const bar = scoreBar(result.hoardScore);
    console.log(
      `  💀 ${chalk.hex('#c39bd3').bold('NECROMANCER')} ${chalk.greenBright('✓ COMPLETE')}  ${bar} ${chalk.dim(`${result.hoardScore}/10 hoard score`)}`
    );
  },

  results(runResult) {
    const { topic, meta } = runResult;
    console.log();
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log(chalk.hex('#9b59b6').bold('  ☠️  HOARD COMPLETE'));
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log();
    console.log(`  ${chalk.dim('Topic:')}        ${chalk.white.bold(topic)}`);
    console.log(`  ${chalk.dim('Hoard Score:')}  ${scoreBar(meta.hoardScore)} ${chalk.white.bold(meta.hoardScore + '/10')}`);
    if (meta.hivemind?.active) {
      const delta = meta.hoardScore - meta.hivemind.priorScore;
      const deltaStr = delta > 0 ? chalk.greenBright(`+${delta}`) : delta < 0 ? chalk.redBright(`${delta}`) : chalk.dim('±0');
      console.log(`  ${chalk.dim('Prior Score:')}  ${scoreBar(meta.hivemind.priorScore)} ${chalk.dim(meta.hivemind.priorScore + '/10')} ${chalk.dim('→')} ${deltaStr}`);
    }
    console.log(`  ${chalk.dim('Avg Undead:')}   ${chalk.white(meta.avgUndeadIndex + '/10')}`);
    console.log(`  ${chalk.dim('Deployed:')}     ${chalk.white(meta.zombiesDeployed)} zombies${meta.zombiesFailed > 0 ? chalk.redBright(` (${meta.zombiesFailed} failed)`) : ''}`);
    console.log(`  ${chalk.dim('Concurrency:')} ${chalk.white(meta.concurrency)} parallel`);
    console.log(`  ${chalk.dim('Duration:')}     ${chalk.white(meta.totalDuration + 's')}`);
    console.log(`  ${chalk.dim('Tokens:')}       ${chalk.white(meta.totalTokens.toLocaleString())}`);

    if (meta.savedPath) {
      console.log(`  ${chalk.dim('Saved to:')}     ${chalk.hex('#00ffcc')(meta.savedPath)}`);
    }

    if (meta.infectedTopics?.length > 0) {
      console.log();
      const infectionPhrase = randomLore(INFECTION_PHRASES);
      console.log(`  ${chalk.hex('#9b59b6').bold('🦠 ' + infectionPhrase)}`);
      meta.infectedTopics.forEach(t => {
        console.log(`     ${chalk.dim('→')} ${chalk.white(t)}`);
      });
    }

    console.log();
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log();
  },

  synthesis(synthesisResult) {
    console.log();
    console.log(chalk.hex('#9b59b6').bold('  💀 NECROMANCER SYNTHESIS:'));
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log();
    const preview = synthesisResult.synthesis.substring(0, 1500);
    const hasMore = synthesisResult.synthesis.length > 1500;
    console.log(chalk.dim(preview));
    if (hasMore) {
      console.log(chalk.hex('#4a0080')('\n  ... (full synthesis saved to knowledge file)'));
    }
    console.log();
  },

  // ── NEW: Token cost estimation ─────────────────────────────────────────────
  tokenCost(totalTokens) {
    // Rough Sonnet 4 pricing: $3/M input, $15/M output — estimate blended ~$6/M
    const estimatedCost = (totalTokens / 1_000_000) * 6;
    if (estimatedCost > 0.001) {
      console.log(`  ${chalk.dim('Est. cost:')}    ${chalk.hex('#00ffcc')('~$' + estimatedCost.toFixed(4))}`);
    }
  },

  recallResult(topic, recalled) {
    if (!recalled) {
      console.log();
      console.log(chalk.redBright(`  🧟 No knowledge found for "${topic}" in the graveyard.`));
      console.log(chalk.dim('  Run: zombie-hoard learn "' + topic + '" to feed the hoard.'));
      console.log();
      return;
    }

    const { entry, content, readError } = recalled;
    console.log();
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log(chalk.hex('#9b59b6').bold(`  🪦 KNOWLEDGE RECALLED: ${entry.topic}`));
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log();
    console.log(`  ${chalk.dim('Hoard Score:')} ${scoreBar(entry.hoardScore)} ${chalk.white.bold(entry.hoardScore + '/10')}`);
    console.log(`  ${chalk.dim('Runs:')}        ${chalk.white(entry.runCount)}`);
    console.log(`  ${chalk.dim('Last run:')}    ${chalk.white(new Date(entry.lastRun).toLocaleString())}`);
    const filepath = recalled.filepath || entry.filepath || entry.filename;
    console.log(`  ${chalk.dim('File:')}        ${chalk.hex('#00ffcc')(filepath)}`);
    console.log();

    if (readError) {
      console.log(chalk.redBright('  ⚠️ Knowledge file missing — run `infect` to regenerate.'));
    } else if (content) {
      console.log(chalk.dim('  Showing knowledge document preview...'));
      console.log();
      console.log(chalk.white(content.substring(0, 2000)));
      if (content.length > 2000) {
        console.log(chalk.hex('#4a0080')(`\n  ... open the file for the full document.`));
      }
    }
    console.log();
  },

  graveyard(data) {
    const { entries, totalRuns } = data;
    console.log();
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log(chalk.hex('#9b59b6').bold('  🪦 KNOWLEDGE GRAVEYARD'));
    console.log(chalk.hex('#4a0080')('═'.repeat(60)));
    console.log(`  ${chalk.dim('Total topics:')} ${chalk.white(entries.length)}   ${chalk.dim('Total runs:')} ${chalk.white(totalRuns)}`);
    console.log();
    console.log(chalk.hex('#6a2a8a').italic('  ' + randomLore(GRAVEYARD_EPITAPHS)));
    console.log();

    if (entries.length === 0) {
      console.log(chalk.dim('  The graveyard is empty. Deploy the hoard to fill it.'));
    } else {
      entries.forEach(entry => {
        const score = scoreBar(entry.hoardScore, 10, 6);
        const date = new Date(entry.lastRun).toLocaleDateString();
        console.log(
          `  ${chalk.hex('#9b59b6')('◈')} ${chalk.white.bold(entry.topic.padEnd(35))} ${score} ${chalk.dim(`${entry.hoardScore}/10  ${date}  ×${entry.runCount}`)}`
        );
        if (entry.infectedTopics?.length > 0) {
          console.log(chalk.dim(`      🦠 ${entry.infectedTopics.slice(0, 3).join(', ')}`));
        }
      });
    }
    console.log();
  },

  // ── NEW: Compare two topics ────────────────────────────────────────────────
  compare(r1, r2) {
    const line = '═'.repeat(60);
    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(chalk.hex('#9b59b6').bold('  ⚔️  HOARD COMPARISON'));
    console.log(chalk.hex('#4a0080')(line));
    console.log();

    const e1 = r1.entry;
    const e2 = r2.entry;

    console.log(`  ${chalk.white.bold(e1.topic.padEnd(30))} ${chalk.dim('vs.')} ${chalk.white.bold(e2.topic)}`);
    console.log();
    console.log(`  ${chalk.dim('Hoard Score:')} ${scoreBar(e1.hoardScore, 10, 8)} ${chalk.white(e1.hoardScore + '/10')}  │  ${scoreBar(e2.hoardScore, 10, 8)} ${chalk.white(e2.hoardScore + '/10')}`);
    console.log(`  ${chalk.dim('Runs:')}        ${chalk.white(String(e1.runCount).padEnd(14))}  │  ${chalk.white(e2.runCount)}`);
    console.log(`  ${chalk.dim('Last run:')}    ${chalk.white(new Date(e1.lastRun).toLocaleDateString().padEnd(14))}  │  ${chalk.white(new Date(e2.lastRun).toLocaleDateString())}`);
    console.log(`  ${chalk.dim('Zombies:')}     ${chalk.white(String(e1.zombieCount || '?').padEnd(14))}  │  ${chalk.white(e2.zombieCount || '?')}`);

    // Find shared infected topics
    const shared = (e1.infectedTopics || []).filter(t =>
      (e2.infectedTopics || []).some(t2 => t2.toLowerCase() === t.toLowerCase())
    );
    if (shared.length > 0) {
      console.log();
      console.log(`  ${chalk.hex('#9b59b6').bold('🦠 Shared infected topics:')}`);
      shared.forEach(t => console.log(`     ${chalk.dim('→')} ${chalk.white(t)}`));
    }

    console.log('\n' + chalk.hex('#4a0080')(line) + '\n');
  },

  status(config, stats) {
    console.log();
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log(chalk.hex('#9b59b6').bold('  🧟 ZOMBIE HOARD STATUS'));
    console.log(chalk.hex('#4a0080')('─'.repeat(60)));
    console.log(`  ${chalk.dim('Model:')}       ${chalk.white(config.model || process.env.ZOMBIE_MODEL || 'claude-sonnet-4-20250514')}`);
    console.log(`  ${chalk.dim('Max tokens:')} ${chalk.white(config.maxTokens || process.env.ZOMBIE_MAX_TOKENS || 1500)}`);
    console.log(`  ${chalk.dim('Hoard size:')} ${chalk.white(config.hoardSize || process.env.ZOMBIE_HOARD_SIZE || 7)}`);
    console.log(`  ${chalk.dim('Concurrency:')} ${chalk.white(process.env.ZOMBIE_CONCURRENCY || 4)}`);
    console.log(`  ${chalk.dim('Timeout:')}    ${chalk.white((process.env.ZOMBIE_TIMEOUT || 120000) + 'ms')}`);
    console.log(`  ${chalk.dim('Retries:')}    ${chalk.white(process.env.ZOMBIE_RETRIES || 1)}`);
    console.log(`  ${chalk.dim('API key:')}     ${process.env.ANTHROPIC_API_KEY ? chalk.greenBright('✓ set') : chalk.redBright('✗ not set (set ANTHROPIC_API_KEY)')}`);
    console.log(`  ${chalk.dim('Storage:')}     ${chalk.white(stats.storageDir)}`);
    console.log(`  ${chalk.dim('Topics:')}      ${chalk.white(stats.totalTopics)}`);
    console.log(`  ${chalk.dim('Total runs:')} ${chalk.white(stats.totalRuns)}`);
    console.log();
  },

  error(msg) {
    console.error(chalk.redBright(`\n  ✗ ERROR: ${msg}\n`));
  },

  info(msg) {
    console.log(chalk.dim(`  ℹ ${msg}`));
  },

  // ── Lore display functions ─────────────────────────────────────────────────

  worldLore(text) {
    const line = '═'.repeat(60);
    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(chalk.hex('#9b59b6').bold('  📖 THE HOLLOW — World Lore'));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
    text.trim().split('\n').forEach(l => {
      if (l.trim() === '') { console.log(); return; }
      if (l.trim().toUpperCase() === l.trim() && l.trim().length > 2) {
        console.log(chalk.hex('#c39bd3').bold('  ' + l));
      } else if (l.startsWith('*') && l.endsWith('*')) {
        console.log(chalk.hex('#9b59b6').italic('  ' + l.replace(/\*/g, '')));
      } else {
        console.log(chalk.white('  ' + l));
      }
    });
    console.log('\n' + chalk.hex('#4a0080')(line) + '\n');
  },

  necromancerLore(text) {
    const line = '─'.repeat(60);
    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(chalk.hex('#9b59b6').bold('  💀 THE NECROMANCER'));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
    text.trim().split('\n').forEach(l => {
      if (l.trim() === '') { console.log(); return; }
      if (l.trim().toUpperCase() === l.trim() && l.trim().length > 2) {
        console.log(chalk.hex('#c39bd3').bold('  ' + l));
      } else {
        console.log(chalk.white('  ' + l));
      }
    });
    console.log('\n' + chalk.hex('#4a0080')(line) + '\n');
  },

  zombieLore(id, loreEntry, colorFn) {
    const emoji = { CORTEX:'🧠', RELIC:'📜', GEARS:'⚙️', VENOM:'🩸', CLAW:'🛠️', SPORE:'🕸️', PROPHET:'🔮' }[id] || '🧟';
    const col = colorFn || colorFor(id);
    const line = '─'.repeat(60);
    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(`  ${emoji}  ${col.bold(id)} — ${chalk.hex('#c39bd3').italic(loreEntry.title)}`);
    console.log(chalk.hex('#6a2a8a').italic('  ' + loreEntry.epitaph));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
    loreEntry.lore.trim().split('\n').forEach(l => {
      if (l.trim() === '') { console.log(); return; }
      console.log(chalk.white('  ' + l.trim()));
    });
    console.log();
  },

  loreMenu() {
    const line = '─'.repeat(60);
    console.log('\n' + chalk.hex('#4a0080')(line));
    console.log(chalk.hex('#9b59b6').bold('  📖 ZOMBIE HOARD — Lore'));
    console.log(chalk.hex('#4a0080')(line));
    console.log();
    console.log(chalk.dim('  Commands:'));
    console.log(`  ${chalk.hex('#9b59b6')('lore world')}         ${chalk.dim('The mythology of The Hollow')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore necromancer')}   ${chalk.dim("The Necromancer's origin")}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore cortex')}        ${chalk.dim('🧠 The First Principle')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore relic')}         ${chalk.dim('📜 The Archivist')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore gears')}         ${chalk.dim('⚙️  The Machinist')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore venom')}         ${chalk.dim('🩸 The Wound')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore claw')}          ${chalk.dim('🛠️  The Builder')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore spore')}         ${chalk.dim('🕸️  The Network')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore prophet')}       ${chalk.dim('🔮 The Edge')}`);
    console.log(`  ${chalk.hex('#9b59b6')('lore all')}           ${chalk.dim('Everything, in order')}`);
    console.log();
  },
};
