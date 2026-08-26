# TinyDecklings — Roadmap

> All `USER_QUESTIONS.md` items answered 2026-08-26 (all recommendations; Q14 → energy system). Detailed
> tasks, dependencies and acceptance criteria live in `IMPLEMENTATION_PLAN.md`. Phases ship in order; each
> ends in a playable, committed state.

## Status

Questions answered and development started **2026-08-26**. **Phase 0 is complete**; Phase 1 (the vertical
slice) is next.

---

## Phase 0 — Foundation (engineering scaffold) ✅ COMPLETE

Everything later phases stand on; no gameplay yet.

- Vite + React + TypeScript (strict) scaffold, ESLint/Prettier, Vitest wiring
- Design tokens (`tokens.css`) + Saira via `@fontsource` + global text styles
- Core design-system primitives: Panel, Button (all variants/states), Pill, IconChip, StarRow, StatBar, Modal, TopHud shell, TabBar shell
- Icon manifest + vendored placeholder icon set + shared placeholder avatar + `CREDITS.md`
- Content pipeline: Zod schemas, content registry, validation test harness
- Seeded RNG module (named streams) with tests
- Screen-stack navigation store; app bootstrap + error boundary
- Storage service + versioned save/load with migration harness
- Dev panel (grant resources incl. energy toggle, jump stage, seed override)

**Exit:** ✅ the game boots to a styled, navigable shell; `npm run verify` (typecheck + lint + 60 tests) green;
verified in Chromium at 390×844 and 360×640.

## Phase 1 — Vertical slice ⭐ (prove the loop)

**Map → Encounter → Combat → Reward → Progression → Continue** — small, complete, juicy.

- Map screen: 1 region (~10 stages), linear path, node medallions, star records, scroll & select
- Battle: 2×3 grids, manual targeting + AUTO, melee/ranged, 1 skill per card with cooldown badge, reinforcement queue, win/lose/stars (3★ flawless · 2★ ≤2 deaths · 1★ win), X1/X2, surrender
- Battle presentation: attack lunges, floating numbers, deaths, deploy, canvas FX layer v1, victory/defeat + reward ceremony
- Rewards: gold + card XP + basic gear drops (loot tables)
- Collection: card grid, card detail (level up with gold/XP, equip the 4 active gear slots: Weapon/Helmet/Armor/Boots)
- Content: ~10 player cards (incl. 2 heroes), ~8 enemies + 1 boss, ~12 gear items, 1 region theme
- Autosave/resume everywhere (incl. mid-battle intent-log resume)
- Placeholder SFX hooks (tap, hit, victory) behind audio service
- _(Energy system intentionally NOT here — lands Phase 3; slice plays ungated)_

**Exit:** a stranger can play stages 1–10 on a phone browser, level a card, equip gear, and _want_ stage 11.

## Phase 2 — Collection & progression depth

- Full gear system: all 8+1 slots active, 6 gear rarities, substats, gold enhancement (Q10/Q11)
- Ascension/EVOLVE (duplicates → stars, up to 6★), level caps by stars, skill slot unlocks (Q8)
- Skills to full ladder: up to 5 per card, upgrades with gold + tomes (Q18)
- Deck builder: 6 decks, leader + 8, auto-equip/auto-build, deck power (Q6)
- Full card detail sheet — RANK/TRAIT/FOIL/artifact-set buttons **visible but locked** (Q22)
- Settings screen (audio toggles, speed, language stub)
- Collection QoL: filter/sort, favorites, notification dots

## Phase 3 — Economy, summon & energy

- Summon screen: pools, tokens, pity counters, single/×10, reveal ceremony — fully earnable, **no IAP** (Q13)
- Fragments & pity conversion; currency sinks/sources balanced pass 1
- **Energy system (Q14b):** cap 30, 1/2min regen (lazy, clock-injected), costs battle 5 / elite 6 / boss 8, vignettes free, overflow from rewards, out-of-energy sheet, HUD pill wiring
- Shop v1 (soft-currency offers, daily rotation; style per `Shop.png`; gem energy refills — still no real money)
- Red-swords HUD counter stays cut (Q15)

## Phase 4 — The endless road

- Region generator v2: 3 authored biomes/themes, elites, bosses with modifiers, endless scaling curve
- Event/choice encounters, treasure & camp nodes (Q16)
- Fork nodes: 2-way risk/reward branches that rejoin (Q2)
- Stage star chests / region completion rewards; difficulty tuning pass
- **Light elemental affinity:** stage element themes, counter-element bonus +10–15% (Q21)

## Phase 5 — Profile & records

- Player profile (stats, records), achievements-lite (Q23: Profile + Settings are the only meta screens in first release)
- Locked-state facades polished for deferred systems (RANK/TRAIT/FOIL/artifact sets)

## Phase 6 — Polish & feel

- Audio pass: music per region, full SFX set, mix + settings (Q26)
- FX pass: particles, screen shake (with reduce-motion), transitions, reward ceremonies
- **Onboarding: guided first 2 stages** (forced simple deck, tooltip beats), then free (Q25)
- Edge/empty/error states, haptics hooks (web no-op)
- Performance hardening to budget (`ARCHITECTURE.md` §9), device sweep

## Phase 7 — Release readiness

- Balance pass across the full curve; content breadth to targets (Q29: ~30 units + 6 heroes, ~40 gear, 3 regions, 1 boss/region)
- Accessibility pass (Q28: reduced-motion, color-blind-safe cues, size floors)
- **Save export/import** (file/clipboard backup) (Q27)
- English-only release; strings stay centralized (Q30)
- Crash/bug reporting affordance; PWA install nicety (optional)

## Post-first-release backlog (decided deferrals)

- **Events hub** and **Season pass** screens (Q23)
- **Local records** ("leaderboard" without a server) — or stays cut (Q23)
- **RANK, TRAIT, FOIL, Artifact sets** (Q22)
- **Expedition mode** — rotating roguelike draft runs with temporary buffs (Q1 candidate)
- Deeper i18n (e.g. German) (Q30)

## Future (explicitly out of plan)

- **Capacitor packaging** (Android/iOS), store assets, native storage/haptics swap — architecture keeps this a bounded task (see `TECH_STACK.md` §4)
- Cloud save/accounts, real leaderboards — only with a future backend decision
- Real-money monetization — **none planned** (Q13); revisited only on owner request
- Owner's final art drop-in (per-card art + full icon set) — supported at any time via the asset manifest
