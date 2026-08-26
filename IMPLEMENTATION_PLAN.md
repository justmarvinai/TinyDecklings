# TinyDecklings — Implementation Plan

> Status: **PLANNING — blocked by the question gate.** Tasks marked `▣Qn` cannot be *finalized* until that
> question in `USER_QUESTIONS.md` is answered (they can be planned, not coded). Phases match `ROADMAP.md`.
> This plan is written so another experienced developer could execute it without re-deriving decisions.

## Conventions for this plan

- **AC** = acceptance criteria (definition of done).
- Tasks are ordered by dependency within a phase; `→` marks "depends on".
- Every phase ends with: update `CHANGELOG.md`, reconcile docs touched, commit.

---

## Phase 0 — Foundation

| # | Task | Notes / AC |
|---|---|---|
| 0.1 | Scaffold Vite + React + TS strict; ESLint, Prettier, Vitest | AC: `dev`, `build`, `test`, `lint`, `typecheck` scripts run clean |
| 0.2 | `ui/design/tokens.css`: all tokens from `UI_STYLE_GUIDE.md` §3–5; Saira via `@fontsource` (400/500/600/700/900 + italics); global type styles incl. outlined-caps utility | AC: token demo page renders palette/type ramp |
| 0.3 | Design primitives: `Panel`, `Button` (5 variants × states), `Pill`, `IconChip`, `StarRow`, `StatBar` (segmented + fill), `Modal`, `Ribbon`, `NotificationDot`, `Toggle`, `Tab` | AC: kitchen-sink dev screen matches style guide by eye; touch targets ≥48px; pressed states |
| 0.4 | Icon pipeline: vendor Open Game Icons subset; `iconManifest.ts` (semantic keys), `gearSlotIcon(slot)`; shared placeholder avatar asset; `CREDITS.md` attribution | AC: unknown key = typed error; gear icons resolvable **only** via slot |
| 0.5 | Content pipeline: Zod schemas per `CONTENT_SCHEMA.md`; registry + dev/test validation incl. referential integrity; lint that `GearDef` has no icon/art field | AC: intentionally broken fixture fails tests with a readable message |
| 0.6 | `engine/rng.ts` (mulberry32, named streams, fork-by-key) | AC: golden tests: same seed → same sequences; streams independent |
| 0.7 | `state/screenStore.ts` (typed stack, modal entries, back handling); app bootstrap + error boundary | AC: push/pop unit tests; Android/browser back pops |
| 0.8 | `services/storage.ts` + `services/saves.ts`: versioned save doc, migration runner, autosave debouncer, `visibilitychange` flush | AC: round-trip + fixture-migration tests |
| 0.9 | `services/audio.ts` Howler wrapper (channels, mute persistence, unlock-on-gesture) | AC: no-op safe before first gesture |
| 0.10 | Dev panel (dev-only route): grant currency, add cards/gear, jump stage, seed override, validate content button | AC: hidden in prod build |

## Phase 1 — Vertical slice

**Content first (data before features):**

| # | Task | Notes / AC |
|---|---|---|
| 1.1 | Author slice content: ~10 player cards (2 heroes ▣Q12), ~8 enemy cards, 1 boss group, ~12 gear items across 3–4 slots ▣Q10, ~6 skills, statuses (burn/shield/stun min) ▣Q20, region `region.slice_isles` with 10 stages ▣Q16, loot tables, growth curves | AC: all validates; balance sheet doc comment per curve |

**Engine:**

| # | Task | Notes / AC |
|---|---|---|
| 1.2 | Battle state & setup: formation auto-place, reinforcement queue ▣Q6/Q7 | AC: golden setup tests |
| 1.3 | Turn loop: side turns, slot-order acting, intents (attack/cast/auto/surrender), cooldowns ▣Q3/Q4 | AC: seed+intents → deterministic event log |
| 1.4 | Targeting & patterns: melee front-row rule, ranged free, pattern shapes ▣Q7 | AC: table-driven tests over grid cases |
| 1.5 | Effect interpreter: damage/heal/shield/status/modifyStat + triggers + chance | AC: each primitive has unit tests; scripted-registry stub |
| 1.6 | Win/loss/stars ▣Q17 + reward roll (gold, XP, gear drop) → `RewardBundle` | AC: loot distribution test within tolerance |
| 1.7 | Map generator v1: linear 10-stage region, names, kinds (battle/boss), difficulty budget curve | AC: monotonic difficulty; deterministic per seed |
| 1.8 | Progression math: XP→level (caps by stars, static in slice), stat growth, Power formula | AC: golden tables |
| 1.9 | Battle AI (enemy + AUTO): target selection heuristics, skill-when-ready | AC: AI never illegal-moves (property test vs. rules) |

**State & UI (→ engine tasks):**

| # | Task | Notes / AC |
|---|---|---|
| 1.10 | `playerStore` (collection, currencies, records) + `runStore` (map window, position) wired to saves | AC: reload restores exactly |
| 1.11 | Map screen: scrolling path, `NodeMedallion`, star records, select→confirm sheet, region backdrop | AC: matches `Map.png` structure; 60fps scroll on target device |
| 1.12 | Battle screen: grids, `CardFrame` battle variant (HP plate, type badge, cooldown badge, glow), TURN banner, deck counters, controls (X1/X2, AUTO, flag) | AC: matches `Battle.png` structure |
| 1.13 | Battle sequencer + canvas FX v1: event queue → tweens/particles/floating numbers/sfx hooks; speed scaling; skippable ceremonies | AC: no rules logic in UI; reduced-motion fallback |
| 1.14 | Manual targeting UX: tap acting card's valid targets (pulse outlines), tap skill chip to arm ▣Q3 | AC: fat-finger safe (48px), cancelable |
| 1.15 | Victory/defeat + reward ceremony; stars award; return-to-map advance | AC: rewards land in store + save |
| 1.16 | Cards screen v1 (grid, 3-wide) + Card detail v1 (stats, XP bar, LEVEL UP with gold cost, gear grid with equip/unequip via inventory sheet) | AC: matches reference structure; gear tiles show slot icon + gear-rarity bg |
| 1.17 | Mid-battle resume (persist seed + intent log; replay on load) | AC: kill app mid-fight → resume exact state |
| 1.18 | Slice QA pass: device sweep (small/tall phones), perf budget check, feel pass on timings | AC: exit criteria of Phase 1 in `ROADMAP.md` |

## Phase 2 — Collection & progression depth (all ▣Q8–Q12, Q18, Q22)

2.1 Gear full slot set + substats + enhancement · 2.2 Ascension/EVOLVE + level caps + skill slot unlocks · 2.3 Skill upgrade UI + resource · 2.4 Deck builder (6 decks, leader+8, auto-build, power) · 2.5 Full card detail action bar with locked-system gates · 2.6 Settings screen · 2.7 Collection filter/sort/favorites/badges.

## Phase 3 — Economy & summon (▣Q13–Q15)

3.1 Summon engine (pools, weights, pity) + tests · 3.2 Summon screen + reveal ceremony · 3.3 Fragments/dust conversions · 3.4 Shop v1 (rotating soft-currency offers) · 3.5 Economy tuning pass (sources/sinks sheet).

## Phase 4 — Endless road (▣Q2, Q16, Q21)

4.1 Region/biome themes ×3 with palettes/backdrops · 4.2 Elite/boss modifier system · 4.3 Event/treasure/camp encounters + choice sheets · 4.4 Fork nodes · 4.5 Endless scaling + modifier composition · 4.6 Region rewards/star chests · 4.7 Elements if approved.

## Phase 5 — Meta screens (▣Q22–Q23)

5.1 Profile + records · 5.2 Events hub · 5.3 Season pass track · 5.4 Local records/leaderboard-lite or cut · 5.5 RANK/TRAIT/FOIL/artifact sets per scope decision.

## Phase 6 — Polish (▣Q25, Q26, Q28)

6.1 Music/SFX full pass · 6.2 FX/juice pass · 6.3 Tutorial/onboarding · 6.4 Edge/empty states · 6.5 Perf hardening · 6.6 Accessibility pass.

## Phase 7 — Release readiness (▣Q27, Q29, Q30)

7.1 Balance across full curve · 7.2 Content breadth to target counts · 7.3 Save export/import · 7.4 i18n scaffold · 7.5 PWA nicety · 7.6 Release checklist.

---

## Cross-cutting rules (every phase)

- Content additions never require engine edits (else: extract a primitive first, then data).
- Every PR/commit that changes behavior updates `CHANGELOG.md`; doc-affecting decisions update their doc in the same commit.
- New save-affecting fields ⇒ save version bump + migration + fixture test, same commit.
- UI work is validated against `UI_STYLE_GUIDE.md` and on a real phone viewport before "done".

## Dependency graph (coarse)

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 5
                 │                        ▲
                 └──────► Phase 4 ────────┘
Phase 6 & 7 follow the last content phase shipped.
```

## First session after the gate opens

1. Owner answers `USER_QUESTIONS.md` → update `GAME_DESIGN.md`, `CONTENT_SCHEMA.md`, this plan; list changed docs explicitly; resolve contradictions.
2. Freeze slice scope (Phase 1 table) against answers.
3. Execute Phase 0 top to bottom.
