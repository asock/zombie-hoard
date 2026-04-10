---
name: zombie-hoard
version: 1.0.0
description: Deploy a parallel swarm of specialized LLM zombie agents to deeply learn any topic, synthesize findings, and grow a persistent knowledge graveyard.
author: hellsy.net
license: MIT
tags: [learning, research, ai, agents, parallel, knowledge-base]
---

# Zombie Hoard — Parallel AI Learning Skill

A swarm of 7 specialized zombie LLM agents that simultaneously consume a topic from different cognitive angles. A Necromancer agent synthesizes their findings into structured knowledge, which is persisted to a local graveyard for future recall.

## When to use this skill

Invoke the Zombie Hoard when the user wants to:
- Deeply understand a complex topic from multiple angles
- Research something thoroughly and save the findings
- Generate a comprehensive breakdown of a subject
- Build up a persistent knowledge base on a domain
- Get both technical depth AND practical breadth on a topic simultaneously

Trigger phrases: "zombie hoard", "deploy the hoard", "learn everything about", "hoard it", "infect the hoard with", "feed the hoard", "what does the hoard know about", "show me the graveyard", "knowledge graveyard"

## Commands

| Command | Description |
|---|---|
| `learn <topic>` | Deploy the full 7-zombie hoard on a topic |
| `quick <topic>` | Deploy a 3-zombie hoard (CORTEX, GEARS, CLAW) for fast results |
| `recall <topic>` | Retrieve previously learned knowledge from the graveyard |
| `graveyard` | List all topics in the knowledge graveyard |
| `infect <topic>` | Re-run hoard on a topic and merge with existing knowledge |
| `status` | Show hoard configuration and stats |

## Invocation examples

User: "Deploy the zombie hoard on TypeScript generics"
→ Run: `node /path/to/zombie-hoard/index.js learn "TypeScript generics"`

User: "What does the hoard know about Rust?"
→ Run: `node /path/to/zombie-hoard/index.js recall "Rust"`

User: "Show me the knowledge graveyard"
→ Run: `node /path/to/zombie-hoard/index.js graveyard`

User: "Quick hoard: WebSockets"
→ Run: `node /path/to/zombie-hoard/index.js quick "WebSockets"`

## Zombie roles

- 🧠 **CORTEX** — Core concepts, definitions, first principles, mental models
- 📜 **RELIC** — Historical context, origins, evolution, key milestones
- ⚙️ **GEARS** — Technical mechanics, implementation details, internals
- 🩸 **VENOM** — Critiques, failure modes, weaknesses, controversies, gotchas
- 🛠️ **CLAW** — Practical applications, real-world examples, code patterns
- 🕸️ **SPORE** — Cross-domain connections, analogies, related concepts
- 🔮 **PROPHET** — Future trends, emerging directions, what's next

## Output

Each run produces:
1. Live terminal output with per-zombie progress
2. A synthesized markdown knowledge document saved to `~/.openclaw/zombie-hoard/knowledge/<topic>.md`
3. An index entry in `~/.openclaw/zombie-hoard/graveyard.json`

## Configuration

Env vars (optional — falls back to OpenClaw's configured model):
- `ZOMBIE_MODEL` — LLM model to use (default: claude-sonnet-4-20250514)
- `ZOMBIE_HOARD_SIZE` — Number of zombies (1-7, default: 7)
- `ZOMBIE_MAX_TOKENS` — Max tokens per zombie (default: 1500)
- `ANTHROPIC_API_KEY` — Anthropic API key (or use OPENAI_API_KEY for OpenAI-compatible)

## Notes

- All zombies run in parallel — total wall time ≈ single-zombie time
- Knowledge is append-on-infect — re-running a topic merges new findings
- The Undead Index (0-10) rates each zombie's confidence/depth
- Spore zombies may suggest new topics; the agent can chain-infect automatically
