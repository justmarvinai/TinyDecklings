# Changelog

All notable changes to TinyDecklings are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project has no version numbers yet
(pre-release).

## [Unreleased]

### Added

- 2026-08-26 — **Phase 3: economy, summon & energy** (`IMPLEMENTATION_PLAN.md` 3.1–3.6).
  - **Summoning** — four pools (three unit tiers plus heroes) with **working pity counters**: a test proves
    a player can never exceed a pool's threshold without the promised rarity, and the registry now refuses
    content where a pity rule could never pay out. ×10 pulls carry pity across the batch and cost 10% less.
    Every pull is deterministic per (pool, pulls made), so reloading a save cannot re-roll a lucky batch (Q13)
  - **Duplicates and fragments** — a duplicate pull pays fragments scaled by rarity, and fragments buy a
    card of your choosing outright. Nothing pulled is ever wasted
  - **Energy (Q14b)** — cap 30, one point every two minutes, battle 5 / elite 6 / boss 8, vignettes free.
    Regen is _derived from an injected clock_, not ticked: no timer runs, a week offline settles in one
    step, and rewards may overflow the cap. Combat stages are gated with a sheet that says how much is
    missing and when the next point arrives, rather than a dead button
  - **Shop** — a daily rotation derived from the day and run seed (so no scheduler is needed) plus always-
    stocked staples: energy flasks, tomes and summon tokens. Purchase limits reset at the day boundary
  - **Economy tuning** — tokens, tomes, gems and fragments now drop from ordinary battles, with a test
    asserting every system the game asks you to engage with is reachable by playing
  - **Three new chase cards** and a legendary hero, added because the content pipeline caught that the
    top-tier pools had nothing to offer
  - **Screens are code-split**, cutting the initial bundle from 160 KB to 84 KB gzip
  - 277 tests green; verified at 390×844 and 360×640

### Changed

- 2026-08-26 — **Save format v1 → v2**: added `player.shop` and `player.summonCounts`. Existing saves
  migrate automatically; a fixture test walks a full v1 document forward and asserts nothing is lost.

- 2026-08-26 — **Phase 2: collection & progression depth** (`IMPLEMENTATION_PLAN.md` 2.1–2.7).
  - **Full gear system** — all eight slots live plus the Artifact slot gated behind a 6★ card; 38 items
    spanning the whole gear rarity ladder; substats shown on a gear sheet; **gold enhancement** with a
    per-rarity cap and rising cost (Q11: guaranteed upgrades, never a gamble)
  - **Ascension (EVOLVE)** — feed same-grade cards plus gold to gain a star, up to 6★. Every star raises
    stats, the level cap and unlocks a skill slot. Favourites and cards sitting in a deck are never eaten,
    and the sheet says plainly what is missing rather than greying out with no reason (Q8)
  - **Skill ladder** — every card carries five skills, one unlocked per star, upgraded with gold + tomes;
    five new skills authored to fill the ladders; the battle bar now shows one button per unlocked skill
    with its own cooldown (Q18)
  - **Deck builder** — six decks of 1 hero + 8 units, no duplicates within a deck, deck power, auto-build
    and clear, page dots; battles now fight with the active deck instead of auto-picking (Q6).
    No defense deck: that is multiplayer furniture and this game is single-player
  - **Settings screen** — audio toggles, battle speed, reduced motion, language, in the reference's
    label-above-control layout; no accounts or sign-in, because there is no server
  - **Collection QoL** — Units/Heroes/Deck tabs, sort by power/level/stars/name, favourites filter and
    marker; the deck tab shows the collection beneath the builder, as in the reference
  - 207 tests green; verified at 390×844 and 360×640 with no overflow

- 2026-08-26 — **Phase 1: the vertical slice** — the core loop runs end to end
  (`IMPLEMENTATION_PLAN.md` 1.1–1.18). A new player can walk the map, fight, win rewards, level a card,
  equip gear and take on the next stage.
  - **Slice content** — 10 player cards (2 heroes with leader skills), 9 enemy cards incl. the Tide Tyrant
    boss, 16 gear items across the 4 active slots, 8 skills, 9 enemy formations, the Sunken Isles region
    (10 stages), battle and boss loot tables
  - **Battle engine** — 2×3 boards per side, round = player turn then enemy turn, slot-order acting,
    melee locked to the living front row with taunt override, ranged free, attack patterns clipped to the
    board, reinforcement queue, skill cooldowns, status ticks, surrender, stars (3★ flawless · 2★ ≤2 deaths
    · 1★ win). Pure, deterministic and replayable from a seed plus an intent log
  - **Effect interpreter** — damage, heal, shield, status, stat modifiers, cleanse and taunt as composable
    data primitives, so a new card is a data entry rather than engine code
  - **Map generator** — endless linear road, boss every tenth stage, difficulty that only climbs, stages
    derived from (run seed, stage number) so the road is stable and generating stage 400 cannot disturb
    stage 3
  - **Progression** — level/XP curves capped by star grade, gear-aware stat computation, Power rating
  - **Battle AI** — drives enemy turns and the AUTO toggle through the same intents a tap produces
  - **Stores** — player (collection, gear, currencies, stage records), run (position, stage window), battle
    (live state, intent log, one-shot result banking), all persisted through the versioned save
  - **Screens** — Map with node medallions, star records and a stage sheet; fullscreen Battle with a canvas
    FX layer (impacts, floating damage, deaths), manual targeting, AUTO and speed toggles, and a reward
    ceremony; Cards collection with a detail sheet for levelling and equipping
  - **Mid-battle resume** — an interrupted fight is stored as its seed plus intents and replayed exactly
  - **Balance guard** — a test proving the region is completable: stage 1 winnable with the starter deck,
    the boss needing roughly level 20
  - 153 tests green; verified at 390×844 and 360×640 with no overflow
- 2026-08-26 — **Vercel deployment** (`vercel.json`, `.vercelignore`, `DEPLOYMENT.md`): SPA rewrite,
  immutable asset caching, reference screenshots excluded from the published bundle. Every branch push gets
  a preview URL, so the current state of development is always viewable on a real phone.

- 2026-08-26 — **Phase 0: Foundation** (`IMPLEMENTATION_PLAN.md` 0.1–0.10). The game now boots to a styled,
  navigable shell; no gameplay yet.
  - **Scaffold** — Vite 8 + React 19 + TypeScript 6 (strict), ESLint 10, Prettier, Vitest 4; `@/*` path alias;
    scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`, `format`, `verify`, `vendor:icons`
  - **Engine purity is lint-enforced** — `src/engine` and `src/content` cannot import React/DOM/stores/services
    or use `Math.random`, `Date.now`, `new Date()` (CLAUDE.md rule 7)
  - **Design tokens** (`ui/design/tokens.css`) — full palette, type ramp, shape/bevel/shadow language, motion
    and layout tokens, with **separate card and gear rarity scales** that share no token (rule 4)
  - **Design primitives** — Button (6 variants, stacked/locked/icon-only states), Panel, Pill, IconChip,
    StarRow, StatBar (segmented + fill), Modal, TitleBanner, Tabs, Toggle, Ribbon, NotificationDot;
    plus TopHud and TabBar shells and a kitchen-sink screen to eyeball them against `assets/examples/`
  - **Icon & art pipeline** — 50 placeholder icons vendored from Game Icons (CC BY 3.0) via
    `@iconify-json/game-icons`; semantic `iconManifest.ts` keyed by meaning; `gearSlotIcon(slot)` is the only
    way to get gear art (rule 5); shared placeholder avatar + `artManifest.ts`; `CREDITS.md` attribution
  - **Content pipeline** — Zod schemas for cards, gear, skills, effects, statuses, patterns, map, economy;
    validated registry with cross-reference integrity checks; system content authored (9 gear slots,
    6 attack patterns, 9 statuses, 5 growth curves, energy config, difficulty curve)
  - **Seeded RNG** — mulberry32 with named, independent streams and forkable sub-streams; golden tests
  - **Screen stack** — typed navigation store with tabs, modals and hardware/browser back
  - **Persistence** — storage + clock service seams, versioned `SaveDoc`, migration runner, debounced autosave
    with `visibilitychange`/`pagehide` flush, corrupt-save backup instead of overwrite
  - **Audio service** — Howler wrapper with channels, settings and unlock-on-gesture (silent until Phase 6)
  - **App shell** — composition root, error boundary with copyable debug blob, dev panel (navigation,
    settings, content validation, state dump), favicon, portrait/safe-area `index.html`
  - 60 tests passing; verified in Chromium at 390×844 and 360×640 with no horizontal overflow

- 2026-08-26 — **Planning & documentation baseline** (no game code yet; development gated on `USER_QUESTIONS.md`):
  - `CLAUDE.md` — engineering & AI-contributor guide, non-negotiable rules, development gate
  - `GAME_DESIGN.md` — vision, pillars, core loop, systems (cards, decks, combat, map, gear, economy) with DECIDED/PROPOSED/OPEN tags
  - `TECH_STACK.md` — stack decision: TypeScript + Vite + React (DOM-first) + canvas FX layer, Zustand, Zod, Motion, Howler, @fontsource Saira; Capacitor kept as a future seam
  - `ARCHITECTURE.md` — layering, battle event pipeline, seeded RNG, versioned saves, semantic asset manifest, testing strategy, ADR table
  - `CONTENT_SCHEMA.md` — data shapes: cards, **separate CardRarity/GearRarity systems**, gear (slot-typed icons, no per-item icon field), skills/effects, map/encounters, economy, save doc
  - `UI_STYLE_GUIDE.md` — visual language extracted from `assets/examples/` (palette, type, shape/bevel language, component specs, screen blueprints, motion)
  - `ROADMAP.md` — phased roadmap (Foundation → Vertical slice → … → Release readiness; Capacitor explicitly future)
  - `IMPLEMENTATION_PLAN.md` — concrete tasks, dependencies, acceptance criteria per phase
  - `USER_QUESTIONS.md` — the owner-decision gate (Q1–Q30)

### Fixed

- 2026-08-26 — Enemy formations opened with their reserves already deployed (see Phase 1 note) and, in the
  same class of bug, a Zustand selector that built a fresh array (`ascensionFodder`) crashed the card sheet
  with an infinite render loop. Both derived helpers are now pure exported functions memoised on the save,
  and the hazard is documented in `CLAUDE.md` so it stops recurring.

- 2026-08-26 — Battle could stall when every enemy was dead but a reinforcement was still queued: the
  acting card had no legal target and the turn loop waited forever for an impossible intent. Cards with
  nothing to act on now pass their turn. Found by a balance sweep, guarded by a test.
- 2026-08-26 — Enemy reinforcements deployed onto the board at battle start instead of waiting in reserve,
  so a four-card formation opened as six. Reserves are now explicit and stay queued (Q7).
- 2026-08-26 — Winning a battle restarted it: banking rewards changed player state, which recomputed the
  battle setup and remounted the fight. The roster is now snapshotted once when a battle begins.

### Changed

- 2026-08-26 — **All owner decisions locked** (`USER_QUESTIONS.md` Q1–Q30 answered: all recommendations
  accepted; **Q14 → option (b)** — generous fast-refill energy system, cap 30, 1 energy/2 min, costs
  battle 5 / elite 6 / boss 8, vignettes free, lands Phase 3). Docs updated to DECIDED state:
  - `USER_QUESTIONS.md` → decision log; gate now awaits the owner's explicit start instruction
  - `GAME_DESIGN.md` → all PROPOSED/OPEN tags resolved; new §10.1 Energy pacing; Defense deck,
    red-swords HUD counter, and Leaderboard screen marked as conscious cuts/divergences from references
  - `ROADMAP.md` → Phase 3 renamed "Economy, summon & energy"; Phase 5 reduced to Profile & records;
    Events hub / Season pass / RANK / TRAIT / FOIL / artifact sets / Expedition moved to post-release backlog
  - `IMPLEMENTATION_PLAN.md` → all ▣Qn blockers inlined as decisions; energy task 3.4 added; final
  - `CONTENT_SCHEMA.md` → `EnergyConfig` + save `energy` block added; Q-comments resolved
  - `CLAUDE.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `UI_STYLE_GUIDE.md` → status/provenance notes updated
- 2026-08-26 — Docs reconciled with the as-built Phase 0: `CLAUDE.md` status + commands section,
  `TECH_STACK.md` installed versions (React 19, not 18) and an "as-built" section, `ROADMAP.md` and
  `IMPLEMENTATION_PLAN.md` Phase 0 marked complete.

## Baseline

- Repository initially contained reference assets only: `assets/examples/` (13 reference screenshots incl. `Map.png`).
