# 🧟 ZOMBIE HOARD v3.1

> *One zombie in a trenchcoat. Doing it honestly. Now with a web UI.*

An [OpenClaw](https://openclaw.dev) skill by [hellsy.net](https://hellsy.net)

Themed after *Return of the Living Dead* (1985) — Darrow Chemical Company. 2-4-5 Trioxin. Louisville, Kentucky. July 3, 1984.

---

## What changed in v3.0

v2.0 deployed "7 specialized zombie agents in parallel." That was theatre. They
were all the same model with the same training data wearing different roleplay
costumes. Seven cosplaying agents are not an ensemble; they're one mind in a
trenchcoat. v2.0 also had **zero grounding** — every "fact" came from the
model's frozen priors with no sources.

v3.0 fixes the actual problems:

- **Real sources.** The Hoard fetches Wikipedia (and any URLs you hand it),
  feeds the actual text into the prompt, and the model is required to cite
  inline as `[S1]`, `[S2]`, etc.
- **One call, not eight.** The 7 cognitive angles (CORTEX, RELIC, GEARS, etc.)
  survive as section headers in a single research call. Same coverage,
  ~1/4 the tokens, no synthesis-glue tax.
- **Structured claims with provenance.** Every bulleted claim is parsed out
  with its section and source citations and stored in a JSON sidecar
  (`claims/<slug>.json`) alongside the rendered markdown.
- **Honest metrics.** No more self-graded "Hoard Score" or "Undead Index."
  We measure: how many sources were cited, how many of the 7 sections were
  covered, and the *grounding ratio* (claims with citations / total claims).
- **Re-runs actually compound.** `infect` loads the prior structured claims,
  passes them as context to the new run, and **diffs new claims against
  old** by Jaccard similarity. You see what was added, removed, or kept —
  not a smoothed-over echo of the previous synthesis.
- **Contradictions are surfaced, not smoothed.** The prompt instructs the
  Necromancer to put disagreements between sources (and disagreements with
  prior knowledge) under a dedicated "Contradictions & Open Questions"
  section. Disagreement is the most useful signal a re-run can produce.

The lore stays. The 🧟 emoji stay. The dignity, surprisingly, also stays.

---

## The Seven Angles

Still 7. They're now section headers, not separate calls.

| Angle | Focus |
|-------|-------|
| 🧠 **CORTEX** | First principles, definitions, mental models |
| 📜 **RELIC** | Origins, evolution, key milestones |
| ⚙️ **GEARS** | Technical internals, implementation, trade-offs |
| 🩸 **VENOM** | Failure modes, gotchas, honest criticism |
| 🛠️ **CLAW** | Real-world patterns, actionable examples |
| 🕸️ **SPORE** | Cross-domain analogies, related concepts |
| 🔮 **PROPHET** | Trends, emerging directions, what's next |

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
node index.js learn "WebSockets"
```

If no local server is reachable, Zombie Hoard will fall back to the Anthropic
API automatically *iff* `ANTHROPIC_API_KEY` is set:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

To force a provider, set `ZOMBIE_PROVIDER=local` or `ZOMBIE_PROVIDER=anthropic`.

## Web UI (v3.1)

There's a full-featured browser UI now. Same architecture (one honest call), but
the presentation lets the seven facets stage like a proper feeding, with
character commentary, full bios, and live SSE updates as the run progresses.

```bash
node index.js serve              # http://127.0.0.1:7331
node index.js serve 8080         # custom port
node index.js serve --host 0.0.0.0 --port 9000
```

What you get:

- **/** — Home: deploy form, recent topics, character roster
- **/run/&lt;id&gt;** — Live SSE-driven feeding page; phases tick over in
  real time, then each zombie's section "rises" one by one with their
  portrait, voice commentary, content, and extracted claims with
  citations.
- **/topic/&lt;slug&gt;** — Saved topic view: same rich rendering, loaded
  from the structured sidecar.
- **/zombies** — The Hoard: roster of all 7 facets + the Necromancer
- **/zombies/cortex**, **/zombies/relic**, ... — Per-character bio
  pages with full lore, voice samples, "how they arrive" lines,
  "while reading sources" lines, and trademark claim openers.
- **/necromancer** — Colonel Glover's bio
- **/lore** — The Hollow: full world backstory + atmospheric quotes
- **/api/graveyard** — JSON list of all topics
- **/api/topic/&lt;slug&gt;** — JSON sidecar for one topic

The graphics are deliberately simple (inline SVG portraits, no image
files, no build step), but the *content* is dense: every page is
populated with character bios, voice samples, and per-phase commentary
pulled from `lib/characters.js`. The 7 zombies and the Necromancer
each have ~5 voice samples, ~3 "arrival" lines, and (for the zombies)
"while reading sources" + trademark claim opener lines. They're all
rendered randomly per page load so the UI feels populated by the
characters, not just the data.

## Usage

```bash
# Grounded research run
node index.js learn "TypeScript generics"

# Smaller / faster (3 sources, lower token budget)
node index.js quick "WebSockets"

# Inject explicit URLs as additional sources
node index.js learn "Custom Topic" --url https://example.com/spec.html

# Skip source fetching entirely (ungrounded mode — model priors only)
node index.js learn "Quantum Foo" --no-sources

# Re-run and diff against prior structured claims
node index.js infect "TypeScript generics"

# Retrieve saved knowledge
node index.js recall "TypeScript"

# List all stored topics
node index.js graveyard

# Delete a topic
node index.js purge "Old Topic"

# Export structured JSON (sources + claims + sections)
node index.js export "TypeScript" > typescript.json

# Compare two stored topics
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
| `ZOMBIE_MAX_SOURCES` | `5` | Max sources fetched per run |
| `ZOMBIE_MAX_CHARS_PER_SOURCE` | `6000` | Per-source text cap |
| `ZOMBIE_SOURCE_TIMEOUT` | `10000` | Source-fetch timeout in ms |
| `ZOMBIE_MAX_TOKENS` | `4000` | Max tokens for the research call |
| `ZOMBIE_TIMEOUT` | `180000` | LLM call timeout in ms |
| `ZOMBIE_STORAGE_DIR` | `~/.openclaw/zombie-hoard` | Knowledge storage path |

## Architecture

```
index.js              CLI router + commands (incl. `serve`)
lib/
  llm.js              Unified LLM client (local OpenAI-compat → Anthropic fallback)
  sources.js          Wikipedia + URL fetching, HTML→text, source context builder
  research.js         The honest research pipeline: ONE grounded call, structured output
  hoard.js            Thin orchestrator: prior → fetch → research → diff → save
  storage.js          Persistent graveyard: markdown + JSON sidecar with claims
  display.js          Terminal UI (chalk)
  lore.js             Return of the Living Dead mythology
  util.js             Shared helpers (safeInt, jaccard, normalizeText)
  characters.js       Web UI: per-character data, SVG portraits, voice samples
  assets.js           Web UI: embedded CSS + client JS (no build step)
  templates.js        Web UI: HTML page builders
  server.js           Web UI: native http server, SSE live runs, run state
```

## What's stored on disk

For each topic, two files:

```
~/.openclaw/zombie-hoard/
├── graveyard.json                 # index of all topics + objective metrics
├── knowledge/
│   └── typescript-generics.md     # human-readable rendered document
└── claims/
    └── typescript-generics.json   # structured: sources, sections, claims, metrics, diff
```

The JSON sidecar is what makes re-runs compound. It's also what `export`
produces.

## Honest limits (the new VENOM section)

- **Wikipedia is one source.** The default fetcher only hits Wikipedia. Topics
  Wikipedia covers poorly will produce thin grounding. Pass `--url` for
  domain-specific sources.
- **Citations can still be wrong.** The model can produce a `[S2]` referring to
  source 2, but the claim itself can misread what source 2 actually says. We
  surface invalid citations (referencing sources that don't exist) but we
  don't verify that valid citations are accurate. Future work.
- **Jaccard claim diffing is approximate.** "Same idea, very different wording"
  may slip through and look like an added claim. Surfacing more change than
  reality is the safer failure mode.
- **No web crawling beyond user URLs.** No JS rendering, no auth, no rate-limit
  awareness. The fetcher is intentionally simple.
- **Single-call quality is bottlenecked by the model.** A small local model
  will produce a small local-model-quality result. The architecture isn't
  magic; it just stops being dishonest about the magic.

## The Lore

Every cognitive angle, the Necromancer, and the world itself have backstories
rooted in the 1985 film. Run `zombie-hoard lore all` to read the full
mythology.

> *"Do you ever wonder about all the different ways of dying?" — Suicide, before he found out.*

---

**License:** MIT

**Author:** [hellsy.net](https://hellsy.net)
