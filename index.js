#!/usr/bin/env node
// index.js — Zombie Hoard CLI entry point v2.0
// Usage: node index.js <command> [args]

import { Hoard } from './lib/hoard.js';
import { storage } from './lib/storage.js';
import { display } from './lib/display.js';
import { ZOMBIE_ROSTER } from './lib/zombie.js';
import { WORLD_LORE, NECROMANCER_LORE, ZOMBIE_LORE } from './lib/lore.js';

const VERSION = '2.0.0';

// ── Graceful shutdown ──────────────────────────────────────────────────────────
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

// ── Command: learn <topic> ─────────────────────────────────────────────────────
async function cmdLearn(topic, mode = 'full') {
  if (!topic) { display.error('Provide a topic. Example: zombie-hoard learn "TypeScript generics"'); process.exit(1); }

  const roster = mode === 'quick'
    ? ['CORTEX', 'GEARS', 'CLAW']
    : Object.keys(ZOMBIE_ROSTER);

  display.banner(topic);
  display.hoardRoster(roster.map(id => ZOMBIE_ROSTER[id]));

  const hoard = new Hoard({
    mode,
    onHivemindLoaded: (prior) => display.hivemindActive(prior),
    onZombieStart: (zombie) => display.zombieStart(zombie),
    onZombieComplete: (zombie, result) => display.zombieComplete(zombie, result),
    onNecromancerStart: () => display.necromancerStart(),
    onNecromancerComplete: (result) => display.necromancerComplete(result),
  });

  activeHoard = hoard;

  try {
    const result = await hoard.deploy(topic, { save: true });

    display.results(result);
    display.synthesis(result.synthesisResult);
    display.tokenCost(result.meta.totalTokens);

    console.log('  Run `zombie-hoard recall "' + topic + '"` to re-read the knowledge.\n');
  } catch (err) {
    display.error(err.message);
    process.exit(1);
  } finally {
    activeHoard = null;
  }
}

// ── Command: quick <topic> ────────────────────────────────────────────────────
async function cmdQuick(topic) {
  return cmdLearn(topic, 'quick');
}

// ── Command: recall <topic> ───────────────────────────────────────────────────
function cmdRecall(topic) {
  if (!topic) { display.error('Provide a topic. Example: zombie-hoard recall "TypeScript"'); process.exit(1); }
  const recalled = storage.recall(topic);
  display.recallResult(topic, recalled);
}

// ── Command: graveyard ────────────────────────────────────────────────────────
function cmdGraveyard() {
  const data = storage.listGraveyard();
  display.graveyard(data);
}

// ── Command: infect <topic> ─────────────────────────────────────────────────
async function cmdInfect(topic) {
  if (!topic) { display.error('Provide a topic.'); process.exit(1); }

  const existing = storage.recall(topic);
  if (existing) {
    display.info(`Existing knowledge found (score: ${existing.entry.hoardScore}/10, runs: ${existing.entry.runCount}). Infecting with fresh feeding...`);
  } else {
    display.info('No existing knowledge. Running fresh hoard...');
  }

  return cmdLearn(topic, 'full');
}

// ── Command: purge <topic> ──────────────────────────────────────────────────
function cmdPurge(topic) {
  if (!topic) { display.error('Provide a topic to purge. Example: zombie-hoard purge "TypeScript"'); process.exit(1); }
  const result = storage.purge(topic);
  if (result.purged) {
    display.info(`🪦 Purged "${result.topic}" from the graveyard. Knowledge destroyed.`);
  } else {
    display.error(result.reason);
  }
}

// ── Command: export <topic> [--json] ───────────────────────────────────────────
function cmdExport(topic) {
  if (!topic) { display.error('Provide a topic. Example: zombie-hoard export "TypeScript" --json'); process.exit(1); }
  const data = storage.exportJSON(topic);
  if (!data) {
    display.error(`No knowledge found for "${topic}" in the graveyard.`);
    process.exit(1);
  }
  // Output raw JSON to stdout (pipeable)
  console.log(JSON.stringify(data, null, 2));
}

// ── Command: compare <topic1> <topic2> ─────────────────────────────────────────
function cmdCompare(topicArgs) {
  // Parse two topics separated by " vs ", " and ", or just two quoted args
  let topic1, topic2;

  const vsMatch = topicArgs.match(/^(.+?)\s+(?:vs\.?|and|&)\s+(.+)$/i);
  if (vsMatch) {
    topic1 = vsMatch[1].replace(/^["']|["']$/g, '').trim();
    topic2 = vsMatch[2].replace(/^["']|["']$/g, '').trim();
  } else {
    display.error('Usage: zombie-hoard compare "Topic A" vs "Topic B"');
    process.exit(1);
  }

  const r1 = storage.recall(topic1);
  const r2 = storage.recall(topic2);

  if (!r1) { display.error(`No knowledge found for "${topic1}"`); process.exit(1); }
  if (!r2) { display.error(`No knowledge found for "${topic2}"`); process.exit(1); }

  display.compare(r1, r2);
}

// ── Command: lore [subject] ───────────────────────────────────────────────────
function cmdLore(subject) {
  const key = (subject || '').toLowerCase().trim();

  if (!key || key === 'help') {
    display.loreMenu();
    return;
  }
  if (key === 'world' || key === 'hollow') {
    display.worldLore(WORLD_LORE);
    return;
  }
  if (key === 'necromancer' || key === 'nec') {
    display.necromancerLore(NECROMANCER_LORE);
    return;
  }
  if (key === 'all') {
    display.worldLore(WORLD_LORE);
    display.necromancerLore(NECROMANCER_LORE);
    for (const [id, entry] of Object.entries(ZOMBIE_LORE)) {
      display.zombieLore(id, entry, null);
    }
    return;
  }

  const zombieId = key.toUpperCase();
  if (ZOMBIE_LORE[zombieId]) {
    display.zombieLore(zombieId, ZOMBIE_LORE[zombieId], null);
    return;
  }

  display.error(`Unknown lore subject: "${subject}". Try: zombie-hoard lore`);
}

// ── Command: status ───────────────────────────────────────────────────────────
function cmdStatus() {
  const stats = storage.stats();
  display.status({}, stats);
}

// ── Help ──────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
  🧟 ZOMBIE HOARD v${VERSION} — OpenClaw Skill

  COMMANDS:
    learn <topic>       Deploy full 7-zombie hoard on a topic
    quick <topic>       Deploy 3-zombie hoard (CORTEX, GEARS, CLAW)
    recall <topic>      Retrieve saved knowledge from the graveyard
    infect <topic>      Re-run hoard on a topic (merges with existing)
    purge <topic>       Delete a topic from the graveyard permanently
    export <topic>      Export knowledge as JSON (pipeable to stdout)
    compare <A> vs <B>  Compare two graveyard topics side by side
    graveyard           List all topics in the knowledge graveyard
    lore [subject]      Read the mythology of the Hoard
    status              Show configuration and stats
    version             Show version
    help                Show this message

  EXAMPLES:
    node index.js learn "TypeScript generics"
    node index.js quick "WebSockets"
    node index.js recall "Rust"
    node index.js purge "Old Topic"
    node index.js export "Rust" > rust.json
    node index.js compare "React vs Vue"
    node index.js graveyard

  ENV VARS:
    ZOMBIE_BASE_URL      Local OpenAI-compatible endpoint (default: http://localhost:11434/v1)
    ZOMBIE_MODEL         Model name (default: llama3.2 local, claude-sonnet-4-20250514 anthropic)
    ZOMBIE_PROVIDER      Force provider: local|anthropic (default: auto-detect)
    ANTHROPIC_API_KEY    Optional fallback if no local server is reachable
    ZOMBIE_HOARD_SIZE    Number of zombies 1-7 (default: 7)
    ZOMBIE_MAX_TOKENS    Tokens per zombie (default: 1500)
    ZOMBIE_CONCURRENCY   Max parallel calls (default: 4)
    ZOMBIE_TIMEOUT       Per-zombie timeout ms (default: 120000)
    ZOMBIE_RETRIES       Retries per zombie on failure (default: 1)
    ZOMBIE_STORAGE_DIR   Knowledge storage path (default: ~/.openclaw/zombie-hoard)
`);
}

// ── Router ─────────────────────────────────────────────────────────────────────
const [,, command, ...args] = process.argv;
const topic = args.join(' ').replace(/^["']|["']$/g, '').trim();

switch (command) {
  case 'learn':     await cmdLearn(topic);      break;
  case 'quick':     await cmdQuick(topic);      break;
  case 'recall':    cmdRecall(topic);           break;
  case 'graveyard': cmdGraveyard();             break;
  case 'infect':    await cmdInfect(topic);     break;
  case 'purge':     cmdPurge(topic);            break;
  case 'export':    cmdExport(topic);           break;
  case 'compare':   cmdCompare(topic);          break;
  case 'lore':      cmdLore(topic);             break;
  case 'status':    cmdStatus();                break;
  case 'version':
  case '--version':
  case '-v':        console.log(`zombie-hoard v${VERSION}`); break;
  case 'help':
  case '--help':
  case '-h':        showHelp();                 break;
  default:
    if (command) {
      await cmdLearn([command, ...args].join(' '));
    } else {
      showHelp();
    }
}
