# Changelog

All notable changes to TinyDecklings are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project has no version numbers yet
(pre-release).

## [Unreleased]

### Added

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

## Baseline

- Repository initially contained reference assets only: `assets/examples/` (13 reference screenshots incl. `Map.png`).

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
