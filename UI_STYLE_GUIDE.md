# TinyDecklings — UI Style Guide

> Status: **Binding; tokens implemented in `src/ui/design/tokens.css` (Phase 0).** Derived from `assets/examples/*` — the visual source of truth. Hex values are sampled
> approximations to be refined against the references during implementation; the _relationships_ are binding.
> Do **not** replace this language with generic "modern mobile UI".

## 1. Reference inventory

Two groups, one language:

**A. Portrait references — core game screens (primary truth for layout _and_ style):**

| File                   | Shows                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Map.png`              | Endless stage path, node medallions, star ratings, top HUD, purple title banner                                 |
| `Battle.png`           | 2×3-per-side battlefield, HP plates, type badges, BOSS frame, TURN banner, AUTO/X1/flag controls, deck counters |
| `Card_Unit_Detail.png` | Card sheet: level/XP, stars, Strength/Power, gear grid (fixed slot icons!), skills, action bar (LEVEL UP…EQUIP) |
| `Decks.png`            | Deck builder: leader + 8, deck power, page dots, UNITS/HEROES tabs, collection grid                             |
| `Card_Summon.png`      | Summon: token tabs, pity meters, reveal frame, SUMMON/×10 CTAs                                                  |

**B. Landscape references — design-language donors (Brawl Stars screens; translate patterns to portrait, never copy layouts 1:1):**

| File                      | Steal this                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Shop.png`                | Offer cards, timer chips, NEW/discount ribbons, strikethrough pricing, "Claimed" state, bottom category tabs |
| `Buy_Submenu.png`         | Purchase modal anatomy: purple sheet, info button, red X, two offer panels, yellow price buttons             |
| `Battlepass.png`          | Track UI: premium/free lanes, tier nodes on a progress spine, locked states, season timer                    |
| `Events.png`              | Event cards: colored header band + illustration, countdown chip, locked/gray state with unlock text          |
| `Leaderboard.png`         | Skewed list rows, rank + avatar + name + value, highlighted "you" row, segmented tabs                        |
| `Player_Profile_Page.png` | Stat pills with icon + label-above, editable name plate, level badge + XP bar                                |
| `Settings.png`            | ON/OFF segmented toggles (green/red), chunky blue buttons, label-above-control pattern                       |
| `UI_Stats.png`            | Segmented stat bars: icon chip + colored label + blocky segments                                             |

## 2. Mood

Saturated, chunky, toy-like, confident. Everything looks **pressable**: thick outlines, bevel highlights, hard drop shadows, springy motion. Density is high but organized by strong grouping and heavy type.

**The reference is not a dark game, and neither is this one.** Every screen stands on its own bright, saturated ground — cyan ocean for the map, rust for the collection, magenta for summoning, blue for the shop and the profile. The only dark surfaces are the HUD strip, the tab bar, and the small inset pills and tiles that sit ON that ground for contrast. The battle arena is the single deliberate exception: a deep crimson, lit from the floor, because the cards have to be the brightest thing in it.

Build a screen by choosing a **ground triple** and composing `.u-ground`; never by tinting everything one shade of dark. Where a tile needs to sit _into_ the ground rather than on it, use `--surface-inset` (translucent black), which comes out navy on blue and deep rust on the collection — the way the reference's stat tiles are always a darker shade of their own screen.

## 3. Color tokens

### 3.1 Grounds — one per screen

Sampled from the reference screenshots. A screen sets the three and composes `.u-ground` (a class, not a token: a custom property containing `var()` resolves those where it is _declared_, so a wash token would freeze in the default).

| Ground  | lit / mid / deep              | Screens                         | Sampled from             |
| ------- | ----------------------------- | ------------------------------- | ------------------------ |
| Ember   | `#D4552C` `#B8402C` `#892D26` | Collection, decks, kitchen sink | `Decks.png`              |
| Isles   | `#4DFBFF` `#00C2EE` `#0079C6` | Map — Sunken Isles              | `Map.png` ocean          |
| Ashfall | `#FF8A24` `#D43F10` `#7A1A0B` | Map — Ashfall                   | `Map.png` volcanoes      |
| Verdant | `#6EE13F` `#14A04A` `#086134` | Map — Verdant                   | `Map.png` islands        |
| Arcane  | `#A4147A` `#6F0A58` `#3D0338` | Summon                          | `Card_Summon.png`        |
| Azure   | `#2B8BFF` `#0B63DD` `#0345AD` | Shop, profile, more, settings   | `Shop.png`, profile page |
| Crimson | `#A3040F` `#6B0210` `#35000B` | Battle arena                    | `Battle.png`             |

### 3.1b Chrome & surfaces

| Token              | Approx             | Use                                                  |
| ------------------ | ------------------ | ---------------------------------------------------- |
| `--bg-hud`         | `#101014`          | Top HUD bar, tab bar, battle counters                |
| `--surface-panel`  | `#303030`          | Panels, sheets — neutral grey, deliberately untinted |
| `--surface-pill`   | `#0D0D10`          | Stat/name pills, counters, map labels                |
| `--surface-slot`   | `#5D5D5D`          | Empty slots, disabled tiles                          |
| `--surface-inset`  | `rgb(0 0 0 / 0.3)` | A tile pressed _into_ the ground (stat grids)        |
| `--outline-dark`   | `#0A0A0C`          | Universal 2–3px component outline                    |
| `--medallion-ring` | `#DCD8FF`          | The periwinkle ring on every stage medallion         |
| `--text-primary`   | `#FFFFFF`          | Primary text (always outlined/shadowed on busy art)  |
| `--text-secondary` | `#D8D8D8`          | Secondary/labels                                     |

A tinted panel reads as a smudge on a coloured ground; the reference's flat grey reads as a card laid on top of it. Keep panels neutral.

### 3.2 Brand & feedback

Sampled off the reference's own buttons. These are meant to be loud — a muted green here is the difference between the reference and a generic dark mobile app.

| Token               | Approx                            | Use                                                        |
| ------------------- | --------------------------------- | ---------------------------------------------------------- |
| `--accent-header`   | `#8A2DEE` / gradient to `#A72CFF` | The purple title band, back button, modal headers          |
| `--accent-positive` | `#00DB00`                         | Primary CTAs (LEVEL UP, SUMMON), ON state, healed numbers  |
| `--accent-info`     | `#0083FF`                         | Secondary CTAs (AUTO EQUIP), skills, links                 |
| `--accent-warning`  | `#FFC700`                         | EQUIP, highlights, active tab                              |
| `--accent-danger`   | `#F5231A`                         | Close X, OFF state, damage numbers, alerts                 |
| `--accent-xp`       | `#6BFF1F`                         | XP/progress fills                                          |
| `--star-gold`       | `#F5EC00`                         | Earned stars — a lemon yellow, brighter than currency gold |
| `--star-blank`      | `#3F3F4A`                         | Unearned stars, with their own dark outline                |
| `--badge-notify`    | `#FF2216`                         | Notification dots (with white count)                       |

**Every screen wears the purple band** under the HUD carrying an outlined all-caps title (`TitleBanner`), edge to edge. The map spends it on the region name instead of the word "MAP" — it has somewhere to be.

### 3.3 Card rarity (frames) — **cards only**

| Rarity    | Token                     | Approx                                           |
| --------- | ------------------------- | ------------------------------------------------ |
| Common    | `--rarity-card-common`    | `#B3BCC6` gray                                   |
| Uncommon  | `--rarity-card-uncommon`  | `#3FD21F` green                                  |
| Rare      | `--rarity-card-rare`      | `#21A7FF` blue                                   |
| Epic      | `--rarity-card-epic`      | `#F215EA` magenta                                |
| Legendary | `--rarity-card-legendary` | `#FFAB00` gold + glow, orange "LEGENDARY" banner |

### 3.4 Gear rarity (tile backgrounds) — **gear only, never reuse card tokens**

| Gear rarity | Token                   | Approx    |
| ----------- | ----------------------- | --------- |
| Worn        | `--rarity-gear-worn`    | `#9D9DA6` |
| Sturdy      | `--rarity-gear-sturdy`  | `#37C23F` |
| Refined     | `--rarity-gear-refined` | `#2B8BF5` |
| Ornate      | `--rarity-gear-ornate`  | `#E043D0` |
| Exalted     | `--rarity-gear-exalted` | `#FF9412` |
| Mythic      | `--rarity-gear-mythic`  | `#F5231A` |

Two systems must be tellable apart at a glance: **cards carry rarity on the frame**, **gear carries rarity as tile background** behind the fixed slot icon.

## 4. Typography

- **Family:** Saira (self-hosted). Display/headers: **Saira Bold/Black Italic**; UI labels: SemiBold; body: Medium.
- **ALL CAPS by default** (titles, buttons, labels, card names). Normal case where caps hurt readability: lore text, event prose, multi-sentence descriptions, settings explanations.
- **Outlined type:** headline text on busy art gets a dark outline (2px `--outline-dark`) + hard 2–3px drop shadow (reference: white outlined "SETTINGS", node labels). Implement via `-webkit-text-stroke` + `text-shadow`, or paint-order stroked SVG for hero titles.
- Numbers are heroes: HP/damage/prices use Black weight, tightly tracked, often colored (damage red, heal green, gold yellow).
- Scale (px @ 390pt viewport, fluid via `clamp`): Display 28 · Title 22 · Section 18 · Body 15 · Label 13 · Micro 11. Minimum legible: 11px.

## 5. Shape & depth language

- **Corner radii:** buttons/pills 10–14px; cards 12–16px; panels/sheets 16–20px; circular for node medallions/avatars.
- **Outline:** nearly every component has a 2–3px near-black outline (`--outline-dark`) — this is the single strongest signature of the style.
- **Bevel:** top-edge inner highlight (lighter band, ~15% white) + bottom-edge inner shade (~25% black) → "candy" relief. Implement with layered `inset` box-shadows, no images.
- **Drop shadow:** hard, short offset (0 3–4px, near-black, no blur or slight blur) under interactive elements; pressed state removes offset and nudges translateY(2px).
- **Skew:** section tabs, ribbons, list rows in meta screens skew ≈ **−6° to −8°** (Brawl refs). Portrait core screens use straight rects — apply skew only to tabs/ribbons/banner accents.
- **Ribbons/badges:** notched ribbons for NEW/BOSS/-10%; hexagon chips for +N deltas; black pills for names/counters.

## 6. Core components (build in `ui/design`)

| Component                      | Spec highlights                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TopHud**                     | Full-width dark bar, safe-area padded; left avatar (rounded square, level badge overlaps corner, red dot for news); center: resource pills; right: green `+`. Pills: dark rounded rect, icon left overlapping edge, white Black-weight value.                                                                                                                                                                                    |
| **TitleBanner**                | Full-width purple gradient band under HUD; centered white outlined caps title; optional left ribbon-tab (e.g. UNIT) and right red round X.                                                                                                                                                                                                                                                                                       |
| **Button**                     | Variants: `positive` (green), `info` (blue), `warning` (yellow, dark text), `danger` (red), `neutral` (gray = disabled/locked with padlock). Bevel + outline + shadow per §5; icon-above-label allowed (action bar); pressed = translateY + shadow collapse; disabled = desaturated gray, no bevel. Min height 48px.                                                                                                             |
| **Pill**                       | Black rounded pill for names/values (map node names, deck power).                                                                                                                                                                                                                                                                                                                                                                |
| **Tab / SegmentedControl**     | Skewed rect tabs; active = filled (yellow/orange) with dark text, inactive = dark with light text; optional red notification dot; counts as second line (UNITS 42/70).                                                                                                                                                                                                                                                           |
| **Toggle**                     | ON/OFF twin buttons; active side colored (green ON; red when OFF is the "negative" state), inactive side dark.                                                                                                                                                                                                                                                                                                                   |
| **CardFrame**                  | Rarity-colored frame + inner art window; overlays: HP plate (bottom-left, Black weight), attack-type round badge (bottom-right), cooldown badge (top-left square), buff/status icons (top-right), star row (below or on frame), level label, BOSS golden variant with banner; active-turn = pulsing yellow glow outline; empty battle slot = dark silhouette tile. Sizes: battle M ≈ 30vw, collection S ≈ 21vw, detail L ≈ 42vw. |
| **StarRow**                    | Gold stars (unearned = dark gray); card-detail ascension variant uses magenta stars with the next star slot dark; map nodes: tiny 3-star row under name pill.                                                                                                                                                                                                                                                                    |
| **StatBar**                    | Segmented blocky bar (UI_Stats): icon chip (rounded square, colored) + colored caps label + segments; XP variant: continuous green fill in dark trough with outline.                                                                                                                                                                                                                                                             |
| **GearTile**                   | Rounded square; background = **gear-rarity color**; centered **slot icon (fixed per slot type — THE boots icon, THE helmet icon…)**; star row top; empty state: `--surface-slot` bg, gray slot-icon silhouette, blue `+` corner badge; locked state: padlock + unlock hint (e.g. `6★`).                                                                                                                                          |
| **NodeMedallion**              | Circular portrait, thick ring (state-colored: next = purple/highlight, done = dimmed), element badge (small round chip, bottom-left), name pill + star row below; dotted path segments connect nodes.                                                                                                                                                                                                                            |
| **Modal/Sheet**                | Dimmed backdrop; panel with purple header (title + red X); content on `--surface-panel`; slides/springs up from bottom.                                                                                                                                                                                                                                                                                                          |
| **ProgressTrack** (pass/tiers) | Horizontal spine with numbered round nodes; reached = yellow fill; reward tiles above/below; locked = padlock overlay.                                                                                                                                                                                                                                                                                                           |
| **ListRow**                    | (Leaderboard-style) skewed row, rank block, avatar, name + subtitle, right-aligned value; "you" variant = orange fill.                                                                                                                                                                                                                                                                                                           |
| **Timer/InfoChip**             | Small dark chip "3d 23h" top-corner; round blue `i` button.                                                                                                                                                                                                                                                                                                                                                                      |
| **NotificationDot**            | Red circle, white count, top-right overlap on any control.                                                                                                                                                                                                                                                                                                                                                                       |

## 7. Screen blueprints (portrait 9:16–9:21)

- **Global:** design canvas 390×844; support 360×640 up to tall 21:9; fluid units (`vw`/`clamp`) + safe-area insets; **one-handed reach:** primary actions in the bottom 40%; back button = purple rounded square, bottom-left.
- **Map:** vertically scrolling world; path winds bottom→top (progress = upward); HUD + banner pinned; current node centered on load; parallax background layers per region theme.
- **Battle:** enemy grid top ~40%, TURN divider band, player grid below; deck counters top-left/bottom-left; controls (X1 · AUTO · flag) top-right row of round buttons; floating damage/heal numbers; skill-ready cards sparkle; target candidates get outline pulse on manual targeting.
- **Cards/Decks:** deck strip on top (leader large left, 8 small in 2×4), page dots, tabs below, then scrollable collection grid (3-wide); cards in deck get "DECK n" corner ribbon.
- **Card detail:** two-column top block (portrait left; level/stars/stats right), gear grid left + skills right below, full-width action bar bottom (LEVEL UP · RANK · EVOLVE · TRAIT · FOIL · EQUIP as icon-above-label buttons).
- **Summon:** token tabs row → pity meters → centered reveal stage → CTA pair (single green / ×10 blue with discount ribbon).

## 8. Iconography

- Source (placeholder phase): **Open Game Icons** (game-icons.net fork); vendored SVGs, recolorable (white glyph + colored chip bg), semantic manifest keys only (`icon('currency.gold')`).
- **Gear slot icons are canonical and constant** (owner directive): one icon per slot type used everywhere (inventory, equipment grid, drops, tooltips). Items differ by name/rarity-color/stars only. The manifest exposes `gearSlotIcon(slot)` — there is no per-item icon path.
- All icons sit in **chips** (rounded square or circle with outline + bevel) rather than floating bare.
- Attribution: keep per-artist CC-BY credits in `CREDITS.md` when vendoring.
- Owner will later replace icons and per-card art; manifest keys stay stable (see `ARCHITECTURE.md` §6).

## 9. Motion & game feel

- **Timings:** micro (press, dot) 100–130ms; standard (reveal, tab) 180–250ms; screen transitions 280–350ms; reward ceremonies 600–900ms.
- **Springs with overshoot** for anything that "arrives" (cards, modals, stars); scale-pop 0.9→1.05→1 on spawn/claim.
- **Battle reads:** attacker lunges toward target (translate + squash), impact flash + particle burst (canvas layer), floating damage number arcs up and fades, death = desaturate + shatter/fall, deploy = drop-in with dust.
- **Ambient life:** active-turn glow pulse, ready-skill shimmer, legendary frame slow sheen, map current-node bob.
- **Numbers count up** (gold totals, power) — never snap.
- Speed toggle (X1/X2) scales battle sequencer timings only, not menu motion.
- Respect `prefers-reduced-motion`: swap springs/particles for fades (accessibility floor decided — Q28).

## 10. Do / Don't

- ✅ Thick outlines, bevels, hard shadows, outlined caps type, saturated fills.
- ✅ Rarity color = the loudest identity on any card/gear tile.
- ✅ Every interactive element ≥ 48×48px touch target, pressed feedback always.
- ❌ No flat "material/clean SaaS" panels, no thin hairline dividers, no pastel gradients.
- ❌ No hover-dependent affordances; no desktop dense grids (max 3 collection columns on phones).
- ❌ Never skew body copy; skew is for tabs/ribbons/banners.
- ❌ Never express gear identity via a unique icon (slot icon is fixed); never reuse card rarity colors for gear tiers.
