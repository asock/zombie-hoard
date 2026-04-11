#!/usr/bin/env node
// index.js — Zombie Hoard CLI entry point (v3.0)
//
// "One zombie in a trenchcoat." The 7-zombie fan-out is gone. The 7 cognitive
// angles survive as section headers in a single grounded research call against
// real fetched sources.

import { Hoard } from './lib/hoard.js';
import { storage } from './lib/storage.js';
import { display } from './lib/display.js';
import { WORLD_LORE, NECROMANCER_LORE, ZOMBIE_LORE } from './lib/lore.js';

const VERSION = '3.0.0';

// ── Graceful shutdown ────────────────────────────────────────────────────────
let activeHoard = null;

process.on('SIGINT', () => {
  if (activeHoard) {
    display.info('SIGINT received — aborting hoard deployment...');
    activeHoard.abort();
  } else {
    console.log();
    process.exit(0);
  }
});

process.on('uncaughtException', (err) => {
  display.error(`Uncaught: ${err.message || err}`);
  process.exit(1);
});

// ── Argv parsing ─────────────────────────────────────────────────────────────
//
// Supports flags interleaved with positional args:
//   --url <url>          Inject an explicit URL as a source (repeatable)
//   --no-sources         Skip source fetching (ungrounded mode)
//   --max-sources <n>    Cap the number of sources fetched
//   --quick              Fetch fewer sources, lower max_tokens
//
function parseArgs(rawArgs) {
  const flags = { urls: [], ungrounded: false, maxSources: null, quick: false };
  const positional = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--url' && rawArgs[i + 1]) {
      flags.urls.push(rawArgs[++i]);
    } else if (a === '--no-sources' || a === '--ungrounded') {
      flags.ungrounded = true;
    } else if (a === '--max-sources' && rawArgs[i + 1]) {
      const n = parseInt(rawArgs[++i], 10);
      if (!Number.isNaN(n)) flags.maxSources = n;
    } else if (a === '--quick') {
      flags.quick = true;
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

// ── Command: learn <topic> ───────────────────────────────────────────────────
async function cmdLearn(topic, flags = {}) {
  if (!topic) {
    display.error('Provide a topic. Example: zombie-hoard learn "TypeScript generics"');
    process.exit(1);
  }

  display.banner(topic);

  const hoard = new Hoard({
    urls: flags.urls,
    ungrounded: flags.ungrounded,
    maxSources: flags.quick ? 3 : flags.maxSources,
    maxTokens: flags.quick ? 2500 : undefined,
    onPriorLoaded: (prior) => display.priorLoaded(prior),
    onSourcesStart: () => display.sourcesStart(),
    onSourcesFetched: (sources) => display.sourcesFetched(sources),
    onResearchStart: () => display.researchStart(),
    onResearchComplete: (result) => display.researchComplete(result),
  });

  activeHoard = hoard;

  try {
    const runResult = await hoard.deploy(topic, { save: true });
    display.results(runResult);
    display.synthesisPreview(runResult.result);
    display.tokenCost(runResult.meta.totalTokens);

    console.log(`  Run \`zombie-hoard recall "${topic}"\` to re-read the knowledge.\n`);
  } catch (err) {
    display.error(err.message || String(err));
    process.exit(1);
  } finally {
    activeHoard = null;
  }
}

// ── Command: quick <topic> ───────────────────────────────────────────────────
async function cmdQuick(topic, flags = {}) {
  return cmdLearn(topic, { ...flags, quick: true });
}

// ── Command: recall <topic> ──────────────────────────────────────────────────
function cmdRecall(topic) {
  if (!topic) {
    display.error('Provide a topic. Example: zombie-hoard recall "TypeScript"');
    process.exit(1);
  }
  const recalled = storage.recall(topic);
  display.recallResult(topic, recalled);
}

// ── Command: graveyard ───────────────────────────────────────────────────────
function cmdGraveyard() {
  display.graveyard(storage.listGraveyard());
}

// ── Command: infect <topic> ──────────────────────────────────────────────────
async function cmdInfect(topic, flags = {}) {
  if (!topic) {
    display.error('Provide a topic.');
    process.exit(1);
  }
  const existing = storage.findEntry(topic);
  if (existing) {
    display.info(
      `Existing knowledge found (run #${existing.runCount}, ${existing.claimsExtracted ?? '?'} prior claims). New run will be diffed against it.`
    );
  } else {
    display.info('No prior knowledge. Running fresh.');
  }
  return cmdLearn(topic, flags);
}

// ── Command: purge <topic> ───────────────────────────────────────────────────
function cmdPurge(topic) {
  if (!topic) {
    display.error('Provide a topic to purge. Example: zombie-hoard purge "TypeScript"');
    process.exit(1);
  }
  const result = storage.purge(topic);
  if (result.purged) {
    display.info(`🪦 Purged "${result.topic}" from the graveyard. Knowledge destroyed.`);
  } else {
    display.error(result.reason);
  }
}

// ── Command: export <topic> ──────────────────────────────────────────────────
function cmdExport(topic) {
  if (!topic) {
    display.error('Provide a topic. Example: zombie-hoard export "TypeScript" > out.json');
    process.exit(1);
  }
  const data = storage.exportJSON(topic);
  if (!data) {
    display.error(`No knowledge found for "${topic}" in the graveyard.`);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

// ── Command: compare <A> vs <B> ──────────────────────────────────────────────
function cmdCompare(topicArgs) {
  const vsMatch = topicArgs.match(/^(.+?)\s+(?:vs\.?|and|&)\s+(.+)$/i);
  if (!vsMatch) {
    display.error('Usage: zombie-hoard compare "Topic A" vs "Topic B"');
    process.exit(1);
  }
  const topic1 = vsMatch[1].replace(/^["']|["']$/g, '').trim();
  const topic2 = vsMatch[2].replace(/^["']|["']$/g, '').trim();

  const r1 = storage.recall(topic1);
  const r2 = storage.recall(topic2);
  if (!r1) { display.error(`No knowledge found for "${topic1}"`); process.exit(1); }
  if (!r2) { display.error(`No knowledge found for "${topic2}"`); process.exit(1); }

  display.compare(r1, r2);
}

// ── Command: lore ────────────────────────────────────────────────────────────
function cmdLore(subject) {
  const key = (subject || '').toLowerCase().trim();

  if (!key || key === 'help') { display.loreMenu(); return; }
  if (key === 'world' || key === 'hollow') { display.worldLore(WORLD_LORE); return; }
  if (key === 'necromancer' || key === 'nec') { display.necromancerLore(NECROMANCER_LORE); return; }
  if (key === 'all') {
    display.worldLore(WORLD_LORE);
    display.necromancerLore(NECROMANCER_LORE);
    for (const [id, entry] of Object.entries(ZOMBIE_LORE)) {
      display.zombieLore(id, entry);
    }
    return;
  }

  const zombieId = key.toUpperCase();
  if (ZOMBIE_LORE[zombieId]) {
    display.zombieLore(zombieId, ZOMBIE_LORE[zombieId]);
    return;
  }
  display.error(`Unknown lore subject: "${subject}". Try: zombie-hoard lore`);
}

// ── Command: status ──────────────────────────────────────────────────────────
function cmdStatus() {
  display.status(storage.stats());
}

// ── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
  🧟 ZOMBIE HOARD v${VERSION} — one zombie in a trenchcoat

  COMMANDS:
    learn <topic> [flags]     Fetch sources, run grounded research, save
    quick <topic> [flags]     Same, with fewer sources / smaller budget
    infect <topic> [flags]    Re-run on a topic; diffs against prior claims
    recall <topic>            Show saved knowledge from the graveyard
    purge <topic>             Delete a topic from the graveyard
    export <topic>            Print structured JSON to stdout (pipeable)
    compare <A> vs <B>        Compare two topics in the graveyard
    graveyard                 List all stored topics
    lore [subject]            Read the mythology of the Hoard
    status                    Show configuration and stats
    version                   Show version
    help                      Show this message

  FLAGS (for learn / quick / infect):
    --url <url>          Inject an explicit URL as a source (repeatable)
    --no-sources         Skip source fetching (ungrounded mode)
    --max-sources <n>    Cap how many sources to fetch (default: 5)

  EXAMPLES:
    node index.js learn "TypeScript generics"
    node index.js learn "WebSockets" --max-sources 3
    node index.js learn "Custom Topic" --url https://example.com/spec.html
    node index.js infect "TypeScript generics"
    node index.js export "TypeScript generics" > ts.json
    node index.js compare "React vs Vue"

  ENV VARS:
    ZOMBIE_BASE_URL          Local OpenAI-compatible endpoint (default: http://localhost:11434/v1)
    ZOMBIE_MODEL             Model name
    ZOMBIE_PROVIDER          Force provider: local|anthropic
    ANTHROPIC_API_KEY        Optional fallback if no local server is reachable
    ZOMBIE_MAX_SOURCES       Max sources fetched per run (default: 5)
    ZOMBIE_MAX_TOKENS        Max tokens for the research call (default: 4000)
    ZOMBIE_TIMEOUT           Per-call timeout in ms (default: 180000)
    ZOMBIE_STORAGE_DIR       Knowledge storage path (default: ~/.openclaw/zombie-hoard)
`);
}

// ── Router ───────────────────────────────────────────────────────────────────
const [, , command, ...rawArgs] = process.argv;
const { flags, positional } = parseArgs(rawArgs);
const topic = positional.join(' ').replace(/^["']|["']$/g, '').trim();

switch (command) {
  case 'learn':     await cmdLearn(topic, flags); break;
  case 'quick':     await cmdQuick(topic, flags); break;
  case 'recall':    cmdRecall(topic); break;
  case 'graveyard': cmdGraveyard(); break;
  case 'infect':    await cmdInfect(topic, flags); break;
  case 'purge':     cmdPurge(topic); break;
  case 'export':    cmdExport(topic); break;
  case 'compare':   cmdCompare(topic); break;
  case 'lore':      cmdLore(topic); break;
  case 'status':    cmdStatus(); break;
  case 'version':
  case '--version':
  case '-v':        console.log(`zombie-hoard v${VERSION}`); break;
  case 'help':
  case '--help':
  case '-h':        showHelp(); break;
  default:
    if (command) {
      // Bare topic — treat as `learn`
      await cmdLearn([command, ...positional].join(' ').trim(), flags);
    } else {
      showHelp();
    }
}
