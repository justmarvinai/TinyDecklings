# CLAUDE.md — TinyDecklings engineering guide

Guidance for AI assistants and human contributors working in this repository.

## Current project status: Phase 6 complete — polish & feel

`USER_QUESTIONS.md` Q1–Q30 were **answered on 2026-08-26** (all recommendations accepted; Q14 → option (b),
the energy pacing system). **Phases 0–4 are done**: the core loop runs end to end, cards ascend and equip
across all eight gear slots, decks are built by hand, the economy is live — summoning with pity meters, a
fragment exchange, the energy pacing system and a daily shop, all paid for in currency the player earns — and
the road runs through three authored biomes with elites, boss modifiers, vignettes, forks and region star
chests before looping endlessly, the player has a record — a profile derived from the save, achievements with
claimable payouts, honest locked facades for everything deferred — and the polish pass has landed: audio,
juice, a guided opening, edge states and performance. The app deploys to Vercel for live review
(`DEPLOYMENT.md`). Next up is **Phase 7 — release readiness** in `IMPLEMENTATION_PLAN.md`. New owner-preference ambiguities go into
`USER_QUESTIONS.md` → "Open questions" instead of being silently decided.

**This is a single-player game.** There is no multiplayer, no PvP, no server and no accounts — anywhere.
Reference screenshots contain multiplayer furniture (defense decks, leaderboards); those are deliberately
cut, and nothing multiplayer-shaped should be added without an owner decision.

## What this project is

A **portrait-only, mobile-first, single-player collectible card roguelike** ("Hearthstone-feel collection ×
Black Deck-style endless journey"): collect card-creatures, level them, equip **Gear**, fight across an
endless stage map. Full vision: `GAME_DESIGN.md`.

## Document map (keep these in sync — they are the contract)

| Doc                                     | Purpose                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GAME_DESIGN.md`                        | Vision, systems, rules, terminology; items tagged DECIDED / PROPOSED / OPEN                               |
| `TECH_STACK.md`                         | Stack choice + rationale (React DOM-first + canvas FX, Zustand, Zod, Vite, TS strict)                     |
| `ARCHITECTURE.md`                       | Layering (`content → engine → state → ui`, `services`), battle event pipeline, RNG, saves, asset manifest |
| `CONTENT_SCHEMA.md`                     | Data shapes for cards/gear/skills/effects/map/economy/saves                                               |
| `UI_STYLE_GUIDE.md`                     | Visual language extracted from `assets/examples/` — binding for all UI work                               |
| `ROADMAP.md` / `IMPLEMENTATION_PLAN.md` | Phases; concrete tasks + acceptance criteria                                                              |
| `USER_QUESTIONS.md`                     | Owner decision log (Q1–Q30 answered 2026-08-26) + intake for future questions — **the development gate**  |
| `CHANGELOG.md`                          | Keep-a-Changelog history; update with every meaningful change                                             |
| `DEPLOYMENT.md`                         | Vercel setup, preview URLs, what is deliberately not deployed                                             |
| `CREDITS.md`                            | Placeholder art/font attribution (CC BY 3.0 icons, SIL font)                                              |

## Commands

```bash
npm install            # once
npm run dev            # Vite dev server on :5173 (host exposed for device testing)
npm run build          # typecheck + production build to dist/
npm run preview        # serve the production build
npm run test           # Vitest (run once)
npm run test:watch     # Vitest watch mode
npm run lint           # ESLint (includes the engine-purity rules)
npm run typecheck      # tsc --noEmit
npm run format         # Prettier write
npm run verify         # typecheck + lint + test — run before calling anything done
npm run vendor:icons   # re-extract placeholder icons and regenerate the icon module
```

## Non-negotiable rules (owner directives + brief)

1. **Portrait & mobile-first, touch-first.** No hover-dependent UX, no desktop-dense grids, touch targets ≥ 48px.
2. **The reference screenshots are the style.** Never introduce generic "modern mobile UI"; follow `UI_STYLE_GUIDE.md`.
3. **Data-driven content.** Cards/gear/enemies/encounters are data entries validated by Zod. Never hard-code a card as bespoke UI/engine logic; new behavior = new reusable effect primitive.
4. **Cards and Gear have separate rarity systems.** Distinct enums, names, and color tokens (`CardRarity` ≠ `GearRarity`). Never mix or visually reuse one for the other.
5. **Gear icons are fixed per slot type.** Every Boots item shows THE boots icon, every Helmet THE helmet icon — everywhere (inventory, equipment grid, drops). `GearDef` has **no** icon field; icons resolve via `gearSlotIcon(slot)` only. Items differ by name, stats, rarity color, stars.
6. **All art and audio is swappable placeholder for now.** One shared avatar for every card; icons from Open Game Icons (keep CC-BY attribution in `CREDITS.md`). The owner will supply final per-card art and icons later — everything resolves through the semantic asset manifest (`iconManifest.ts` / `artKey`), so a swap is an asset drop, never a code or schema change. Sound works the
   same way: `services/audio/soundManifest.ts` names meanings, and today they resolve to synthesized voices
   rather than files — dropping in real audio is a manifest change with no call site touched.
7. **Engine purity.** `src/engine` and `src/content` never import React/DOM; no `Math.random`/`Date.now` inside the engine — inject seeded RNG (named streams) and time.
8. **Saves are sacred.** Any save-shape change ⇒ version bump + migration + fixture test in the same commit.
9. **Typography:** Saira, ALL CAPS for UI labels/titles; normal case where caps hurt readability (lore, prose).
10. **Capacitor later, never now.** Keep platform concerns behind `services/` interfaces; no Capacitor work until the owner schedules it.
11. **Single-player only.** No multiplayer, PvP, accounts, servers or online leaderboards. Saves are local.
12. **No real money, anywhere.** Every price is in a currency the player earns (Q13). Never add an IAP,
    a purchase bundle, or urgency framing designed to push a wallet.

## Conventions

- TypeScript strict; no `any` in `engine`/`content`.
- Ids: `domain.snake_case` (`card.ember_drake`, `gear.springstep_boots`, `skill.cinder_volley`).
- Components: PascalCase in `ui/`; stores `xxxStore.ts`; one Zustand store per domain slice.
- Styling: CSS Modules + tokens from `ui/design/tokens.css`; no inline hex values — tokens only.
- Tests colocated `*.test.ts`; engine changes ship with tests (goldens for battle/map determinism).
- **Never pass a store method that builds a fresh object/array to a Zustand selector** (e.g. `statsFor`,
  `ascensionFodder`) — it re-renders forever. Subscribe to `save` and use the pure helpers
  (`computeCardStats`, `ascensionFodderFor`) inside `useMemo`.
- Commits: imperative subject, scope prefix when useful (`engine: add burn tick`), update `CHANGELOG.md` for user-visible changes. Do not mention AI models in commit messages or code.
- User-facing strings live centralized in `ui/text/labels.ts` (future i18n), never scattered literals. The
  **engine never builds prose**: it returns structured facts (e.g. why a choice is blocked) and the UI writes
  the sentence.
- New content shapes ship with the registry rule that catches the obvious way to author them wrong — an
  unreachable chest threshold, a node kind with no content, a status that would lock a side out of a fight,
  an achievement asking for more cards than exist. A gap the pipeline can catch should fail validation, not
  reach a player.
- **Derive, don't tally.** A number the save already implies (stars, clears, the collection, summon counts)
  is computed on read, never kept in a second place that can drift. Store only what leaves no other trace —
  see `player.stats` and the comment above it.

## Workflow expectations

- Work happens on the designated feature branch; push with `git push -u origin <branch>`.
- Before "done": typecheck + lint + tests green; UI verified at 390×844 and a small viewport (360×640).
- When a decision contradicts a doc: fix the doc in the same change and note it in `CHANGELOG.md`.
- Unresolved design ambiguity → add to `USER_QUESTIONS.md` rather than silently inventing owner-preference decisions.
