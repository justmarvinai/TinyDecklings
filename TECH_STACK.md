# TinyDecklings — Tech Stack & Rationale

> Status: **DECIDED** (planning phase). No code exists yet; versions are pinned when the scaffold is created.

## 1. Constraints that drive the choice

From the project brief:

- Portrait, **mobile-first**, touch-first UI
- 2D card-game presentation; heavy on **panels, lists, grids, modals, typography**
- Animation & game feel (pops, glows, transitions, battle VFX)
- Roguelike map navigation (long scrolling illustrated path)
- Scalable, **data-driven** card/effect systems
- Maintainable game state, local save/progression, testability
- **Future packaging via Capacitor** (Android/iOS) — *not in the current plan, but the stack must not block it*

The Capacitor requirement effectively mandates a **web stack** (Capacitor wraps a web app in a native WebView). The real decision is *which* web stack.

## 2. Options considered

### Option A — TypeScript + React (DOM-first) + targeted canvas FX layer ✅ CHOSEN

- ~90% of this game **is UI**: HUD, card grids, detail sheets, deck builder, shop, map medallions, modals. DOM/CSS is the strongest tool ever built for exactly that: text layout, flex/grid, scrolling with momentum, safe-area insets, accessibility, responsive units.
- Battle presentation (two 2×3 grids of cards + numbers + badges) is *also* structured UI; only projectiles/impacts/particles want a free-form layer — solvable with **one absolutely-positioned `<canvas>` overlay** driven by the animation queue.
- CSS transforms + [Motion](https://motion.dev) (Framer Motion) deliver the springy, overshooting "juice" the references show, with excellent developer ergonomics.
- First-class testing (Vitest/Playwright), TypeScript end-to-end, enormous hiring/AI-assist familiarity.

### Option B — Phaser 3 / PixiJS (canvas-first)

- Great for sprite/particle-heavy scenes; **painful for UI**: text wrapping, scroll views, modals, input fields and lists all become hand-rolled. A card-collection game would spend most of its code fighting the engine.
- Hybrid "Phaser scene + DOM overlay" splits the UI across two layout systems and two input models — a persistent complexity tax.
- **Rejected**: wrong center of gravity for a UI-dominant game. (PixiJS remains a *documented escape hatch* if battle VFX ever outgrow the canvas overlay.)

### Option C — Godot / Unity (native engine, web export)

- Superb engines, but web exports are heavyweight (large WASM payloads, slow cold start on mid-range Android WebViews) and Capacitor wrapping is at best awkward, at worst counter-productive vs. their own native exports.
- Choosing them would silently overturn the mandated Capacitor delivery path. **Rejected.**

### Option D — Svelte 5 / SolidJS (DOM-first alternatives)

- Genuinely good fits (smaller runtime, fast). React wins on ecosystem depth for this project: Motion, mature testing patterns, and the largest pool of future contributors/AI tooling familiarity. The margin is taste, not capability. **Not chosen.**

## 3. The chosen stack

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript (strict)** | Content schemas, engine determinism, refactor safety |
| Build | **Vite** | Instant dev loop, first-class TS/asset handling, static output Capacitor can wrap |
| UI | **React 18** | Component model for the design system; concurrent features unneeded but harmless |
| Animation | **Motion (framer-motion)** + CSS transitions | Springs/overshoot for game feel; layout animations for lists |
| Battle VFX | **Single `<canvas>` overlay**, custom mini particle system | Projectiles/impacts; avoids a full engine dependency (PixiJS documented as escape hatch) |
| State | **Zustand** (slice pattern) | Tiny, unopinionated, selector-based renders; stores stay serializable |
| Game rules | **Pure TS engine package** (`src/engine`) — zero React/DOM imports | Deterministic, unit-testable simulation; UI is a projection of engine events |
| RNG | Custom seeded PRNG (mulberry32) with **named streams** | Reproducible map generation & battles; replayable bugs |
| Styling | **CSS Modules + design tokens as CSS custom properties** | Hand-crafted cartoon UI (bevels, outlines, skews) needs real CSS, not utility soup; tokens defined once in `UI_STYLE_GUIDE.md` |
| Font | **Saira** via `@fontsource/saira` (self-hosted) | Brief-mandated; self-hosting keeps the app offline-capable and Capacitor-ready (no runtime Google Fonts fetch) |
| Icons | Vendored SVGs from **Open Game Icons** behind a semantic manifest | Placeholder policy: every icon swappable by key; per-artist CC-BY attribution kept in `CREDITS` |
| Audio | **Howler.js** | Battle-tested mobile WebAudio handling (unlock-on-gesture, sprites) |
| Persistence | Versioned JSON snapshots via a **storage service interface**; `localStorage` now | Sync API, ample for save sizes; interface swaps to Capacitor Preferences/Filesystem later without touching game code |
| Validation | **Zod** schemas for all content data | Content is data; validation runs in dev/build and in tests |
| Testing | **Vitest** (engine + content), **@testing-library/react** (key components), **Playwright** (later, smoke) | Engine logic is where correctness lives; test it headlessly |
| Lint/format | **ESLint + Prettier** | Standard |
| Runtime targets | Evergreen mobile browsers; Android WebView / iOS WKWebView (Capacitor later) | See performance budget in `ARCHITECTURE.md` |

**No backend. Fully offline.** All content ships with the app; saves are local; manual export/import lands in Phase 7 (Q27 decided).

## 4. How this stays Capacitor-ready (without doing Capacitor now)

- Static Vite build output — exactly what Capacitor wraps.
- No SSR, no server APIs, no absolute URLs; all assets bundled/relative.
- Platform concerns (storage, haptics, share, safe areas) live behind `src/services/platform` interfaces with web implementations; native swaps later are additive.
- Self-hosted fonts/icons/audio → zero network dependency at runtime.
- Viewport/safe-area handling via CSS `env(safe-area-inset-*)` from day one.

## 5. Notable non-goals / deferred tech

- **PixiJS/WebGL renderer** — only if canvas-overlay VFX provably hits perf limits.
- **i18n framework** — English-only first release (Q30 decided), but *all user-facing strings centralized* so i18n is a bolt-on later.
- **Service worker / PWA install** — nice-to-have after the slice; trivially compatible.
- **React Router** — screens are a game state machine, not URLs; a tiny screen-stack store replaces routing (see `ARCHITECTURE.md`).
