# Changelog

All notable changes to TinyDecklings are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project has no version numbers yet
(pre-implementation).

## [Unreleased]

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

### Added
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
