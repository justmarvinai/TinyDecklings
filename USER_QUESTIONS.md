# TinyDecklings — Open Questions for the Owner

> ⛔ **Development is gated on this file.** These are the decisions that materially shape design, architecture,
> scope, or feel. Each question has options and a **bold recommendation**.
>
> **Fast path:** reply *"accept all recommendations, except: …"* and list only deviations, e.g. `Q14: b`.
> Priorities: 🔴 blocks the vertical slice · 🟡 shapes Phases 2–4 · 🟢 later phases.

---

## A. Game model & map

**Q1 🔴 — What persists? (biggest single decision)**
The references (permanent card levels, gacha, gear inventory) imply a persistent-collection game; the brief says "roguelike".
a) **Persistent collection + endless stage journey** — cards/gear/currencies never reset; the endless map, procedural encounters, and choice events carry the roguelike feel. *(Black Deck / Raid-like)*
b) True roguelike runs — deck resets on death; meta-unlocks only. *(Slay-the-Spire-like; contradicts summon/level/gear screens)*
c) Hybrid: persistent collection **plus** a separate rotating "Expedition" roguelike mode later.
**Recommendation: (a), with (c)'s Expedition mode as a Phase 5+ candidate.**

**Q2 🔴 — Map structure**
`Map.png` shows a strictly linear numbered path (…28→34…).
a) **Linear endless chain, occasional 2-way fork that rejoins after 1–3 stages (risk/reward)** — keeps the reference look, adds choice.
b) Strictly linear only.
c) Full branching graph per region (Slay-the-Spire style web).
**Recommendation: (a).** *(Forks land in Phase 4; the slice is linear either way.)*

**Q16 🟡 — Stage/node mix**
Proposed kinds: Battle, Elite (~every 5th), Boss (~every 10th), Event (choice vignette), Treasure, Camp (heal/buff before hard fights). Regions ≈ 10 stages.
**Recommendation: approve this mix**; slice ships Battle + Boss only. Trim/add kinds here if you want.

**Q17 🟡 — Stars & replay**
a) **3★ = win with no card deaths · 2★ = ≤2 deaths · 1★ = any win; beaten stages replayable for farming; star records permanent.**
b) Different criteria (tell me), or no replay (pushes economy into events/idle income).
**Recommendation: (a).**

## B. Combat

**Q3 🔴 — Player control model**
a) **Manual by default** — on your turn each card acts in order; you tap the target (or tap a ready skill, then target); **AUTO toggle** hands it to AI; X1/X2 speed. *(Matches the AUTO/X1 buttons in `Battle.png`)*
b) Full auto-battler — you only build the deck/formation; battles play themselves.
c) Hearthstone-style hand + mana card play *(clashes with the brief's "meaningfully different" and the references)*.
**Recommendation: (a).**

**Q4 🔴 — The "2" badge & skills in battle**
I read the square top-left badge on battle cards as **rounds until the card's skill is ready** (cooldown counter).
a) **Confirm**: skills auto-charge; in manual mode you choose fire/hold; in AUTO the AI fires when ready.
b) It should mean something else (deploy cost, attack-every-N-rounds, …) — describe.
**Recommendation: (a).**

**Q5 🔴 — Stat model**
a) **Strength (max HP, the big visible number) + Attack (separate stat, visible in detail) + later Speed; no defense/dodge/crit in v1** — mitigation via effects (Shield/Weaken).
b) Attack derived from Strength (single-stat purity).
c) Fuller RPG sheet now (DEF/crit/accuracy…).
**Recommendation: (a).**

**Q6 🔴 — Deck & battlefield shape**
Confirm: deck = **1 Hero + 8 Units**, battlefield **2×3 per side**, no duplicate cards in a deck, up to 6 saved decks. The reference's "DEFENSE deck" toggle looks multiplayer-flavored.
a) **Confirm all; cut the Defense deck.**
b) Adjust numbers (tell me which).
**Recommendation: (a).**

**Q7 🔴 — Reinforcements & rows**
Confirm two proposals: dead slots refill from the **reinforcement queue** (the deck counters on screen) at the next round start; **melee must target the front row while it lives, ranged targets anywhere**, attack patterns widen hits.
a) **Confirm both.**  b) Adjust (describe).
**Recommendation: (a).**

**Q20 🟡 — Status effect starter set**
Proposed: Burn, Poison, Freeze/Stun, Shield, Taunt, Weaken, Strengthen, Regen.
**Recommendation: approve** (slice ships ~3 of these; rest by Phase 2–4).

**Q21 🟡 — Elements**
Map badges show element-ish icons (nature/fire/ice/lightning/dark…).
a) **Light version: stages have an element theme; cards of the counter-element get a small bonus (+10–15%)** — flavor + gentle deck-variety pressure, cheap to build.
b) Full advantage wheel with per-matchup multipliers everywhere.
c) Purely cosmetic badges.
**Recommendation: (a), introduced Phase 4.**

## C. Cards, rarity, progression

**Q8 🔴 — Card rarity ladder**
Proposed (independent from gear): **Common 1★ gray · Uncommon 2★ green · Rare 3★ blue · Epic 4★ magenta · Legendary 5★ gold** — rarity fixes base stars; ascension can push any card to 6★.
**Recommendation: approve** (rename/recolor freely — colors follow the references).

**Q12 🟡 — Heroes**
Confirm: Hero = leader-class card; exactly one per deck; fights on the field **and** carries a passive Leader Skill; own summon pool.
**Recommendation: confirm.**

**Q18 🟡 — Skills per card & upgrade cost**
Proposed: 1 basic attack + up to 5 skills (slots unlock by stars); skills level up with **gold + a skill resource** (tomes) from elites/events.
**Recommendation: approve; slice ships 1 skill per card.**

**Q22 🟡 — The long progression tail (scope check)**
The detail screen shows RANK, TRAIT, FOIL, Artifact sets. These are big retention systems but heavy.
a) **Defer all four past first release** (buttons visible but locked, like the reference's locked states).
b) Pick some for Phase 5 (tell me which).
**Recommendation: (a).**

## D. Gear

**Q9 🔴 — Gear rarity ladder (must differ from cards — your directive)**
Proposed 6 tiers: **Worn gray · Sturdy green · Refined blue · Ornate pink · Exalted orange · Mythic red**.
**Recommendation: approve names/colors or supply your own** (count can change; colors keep gear visually distinct from card frames).

**Q10 🔴 — Gear slots**
Reference shows 8 + 1 locked: Weapon, Helmet, Shield, Gauntlets, Armor, Boots, Ring, Amulet (+ Artifact at 6★).
a) **Keep all 8+1** (slice activates 3–4; rest unlock through Phase 2).
b) Trim to 6 (drop Shield + Gauntlets).
**Recommendation: (a)** — matches the reference sheet; icons are fixed per slot everywhere (your directive, already locked into the schema).

**Q11 🟡 — Gear depth**
a) **Main stat by slot + rarity-scaled substats + enhancement levels (+gold), no RNG substat *upgrades*** — Raid-flavor without its darkest grind.
b) Simpler: main stat only.
c) Deeper: substat reroll/gambling systems.
**Recommendation: (a).**

## E. Economy & monetization

**Q13 🔴 — Gacha & money**
a) **Keep the summon/gacha as an *earnable* reward cadence (tokens/gems from play); zero real-money IAP; game fully offline.**
b) Plan IAP hooks for later (affects economy design now).
**Recommendation: (a)** — single-player premium feel; nothing blocks revisiting later.

**Q14 🔴 — Energy (30/30 bolt in the HUD)**
a) **No energy gate** — play freely; pacing comes from difficulty walls. *(HUD slot shows something else, e.g. current region progress)*
b) Generous fast-refill energy for session pacing (mobile-typical).
**Recommendation: (a)** for a premium single-player feel — but this is taste; pick (b) if you want classic mobile pacing.

**Q15 🟢 — The red-swords 10/10 counter**
Unidentified in the reference.
a) **Cut for v1.**  b) Make it boss/elite tickets. c) Other meaning you have in mind?
**Recommendation: (a).**

## F. Screens, UX, platform

**Q24 🔴 — Navigation**
a) **Bottom tab bar: MAP · CARDS · SUMMON · SHOP · MORE, persistent top HUD, modals for details, Map as home.**
b) Hub-and-back-button only (reference screens show back buttons, no tab bar).
**Recommendation: (a)** — fewer taps for the core loop on tall phones.

**Q23 🟢 — Meta screens for first release**
Events hub, Season pass, Leaderboard, Profile exist as references. Offline single-player makes real leaderboards impossible without a backend.
a) **First release: Profile + Settings only; Events/Pass in a later phase; Leaderboard cut (or local records).**
b) Different mix (tell me).
**Recommendation: (a).**

**Q25 🟡 — Onboarding**
a) **Guided first 2 stages (forced simple deck, tooltip beats), then free.**
b) None / just a help sheet.
**Recommendation: (a), built in Phase 6.**

**Q26 🟢 — Audio ambition**
a) **Full pass in Phase 6: per-region music loops + complete SFX set** (placeholder-silent until then, hooks wired from the slice).
b) Minimal SFX only.
**Recommendation: (a).**

**Q27 🟢 — Saves**
Local, versioned, auto-migrating (already decided). Add **manual export/import (file/clipboard)** as a backup in Phase 7?
**Recommendation: yes.**

**Q28 🟢 — Accessibility floor**
Proposed: reduced-motion mode, color-blind-safe rarity cues (icons/labels accompany color), min 11px text, 48px targets.
**Recommendation: approve.**

**Q29 🟡 — Content scope for first release** (drives production volume)
Proposed: **~30 units + 6 heroes, ~40 gear items, ~10 skills-per-element-of-variety, 3 regions/biomes authored + endless generation, 1 boss per region.**
Adjust up/down?

**Q30 🟢 — Language**
a) **English-only UI, strings centralized for later i18n.**  b) German+English from day one.
**Recommendation: (a).** *(Strings live in one module either way, so (b) is cheap to add later.)*

---

## How to answer

Reply in chat or edit this file. Shorthand welcome: `Q1:a, Q2:a, Q9: my names are …`. Anything unanswered
follows the recommendation **only after you say "accept remaining recommendations"** — otherwise it stays open.
After your answers I will: update all affected docs, list exactly which docs changed, reconcile contradictions,
finalize `IMPLEMENTATION_PLAN.md`, and only then begin implementation (per the project brief's hard stop).
