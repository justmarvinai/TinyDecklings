# TinyDecklings — Roadmap

> Status: **PLANNING**. Development is **gated** on the owner answering `USER_QUESTIONS.md` (see Phase gate below).
> Detailed tasks, dependencies, and acceptance criteria live in `IMPLEMENTATION_PLAN.md`. Phases ship in order;
> each ends in a playable, committed state.

## Phase gate ⛔

**No implementation before the owner has answered `USER_QUESTIONS.md`.** After answers: update affected docs,
confirm the changes, reconcile contradictions, finalize `IMPLEMENTATION_PLAN.md` — then code.

---

## Phase 0 — Foundation (engineering scaffold)

Everything later phases stand on; no gameplay yet.

- Vite + React + TypeScript (strict) scaffold, ESLint/Prettier, Vitest wiring
- Design tokens (`tokens.css`) + Saira via `@fontsource` + global text styles
- Core design-system primitives: Panel, Button (all variants/states), Pill, IconChip, StarRow, StatBar, Modal, TopHud shell, TabBar shell
- Icon manifest + vendored placeholder icon set + shared placeholder avatar + `CREDITS.md`
- Content pipeline: Zod schemas, content registry, validation test harness
- Seeded RNG module (named streams) with tests
- Screen-stack navigation store; app bootstrap + error boundary
- Storage service + versioned save/load with migration harness
- Dev panel (grant resources, jump stage, seed override)

**Exit:** empty "game" boots to a styled shell; CI-grade `typecheck + lint + test` green.

## Phase 1 — Vertical slice ⭐ (prove the loop)

**Map → Encounter → Combat → Reward → Progression → Continue** — small, complete, juicy.

- Map screen: 1 region (~10 stages), linear path, node medallions, star records, scroll & select
- Battle: 2×3 grids, manual targeting + AUTO, melee/ranged, 1 skill per card with cooldown badge, reinforcement queue, win/lose/stars, X1/X2, surrender
- Battle presentation: attack lunges, floating numbers, deaths, deploy, canvas FX layer v1, victory/defeat + reward ceremony
- Rewards: gold + card XP + basic gear drops (loot tables)
- Collection: card grid, card detail (level up with gold/XP, equip 3–4 gear slots live)
- Content: ~10 player cards (incl. 2 heroes), ~8 enemies + 1 boss, ~12 gear items, 1 region theme
- Autosave/resume everywhere (incl. mid-battle intent-log resume)
- Placeholder SFX hooks (tap, hit, victory) behind audio service

**Exit:** a stranger can play stages 1–10 on a phone browser, level a card, equip gear, and *want* stage 11.

## Phase 2 — Collection & progression depth

- Full gear system per answers: all slots, gear rarities, substats, enhancement (`Q10/Q11`)
- Ascension/EVOLVE (duplicates → stars), level caps by stars, skill unlock slots
- Deck builder: multiple decks, leader + 8, auto-equip/auto-build, deck power
- Full card detail sheet (skills upgrade UI, locked systems visibly gated)
- Settings screen (audio toggles, speed, language stub)
- Collection QoL: filter/sort, favorites, notification dots

## Phase 3 — Economy & summon

- Summon screen: pools, tokens, pity counters, single/×10, reveal ceremony (`Q13`)
- Fragments & pity conversion; currency sinks/sources balanced pass 1
- Shop v1 (soft-currency offers, daily rotation; style per `Shop.png`) — scope per `Q13/Q23`
- Energy/attempt pacing if kept (`Q14`)

## Phase 4 — The endless road

- Region generator v2: multiple biomes/themes, elites, bosses with modifiers, endless scaling curve
- Event/choice encounters, treasure & camp nodes (`Q16`)
- Fork nodes (risk/reward branches) if approved (`Q2`)
- Stage star chests / region completion rewards; difficulty tuning pass
- Elements/affinity system if approved (`Q21`)

## Phase 5 — Meta & retention screens (scope per `Q22/Q23`)

- Player profile (stats, records), achievements-lite
- Events hub; season pass track — **only if owner wants them** for v1
- Local records ("leaderboard" without a server) or cut
- Later-ladder card systems per answers: RANK, TRAIT, FOIL, artifact sets

## Phase 6 — Polish & feel

- Audio pass: music per region, full SFX set, mix + settings
- FX pass: particles, screen shake (with reduce-motion), transitions, reward ceremonies
- Onboarding/tutorial (`Q25`), empty/error/edge states, haptics hooks (web no-op)
- Performance hardening to budget (`ARCHITECTURE.md` §9), device sweep

## Phase 7 — Release readiness

- Balance pass across the full curve; content breadth push (cards/gear/regions per `Q29`)
- Accessibility pass (`Q28`), i18n scaffold if approved (`Q30`)
- Save export/import if approved (`Q27`); crash/bug reporting affordance
- PWA install nicety (optional)

## Future (explicitly out of current plan)

- **Capacitor packaging** (Android/iOS), store assets, native storage/haptics swap — architecture keeps this a bounded task (see `TECH_STACK.md` §4)
- Cloud save/accounts, real leaderboards — only with a future backend decision
- Owner's final art drop-in (per-card art + full icon set) — supported at any time via the asset manifest
