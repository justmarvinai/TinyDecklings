# Changelog

All notable changes to TinyDecklings are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project has no version numbers yet
(pre-release).

## [Unreleased]

### Added

- 2026-08-27 — **The summon screen says what is in the pool.** Its centre was an
  empty field with one sentence in it, on the one screen where the player is
  deciding whether to spend. It now shows each rarity's share with a bar, the
  percentage, and how many different cards carry it. `poolOdds` derives this from
  the weights the pool is authored with rather than from a second published table,
  so a stated chance cannot drift from the one the game rolls — the same honesty the
  pity meters above it already promise, for the other half of the question.

- 2026-08-27 — **The battle animates like a fight now.**
  - **Strikes travel.** An attacker used to nudge in place; it now crosses the real
    distance to its target — the strike animation is handed `--dx`/`--dy` measured
    between the two cards — and a ranged attacker fires a trailed projectile along
    that same line instead. Contact is a hit-stop: the white impact flash holds for
    ~90ms with everything else frozen, which is the thing that makes a hit feel like
    it landed rather than like it was drawn.
  - **Impacts have weight.** A shockwave ring, a directional spray of sparks thrown
    along the blow, knockback and spin on the struck card, screen shake scaled to
    the damage (six keyframes with rotation, not three), and a damage number that
    overshoots and settles. Deaths spin and fall; deployments drop in.
  - **×1 is a pace, not a rush, and ×2 is 1.7× rather than double.** Beats roughly
    half again as long as before (strike 520ms, cast 600ms, death 520ms). Past 1.7×
    the animation stops being watchable and the toggle quietly becomes a skip
    button, which is not what it is for.
  - **`compactNumber`** in `ui/text/labels.ts`: strength and attack capped at five
    characters (`9999`, `12.3K`, `1.4M`). The road never ends, so no fixed layout
    survives an unbounded digit count.

- 2026-08-27 — **Gear and status tooltips, and a retry on defeat.**
  - **Gear says what it gives.** A gear tile is one of nine identical slot icons
    told apart by a rarity colour; the numbers that decide whether to equip it were
    two taps away on a sheet the player has to leave the card to reach. Holding one
    — in the equipment grid or in the picker — gives the main stat at its current
    enhancement, every substat, and who is already wearing it.
  - **Statuses say what they are doing.** `statusDef` gained an authored
    `description`, so a status is self-describing data like a skill or a modifier
    rather than something the UI infers from `tick` and `blocksAction`. A card's tip
    now names each status with rounds left, stacks, and what it does. Deliberately
    _not_ behind the 14px status icons: three of them are well under the touch floor
    (rule 1), and the press was caught by the card underneath anyway.
  - **Try again, from the defeat sheet.** Losing sent the player back to the map to
    scroll for the stage they were just on and open it again — three taps to do what
    they had already decided. It charges energy exactly as entering from the map
    does, and greys out when that cannot be paid, because a retry is a convenience
    and not a discount: a free rematch would quietly undo the pacing the energy
    system exists to set (Q14b).

### Changed

- 2026-08-27 — **The battle effects layer costs about half what it did.** A CPU
  profile of a real fight on the production build (4–6× throttle, roughly a
  mid-range phone) put the canvas loop at the top of everything the app itself ran:
  it asked for the drawing context on every frame and read the canvas's position
  from the DOM on every emit — four times a beat, each one forcing a synchronous
  layout of a screen that is mid-animation. Both answers only change when the canvas
  resizes or the page scrolls, so they are computed then instead. Measured across
  three runs: 627ms → ~350ms of CPU over six seconds of fighting, with the effects
  landing in the same places.

### Fixed

- 2026-08-27 — **Escape closed every open sheet at once.** Each modal listened for
  it on the window, so backing out of the gear picker took the card sheet under it
  too. The modal stack tracks identity rather than a bare depth count, and only the
  frontmost sheet answers a dismiss.

- 2026-08-27 — **Every modal was laid out inside the screen that opened it.** The
  screen-transition keyframes ended on `transform: translate3d(0, 0, 0)` and filled
  forwards, so an identity transform stayed on the element — and any transform makes
  its element the containing block for `position: fixed` descendants. A sheet sized
  against the viewport (`88svh`) was therefore taller than the box it was trapped in
  and overflowed upward under the HUD, slicing its own title bar off. The final
  keyframe no longer declares a transform, and modals portal to the body, so a
  future transformed ancestor cannot do it again.

- 2026-08-27 — **A currency you could not read.** Three pills, an avatar and the shop
  shortcut did not fit a 360px phone, and the row silently scrolled — with no
  affordance, so gems just looked cut off mid-number. Values run through
  `compactNumber` (`10K`, not `10000`), the pill chrome is trimmed, and the row now
  fits with room for a seven-figure gold total.

- 2026-08-27 — **Touch targets below the floor (rule 1).** The eight gear slots on a
  card were 36px buttons floating inside 76px columns — the tile was sizing to its
  icon rather than filling its cell — and the HUD's avatar and `+` were 44 and 40.
  All of them are ≥48px now, and the gear grid reads like the reference's chunky
  slots. Audited across every screen at 390×844 and 360×640: nothing player-facing
  is under the floor.

- 2026-08-27 — Settings toggles left dead rail: the two halves were content-sized
  inside a full-width track, so ON sat in a corner of a mostly empty control. They
  split it evenly now, and battle speed is the same twin control (×1/×2) rather than
  a button that cycled — in the info accent, because neither speed is the "off" one
  and red on a plain choice reads as a warning about a setting that carries none.

- 2026-08-27 — **The enemy's front row was drawn behind its back row.** Slots 0–2 are
  the melee rank on both sides, and both boards were laid out top-left to
  bottom-right — which put the player's front line nearest the divider and the
  enemy's furthest from it, so the two melee ranks were not facing each other. The
  enemy's rows render in reverse order now; the fight reads the way it resolves.

- 2026-08-27 — **The damage number sat on top of the strength.** They were pinned to
  opposite bottom corners, which collides as soon as either number grows. They share
  a flex row now, so they cannot overlap at any value, and when the row genuinely
  runs out of room it is the attack pill that yields — first its slot icon (which the
  card's row on the board and its hold-tip both already say), then, far past any
  reachable number, the pill itself. Strength never shrinks. Measured across both
  cards' widths: 108px on a 390×844 phone and 71px on a 360×640 one, where the icon
  drops out on its own.

- 2026-08-27 — **The in-game reduced-motion switch only calmed the screen shake.**
  It is a setting, so no media query could see it, and every CSS keyframe and the
  whole canvas FX layer were listening for `prefers-reduced-motion` alone — which
  mattered much more once the battle animation got this much louder. The merged
  preference is stamped on the document root as `data-motion`, so one selector
  covers the app, and the canvas stops throwing particles, rings and projectiles.
  The damage number still rises and a ranged attack still waits out its flight, so
  the round keeps its shape and its information (Q28).

- 2026-08-27 — A card's tooltip could run off the bottom of the screen when it
  carried statuses and a full skill ladder. The bubble has a height ceiling now, and
  a battle card's tip lists skills as ready/cooldown chips — their descriptions are
  already one hold away on the skill buttons themselves.

- 2026-08-27 — **The installed app opens without a network.** TinyDecklings is
  single-player, offline and local-save, and installs to a home screen — but until
  now that icon needed a network to open, because "the save is local" and "the app
  is delivered" are different problems and only the first was solved. `dist/sw.js`
  is generated at build time from the real bundle (`scripts/sw-plugin.mjs`) and
  precaches the shell; fonts, art and lazy screens fill in as they are first
  fetched. The build **fails** if an entry chunk is missing from the precache list,
  because a stale hand-written list breaks only for the player on a train. No
  `skipWaiting`: a new build waits rather than swapping code out mid-battle, and
  the app raises an "Update ready" notice instead.
- 2026-08-27 — **The stage sheet says whether you can win, before the energy is
  spent.** It named the enemies and counted them and stopped there, so the only way
  to learn a fight was out of reach was to pay for it and lose — the worst thing a
  map can do with a pacing currency. `stageReading()` scores the enemy side the way
  the collection scores yours and returns a band; the sheet writes it as
  **Comfortable / A fair fight / A stretch / Outmatched** with both numbers beside
  it, so a player who disagrees with the word can read the evidence. Non-combat
  stages say nothing — a difficulty line on a campfire teaches people to stop
  reading the one place it matters. The band edges are pinned by tests against the
  authored road, not chosen by feel.

### Changed

- 2026-08-27 — Dropped the Saira 400 weight: nothing in the game is set in it, and
  an unused weight is thirty font files nobody downloads and everybody deploys.

- 2026-08-27 — **The numbers that decide a fight are now on screen, and holding
  anything explains it.**
  - **Damage on every card.** Strength was on the face; attack was not, so the one
    number that decides whether a swing kills was only reachable by leaving the
    battle. Every card — battlefield and collection — now carries strength
    bottom-left and an attack pill bottom-right: the attack-type icon saying where
    the card stands, the damage saying how hard it hits. On the battlefield it is
    the _effective_ attack, buffs and debuffs included, not the printed one.
  - **Press and hold to be told more** (`useHoldTip`). A styled bubble after ~320ms:
    a card gives full stats and its skill list, a skill button gives what the spell
    actually does, and stage modifiers and element affinities give the sentence that
    was already authored for them and until now sat in a `title` attribute no phone
    can open. A hold never also fires the tap underneath — inspecting an enemy must
    not swing at it — and releasing closes it, so reading costs exactly as long as
    you hold and nothing has to be dismissed.
  - **The collection tile says what a card is.** Strength, damage and front-row /
    ranged, without opening the sheet; holding a tile adds its skills.
  - New `attackTypeLabel()`: "Front row" and "Ranged" rather than the engine's
    melee/ranged, named in `ui/text/labels.ts` with the rest of the vocabulary.

### Fixed

- 2026-08-27 — **Holding anything on a phone started selecting text.** The game is
  played with long presses, and the platform answered them with the magnifier and a
  Copy callout over the board. Selection is off (`user-select`, `-webkit-touch-callout`)
  everywhere except inputs and `.u-selectable`, which keeps the save code copyable —
  the one flow that has no other route.

- 2026-08-27 — **A wallpaper for the map screen.** Drop an image into
  `src/ui/art/map/` and it becomes the map's backdrop — no import, no map entry, no
  code, the same rule as card portraits and icons. One file named `default` covers
  the whole road; a file named after a region's `themeToken` (`theme-isles.jpg`)
  gives that biome its own. It resolves region → `default` → the painted gradient, so
  a single image is enough and none at all still looks finished.
  - The image replaces the biome's gradient rather than layering over it (the glows
    are a stand-in for art, and are in the way once there is art), and is anchored to
    the screen rather than the scroller, so the road travels across a still backdrop.
  - A slight scrim at the top and bottom edges only: the name pills and medallions
    carry their own contrast, but the dotted path between them is translucent and
    would vanish into a busy photograph. The middle of the image is left alone.
  - A file named after no region fails `npm run test` and names the file, rather than
    sitting in the folder doing nothing. The dev panel's **Art coverage** button
    lists which regions are still on the gradient.
  - `src/ui/art/map/README.md` documents naming, formats, sizing and weight.

### Changed

- 2026-08-27 — **The palette, rebuilt from the reference screenshots.** The game was a
  dark maroon app wearing the reference's shapes; the reference is not a dark game.
  Colours are now _sampled_ out of `assets/examples/` rather than approximated:
  - **Every screen stands on its own bright, saturated ground** — cyan ocean for the
    map (`Map.png`), rust for the collection (`Decks.png`), magenta for summoning
    (`Card_Summon.png`), blue for the shop, profile, more and settings (`Shop.png`,
    `Player_Profile_Page.png`). The battle arena is the single deliberate exception: a
    lava-lit crimson, because the cards must be the brightest thing in it. A screen
    picks a **ground triple** and composes `.u-ground`.
  - **The purple title band is on every screen now** (`#8A2DEE`), edge to edge, as in
    every reference shot. The map spends it on the region name rather than the word
    "MAP" — it has somewhere to be. Shop, settings, profile and more were restructured
    so the band stays put while the content scrolls under it.
  - **Accents are sampled off the reference's own buttons** and are much louder: green
    `#00DB00`, blue `#0083FF`, yellow `#FFC700`, magenta `#F215EA`, red `#F5231A`.
    Stars are the reference's lemon `#F5EC00`, with unearned ones outlined so they read
    on any ground. Stage medallions wear the reference's periwinkle ring `#DCD8FF`, and
    a locked stage now dims only its portrait — dimming whole medallions had put a grey
    wash over most of the road.
  - **Panels are neutral grey** (`#303030`), untinted: on a coloured ground a tinted
    panel reads as a smudge. New `--surface-inset` for tiles pressed _into_ the ground,
    which comes out navy on blue and deep rust on the collection.

  `UI_STYLE_GUIDE.md` §2–3 rewritten with the sampled values and where each came from.

### Fixed

- 2026-08-27 — **A ground defined as a token silently ignored every screen that set
  one.** `--ground-wash` held the gradient formula on `:root`, and a custom property
  containing `var()` has those references resolved _where it is declared_ — so every
  screen inherited the already-substituted default and came out rust no matter which
  triple it chose. The formula is a class (`.u-ground`) now, which resolves on the
  element that uses it. Screen glow overlays also moved behind the content
  (`z-index: -1`); as absolutely-positioned pseudo-elements they had been painting
  over every in-flow child and tinting whole screens. A negative `z-index` only lands
  above the parent's own background when the parent forms a stacking context, which
  `position: relative` alone does not — so the map, summon and battle screens now
  carry `isolation: isolate`, without which the glows (and the map wallpaper) painted
  behind an opaque ground and were invisible.

- 2026-08-27 — **A bare strip below the tab bar on an installed home-screen app.**
  The shell was sized with `height: 100%`, which resolves against the layout viewport
  and in a standalone PWA can stop short of the screen — leaving the page's own
  background showing over the home indicator. It now uses `100dvh` (the visible
  viewport, insets included) with the old `100%` as the fallback, so the tab bar ends
  where the screen does. The page background is also the HUD colour rather than the
  game's, matching `theme-color`, so the safe areas read as chrome on any device.
- 2026-08-27 — **The coach card covered the stage it was telling you to tap.**
  Beat 2 rings stage 1 and says "tap stage 1", but stage 1 is the last node on the
  road: the map runs out of scroll with it still low on the screen, under a card
  anchored to the bottom. The card now takes whichever half of the screen its target
  is _not_ in — decided once per beat from the measured anchor, so it cannot flip
  sides mid-sentence — and `coachPlacement()` in `beats.ts` carries the rule with
  tests. Also: only the card's buttons take taps now (the header row spanned the full
  width and was live), and the card's clearance is derived from the tab-bar and
  safe-area tokens rather than a hardcoded 76px, which was too small once a home
  indicator was in play.

### Added

- 2026-08-27 — **Art drop-in: per-card portraits and per-slot icons are now file drops.**
  Replacing placeholder art no longer means editing code. Two folders are discovered by
  file name at build time:
  - `src/ui/art/cards/<artKey>.png` (also `.jpg` / `.webp` / `.avif` / `.svg`) becomes
    that card's portrait — `card.ember_drake.png` is Ember Drake. Previously `CARD_ART`
    was a hand-written map, so every portrait needed an import and an entry; it is now an
    `import.meta.glob` over the folder.
  - `src/ui/icons/custom/<icon-key>.svg` replaces that meaning everywhere it is drawn —
    `gear.weapon.svg` is every Weapon in inventory, on equipment grids and in drops. Run
    `npm run vendor:icons` to inline it; `iconPath()` prefers it over the placeholder.
    Nine files replace all gear art, one per slot (CLAUDE.md rule 5).

  Anything with no file still falls back to the placeholder, so a half-finished art pass
  runs. A file named after nothing — a portrait matching no card, an icon key that does not
  exist — is silently inert, so `artManifest.test.ts` and `iconManifest.test.ts` now fail on
  it by name. The dev panel gained an **Art coverage** button listing what is still
  placeholder. `src/ui/art/cards/README.md` and `src/ui/icons/custom/README.md` document the
  conventions; `ARCHITECTURE.md` §6 and CLAUDE.md rule 6 updated to match.

- 2026-08-26 — **Phase 7: release readiness** (`IMPLEMENTATION_PLAN.md` 7.1–7.6).
  - **The first-release roster (Q29)** — grown from 14 collectible cards to **36: 30 units and 6 heroes**
    across both rarity ladders, plus ten new skills so a thirty-card roster is not five skills wearing thirty
    names. Gear reaches 44 items, with an **exalted piece in every slot** — the boss and chest tables lean on
    the top of the ladder, and without those the roller quietly fell back a rarity, which reads as a worse
    drop than the sheet promised
  - **Manual save backup (Q27)** — export a readable file or copy it to the clipboard; restore by pasting or
    picking the file. The backup is checked before the warning is shown, confirmed before anything is
    replaced, and the game reloads rather than swapping the world out from under itself. An older backup is
    migrated forward; a damaged one is refused with a reason, not half-applied
  - **A roster sweep** that puts every collectible card into a real fight with all five of its skills live.
    Thirty-six cards times five skills is a lot of authored effect data, and this is the test that catches one
    of them targeting something that is never there
  - **A string contract (Q30)** — every repeated vocabulary (currencies, both rarity ladders, elements, node
    kinds) is named in one place and guarded by a test, including that the two rarity ladders never share a
    name. Prose that appears once still lives with the component that says it
  - **Release bits** — a web manifest so the game installs to a home screen, and a diagnostics blob reachable
    from Settings rather than only after a crash: version, seed and a few counts, no personal data, nothing
    sent anywhere
  - 384 tests green; verified at 390×844 and 360×640

- 2026-08-26 — **Phase 6: polish & feel** (`IMPLEMENTATION_PLAN.md` 6.1–6.6).
  - **The game is audible (Q26)** — a full sound set and per-biome music, all of it _synthesized_ rather than
    sampled: short Web Audio envelopes for effects, slow generative chord beds for music. Nothing is
    downloaded, so audio costs no bundle and carries no licensing, and it sits behind the same manifest the
    owner's real files will use — dropping those in changes no call site. Effects are keyed by meaning, every
    button clicks by default, and the bed follows the player (biome theme on the road, a battle bed in a
    fight, a heavier one against a boss) so no screen can forget to start it
  - **A mix, not just a switch** — volume sliders for effects and music in Settings
  - **Juice** — heavy hits shake the screen and throw a bigger burst, deaths land, rewards arrive one at a
    time instead of all at once, and screens enter rather than snap in. All transform/opacity, all dropped
    entirely under reduced motion
  - **A guided opening (Q25)** — seven beats across the first two stages, each pointing at what it is talking
    about with a ring that follows the thing as the map scrolls. Skippable at every beat, and it can never
    block the tap it is asking for
  - **Edge states** — a device that refuses to save (private browsing, full storage) now says so and keeps
    trying, instead of failing into a swallowed promise; an unreadable save says what happened and that the
    old file was kept; a stage sheet explains why Fight is greyed out when you have no cards
  - **Performance** — `content-visibility` on the collection grid, the road and the achievement list, so
    off-screen rows are neither laid out nor painted. Initial bundle measured at 177 KB gz against a 300 KB
    budget
  - **Accessibility (Q28)** — reduced motion honoured from the device as well as the setting, no interface
    text under 11px, no touch target under 48px, and every rarity named as well as tinted
  - 369 tests green; verified at 390×844 and 360×640, with audio confirmed by instrumenting the Web Audio API

- 2026-08-26 — **Phase 5: profile & records** (`IMPLEMENTATION_PLAN.md` 5.1–5.4).
  - **A profile that is derived, not tallied** — furthest stage, stars, flawless clears, regions and chests,
    vignettes walked, risky roads taken, laps of the endless road, the collection by rarity, gear held and
    summons made are all computed from the save on read. The only stored record is battles lost, because a
    loss is the one thing that leaves no other trace. Nothing here can drift out of step with what the player
    actually did
  - **Commander level derived from stars** — one per three earned. The badge on the HUD is now a summary of
    the journey rather than a second number that never advanced
  - **Achievements-lite (Q23)** — seventeen across three groups, each naming one of eighteen profile metrics
    and a target, so authoring one is a data entry. Because the metrics are derived, an achievement added
    later is correctly already earned by a player who did the thing months ago. Each carries a small payout,
    claimed by hand, in currency the player earns
  - **A More hub** — Profile and Settings, the only meta screens in the first release (Q23), with a badge
    when a reward is waiting
  - **Locked facades polished (Q22)** — Rank, Trait, Foil and artifact sets on the card sheet; Events, Season
    pass and local records in the More tab. Each is visible, locked, and explains what it would have been and
    why it is not here, from one shared description rather than three drifting copies
  - **A new pipeline guard** — an achievement may not ask for more than the shipped content can give: more
    cards than exist, more regions than are authored, more chests than there are. A test also pins "Full
    Roster" to the real size of the roster, so adding a card cannot quietly turn it into a lie
  - 353 tests green; verified at 390×844 and 360×640

- 2026-08-26 — **Phase 4: the endless road** (`IMPLEMENTATION_PLAN.md` 4.1–4.7).
  - **Three authored biomes** — Sunken Isles, Ashfall Reach and Verdant Wound, each ten stages with its own
    palette, tagline and **node plan**: where the elite lands and where you get to breathe is now a content
    decision rather than modular arithmetic. Fourteen new enemy cards and twenty-four new formations, plus
    two bosses to hold the ends of the new roads
  - **Stage modifiers** — elites and bosses roll twists from their region's pool (Frenzied, Ironhide, Endless
    Tide, Scorched, Choking Dust, Quickened, Blessed Ground), stacking up to three deep on the endless road.
    Every twist is **printed on the stage sheet before energy is spent** and pays a matching loot bonus, and
    is visible again on a banner during the fight
  - **Vignettes (Q16)** — twelve event, treasure and camp encounters with up to three choices each. Prices
    are shown on the button, closed choices say exactly what they need, and an outcome can hang a **boon or
    curse on the party that the next fight spends** — bounded to a few rounds, because a vignette should give
    a fight a different opening, not decide it
  - **Fork nodes (Q2)** — every region splits once into two roads that rejoin within three stages. Both sides
    occupy the same stage numbers, so the map stays one numbered chain; the safe road is the region's own
    plan, the detour swaps vignettes for elites and pays a flat bonus. The choice can be changed right up
    until a fork stage is cleared, then it stands
  - **Region star chests** — stars earned in a region unlock chests at authored thresholds. A fight is scored
    out of three stars, a vignette is worth one, and the registry refuses a threshold above what the region's
    _safe_ road can earn
  - **Elemental affinity (Q21)** — stages carry an element and counter-element cards attack **+12% harder**.
    Roughly a third of a region's ordinary stages theme themselves off-biome, so the counter you bring is
    worth reading the map for; the stage sheet says how many of your deck qualify
  - **Endless scaling** — past the authored road the biomes loop at a compounding difficulty, enemy levels
    take a flat jump per lap, and stage names take a numeral (`Coral Keep II`)
  - **New pipeline guards** — a region must be walkable on _both_ sides of its fork (a planned elite needs an
    elite pool, a planned camp needs a camp encounter), a modifier may never apply a status that stops a side
    acting, and a carried boon must be one that actually ticks. Each of these is a way to ship a dead or
    unwinnable stage, so each now fails validation instead
  - **Balance guard rewritten** — it now walks every combat stage on both sides of every fork through the real
    generator, proving nothing hangs and that each region's boss asks more than the last while each region
    still _opens_ on a breather rather than a second wall
  - 333 tests green; verified at 390×844 and 360×640

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

- 2026-08-26 — **The AI would not stop buffing.** A ready support skill fired whenever it was off cooldown, so
  a card carrying four of them almost never swung — and two defensive sides shielded and rallied at each other
  until the round counter gave up. Support now has to earn its turn (would this heal, shield, cleanse or buff
  actually change anything?) and no card takes two support turns in a row. Found by the new roster sweep, not
  by a player.
- 2026-08-26 — Rarity labels were being defined twice: once beside the ladders in the content schemas and
  again in `ui/text/labels.ts`. The UI module now re-exports the originals.

- 2026-08-26 — **Save format v4 → v5**: added `settings.sfxVolume`, `settings.musicVolume` and
  `player.tutorialStep`. A save from before the tutorial existed belongs to someone who has already played,
  so it is marked finished rather than walking them through the opening again.
- 2026-08-26 — **The map was running downhill.** Its rows were reversed in the markup _and_ laid out in a
  `column-reverse` list, which cancelled out and put stage 1 at the top with the road descending — the
  opposite of what the design and the stylesheet's own comment describe. It has read that way since Phase 1;
  the fix is one removed `.reverse()`, found by measuring node positions rather than looking at a screenshot.
- 2026-08-26 — **The back control moved into the top bar.** It used to float over the bottom-left of every
  pushed screen, covering whatever was being scrolled past. It now takes the avatar's place in the HUD when
  there is somewhere to go back to.
- 2026-08-26 — Modals now announce themselves, so anything floating over the app (the onboarding coach) steps
  aside rather than sitting on top of the button it is pointing at.

- 2026-08-26 — **Save format v3 → v4**: added `player.claimedAchievements` and `player.stats`, and **dropped**
  `player.profile.level` and `player.profile.xp`. Nothing is lost — the commander level is now derived from
  stars earned, which the save has kept all along, and those two fields never advanced. Existing saves migrate
  automatically; a fixture test walks a v3 document forward, and the v1 fixture now walks the whole chain.
- 2026-08-26 — The engine gained `engine/records`, which describes what it reads structurally rather than
  importing the save module — its tests build their own fixture, so the purity rule is proven rather than
  asserted.

- 2026-08-26 — **Save format v2 → v3**: added `run.branches` (which side of each fork was taken),
  `run.pendingBoon` and `player.claimedChests`. The road itself is still derived from the run seed — only the
  decisions are stored. Existing saves migrate automatically; fixture tests walk both a v1 and a v2 document
  forward and assert nothing is lost.
- 2026-08-26 — **Elites are elite.** The difficulty curve's elite multiplier used to sit in the stage data
  unread; it is now spent where it is felt, as extra enemy levels on elite nodes.
- 2026-08-26 — Reward lists (victory, vignettes, chests) render through one shared component, and currency
  names come from a single `ui/text/labels.ts` rather than three drifting maps.

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
