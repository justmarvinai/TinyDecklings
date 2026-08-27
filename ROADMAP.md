# TinyDecklings — Roadmap

> All `USER_QUESTIONS.md` items answered 2026-08-26 (all recommendations; Q14 → energy system). Detailed
> tasks, dependencies and acceptance criteria live in `IMPLEMENTATION_PLAN.md`. Phases ship in order; each
> ends in a playable, committed state.

## Status

Questions answered and development started **2026-08-26**. **All seven phases are complete.** The game is
playable end to end with the full first-release roster, a live economy, an endless three-biome road, a player
record with achievements, a polish pass covering audio, juice and onboarding, and release readiness including
manual save backup. It deploys to Vercel for live review (`DEPLOYMENT.md`). What is left is the owner's art
and audio drop-in, and whatever the backlog below earns.

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

## Phase 1 — Vertical slice ⭐ (prove the loop) ✅ COMPLETE

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

- **Vercel deployment** so the current state of development is always viewable on a real phone

**Exit:** ✅ a stranger can play stages 1–10 on a phone browser, level a card, equip gear, and want stage 11.
Verified at 390×844 and 360×640 with no overflow; 153 tests green, including a balance guard proving the
region is completable (stage 1 winnable at level 1, the boss needs roughly level 20).

## Phase 2 — Collection & progression depth ✅ COMPLETE

- Full gear system: all 8+1 slots active, 6 gear rarities, substats, gold enhancement (Q10/Q11)
- Ascension/EVOLVE (duplicates → stars, up to 6★), level caps by stars, skill slot unlocks (Q8)
- Skills to full ladder: up to 5 per card, upgrades with gold + tomes (Q18)
- Deck builder: 6 decks, leader + 8, auto-equip/auto-build, deck power (Q6)
- Full card detail sheet — RANK/TRAIT/FOIL/artifact-set buttons **visible but locked** (Q22)
- Settings screen (audio toggles, speed, language stub)
- Collection QoL: sort, favourites filter

**Exit:** ✅ every gear slot is live with substats and gold enhancement; cards ascend to 6★ by consuming
same-grade fodder (favourites and deck members protected); five skill slots unlock one per star and upgrade
with gold + tomes; six decks of 1 hero + 8 units drive battles; settings and collection QoL shipped.
207 tests green; verified at 390×844 and 360×640.

## Phase 3 — Economy, summon & energy ✅ COMPLETE

- Summon screen: pools, tokens, pity counters, single/×10, reveal ceremony — fully earnable, **no IAP** (Q13)
- Fragments & pity conversion; currency sinks/sources balanced pass 1
- **Energy system (Q14b):** cap 30, 1/2min regen (lazy, clock-injected), costs battle 5 / elite 6 / boss 8, vignettes free, overflow from rewards, out-of-energy sheet, HUD pill wiring
- Shop v1 (soft-currency offers, daily rotation; style per `Shop.png`; gem energy refills — still no real money)
- Red-swords HUD counter stays cut (Q15)

**Exit:** ✅ four summon pools with working pity meters and a ×10 discount; duplicates pay fragments and
fragments buy a chosen card; energy gates combat stages with a clear out-of-energy sheet and refills on its
own; a daily shop trades earned currency for energy, tomes and tokens. Save migrated v1 → v2 with a fixture
test. 277 tests green; verified at 390×844 and 360×640.

## Phase 4 — The endless road ✅ COMPLETE

- Region generator v2: 3 authored biomes with node plans and palettes, elites, bosses with modifiers, endless scaling curve
- Event/choice encounters, treasure & camp nodes (Q16)
- Fork nodes: 2-way risk/reward branches that rejoin (Q2)
- Stage star chests / region completion rewards; difficulty tuning pass
- **Light elemental affinity:** stage element themes, counter-element bonus +12% (Q21)

**Exit:** ✅ three biomes (Sunken Isles, Ashfall Reach, Verdant Wound) of ten authored nodes each, every one
carrying a fork that rejoins within three stages; elites and bosses roll twists that are printed before energy
is spent and paid for in loot; twelve vignettes with priced choices and boons that ride into the next fight;
region star chests; and a road that loops the biomes at a compounding difficulty past stage 30. Save migrated
v2 → v3 with a fixture test. 333 tests green, including a balance guard that walks every combat stage on both
sides of every fork; verified at 390×844 and 360×640.

## Phase 5 — Profile & records ✅ COMPLETE

- Player profile (stats, records), achievements-lite (Q23: Profile + Settings are the only meta screens in first release)
- Locked-state facades polished for deferred systems (RANK/TRAIT/FOIL/artifact sets)

**Exit:** ✅ a More hub leading to Profile and Settings; a profile that reads the journey, the collection and
the battle record **out of the save rather than a parallel tally**; seventeen achievements over eighteen named
metrics, each with a claimable earned payout; a commander level derived from stars, so the badge on the HUD
can never disagree with what the player has done; and every deferred system — Rank, Trait, Foil, artifact
sets, Events, Season pass, local records — visible, locked, and able to explain itself. Save migrated
v3 → v4 with a fixture test. 353 tests green; verified at 390×844 and 360×640.

## Phase 6 — Polish & feel ✅ COMPLETE

- Audio pass: music per region, full SFX set, mix + settings (Q26)
- FX pass: particles, screen shake (with reduce-motion), transitions, reward ceremonies
- **Onboarding: guided first 2 stages** (tooltip beats), then free (Q25)
- Edge/empty/error states
- Performance hardening to budget (`ARCHITECTURE.md` §9)

**Exit:** ✅ the game is audible — a synthesized placeholder sound set and per-biome generative music beds
behind the same keys the owner's real audio will use, with a mix in settings; hits shake the screen and
rewards land one at a time, all of it dropping out under reduced motion; a seven-beat guided opening that
points at what it is talking about and can never block the tap it is asking for; a device that refuses to
save now says so instead of failing silently; and the long lists skip what is off screen. The map's reading
direction was fixed — it had been running downhill since Phase 1. Save migrated v4 → v5 with a fixture test.
369 tests green; verified at 390×844 and 360×640, with audio confirmed by instrumenting the Web Audio API.

## Phase 7 — Release readiness ✅ COMPLETE

- Balance pass across the full curve; content breadth to targets (Q29: ~30 units + 6 heroes, ~40 gear, 3 regions, 1 boss/region)
- Accessibility pass (Q28: reduced-motion, color-blind-safe cues, size floors)
- **Save export/import** (file/clipboard backup) (Q27)
- English-only release; strings stay centralized (Q30)
- Crash/bug reporting affordance; PWA install nicety

**Exit:** ✅ the first-release roster is authored — **30 collectible units and 6 heroes** across both rarity
ladders, 44 gear items with an exalted piece in every slot, 23 skills; manual backup exports a readable file
or copies to the clipboard, and restores through a check-then-confirm that reloads rather than swapping the
world out mid-game; every repeated vocabulary is named in one place and guarded by a test; the game installs
to a home screen; and diagnostics are reachable on purpose rather than only after a crash. The roster sweep
caught a real AI stall — support skills fired whenever they were off cooldown, so a defensive deck could
grind forever. 384 tests green; verified at 390×844 and 360×640.

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
