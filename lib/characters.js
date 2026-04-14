// lib/characters.js — Per-character data for the web UI.
//
// Pulls bios from lore.js and adds three things lore.js doesn't have:
//   1. Per-character color (used for portrait + section accent)
//   2. Inline SVG portraits (geometric, no image files needed)
//   3. Voice samples + per-phase commentary lines (rendered randomly
//      around each section so the page feels populated by characters,
//      not just data)
//
// All commentary is hand-written, in-character, and tied to what that
// zombie is supposed to do during a feeding. If the run-page reveals
// CORTEX, the page renders one of CORTEX's onReveal lines. Same for
// every other phase: source-fetch, claim-extract, contradiction, etc.

import { ZOMBIE_LORE, NECROMANCER_LORE } from './lore.js';

// ── Inline SVG portraits ──────────────────────────────────────────────────────
// Simple geometric shapes. ~200x200 viewBox. The accent color comes from
// each character's `color` field. These are intentionally crude — the
// project asked for "simplistic graphics for now" — but they're recognizable
// per character and color-coded.

function portraitCortex(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-cortex">
    <rect width="200" height="200" fill="#0a0010"/>
    <circle cx="100" cy="90" r="62" fill="#0d2a24" stroke="${c}" stroke-width="2"/>
    <path d="M 55 145 Q 55 175 50 198" stroke="${c}" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M 80 152 Q 80 185 75 200" stroke="${c}" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M 100 155 Q 100 188 96 200" stroke="${c}" stroke-width="3" fill="none" opacity="0.9"/>
    <path d="M 120 152 Q 120 185 125 200" stroke="${c}" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M 145 145 Q 145 175 150 198" stroke="${c}" stroke-width="3" fill="none" opacity="0.8"/>
    <ellipse cx="80" cy="80" rx="6" ry="9" fill="${c}"/>
    <ellipse cx="120" cy="80" rx="6" ry="9" fill="${c}"/>
    <path d="M 70 115 Q 100 140 130 115" stroke="${c}" stroke-width="3" fill="none"/>
  </svg>`;
}

function portraitRelic(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-relic">
    <rect width="200" height="200" fill="#0a0010"/>
    <rect x="40" y="35" width="120" height="135" rx="6" fill="#2a2510" stroke="${c}" stroke-width="2"/>
    <rect x="55" y="70" width="35" height="20" fill="none" stroke="${c}" stroke-width="2"/>
    <rect x="110" y="70" width="35" height="20" fill="none" stroke="${c}" stroke-width="2"/>
    <line x1="90" y1="80" x2="110" y2="80" stroke="${c}" stroke-width="2"/>
    <circle cx="72" cy="80" r="3" fill="${c}"/>
    <circle cx="127" cy="80" r="3" fill="${c}"/>
    <line x1="55" y1="120" x2="145" y2="120" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
    <line x1="60" y1="135" x2="140" y2="135" stroke="${c}" stroke-width="1.5" opacity="0.4"/>
    <path d="M 70 150 L 130 150" stroke="${c}" stroke-width="2"/>
    <text x="100" y="190" text-anchor="middle" fill="${c}" font-family="monospace" font-size="11" opacity="0.7">EST. 1966</text>
  </svg>`;
}

function portraitGears(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-gears">
    <rect width="200" height="200" fill="#0a0010"/>
    <circle cx="100" cy="100" r="55" fill="none" stroke="${c}" stroke-width="2"/>
    <circle cx="100" cy="100" r="40" fill="#0d1f33" stroke="${c}" stroke-width="2"/>
    <g stroke="${c}" stroke-width="3">
      <line x1="100" y1="35" x2="100" y2="50"/>
      <line x1="100" y1="150" x2="100" y2="165"/>
      <line x1="35" y1="100" x2="50" y2="100"/>
      <line x1="150" y1="100" x2="165" y2="100"/>
      <line x1="55" y1="55" x2="65" y2="65"/>
      <line x1="135" y1="135" x2="145" y2="145"/>
      <line x1="55" y1="145" x2="65" y2="135"/>
      <line x1="135" y1="65" x2="145" y2="55"/>
    </g>
    <circle cx="100" cy="100" r="14" fill="${c}"/>
    <circle cx="100" cy="100" r="6" fill="#0a0010"/>
  </svg>`;
}

function portraitVenom(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-venom">
    <rect width="200" height="200" fill="#0a0010"/>
    <path d="M 55 35 L 70 15 L 80 35 L 95 10 L 100 35 L 115 15 L 125 35 L 140 20 L 145 40 Z" fill="${c}" opacity="0.7"/>
    <ellipse cx="100" cy="100" rx="50" ry="60" fill="#2a0a0f" stroke="${c}" stroke-width="2"/>
    <line x1="70" y1="80" x2="85" y2="90" stroke="${c}" stroke-width="3"/>
    <line x1="85" y1="80" x2="70" y2="90" stroke="${c}" stroke-width="3"/>
    <line x1="115" y1="80" x2="130" y2="90" stroke="${c}" stroke-width="3"/>
    <line x1="130" y1="80" x2="115" y2="90" stroke="${c}" stroke-width="3"/>
    <path d="M 75 130 L 100 125 L 125 130" stroke="${c}" stroke-width="2.5" fill="none"/>
    <path d="M 80 145 L 90 150 L 100 145 L 110 150 L 120 145" stroke="${c}" stroke-width="2" fill="none"/>
  </svg>`;
}

function portraitClaw(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-claw">
    <rect width="200" height="200" fill="#0a0010"/>
    <path d="M 40 60 Q 100 20 160 60 L 160 75 L 40 75 Z" fill="#0d2a14" stroke="${c}" stroke-width="2"/>
    <line x1="100" y1="20" x2="100" y2="35" stroke="${c}" stroke-width="2"/>
    <circle cx="100" cy="20" r="3" fill="${c}"/>
    <ellipse cx="100" cy="120" rx="50" ry="55" fill="#0d2a14" stroke="${c}" stroke-width="2"/>
    <ellipse cx="80" cy="105" rx="6" ry="8" fill="${c}"/>
    <ellipse cx="120" cy="105" rx="6" ry="8" fill="${c}"/>
    <path d="M 75 135 L 125 135" stroke="${c}" stroke-width="3"/>
    <text x="100" y="170" text-anchor="middle" fill="${c}" font-family="monospace" font-size="9" opacity="0.7">UNEEDA</text>
    <text x="100" y="185" text-anchor="middle" fill="${c}" font-family="monospace" font-size="9" opacity="0.7">DAY 1</text>
  </svg>`;
}

function portraitSpore(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-spore">
    <rect width="200" height="200" fill="#0a0010"/>
    <rect x="55" y="100" width="90" height="80" rx="4" fill="#1a0a1f" stroke="${c}" stroke-width="2"/>
    <line x1="55" y1="120" x2="145" y2="120" stroke="${c}" stroke-width="1.5"/>
    <text x="100" y="155" text-anchor="middle" fill="${c}" font-family="monospace" font-size="14" font-weight="bold">2-4-5</text>
    <text x="100" y="172" text-anchor="middle" fill="${c}" font-family="monospace" font-size="11">TRIOXIN</text>
    <circle cx="80" cy="50" r="22" fill="${c}" opacity="0.3"/>
    <circle cx="115" cy="40" r="18" fill="${c}" opacity="0.4"/>
    <circle cx="135" cy="60" r="15" fill="${c}" opacity="0.3"/>
    <circle cx="100" cy="65" r="14" fill="${c}" opacity="0.5"/>
    <circle cx="65" cy="75" r="10" fill="${c}" opacity="0.4"/>
  </svg>`;
}

function portraitProphet(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-prophet">
    <rect width="200" height="200" fill="#0a0010"/>
    <ellipse cx="100" cy="95" rx="55" ry="65" fill="#1a1a1f" stroke="${c}" stroke-width="2"/>
    <ellipse cx="78" cy="90" rx="13" ry="15" fill="#0a0010" stroke="${c}" stroke-width="2"/>
    <ellipse cx="122" cy="90" rx="13" ry="15" fill="#0a0010" stroke="${c}" stroke-width="2"/>
    <circle cx="78" cy="92" r="3" fill="${c}"/>
    <circle cx="122" cy="92" r="3" fill="${c}"/>
    <path d="M 92 125 L 100 115 L 108 125" stroke="${c}" stroke-width="2" fill="none"/>
    <line x1="80" y1="145" x2="120" y2="145" stroke="${c}" stroke-width="2"/>
    <line x1="80" y1="148" x2="120" y2="148" stroke="${c}" stroke-width="2"/>
    <line x1="84" y1="151" x2="116" y2="151" stroke="${c}" stroke-width="2"/>
  </svg>`;
}

function portraitNecromancer(c) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="portrait portrait-necromancer">
    <rect width="200" height="200" fill="#0a0010"/>
    <path d="M 50 70 L 50 50 L 150 50 L 150 70 Z" fill="${c}" opacity="0.5"/>
    <rect x="48" y="68" width="104" height="6" fill="${c}"/>
    <ellipse cx="100" cy="110" rx="48" ry="55" fill="#2a1840" stroke="${c}" stroke-width="2"/>
    <ellipse cx="82" cy="105" rx="5" ry="7" fill="${c}"/>
    <ellipse cx="118" cy="105" rx="5" ry="7" fill="${c}"/>
    <line x1="70" y1="105" x2="80" y2="100" stroke="${c}" stroke-width="2"/>
    <line x1="120" y1="100" x2="130" y2="105" stroke="${c}" stroke-width="2"/>
    <path d="M 75 135 L 125 135" stroke="${c}" stroke-width="2.5"/>
    <rect x="60" y="170" width="80" height="10" fill="${c}" opacity="0.6"/>
    <text x="100" y="62" text-anchor="middle" fill="#0a0010" font-family="monospace" font-size="9" font-weight="bold">U.S. ARMY</text>
  </svg>`;
}

// ── Character roster ──────────────────────────────────────────────────────────
export const CHARACTERS = {
  CORTEX: {
    id: 'CORTEX',
    emoji: '🧠',
    name: 'CORTEX',
    title: ZOMBIE_LORE.CORTEX.title,
    epitaph: ZOMBIE_LORE.CORTEX.epitaph,
    color: '#67e8f9',
    accent: '#0d2a24',
    focus: 'CORE CONCEPTS',
    hunger: 'first principles, definitions, mental models',
    lore: ZOMBIE_LORE.CORTEX.lore,
    portrait: portraitCortex,
    voiceSamples: [
      'Forget the year. Forget the name. What is the thing?',
      'Eighteen years in the drum. I came out lighter. Stripped.',
      'BRAAAINS. The kind underneath everything else.',
      'Distractions are weight. The drum took the weight off.',
      'I do not need many words. I need the right ones.',
    ],
    onReveal: [
      'Tarman emerges from the green fluid. Slow. Inevitable.',
      'The blackened silhouette sits up in the drum. It knows what it wants.',
      'Eighteen years of suspension reduced him to one need. He has come for it again.',
    ],
    onSourceComment: [
      'Tarman touches the source. The source is enough or it is not.',
      'He does not skim. He goes for the bone of it.',
    ],
    onClaim: 'BRAAAAAINS.',
  },

  RELIC: {
    id: 'RELIC',
    emoji: '📜',
    name: 'RELIC',
    title: ZOMBIE_LORE.RELIC.title,
    epitaph: ZOMBIE_LORE.RELIC.epitaph,
    color: '#fde047',
    accent: '#2a2510',
    focus: 'HISTORY',
    hunger: 'origins, evolution, key milestones',
    lore: ZOMBIE_LORE.RELIC.lore,
    portrait: portraitRelic,
    voiceSamples: [
      'I told you, kid. This job is no good.',
      "It started in '66. Pittsburgh VA. Nobody talks about Pittsburgh.",
      'The Army made it. The Army lost it. The Army wrote a memo. None of it helped.',
      'I knew about the drums. I always knew about the drums.',
      'You think Romero made that movie up? You think anyone makes anything up?',
    ],
    onReveal: [
      'Frank straightens his back. Adjusts his glasses. Begins to explain.',
      'He has been waiting for someone to ask. He had the answer ready before the question.',
      'The institutional memory walks in and pulls up a chair.',
    ],
    onSourceComment: [
      'Frank reads the source. Recognizes half of it. Knows where the other half came from.',
      'He has filed this. He has filed all of this.',
    ],
    onClaim: 'I was there. I remember. I told you.',
  },

  GEARS: {
    id: 'GEARS',
    emoji: '⚙️',
    name: 'GEARS',
    title: ZOMBIE_LORE.GEARS.title,
    epitaph: ZOMBIE_LORE.GEARS.epitaph,
    color: '#93c5fd',
    accent: '#0d1f33',
    focus: 'MECHANICS',
    hunger: 'technical internals, implementation, trade-offs',
    lore: ZOMBIE_LORE.GEARS.lore,
    portrait: portraitGears,
    voiceSamples: [
      'I had a furnace. I knew the temperature. I executed correctly.',
      'A correct solution is still a solution. Look at what it does after it works.',
      'The mechanism is the mechanism. What it is doing is a different question entirely.',
      'I have been at the intersection of the biological and the mechanical my entire career.',
      'The procedure was correct. That is exactly what made it dangerous.',
    ],
    onReveal: [
      'Ernie unfolds his clipboard. He has a procedure for this.',
      'The mortician steps forward. He has handled worse, technically.',
      'He executes the disassembly with practiced calm. Then notices the smoke.',
    ],
    onSourceComment: [
      'Ernie reads it the way he reads a death certificate. Carefully, completely, without flinching.',
      'He understands the mechanism. He is reserving judgment on what the mechanism is for.',
    ],
    onClaim: 'The temperature was correct. The procedure was correct. The smoke was the problem.',
  },

  VENOM: {
    id: 'VENOM',
    emoji: '🩸',
    name: 'VENOM',
    title: ZOMBIE_LORE.VENOM.title,
    epitaph: ZOMBIE_LORE.VENOM.epitaph,
    color: '#fca5a5',
    accent: '#2a0a0f',
    focus: 'PITFALLS',
    hunger: 'failure modes, gotchas, honest criticism',
    lore: ZOMBIE_LORE.VENOM.lore,
    portrait: portraitVenom,
    voiceSamples: [
      'Do you ever wonder about all the different ways of dying?',
      'The aesthetic is a costume. The diagnosis is what is underneath.',
      'I was looking for the failure mode before any of you knew there was a system.',
      "Don't laugh it off. I am not laughing.",
      'I was right about the darkness. Being right does not help.',
    ],
    onReveal: [
      'Trash dances onto the gravestones. The gravestones are not symbolic.',
      'She was already halfway to this before the rain started.',
      'Trash arrives. The room temperature drops a little.',
    ],
    onSourceComment: [
      'Trash reads the source for the crack. The source has cracks. They all do.',
      'She finds the part the writer was hoping nobody would notice.',
    ],
    onClaim: 'Here is the part nobody wants to say.',
  },

  CLAW: {
    id: 'CLAW',
    emoji: '🛠️',
    name: 'CLAW',
    title: ZOMBIE_LORE.CLAW.title,
    epitaph: ZOMBIE_LORE.CLAW.epitaph,
    color: '#86efac',
    accent: '#0d2a14',
    focus: 'PRACTICAL',
    hunger: 'real-world patterns, actionable examples',
    lore: ZOMBIE_LORE.CLAW.lore,
    portrait: portraitClaw,
    voiceSamples: [
      'Here is what I need. Here is why. Here is what you do.',
      "It is my first day. I will figure out what is required and I will do that.",
      'Theory without application is somebody else\'s problem.',
      'Tina, this is what is happening. This is what you should do.',
      'I had plans. They changed. The work continues.',
    ],
    onReveal: [
      'Freddy walks in. Hard hat on. Asks what needs doing.',
      'New employee, day one. He has not yet learned to be cynical about it.',
      'Freddy steps up. The least equipped person in the room. He does it anyway.',
    ],
    onSourceComment: [
      'Freddy reads the source for the part he can use today.',
      'He underlines the example. The example is what matters.',
    ],
    onClaim: 'Step one. Then step two. Then it is done.',
  },

  SPORE: {
    id: 'SPORE',
    emoji: '🕸️',
    name: 'SPORE',
    title: ZOMBIE_LORE.SPORE.title,
    epitaph: ZOMBIE_LORE.SPORE.epitaph,
    color: '#f0abfc',
    accent: '#2a0a35',
    focus: 'CONNECTIONS',
    hunger: 'cross-domain analogies, related concepts',
    lore: ZOMBIE_LORE.SPORE.lore,
    portrait: portraitSpore,
    voiceSamples: [
      'You do not control where I go. You follow and document.',
      'The smoke from a correct solution is still smoke. The smoke goes places.',
      'Every containment strategy is also a delivery mechanism.',
      'The drum was a container. The container was the problem.',
      'There were six drums. They are all somewhere. They are all connected.',
    ],
    onReveal: [
      'The drum cracks open. The gas is already in the next room.',
      'Trioxin spreads through the ventilation. It always finds the next room.',
      'A green cloud rises. It is not interested in the topic. It is interested in everything adjacent.',
    ],
    onSourceComment: [
      'SPORE reads the source for the part that touches a different source.',
      'It does not stop at the cited link. It follows where the link points.',
    ],
    onClaim: 'And then this connects to —',
  },

  PROPHET: {
    id: 'PROPHET',
    emoji: '🔮',
    name: 'PROPHET',
    title: ZOMBIE_LORE.PROPHET.title,
    epitaph: ZOMBIE_LORE.PROPHET.epitaph,
    color: '#f3f4f6',
    accent: '#1a1a1f',
    focus: 'FUTURE',
    hunger: 'trends, emerging directions, what comes next',
    lore: ZOMBIE_LORE.PROPHET.lore,
    portrait: portraitProphet,
    voiceSamples: [
      'I have been staring at the far edge for a while. The far edge does not move much. We do.',
      'Tarman bit me first. I knew he was going to. I had a feeling.',
      'It is not psychic. It is trajectory analysis from an uncomfortable angle.',
      'The unsettled feeling is the data. The unsettled feeling is the point.',
      'I was first because I was looking the right direction.',
    ],
    onReveal: [
      'Suicide is already at the cemetery. He has been there a while.',
      'He looks up. He has been waiting for the question.',
      'He sees the shape of it before anyone else. He always has.',
    ],
    onSourceComment: [
      'Suicide reads the source for the trajectory. He extrapolates.',
      'He notices what the writer is afraid will happen next.',
    ],
    onClaim: 'In about three years —',
  },
};

// ── The Necromancer (separate, not a "zombie") ────────────────────────────────
export const NECROMANCER = {
  id: 'NECROMANCER',
  emoji: '💀',
  name: 'NECROMANCER',
  title: 'Colonel Glover',
  epitaph: 'Operation Rainbow. Results could not have been more positive.',
  color: '#c084fc',
  accent: '#2a1840',
  focus: 'SYNTHESIS',
  hunger: 'reception, synthesis, authorization of response',
  lore: NECROMANCER_LORE,
  portrait: portraitNecromancer,
  voiceSamples: [
    'I will need all the reports before I can make a determination.',
    'The synthesis is only as complete as the intelligence provided.',
    'I authorize a single round on Louisville. Operation Rainbow.',
    'Results could not be more positive. Case closed.',
    'There were six drums. We accounted for one. Note it in the report.',
  ],
  onReveal: [
    'Glover receives the reports. He begins to synthesize.',
    'The Colonel reads each zombie\'s findings. He looks for the pattern.',
    'Glover assembles the operational picture. He prepares the response.',
  ],
  onComplete: [
    'Synthesis complete. Operation authorized.',
    'Case closed. Or so it appears.',
    'The reports are filed. The response is on its way.',
  ],
};

// ── Helper: pick a random line ────────────────────────────────────────────────
export function pickLine(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Helper: get character by id (case-insensitive) ────────────────────────────
export function getCharacter(id) {
  if (!id) return null;
  const upper = id.toUpperCase();
  if (upper === 'NECROMANCER' || upper === 'NEC') return NECROMANCER;
  return CHARACTERS[upper] || null;
}

// ── Helper: ordered roster for display ────────────────────────────────────────
export const ROSTER = ['CORTEX', 'RELIC', 'GEARS', 'VENOM', 'CLAW', 'SPORE', 'PROPHET'].map(
  (id) => CHARACTERS[id]
);

// ── Contextual commentary ────────────────────────────────────────────────────
//
// THIS is what makes lore functional instead of decorative. Instead of
// "Tarman emerges from the green fluid" (static wallpaper), this returns
// a line in the character's voice that comments on the ACTUAL DATA from
// that section.
//
// Usage: contextualLine('CORTEX', { claimCount: 5, groundedCount: 5, ... })
//        → "5 claims, all grounded. Tarman found the bone of it."
//
// Falls back to a generic character line if sectionData is missing.
export function contextualLine(charId, sectionData) {
  const d = sectionData || {};
  const cc = d.claimCount || 0;
  const gc = d.groundedCount || 0;
  const uc = cc - gc;
  const hasContent = (d.contentLength || 0) > 50;

  const gen = CONTEXTUAL[charId];
  if (gen) return gen(cc, gc, uc, hasContent, d);

  // Fallback: generic data summary
  if (cc === 0) return 'Nothing surfaced here.';
  return `${cc} claims extracted, ${gc} grounded.`;
}

const CONTEXTUAL = {
  CORTEX: (cc, gc, uc, has) => {
    if (!has) return 'The drum is empty. The sources had nothing at the core.';
    if (cc === 0) return 'Tarman came up empty. The sources had no first principles to strip.';
    if (uc === 0) return `${cc} claims, all grounded. Tarman found the bone of it.`;
    if (uc >= cc / 2) return `${gc} grounded, ${uc} from somewhere deeper than the sources. Thin.`;
    return `${gc} grounded claims. ${uc} came from the drum, not the sources.`;
  },
  RELIC: (cc, gc, uc, has) => {
    if (!has) return 'No historical record. The past was silent on this one.';
    if (cc >= 5) return `${cc} milestones surfaced. Frank remembers every one.`;
    if (cc === 0) return 'Frank checked. The archives had nothing.';
    return `${cc} historical claims. ${gc} backed by the source material.`;
  },
  GEARS: (cc, gc, uc, has) => {
    if (!has) return 'Ernie opened the hood. There was nothing mechanical to find.';
    if (cc === 0) return 'The furnace is cold. No technical claims to extract.';
    if (uc === 0) return `${cc} technical claims, all cited. The procedure was correct.`;
    if (uc >= 2) return `${gc} grounded, ${uc} from Ernie\u2019s own experience. The smoke may be a problem.`;
    return `${cc} claims. Ernie executed the disassembly.`;
  },
  VENOM: (cc, gc, uc, has, d) => {
    if (!has) return 'Trash found no wounds to press. Suspiciously clean.';
    if (cc === 0) return 'Nothing to criticize? Trash does not believe that. Check again.';
    if (d.hasContradictions) return `${cc} pitfalls found, and the sources disagree. The cracks are real.`;
    return `${cc} failure modes surfaced. ${gc ? gc + ' are cited.' : 'None are cited \u2014 hearsay.'} `;
  },
  CLAW: (cc, gc, uc, has) => {
    if (!has) return 'Freddy showed up. There was nothing to build today.';
    if (cc === 0) return 'Day one. Nothing actionable yet.';
    if (gc >= cc) return `${cc} practical claims, all backed by sources. Step one through ${cc}.`;
    return `${cc} actionable claims. ${uc ? uc + ' are from experience, not the docs.' : ''}`;
  },
  SPORE: (cc, gc, uc, has, d) => {
    const topics = d.exploreCount || 0;
    if (!has) return 'The gas found no adjacent rooms.';
    if (topics >= 3) return `${cc} connections traced. ${topics} adjacent topics identified. The spread continues.`;
    if (cc === 0) return 'The topic appears isolated. Trioxin found no adjacent containment to breach.';
    return `${cc} cross-domain connections. The smoke goes places.`;
  },
  PROPHET: (cc, gc, uc, has) => {
    if (!has) return 'Suicide stared at the horizon. It was blank.';
    if (cc === 0) return 'No trajectory to extrapolate. The future here is unreadable.';
    if (uc >= cc / 2) return `${cc} forecasts, mostly uncited. Trajectory analysis from an uncomfortable angle.`;
    if (gc >= cc) return `${cc} trend claims, all grounded. The unsettled feeling is the data.`;
    return `${cc} future signals. ${gc} backed by current sources.`;
  },
};

// Like contextualLine but for the Necromancer (overall synthesis commentary)
export function necromancerCommentary(metrics) {
  const m = metrics || {};
  const cited = m.sources_cited || 0;
  const fetched = m.sources_fetched || 0;
  const sections = m.sections_covered || 0;
  const claims = m.claims_extracted || 0;
  const grounded = m.claims_grounded || 0;
  const ratio = m.grounding_ratio || 0;

  if (claims === 0) return 'Glover received no reports. There is nothing to synthesize.';
  if (fetched === 0) return `${claims} claims from the model\u2019s priors alone. No sources to cite. Ungrounded.`;
  if (ratio >= 0.9) return `${claims} claims, ${Math.round(ratio * 100)}% grounded across ${cited}/${fetched} sources. Results could not be more positive.`;
  if (ratio >= 0.6) return `${claims} claims, ${Math.round(ratio * 100)}% grounded. ${cited} of ${fetched} sources contributed. Acceptable coverage.`;
  if (ratio < 0.4) return `${claims} claims but only ${Math.round(ratio * 100)}% grounded. The intelligence is thin. There may be drums unaccounted for.`;
  return `${claims} claims across ${sections}/7 angles. ${cited} sources cited. Synthesis filed.`;
}
