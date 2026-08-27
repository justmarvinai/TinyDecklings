# TinyDecklings — Architecture

> Status: **Phase 0 implemented (2026-08-26).** The layering, RNG, save and asset sections below are live in
> code; the battle pipeline (§3) is the blueprint Phase 1 implements. Stack rationale: `TECH_STACK.md`.

## 1. Layering (the prime directive)

Five layers with one-way dependencies. **Nothing below the UI line imports React or the DOM.**

```
┌─────────────────────────────────────────────────────────┐
│  ui/          React components, screens, animation,     │
│               canvas FX layer, sound triggers           │
├─────────────────────────────────────────────────────────┤
│  state/       Zustand stores: player, run, battle,      │
│               settings, screen-stack (navigation)       │
├─────────────────────────────────────────────────────────┤
│  engine/      Pure simulation: battle resolver, effect  │
│               interpreter, map generator, economy,      │
│               progression math, seeded RNG              │
├─────────────────────────────────────────────────────────┤
│  content/     Static data: cards, gear, skills,         │
│               enemies, encounters, regions, loot,       │
│               rarities, balance — Zod-validated         │
├─────────────────────────────────────────────────────────┤
│  services/    persistence, audio, platform seams        │
│               (storage, haptics), logging               │
└─────────────────────────────────────────────────────────┘
```

Dependency rules:

- `content` depends on nothing (data + schemas).
- `engine` depends on `content` only. **Deterministic, side-effect-free, no `Date.now`/`Math.random`** — time and RNG are injected.
- `state` orchestrates: calls engine, holds serializable snapshots, invokes `services` for persistence.
- `ui` renders `state` and dispatches intents. No game rules in components — a component may _format_ but never _decide_.
- `services` are interfaces with web implementations; Capacitor later swaps implementations, not call sites.

## 2. Directory layout (target)

```
src/
  content/            # data-driven game content
    schemas/          # Zod schemas (single source of truth for content types)
    cards/            # card definitions (units, heroes)
    gear/             # gear definitions + slot/rarity tables
    skills/           # skill + effect definitions
    enemies/          # enemy rosters & scaling tables
    map/              # region themes, stage templates, encounter tables
    economy/          # currencies, loot tables, summon pools, balance curves
    index.ts          # typed, validated content registry
  engine/
    rng.ts            # mulberry32, named streams (map / battle / loot / summon)
    battle/           # battle state, turn loop, targeting, effect interpreter
    map/              # endless stage generation
    progression/      # xp curves, ascension, gear stats, power formula
    economy/          # rewards, loot rolls, summon resolution (pity)
    types.ts          # engine state & event types
  state/
    playerStore.ts    # collection, gear inventory, currencies, stage records
    runStore.ts       # map position, generated stages, pending rewards
    battleStore.ts    # live battle presentation state + event queue cursor
    settingsStore.ts  # audio/gfx/preferences
    screenStore.ts    # screen stack navigation (no router)
  ui/
    design/           # tokens.css, primitives: Panel, Button, Pill, StarRow,
                      # StatBar, IconChip, ResourceCounter, Modal, Ribbon…
    components/       # CardFrame, GearTile, NodeMedallion, TopHud, TabBar…
    screens/          # MapScreen, BattleScreen, CardsScreen, CardDetail…
    fx/               # canvas overlay, particle presets, floating numbers
    icons/            # iconManifest.ts (semantic key → asset)
      svg/            # vendored placeholders, named after their source art
      custom/         # OWNER DROP-IN: <icon-key>.svg wins over the placeholder
    art/              # artManifest.ts + the shared placeholder avatar
      cards/          # OWNER DROP-IN: <artKey>.png is that card's portrait
  services/
    storage.ts        # StorageService interface + localStorage/memory impls
    clock.ts          # Clock seam — injected time (energy regen, save stamps)
    saves/            # versioned save schema, migrations, SaveService
    audio.ts          # Howler wrapper: sfx/music channels, settings-aware
    platform.ts       # haptics/share/etc. no-op web impls (Capacitor seam) — Phase 6
  app/                # bootstrap, composition root, error boundary, dev panel
```

**As built after Phase 0:** `content/` (schemas + gear/battle/economy system data), `engine/rng.ts`,
`state/` (screenStore, settingsStore), `services/` (storage, clock, saves, audio), `ui/` (design tokens,
primitives, icons, art, components, kitchen-sink screen) and `app/` all exist. The engine's battle, map,
progression and economy modules plus the remaining stores and screens arrive with Phase 1.

## 3. The battle pipeline (engine ↔ presentation)

The battle engine is a **pure reducer emitting an event log**; the UI is an _animator of events_, never a rules authority.

```
intent (tap target / cast / auto-step)
   │
   ▼
engine.battle.step(state, intent) ──► { nextState, events[] }
   │                                        │
   ▼                                        ▼
battleStore commits nextState        BattleEvent queue:
                                     CardAttacked, DamageDealt, CardDied,
                                     SkillCast, StatusApplied, CardDeployed,
                                     TurnStarted, BattleEnded …
                                            │
                                            ▼
                              ui/fx animation sequencer:
                              plays events in order (tweens, canvas
                              particles, floating numbers, sfx),
                              at X1/X2 speed; AUTO feeds intents
```

Why: deterministic tests ("given seed + intents, expect events"), replayability, timeline-accurate animations, and free AUTO mode (AI produces intents through the same door).

## 4. Determinism & RNG

- `mulberry32` seeded PRNG; **named streams** so consuming one system's randomness never shifts another's (`rng.map`, `rng.battle`, `rng.loot`, `rng.summon`).
- Run seed stored in the save; a battle's seed derives from (run seed, stage id, attempt #).
- Engine receives RNG as a parameter — never reads global `Math.random`.

## 5. Content pipeline (data-driven mandate)

- **Zod schemas in `content/schemas` are the single source of truth**; TS types are `z.infer<>` of them. Shapes documented in `CONTENT_SCHEMA.md`.
- Content lives as TS modules (typed literals) registered in `content/index.ts`; a dev-mode + test-time validation pass fails loudly on any invalid entry.
- **Adding a card/gear/enemy/encounter = adding a data entry.** If a feature needs engine code, it becomes a _reusable effect primitive_, not a card special-case. A registry of scripted effects (keyed by id) is the escape hatch for truly unique behaviors — used sparingly, documented per entry.
- Balance values (curves, costs, drop rates) live in `content/economy`, not inline in engine code.

## 6. Assets & the placeholder policy

- `iconManifest.ts` maps **semantic keys** → asset modules: `icon('gear.boots')`, `icon('currency.gold')`, `icon('stat.strength')`. UI code never imports an icon file directly.
- **Gear icons resolve from the slot type** (`gearSlotIcon(slot)`) — per owner directive, all items of a slot share the slot's icon; gear data has **no icon field** (see `CONTENT_SCHEMA.md`).
- Card art resolves via `artKey` with a **single shared placeholder avatar** as fallback.
- **Both swaps are a file drop, not an edit.** Two folders are discovered by name at build time, so replacing art never touches a manifest, a component, content data or the schema:

  | Folder                 | File name is…                                | Applies to                        | After dropping in       |
  | ---------------------- | -------------------------------------------- | --------------------------------- | ----------------------- |
  | `src/ui/art/cards/`    | the card's `artKey` (`card.ember_drake.png`) | that one card                     | nothing — Vite globs it |
  | `src/ui/icons/custom/` | the semantic icon key (`gear.weapon.svg`)    | every place that meaning is drawn | `npm run vendor:icons`  |

  Card art is found by `import.meta.glob`; icons are inlined into `generated/iconPaths.ts` as `ICON_OVERRIDES`, which `iconPath()` prefers over the placeholder. Anything with no file falls back, so a half-finished art pass still runs.

- **A misnamed file fails the build.** A portrait matching no card, or an icon named something that is not an icon key, is silently inert — so `artManifest.test.ts` and `iconManifest.test.ts` reject both by name. The dev panel's **Art coverage** button lists what is still placeholder.
- `src/ui/icons/svg/` holds the vendored placeholders under their upstream names; `npm run vendor:icons` never overwrites a file there without `--force`. It is the fallback set, not the drop-in surface.
- Vendored Open Game Icons keep per-artist attribution in `CREDITS.md` (CC-BY of the upstream game-icons collection).

## 7. Persistence

- One **versioned save document** (`saveVersion`, `playerState`, `runState`, `settings`, timestamps) — schema in `CONTENT_SCHEMA.md` §Save.
- **Migrations**: pure functions `vN → vN+1`, run in sequence on load; tested with fixture saves.
- **Autosave** on every meaningful transition (battle end, reward claim, map move, equip change, purchase) and on `visibilitychange` — a killed app never loses more than the current animation. Mid-battle resume: persist battle seed + intent log; replaying the log restores the exact state. Manual export/import ships in Phase 7 (Q27 decided).
- Storage behind `StorageService` (async-shaped API even over localStorage) → Capacitor Preferences/Filesystem swap later.

## 8. Navigation model

Game screens are a **state machine, not URLs**: `screenStore` holds a stack (`push/replace/pop`) of typed screen descriptors (`{ kind: 'cardDetail', cardId }`). Modals are stack entries with transparency. Android back / browser back maps to `pop()`. No router dependency; deep links are a non-goal until Capacitor phase.

## 9. Rendering & performance budget

- Target: **60fps on a 2020 mid-range Android** (e.g. WebView on a Snapdragon 6-series); load-to-map < 3s on such a device.
- Techniques: transform/opacity-only animations (compositor-friendly), `content-visibility: auto` with
  `contain-intrinsic-size` on the long lists (collection grid, the road, the achievement list) so off-screen
  rows are neither laid out nor painted, texture-light DOM (no massive box-shadows stacking), single canvas
  FX layer with pooled particles.
- **Shipped Phase 6:** `content-visibility` does the job a hand-rolled virtualizer was pencilled in for, with
  no scroll-position bookkeeping to get wrong; a real virtualizer is only worth revisiting if a collection
  ever outgrows it. Screen entrances, screen shake and the reward ceremony are all transform/opacity, and all
  drop out entirely under reduced motion (Q28).
- **Audio (Q26):** the sound set is _synthesized_ rather than sampled — short Web Audio envelopes and slow
  generative music beds described in `services/audio/soundManifest.ts`. Nothing is downloaded, so audio costs
  no bundle at all, and the owner's real files replace it as a manifest change (rule 6).
- Bundle: code-split by screen where free; keep initial JS < 300KB gz before art. **Measured Phase 6: 177KB gz** (app 92 + shared primitives 85). Art budgets set when real art arrives.

## 10. Error handling & dev tooling

- App-level error boundary with "copy debug info" (save version, seed, screen).
- Dev panel (dev builds only): grant resources, jump stages, force battle seeds, validate content, animation speed override.
- Logging service with ring buffer attached to bug reports.

## 11. Testing strategy

| Layer     | How                                                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | Schema validation over _all_ entries; referential integrity (skills exist, loot tables sum, icon keys resolve)                                                             |
| `engine`  | Vitest: golden-seed battle tests (seed + intents → expected events/outcome), map generation properties (difficulty monotonic, region composition), progression math tables |
| `state`   | Store logic tests incl. save/load round-trips + migration fixtures                                                                                                         |
| `ui`      | Testing Library for critical widgets (CardFrame states, StatBar); visual/manual pass against `UI_STYLE_GUIDE.md`; Playwright smoke (slice loop) later                      |

CI recommendation (when repo has code): typecheck + lint + vitest on push.

## 12. Architectural decisions record

| #    | Decision                                               | Why (short)                                                |
| ---- | ------------------------------------------------------ | ---------------------------------------------------------- |
| AD-1 | DOM-first React, canvas only for FX                    | UI-dominant game; see `TECH_STACK.md`                      |
| AD-2 | Pure engine + event log                                | Determinism, tests, animation sequencing, AUTO mode        |
| AD-3 | Zod-validated TS content modules                       | Data-driven mandate with compile-time + runtime safety     |
| AD-4 | Screen-stack store instead of router                   | Screens are game states; URLs meaningless in a wrapped app |
| AD-5 | Seeded named-stream RNG                                | Reproducibility across systems                             |
| AD-6 | Storage/platform behind service interfaces             | Clean Capacitor seam without doing Capacitor now           |
| AD-7 | Semantic asset manifest; gear icons keyed by slot type | Owner's placeholder-swap plan + fixed gear iconography     |
| AD-8 | Versioned saves with pure migrations                   | Endless meta progression must survive every update         |
