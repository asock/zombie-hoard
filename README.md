# 🧟 ZOMBIE HOARD v2.0

> *Deploy a parallel swarm of zombie LLM agents to deeply learn any topic*

An [OpenClaw](https://openclaw.dev) skill by [hellsy.net](https://hellsy.net)

Themed after *Return of the Living Dead* (1985) — Darrow Chemical Company. 2-4-5 Trioxin. Louisville, Kentucky. July 3, 1984.

---

## What It Does

Zombie Hoard deploys **7 specialized AI agents in parallel**, each attacking a topic from a unique cognitive angle. A **Necromancer** synthesizes their findings into a unified knowledge document. Knowledge is saved to a persistent **graveyard** and compounds across re-runs via **hivemind memory**.

### The Hoard

| Zombie | Hunger | Perspective |
|--------|--------|-------------|
| 🧠 **CORTEX** | Core concepts | First principles, mental models, definitions |
| 📜 **RELIC** | History | Origins, evolution, key milestones |
| ⚙️ **GEARS** | Mechanics | Technical internals, implementation details |
| 🩸 **VENOM** | Weaknesses | Failure modes, gotchas, controversies |
| 🛠️ **CLAW** | Practical | Real-world patterns, actionable examples |
| 🕸️ **SPORE** | Connections | Cross-domain analogies, related concepts |
| 🔮 **PROPHET** | Future | Trends, emerging directions, what's next |

### The Necromancer (💀)

Reads all zombie reports and raises a unified synthesis — executive summary, cross-cutting insights, contradictions, infected topics for further exploration, and a final **Hoard Score** (0-10).

---

## Install

```bash
git clone https://github.com/asock/zombie-hoard.git
cd zombie-hoard
npm install
```

## Setup

Zombie Hoard runs **locally by default** against any OpenAI-compatible LLM
endpoint — Ollama, llama.cpp, vLLM, LM Studio, etc.

```bash
# 1. Start a local model server (example: Ollama)
ollama serve &
ollama pull llama3.2

# 2. Run a hoard — no API key needed
node index.js quick "WebSockets"
```

If no local server is reachable, Zombie Hoard will fall back to the Anthropic
API automatically *iff* `ANTHROPIC_API_KEY` is set in the environment:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

To force a provider, set `ZOMBIE_PROVIDER=local` or `ZOMBIE_PROVIDER=anthropic`.

## Usage

```bash
# Full 7-zombie hoard
node index.js learn "TypeScript generics"

# Quick 3-zombie hoard (CORTEX, GEARS, CLAW)
node index.js quick "WebSockets"

# Re-run to compound knowledge (hivemind memory)
node index.js infect "TypeScript generics"

# Retrieve saved knowledge
node index.js recall "TypeScript"

# List all learned topics
node index.js graveyard

# Delete a topic
node index.js purge "Old Topic"

# Export as JSON (pipeable)
node index.js export "TypeScript" > typescript.json

# Compare two topics
node index.js compare "React vs Vue"

# Read the lore
node index.js lore
node index.js lore cortex
node index.js lore world

# Show config
node index.js status
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ZOMBIE_BASE_URL` | `http://localhost:11434/v1` | Local OpenAI-compatible endpoint |
| `ZOMBIE_MODEL` | `llama3.2` (local) / `claude-sonnet-4-20250514` (anthropic) | Model name |
| `ZOMBIE_PROVIDER` | *(auto)* | Force provider: `local` or `anthropic` |
| `ANTHROPIC_API_KEY` | *(unset)* | Optional fallback if no local server is reachable |
| `ZOMBIE_HOARD_SIZE` | `7` | Number of zombies (1-7) |
| `ZOMBIE_MAX_TOKENS` | `1500` | Max tokens per zombie response |
| `ZOMBIE_CONCURRENCY` | `4` | Max parallel calls |
| `ZOMBIE_TIMEOUT` | `120000` | Per-zombie timeout in ms |
| `ZOMBIE_RETRIES` | `1` | Retries per zombie on failure |
| `ZOMBIE_STORAGE_DIR` | `~/.openclaw/zombie-hoard` | Knowledge storage path |

## Architecture

```
index.js              CLI router + commands
lib/
  llm.js              Unified LLM client (local OpenAI-compat → Anthropic fallback)
  hoard.js            Orchestrator — spawns zombies with concurrency throttle
  zombie.js           Individual LLM agent with retry + timeout
  necromancer.js      Synthesis agent
  storage.js          Persistent graveyard (JSON index + markdown files)
  display.js          Terminal UI (chalk)
  lore.js             Return of the Living Dead mythology
```

## v2.0 Changelog

**Bugs Fixed:** `hoistScore` typo, NaN-safe parseInt, empty slugs for non-Latin topics, unclamped undead index, absolute path portability, dead code removal, no API timeout, no rate limit protection

**Security:** API key leak prevention in errors, topic input length cap, restrictive file permissions (0o600), graveyard size cap (500 entries)

**New Features:** `purge`, `export --json`, `compare`, `--version`, retry with exponential backoff, graceful SIGINT, concurrency throttle, token cost estimation

## The Lore

Every zombie, the Necromancer, and the world itself have deep backstories rooted in the 1985 film. Run `zombie-hoard lore all` to read the full mythology.

> *"Do you ever wonder about all the different ways of dying?" — Suicide, before he found out.*

---

**License:** MIT

**Author:** [hellsy.net](https://hellsy.net)
