// lib/display.js — Terminal UI for the Hoard.
//
// v3.0: same theming, honest metrics. We dropped the per-zombie progress
// (because there's now ONE call, not seven), and added phases for source
// fetching and grounding stats. Self-graded "Hoard Score" / "Undead Index"
// have been replaced with measured numbers: sources cited, sections covered,
// grounding ratio, claim diff vs prior run.

import chalk from 'chalk';
import {
  HOARD_QUOTES,
  INFECTION_PHRASES,
  GRAVEYARD_EPITAPHS,
  randomLore,
} from './lore.js';
import { SECTIONS } from './research.js';

const PURPLE = chalk.hex('#9b59b6');
const DEEP = chalk.hex('#4a0080');
const PALE = chalk.hex('#c39bd3');
const HAZE = chalk.hex('#6a2a8a');
const TEAL = chalk.hex('#00ffcc');

function bar(value, max = 1, width = 12) {
  const ratio = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return chalk.greenBright('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function fraction(num, denom) {
  if (!denom) return chalk.dim('—');
  const ratio = num / denom;
  const color =
    ratio >= 0.75 ? chalk.greenBright : ratio >= 0.4 ? chalk.yellowBright : chalk.redBright;
  return color(`${num}/${denom}`);
}

// ── Display API ───────────────────────────────────────────────────────────────
export const display = {
  banner(topic) {
    const line = '─'.repeat(60);
    const quote = randomLore(HOARD_QUOTES);
    const wrapped = wrapLines(quote, 56);

    console.log('\n' + DEEP(line));
    console.log(PURPLE.bold('  🧟 ZOMBIE HOARD') + chalk.dim('  v3 — one zombie in a trenchcoat'));
    console.log(DEEP(line));
    console.log();
    wrapped.forEach((l) => console.log(HAZE.italic('  ' + l)));
    console.log();
    console.log(DEEP(line));
    console.log(chalk.dim('  Prey: ') + chalk.white.bold(`"${topic}"`));
    console.log(DEEP(line));
    console.log();
  },

  // ── Phase callbacks ────────────────────────────────────────────────────
  priorLoaded(prior) {
    const date = prior.lastRun ? new Date(prior.lastRun).toLocaleDateString() : '?';
    console.log(
      `  📡 ${PURPLE.bold('HIVEMIND ACTIVE')} — ${chalk.dim(`run #${prior.runCount}, ${prior.claims?.length || 0} prior claims, ${date}`)}`
    );
    console.log(HAZE.italic('     The Hoard remembers. New claims will be diffed against the old.'));
    console.log();
  },

  sourcesStart() {
    process.stdout.write(`  📚 ${chalk.dim('Fetching sources...')}\n`);
  },

  sourcesFetched(sources) {
    if (!sources || sources.length === 0) {
      console.log(`  📚 ${chalk.yellowBright('No sources fetched')} ${chalk.dim('— ungrounded run')}`);
      console.log();
      return;
    }
    console.log(`  📚 ${chalk.greenBright(`${sources.length} sources`)} ${chalk.dim('fed to the Hoard:')}`);
    sources.forEach((s) => {
      const kind = s.kind === 'wikipedia' ? '🌐' : '🔗';
      const titleStr = s.title.length > 50 ? s.title.slice(0, 47) + '...' : s.title;
      console.log(
        `     ${kind} ${chalk.dim(`[S${s.idx}]`)} ${chalk.white(titleStr)}  ${chalk.gray(s.url)}`
      );
    });
    console.log();
  },

  researchStart() {
    console.log(DEEP('─'.repeat(60)));
    console.log(`  💀 ${PURPLE.bold('NECROMANCER')} ${chalk.dim('chewing the topic against the sources...')}`);
  },

  researchComplete(result) {
    const m = result.metrics;
    const status = result.failed
      ? chalk.redBright('✗ FAILED')
      : chalk.greenBright('✓ RISEN');
    console.log(
      `  💀 ${PALE.bold('NECROMANCER')} ${status}  ${chalk.dim(`${result.duration}s · ${m.claims_extracted} claims · ${(m.grounding_ratio * 100).toFixed(0)}% grounded`)}`
    );
    if (m.citations_invalid > 0) {
      console.log(
        `     ${chalk.yellowBright('⚠')} ${chalk.dim(`${m.citations_invalid} invalid citations (model referenced sources that don't exist)`)}`
      );
    }
  },

  // ── Result block ───────────────────────────────────────────────────────
  results(runResult) {
    const { topic, meta, diff } = runResult;
    console.log();
    console.log(DEEP('═'.repeat(60)));
    console.log(PURPLE.bold('  ☠️  HOARD COMPLETE'));
    console.log(DEEP('═'.repeat(60)));
    console.log();
    console.log(`  ${chalk.dim('Topic:')}         ${chalk.white.bold(topic)}`);
    console.log(
      `  ${chalk.dim('Sources cited:')} ${fraction(meta.sourcesCited, meta.sourcesFetched)}   ${chalk.dim('(of fetched)')}`
    );
    console.log(
      `  ${chalk.dim('Sections:')}      ${fraction(meta.sectionsCovered, meta.sectionsTotal)}   ${chalk.dim('(of 7 cognitive angles)')}`
    );
    const groundedPct = Math.round((meta.groundingRatio || 0) * 100);
    console.log(
      `  ${chalk.dim('Grounding:')}     ${bar(meta.groundingRatio, 1, 12)} ${chalk.white(groundedPct + '%')}   ${chalk.dim(`(${meta.claimsGrounded}/${meta.claimsExtracted} claims cite a source)`)}`
    );
    if (meta.citationsInvalid > 0) {
      console.log(
        `  ${chalk.dim('Bad cites:')}     ${chalk.redBright(meta.citationsInvalid)} ${chalk.dim('(referenced source indices that do not exist)')}`
      );
    }
    if (meta.ungrounded) {
      console.log(
        `  ${chalk.dim('Mode:')}          ${chalk.yellowBright('UNGROUNDED')} ${chalk.dim('— answers come from model priors only')}`
      );
    }
    console.log(`  ${chalk.dim('Duration:')}      ${chalk.white(meta.totalDuration + 's')}`);
    console.log(`  ${chalk.dim('Tokens:')}        ${chalk.white((meta.totalTokens || 0).toLocaleString())}`);

    if (meta.savedPath) {
      console.log(`  ${chalk.dim('Saved to:')}      ${TEAL(meta.savedPath)}`);
    }

    if (diff) {
      console.log();
      console.log(`  ${PURPLE.bold('🩻 Diff vs prior run:')}`);
      console.log(
        `     ${chalk.greenBright('+ ' + diff.added + ' new')}   ${chalk.redBright('- ' + diff.removed + ' removed')}   ${chalk.dim(diff.kept + ' kept')}`
      );
    }

    if (meta.infectedTopics?.length > 0) {
      console.log();
      console.log(`  ${PURPLE.bold('🦠 ' + randomLore(INFECTION_PHRASES))}`);
      meta.infectedTopics.forEach((t) => {
        console.log(`     ${chalk.dim('→')} ${chalk.white(t)}`);
      });
    }

    console.log();
    console.log(DEEP('─'.repeat(60)));
    console.log();
  },

  synthesisPreview(result) {
    if (!result || !result.markdown) return;
    console.log();
    console.log(PURPLE.bold('  💀 NECROMANCER OUTPUT (preview):'));
    console.log(DEEP('─'.repeat(60)));
    console.log();

    if (result.executive) {
      console.log(chalk.white(' ' + result.executive));
      console.log();
    }
    if (result.contradictions) {
      console.log(chalk.yellowBright('  ⚠ Contradictions & Open Questions:'));
      console.log(chalk.dim('  ' + truncate(result.contradictions, 600).replace(/\n/g, '\n  ')));
      console.log();
    }

    const grounded = result.claims.filter((c) => c.grounded).slice(0, 6);
    if (grounded.length > 0) {
      console.log(chalk.dim('  Sample grounded claims:'));
      grounded.forEach((c) => {
        const src = c.sources.map((i) => `[S${i}]`).join(' ');
        console.log(`  ${chalk.greenBright('•')} ${chalk.dim(`(${c.section})`)} ${chalk.white(c.text.slice(0, 140))} ${chalk.cyanBright(src)}`);
      });
      console.log();
    }
  },

  tokenCost(totalTokens) {
    // Rough Sonnet 4 blended estimate. Local runs are free but harmless to display.
    const estimatedCost = ((totalTokens || 0) / 1_000_000) * 6;
    if (estimatedCost > 0.001) {
      console.log(`  ${chalk.dim('Est. cost:')}     ${TEAL('~$' + estimatedCost.toFixed(4))}`);
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
    console.log(DEEP('═'.repeat(60)));
    console.log(PURPLE.bold(`  🪦 KNOWLEDGE RECALLED: ${entry.topic}`));
    console.log(DEEP('═'.repeat(60)));
    console.log();
    console.log(`  ${chalk.dim('Runs:')}          ${chalk.white(entry.runCount)}`);
    console.log(`  ${chalk.dim('Last run:')}      ${chalk.white(new Date(entry.lastRun).toLocaleString())}`);
    if (entry.sourcesCited != null) {
      console.log(
        `  ${chalk.dim('Sources cited:')} ${fraction(entry.sourcesCited, entry.sourcesFetched)}`
      );
    }
    if (entry.sectionsCovered != null) {
      console.log(
        `  ${chalk.dim('Sections:')}      ${fraction(entry.sectionsCovered, entry.sectionsTotal || SECTIONS.length)}`
      );
    }
    if (entry.groundingRatio != null) {
      const pct = Math.round(entry.groundingRatio * 100);
      console.log(
        `  ${chalk.dim('Grounding:')}     ${bar(entry.groundingRatio, 1, 12)} ${chalk.white(pct + '%')}`
      );
    }
    const filepath = recalled.filepath || entry.filename;
    console.log(`  ${chalk.dim('File:')}          ${TEAL(filepath)}`);
    console.log();

    if (readError) {
      console.log(chalk.redBright('  ⚠ Knowledge file missing — run `infect` to regenerate.'));
    } else if (content) {
      console.log(chalk.dim('  Document preview:'));
      console.log();
      console.log(chalk.white(truncate(content, 2000)));
      if (content.length > 2000) {
        console.log(DEEP(`\n  ... open the file for the full document.`));
      }
    }
    console.log();
  },

  graveyard(data) {
    const { entries, totalRuns } = data;
    console.log();
    console.log(DEEP('═'.repeat(60)));
    console.log(PURPLE.bold('  🪦 KNOWLEDGE GRAVEYARD'));
    console.log(DEEP('═'.repeat(60)));
    console.log(
      `  ${chalk.dim('Total topics:')} ${chalk.white(entries.length)}   ${chalk.dim('Total runs:')} ${chalk.white(totalRuns)}`
    );
    console.log();
    console.log(HAZE.italic('  ' + randomLore(GRAVEYARD_EPITAPHS)));
    console.log();

    if (entries.length === 0) {
      console.log(chalk.dim('  The graveyard is empty. Deploy the hoard to fill it.'));
    } else {
      entries.forEach((entry) => {
        const grounded = entry.groundingRatio != null ? Math.round(entry.groundingRatio * 100) + '%' : '?';
        const cited = entry.sourcesCited != null ? `${entry.sourcesCited}/${entry.sourcesFetched}src` : '';
        const date = new Date(entry.lastRun).toLocaleDateString();
        console.log(
          `  ${PURPLE('◈')} ${chalk.white.bold(entry.topic.padEnd(35))} ${chalk.dim(`grounded:${grounded}  ${cited}  ${date}  ×${entry.runCount}`)}`
        );
        if (entry.infectedTopics?.length > 0) {
          console.log(chalk.dim(`      🦠 ${entry.infectedTopics.slice(0, 3).join(', ')}`));
        }
      });
    }
    console.log();
  },

  compare(r1, r2) {
    const line = '═'.repeat(60);
    console.log('\n' + DEEP(line));
    console.log(PURPLE.bold('  ⚔️  HOARD COMPARISON'));
    console.log(DEEP(line));
    console.log();

    const e1 = r1.entry;
    const e2 = r2.entry;
    const g1 = e1.groundingRatio != null ? Math.round(e1.groundingRatio * 100) + '%' : '?';
    const g2 = e2.groundingRatio != null ? Math.round(e2.groundingRatio * 100) + '%' : '?';

    console.log(`  ${chalk.white.bold(e1.topic.padEnd(30))} ${chalk.dim('vs.')} ${chalk.white.bold(e2.topic)}`);
    console.log();
    console.log(`  ${chalk.dim('Grounding:')}    ${chalk.white(g1.padEnd(14))}  │  ${chalk.white(g2)}`);
    console.log(`  ${chalk.dim('Sources:')}      ${chalk.white(String(e1.sourcesFetched ?? '?').padEnd(14))}  │  ${chalk.white(e2.sourcesFetched ?? '?')}`);
    console.log(`  ${chalk.dim('Sections:')}     ${chalk.white(String(e1.sectionsCovered ?? '?').padEnd(14))}  │  ${chalk.white(e2.sectionsCovered ?? '?')}`);
    console.log(`  ${chalk.dim('Claims:')}       ${chalk.white(String(e1.claimsExtracted ?? '?').padEnd(14))}  │  ${chalk.white(e2.claimsExtracted ?? '?')}`);
    console.log(`  ${chalk.dim('Runs:')}         ${chalk.white(String(e1.runCount).padEnd(14))}  │  ${chalk.white(e2.runCount)}`);
    console.log(`  ${chalk.dim('Last run:')}     ${chalk.white(new Date(e1.lastRun).toLocaleDateString().padEnd(14))}  │  ${chalk.white(new Date(e2.lastRun).toLocaleDateString())}`);

    const shared = (e1.infectedTopics || []).filter((t) =>
      (e2.infectedTopics || []).some((t2) => t2.toLowerCase() === t.toLowerCase())
    );
    if (shared.length > 0) {
      console.log();
      console.log(`  ${PURPLE.bold('🦠 Shared infected topics:')}`);
      shared.forEach((t) => console.log(`     ${chalk.dim('→')} ${chalk.white(t)}`));
    }

    console.log('\n' + DEEP(line) + '\n');
  },

  status(stats) {
    console.log();
    console.log(DEEP('─'.repeat(60)));
    console.log(PURPLE.bold('  🧟 ZOMBIE HOARD STATUS') + chalk.dim('  v3'));
    console.log(DEEP('─'.repeat(60)));
    console.log(`  ${chalk.dim('Model:')}        ${chalk.white(process.env.ZOMBIE_MODEL || 'auto')}`);
    console.log(`  ${chalk.dim('Provider:')}     ${chalk.white(process.env.ZOMBIE_PROVIDER || 'auto-detect')}`);
    console.log(`  ${chalk.dim('Local URL:')}    ${chalk.white(process.env.ZOMBIE_BASE_URL || 'http://localhost:11434/v1')}`);
    console.log(`  ${chalk.dim('Max sources:')} ${chalk.white(process.env.ZOMBIE_MAX_SOURCES || 5)}`);
    console.log(`  ${chalk.dim('Max tokens:')}  ${chalk.white(process.env.ZOMBIE_MAX_TOKENS || 4000)}`);
    console.log(`  ${chalk.dim('Timeout:')}     ${chalk.white((process.env.ZOMBIE_TIMEOUT || 180000) + 'ms')}`);
    console.log(
      `  ${chalk.dim('Anthropic key:')} ${process.env.ANTHROPIC_API_KEY ? chalk.greenBright('✓ set (fallback available)') : chalk.dim('✗ not set (local only)')}`
    );
    console.log(`  ${chalk.dim('Storage:')}     ${chalk.white(stats.storageDir)}`);
    console.log(`  ${chalk.dim('Topics:')}      ${chalk.white(stats.totalTopics)}`);
    console.log(`  ${chalk.dim('Total runs:')}  ${chalk.white(stats.totalRuns)}`);
    console.log();
  },

  error(msg) {
    console.error(chalk.redBright(`\n  ✗ ERROR: ${msg}\n`));
  },

  info(msg) {
    console.log(chalk.dim(`  ℹ ${msg}`));
  },

  // ── Lore display (unchanged from v2.0, kept as flavor) ─────────────────
  worldLore(text) { renderLoreBlock('📖 THE HOLLOW — World Lore', text, '═'); },
  necromancerLore(text) { renderLoreBlock('💀 THE NECROMANCER', text, '─'); },

  zombieLore(id, loreEntry) {
    const emoji = { CORTEX: '🧠', RELIC: '📜', GEARS: '⚙️', VENOM: '🩸', CLAW: '🛠️', SPORE: '🕸️', PROPHET: '🔮' }[id] || '🧟';
    const line = '─'.repeat(60);
    console.log('\n' + DEEP(line));
    console.log(`  ${emoji}  ${chalk.white.bold(id)} — ${PALE.italic(loreEntry.title)}`);
    console.log(HAZE.italic('  ' + loreEntry.epitaph));
    console.log(DEEP(line));
    console.log();
    loreEntry.lore.trim().split('\n').forEach((l) => {
      if (l.trim() === '') { console.log(); return; }
      console.log(chalk.white('  ' + l.trim()));
    });
    console.log();
  },

  loreMenu() {
    const line = '─'.repeat(60);
    console.log('\n' + DEEP(line));
    console.log(PURPLE.bold('  📖 ZOMBIE HOARD — Lore'));
    console.log(DEEP(line));
    console.log();
    console.log(chalk.dim('  Commands:'));
    [
      ['lore world', 'The mythology of The Hollow'],
      ['lore necromancer', "The Necromancer's origin"],
      ['lore cortex', '🧠 The First Principle'],
      ['lore relic', '📜 The Archivist'],
      ['lore gears', '⚙️  The Machinist'],
      ['lore venom', '🩸 The Wound'],
      ['lore claw', '🛠️  The Builder'],
      ['lore spore', '🕸️  The Network'],
      ['lore prophet', '🔮 The Edge'],
      ['lore all', 'Everything, in order'],
    ].forEach(([cmd, desc]) => {
      console.log(`  ${PURPLE(cmd.padEnd(20))} ${chalk.dim(desc)}`);
    });
    console.log();
  },
};

// ── Internal helpers ──────────────────────────────────────────────────────────
function wrapLines(text, width) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > width) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function truncate(s, n) {
  if (!s || s.length <= n) return s || '';
  return s.slice(0, n) + '…';
}

function renderLoreBlock(title, text, char) {
  const line = char.repeat(60);
  console.log('\n' + DEEP(line));
  console.log(PURPLE.bold('  ' + title));
  console.log(DEEP(line));
  console.log();
  text.trim().split('\n').forEach((l) => {
    if (l.trim() === '') { console.log(); return; }
    if (l.trim().toUpperCase() === l.trim() && l.trim().length > 2) {
      console.log(PALE.bold('  ' + l));
    } else if (l.startsWith('*') && l.endsWith('*')) {
      console.log(HAZE.italic('  ' + l.replace(/\*/g, '')));
    } else {
      console.log(chalk.white('  ' + l));
    }
  });
  console.log('\n' + DEEP(line) + '\n');
}
