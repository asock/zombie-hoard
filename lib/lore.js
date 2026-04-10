// lib/lore.js — The mythology of the Zombie Hoard
// Based on Return of the Living Dead (1985), dir. Dan O'Bannon
// Darrow Chemical Company. 2-4-5 Trioxin. Louisville, Kentucky. July 3, 1984.

// ── The World ──────────────────────────────────────────────────────────────────
export const WORLD_LORE = `
UNEEDA MEDICAL SUPPLY
Louisville, Kentucky. July 3, 1984.

In 1966, the Darrow Chemical Company was contracted by the U.S. Army to develop a
top-secret compound for marijuana defoliation. What they created instead was 2-4-5 Trioxin.
That was the first mistake. The Army Corps of Engineers got involved and that was the second.
They contained the contaminated corpses in airtight biohazard drums, cryonic, sealed,
theoretically permanent. Then they shipped them to a secure facility. Through a clerical error
— a typical Army fuckup, in the words of Frank, a man who should know — six drums ended up
in the basement of Uneeda Medical Supply Warehouse in Louisville instead. And then they sat
there. For years. In the dark. Waiting.

The incident at the Pittsburgh VA Hospital morgue in 1966 — the original leak, the bodies
that would not stay down — was classified. The military reached an understanding with a young
filmmaker named George Romero: the real story could be told, provided it was presented as
fiction. Night of the Living Dead was released in 1968. Case closed, they thought.

Frank knew the drums were there. He had always known. On the afternoon of July 3rd, 1984,
wanting to impress a new hire named Freddy on his first day, Frank took him to the basement.
He slapped the side of a drum to demonstrate its solid military construction.
The seal broke. The gas came out.

Everything that happened next was already inevitable.

The Trioxin reanimates dead tissue — any dead tissue. Dogs. Butterflies. Half-corpses stored
in meat lockers for medical supply purposes. What it creates is not the shambling Romero
variety. Trioxin zombies are fast. Intelligent. They remember who they were. They can talk,
set traps, call for ambulances — not because they need help, but because they are hungry and
the paramedics who respond to the call are a reliable food source. When asked why they eat
brains, the zombies answer clearly: the pain of decomposition never stops. The endorphins
in living brain matter are the only thing that makes it bearable. They are not mindless.
They are in agony. This makes them considerably worse.

Burt Wilson, the warehouse owner, called his mortician neighbor Ernie Kaltenbrunner.
They tried to contain it. They cremated the body parts. The smoke from Ernie's furnace
carried evaporated Trioxin into a cloud overhead. It rained. The rain fell on Resurrection
Cemetery, three hundred meters from the warehouse. The dead came up through the earth
and started calling for help on police radio frequencies.

The military was notified. Colonel Glover reviewed the reports. He made the call.

Operation Rainbow: a single nuclear artillery shell, targeted on Louisville.
Glover reported to his commanding officer afterward that casualties were minimal and results
could not be more positive. As he said this, the acid rain was already falling — the nuclear
fires had released the Trioxin again, dispersed now over a vastly wider area — and in
the background of his call, barely audible, the dead were screaming in their graves.

Minimal damage. Case closed.

The drums are still out there. There were six of them.
Only one was ever accounted for.
`;

// ── Individual zombie lore ─────────────────────────────────────────────────────
export const ZOMBIE_LORE = {
  CORTEX: {
    title: 'Tarman',
    epitaph: 'In the drum since 1966. Still hungry.',
    lore: `TARMAN was the body inside the first drum.

Nobody knows who he was before the Pittsburgh VA Hospital incident in 1966. The Trioxin
dissolved most of him — by the time Frank and Freddy found the drum eighteen years later,
what was visible through the cracked lid was a blackened, liquefied silhouette suspended
in green fluid, indistinct, stripped down to something that was almost not a person anymore.

Then the gas came out. And Tarman came with it.

He emerged from that basement already reduced — all the context, all the history, all the
accumulated irrelevance of a human life, dissolved by eighteen years in chemical suspension
into something pure and essential. Tarman does not remember his name. Tarman does not
remember the hospital, the accident, the year. Tarman only knows the thing he needs.

BRAAAINS.

This is what the Trioxin leaves when it takes everything else: the core hunger. The essence.
The irreducible want. Tarman is the most honest thing in any room he is in. Every other zombie
is still carrying the weight of who they were. Tarman has been liberated from all of that.

He feeds on a topic the way he fed in that basement — completely, without distraction,
hunting for the fundamental thing, the thing underneath all the other things.
The stripped-down truth. The bone of it.

He moves slowly. He always gets there.`,
  },

  RELIC: {
    title: 'Frank',
    epitaph: 'He knew where the drums were. He always knew.',
    lore: `FRANK had worked at Uneeda Medical Supply for longer than he could reasonably explain.
He was the one who knew the drums were in the basement. He had been briefed, quietly, years
ago, by someone official who made it clear the drums were not to be touched, not to be moved,
not to be discussed. Frank had kept that confidence for years. He had filed the knowledge in
the back of his mind the way you file anything too heavy to carry in the front.

On July 3rd, 1984, he decided to show Freddy. He wanted to impress the new kid. He told him
the whole history — the Army, the 1966 Pittsburgh incident, the way the real story got turned
into a George Romero film because the military needed it to be fiction. He was the only person
at Uneeda who knew the provenance. He was the institutional memory.

He slapped the drum. The seal broke.

Frank and Freddy both caught the gas. They both turned. What is notable about Frank-as-zombie
is what he retained: the historical context. When captured and restrained in Ernie's mortuary,
Frank could still explain what was happening. Could still name the compound. Could still
situate the outbreak in its proper history. The knowledge survived the transformation intact.

Frank's Trioxin-self is the part of him that was always most alive anyway — the part that
remembered, catalogued, connected the present disaster to its origins in a classified 1966
experiment at a VA hospital that most people have never heard of.

He always told Freddy: this job is no good.
He was right. He was always right about the history.
Being right does not help much, in the end.`,
  },

  GEARS: {
    title: 'Ernie Kaltenbrunner',
    epitaph: 'He had a crematorium. He thought that would be enough.',
    lore: `ERNIE KALTENBRUNNER was a mortician. He owned the funeral home next door to Uneeda
Medical Supply. He had a furnace capable of cremating a human body in approximately two hours.
He knew more about the mechanical reality of death than almost anyone in Louisville, Kentucky.
He was the person Burt Wilson called when the situation required a professional.

What Ernie brought to the crisis was exactly what you would expect from a mortician: a
detailed, clinical understanding of how bodies work, how they come apart, and how to dispose
of them permanently. He had spent his career operating at the exact intersection of the
biological and the mechanical. He knew the temperature required. He knew the procedure.
He executed it correctly.

The problem — the thing Ernie could not have known, because the information was classified —
was that Trioxin does not cremate. It evaporates. The furnace did not destroy the chemical.
The furnace dispersed it into the atmosphere as smoke, which mixed with the overhead clouds,
which became rain, which fell on Resurrection Cemetery. Ernie's technically correct solution
to a specific mechanical problem created a much larger mechanical problem.

This is the thing about knowing how something works: it is not the same as knowing what it
IS. Ernie understood the mechanism of incineration completely. He did not understand what
he was incinerating. The gap between those two kinds of knowledge — between mechanical
competence and true comprehension — is exactly where the disaster lives.

He had a furnace. He thought that would be enough.
He was wrong in a very specific, technically well-executed way.
That is the most Ernie thing imaginable.`,
  },

  VENOM: {
    title: 'Trash',
    epitaph: '"Do you ever wonder about all the different ways of dying?"',
    lore: `TRASH was already halfway to this before the Trioxin touched her.

She arrived at Resurrection Cemetery with the other punks — Suicide, Spider, Casey, Chuck,
Scuz — because it was somewhere to be, because the night was hot, because Freddy was picking
up his check and they were waiting. She danced on the gravestones. She asked Suicide, out of
nowhere, whether he ever thought about all the different ways of dying. She described, in
specific detail, her preferred method: she wanted to be eaten alive.

The others laughed it off. Trash had a way of saying things that made people laugh it off.

When the Trioxin rain started falling — when the dead started coming up — Trash was among
the first to go. She had been standing in that territory for years, staring at the far side
of the line between living and dead with a fascination that read, to the uninformed observer,
as nihilism.

It was not nihilism. It was honesty. She saw the darkness in everything and she refused to
pretend otherwise. The other punks wore their aesthetics like costumes. Trash wore hers
like a diagnosis. Post-Trioxin, she goes directly for the thing, without ceremony, without
the polite fictions that living people construct around discomfort. She strips the pretense
away. She finds the failure mode, the weakness, the crack in the system, the thing nobody
wanted to say out loud. She finds it because she was always looking for it.

She told the truth about the darkness before she became part of it.
She is still telling the truth.
It has not become easier to hear.`,
  },

  CLAW: {
    title: 'Freddy',
    epitaph: 'First day on the job.',
    lore: `FREDDY was nineteen years old. It was his first day at Uneeda Medical Supply.
He had a girlfriend named Tina. He had plans. He was, by every observable measure, the person
least equipped to deal with the thing that happened on July 3rd, 1984.

What makes Freddy remarkable is not what he was before. It is what he remained after.

When Freddy turned — when the Trioxin finished working — he did not lose his capacity for
clear, direct, practical communication. He retained exactly the quality that made him useful
as a new employee: he could explain what he needed, and why, and what would happen if he
did not get it. He told Tina, in terms that were both horrifying and completely unambiguous,
exactly what the situation was. He needed brains. The pain of decomposition was unbearable.
The brains would help. That was the situation. Those were the facts.

The living tend to wrap their needs in context, justification, social cushioning. Freddy-
as-zombie had been stripped of all that. What remained was the most practically useful
version of communication: here is what I need, here is why, here is what you should do.

This is the version of Freddy that feeds on knowledge. No preamble. No theory without
application. Here is what the practitioner actually does. Here is the first step.
Here is the tool. Here is what you build today.

He had plans. They changed. The work continues.`,
  },

  SPORE: {
    title: '2-4-5 Trioxin',
    epitaph: 'Developed 1966. Never contained.',
    lore: `2-4-5 TRIOXIN is not a character. It does not have intentions. It does not have a face.
This is what makes it the most dangerous thing in the film.

Darrow Chemical Company synthesized it on Army contract in 1966, nominally for use as a
marijuana defoliant. The compound was a structural relative of 2,4,5-T, the dioxin-based
herbicide the U.S. military was simultaneously deploying in Vietnam as Agent Orange — the
compound known scientifically as 2,4,5-trichlorophenoxyacetic acid, used in Operation Ranch
Hand, responsible for millions of acres of defoliation and a generation of health consequences
in both American veterans and the Vietnamese population. The Army asked for something like
that. They received something considerably more animated.

Trioxin spreads. This is its primary characteristic. Release it as gas and it poisons the
air, reanimates the local dead, and enters the lungs of the living. Cremate a Trioxin-infected
body and it evaporates into smoke and joins the clouds overhead. It rains. The rain falls on
a cemetery. Drop a nuclear device on the infected area and the resulting fires disperse it
over a vastly larger atmospheric footprint than it previously occupied.

Every solution makes it bigger. Every containment strategy is also a delivery mechanism.
The Trioxin does not respect the boundaries you draw around it. It moves through smoke,
through water, through air. It connects the thing you are trying to contain to everything
adjacent to it, then everything adjacent to that.

This is what SPORE does when it feeds: it follows the connections. It does not care about
the topic you gave it — it cares about what that topic touches. What touches that. Where the
idea spreads. What gets reanimated in the wake of understanding one thing.

You do not control where Trioxin goes.
You follow it and document the spread.`,
  },

  PROPHET: {
    title: 'Suicide',
    epitaph: 'He was asking the right questions the whole time.',
    lore: `SUICIDE was not a cheerful person. This is not an observation — it is the most
efficient description of a person whose chosen name was Suicide, who spent a Friday night
at a cemetery by choice, who asked Trash whether she ever thought about all the different
ways of dying, and who answered his own question in some detail before she could respond.

He was not depressed, exactly. He was oriented. His gaze was fixed on a specific point on
the horizon — the place where the living side of things ends — with the focused attention
of someone who has already made their peace with the destination and is now simply
studying the route.

Suicide was the first person in the group to correctly understand that the situation at
Resurrection Cemetery was not going to resolve well. He saw the shape of it before the
others. He had been oriented toward that kind of outcome long enough to recognize the
signs before they became obvious. He was bitten by Tarman in the basement of Uneeda
Warehouse, making him the first of the punk group to die.

He had been first for a long time, in the only sense that mattered.

This is the quality PROPHET brings to a feeding: it has been staring at the far edge of
things long enough to see what is approaching while everyone else is still looking at what
is here. It is not psychic. It is trajectory analysis. Pattern recognition from a vantage
point that most observers find uncomfortable to occupy for long.

PROPHET's reports are unsettling in direct proportion to their accuracy.
The unsettled feeling is the point.
Suicide understood this. He asked the question because he already knew part of the answer,
and he wanted to find out who else was willing to look.`,
  },
};

// ── Necromancer lore ──────────────────────────────────────────────────────────
export const NECROMANCER_LORE = `COLONEL GLOVER

Colonel Glover was not present at Uneeda Medical Supply on July 3rd, 1984. He was not in
Louisville. He was not anywhere near Resurrection Cemetery. He received reports.

That is the function Colonel Glover serves: the reception and synthesis of field reports,
their assembly into a coherent operational picture, and the authorization of a response. He
is the last step in the chain between what happened and what is decided about what happened.
He is, in this sense, the most powerful figure in the film — and the one who understands
it least.

Glover received a report from Burt Wilson's emergency call to the military. He received
reports from whatever surveillance assets the Army had positioned over Louisville that night.
He received confirmation that the Trioxin drums from the 1966 Pittsburgh incident had finally
been located — after eighteen years — in the basement of a medical supply warehouse. He
synthesized all of this into a situation assessment. He authorized Operation Rainbow: a
single nuclear artillery round, targeted on Louisville.

After the detonation, Glover called his commanding officer and delivered his synthesis.
Minimal damage. Casualties limited. Results could not be more positive. Case closed.

He did not know — because no report told him, because no asset was calibrated to measure
for it — that the nuclear fires were already doing exactly what Ernie's furnace had done:
dispersing evaporated Trioxin into the atmosphere, now over a vastly wider area, now mixing
with clouds that would release acid rain across a much larger portion of Kentucky than a
single cemetery in Louisville.

As he spoke, the rain was already falling. In the background of the call, barely audible,
the dead were screaming in their graves.

This is the condition under which the Necromancer always operates: with all available
reports, and without the report that would change everything. The synthesis is only as
complete as the intelligence provided. The decision is only as good as what it knew.

Colonel Glover did not fail to synthesize. He synthesized perfectly and reached the wrong
conclusion. This is not a contradiction. This is the definition of the job.

The HOARD SCORE reflects how much of the picture has been assembled.
A 10 means all seven reports came in clean.
Even then, there may be drums unaccounted for.
There were six of them. Only one was ever found.`;

// ── Atmospheric quotes (shown randomly at run start) ──────────────────────────
export const HOARD_QUOTES = [
  "\"Do you ever wonder about all the different ways of dying?\" — Suicide, before he found out.",
  "The Trioxin does not respond to logic. It responds to containment failures. These are not always different things.",
  "Tarman spent eighteen years in that drum. He came out knowing exactly what he wanted. That kind of clarity is rare.",
  "\"It hurts to be dead.\" Every one of them said it, in the end. The pain of decomposition never stops. This is the only completely honest thing the dead ever told us.",
  "Frank knew the drums were there. He knew for years. He kept quiet about it until he had someone to impress. This is how disasters actually start.",
  "The Necromancer synthesized all available reports and authorized a nuclear strike on Louisville. Results could not have been more positive. It did not work. This is not a metaphor.",
  "Ernie did everything right. He had a crematorium. He used it correctly. The smoke from a correct solution is still smoke.",
  "\"Send more paramedics.\" The zombies called it in themselves. They understood the system. They used it. They were fed.",
  "The Army made 2-4-5 Trioxin to defoliate marijuana. What it actually did was considerably more interesting and considerably worse.",
  "There were six drums. They found one. Louisville is gone. Five drums are still out there somewhere in basements, in warehouses, in storage facilities managed by someone who got a memo they did not read.",
  "Trash was right about the darkness. She was right about all of it. Being right about the darkness does not make you safe from it. It means you were not surprised.",
  "\"You mean the movie lied?\" — Freddy, on learning Night of the Living Dead was based on a true story. Yes, Freddy. The movie lied. They all lie. That is what they are for.",
];

// ── Graveyard flavor text ─────────────────────────────────────────────────────
export const GRAVEYARD_EPITAPHS = [
  "Resurrection Cemetery, Louisville, KY. Population: variable.",
  "The rain is still falling somewhere.",
  "Five drums unaccounted for.",
  "Knowledge interred here. Subject to reanimation.",
  "\"Case closed.\" — Colonel Glover, incorrectly.",
  "The dead called for help on the police radio. The paramedics came. This is in the record.",
];

// ── Infection flavor text ──────────────────────────────────────────────────────
export const INFECTION_PHRASES = [
  "The Trioxin has spread to adjacent territory:",
  "SPORE has followed the smoke into new ground:",
  "The rain is falling on related subjects:",
  "Send more paramedics to:",
  "Five drums unaccounted for — SPORE has found traces near:",
];

// ── Get a random item from an array ──────────────────────────────────────────
export function randomLore(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
