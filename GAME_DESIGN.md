# TinyDecklings — Game Design Document

> Status: **DECISIONS LOCKED (2026-08-26).** The owner answered `USER_QUESTIONS.md`: **all recommendations
> accepted, except Q14 → option (b)** (energy pacing system). Tags read **[DECIDED — Qn]** with the question
> as provenance. Concrete numbers (costs, curves, percentages) are _initial tunables_ living in
> `content/economy` — tuning them is balancing, not a design change, and needs no new owner decision.

---

## 1. Vision

**TinyDecklings** is a **portrait-only, mobile-first, single-player collectible card roguelike.**

> "A polished portrait mobile card roguelike where you collect and upgrade powerful card-creatures,
> equip them with gear, make strategic choices on an endless adventure map, and fight through
> increasingly dangerous encounters."

Influences:

- **Hearthstone** — collectible cards, readable card-vs-card battlefield, strong game feel. Inspiration only; TinyDecklings is single-player and its combat rules are its own.
- **Black Deck** — atmosphere, endless stage journey, encounter/adventure feel, card systems supporting a roguelike loop.
- **Raid-likes** — cards as persistent "heroes" with levels, stars, and equippable Gear.

### Design pillars

1. **Tactile & juicy** — every tap responds; cards pop, bounce, and glow. Cartoony, cohesive, faithful to the reference screenshots.
2. **Collect & grow** — cards are durable companions: they level, ascend, and wear Gear. Progress is always visible.
3. **One thumb, one sitting** — portrait, one-handed play; a battle or map step fits into a short session.
4. **An endless road** — the map always continues; danger and rewards scale forever.
5. **Data over code** — content (cards, gear, enemies, encounters) is data; adding a card never means writing bespoke UI or engine code.

---

## 2. Core loop **[DECIDED]**

```
        ┌────────────────────────────────────────────────┐
        ▼                                                │
  MAP (endless stage path)                               │
        │  pick next stage / encounter (Energy, §10.1)   │
        ▼                                                │
  ENCOUNTER (battle / elite / boss / event …)            │
        ▼                                                │
  COMBAT (card battlefield, turn-based)                  │
        ▼                                                │
  REWARDS (gold, card XP, gear, tokens, stars)           │
        ▼                                                │
  PROGRESSION (level cards, equip gear, improve deck) ───┘
```

The first vertical slice must prove this loop end-to-end and feel good before content breadth grows (see `IMPLEMENTATION_PLAN.md`).

---

## 3. Meta model — what persists **[DECIDED — Q1]**

TinyDecklings is a **persistent-collection game**:

- The **collection is permanent**: cards, levels, stars, gear, and currencies are never lost.
- The **map is the endless "run"**: the journey itself is the roguelike — procedurally extended stages, escalating danger, encounter variety, and choice events.
- **Defeat is soft**: losing a battle costs only the attempt (the Energy spent on it, §10.1); the player retunes their deck and retries.
- Roguelike _texture_ comes from procedural stage generation, encounter modifiers, and risk/reward choice events. A rotating **Expedition mode** (drafted runs with temporary buffs) is a post-first-release backlog candidate (`ROADMAP.md` §Future).

---

## 4. Cards

### 4.1 Card classes **[DECIDED — Q12]**

| Class    | Role                 | Notes                                                                                                                                                                                                                    |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Unit** | Standard combat card | Bulk of the collection (reference: "UNITS 42/70")                                                                                                                                                                        |
| **Hero** | Leader-class card    | One per deck; fights on the battlefield **and** provides a passive **Leader Skill** that buffs the deck (reference: leader card with "Buffs all other Melee allies by 12% of this card's max Strength"); own summon pool |

### 4.2 Card anatomy **[DECIDED — visible in references]**

Every card shows, at minimum:

- **Art** (single reusable placeholder avatar until final per-card art arrives — see §11)
- **Strength** — max Hit Points; the big number on the card in battle shows _current_ HP
- **Attack type** — **Melee** or **Ranged** (icon badge, bottom-right)
- **Rarity** — expressed by frame color + banner (see §4.3)
- **Stars** — ascension grade (see §6.2)
- **Level**
- **Skill cooldown badge** (in battle; §7.2)

Detail view adds: **Power** (computed rating), XP bar, attack pattern, gear grid, skills.

### 4.3 Card rarity **[DECIDED — Q8]**

Cards and Gear use **separate, independent rarity systems** (owner directive). Card rarity:

| Rarity    | Base stars | Frame color  | Summon feel                                |
| --------- | ---------- | ------------ | ------------------------------------------ |
| Common    | 1★         | Gray         | Filler / fodder                            |
| Uncommon  | 2★         | Green        | Early workhorses                           |
| Rare      | 3★         | Blue         | Solid, buildable                           |
| Epic      | 4★         | Magenta/Pink | Exciting pull (pity counter exists)        |
| Legendary | 5★         | Gold/Orange  | Jackpot (pity counter, "LEGENDARY" banner) |

- Rarity fixes the card's **base star grade** and stat/skill budget; ascension can raise any card up to **6★** (§6.2).
- Reference: summon pools "Unit 1–3★ / 3–5★ / 4–5★", pity counters "Legendary 18/55", "Epic 1/15".

### 4.4 Stats **[DECIDED — Q5]**

One visible pool, simple internals:

| Stat         | Visibility                                | Meaning                                                                                             |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Strength** | Primary (heart icon)                      | Max HP. The battle card shows current HP.                                                           |
| **Attack**   | Detail view — a first-class, visible stat | Damage per basic attack                                                                             |
| **Speed**    | Detail view (post-slice)                  | Acting order within a side's turn _(slice: fixed slot order)_                                       |
| **Power**    | Detail view (fist icon)                   | Computed rating from level, stars, gear, skills — a comparison number, never used by the simulation |

No defense/armor/dodge/crit stat in v1; mitigation comes from effects (Shield, Weaken, buffs).

---

## 5. Decks **[DECIDED — Q6]**

- A deck = **1 Hero + 8 Units** (reference: large leader card + 8 slots).
- **No duplicate cards** within a deck; duplicates in the collection feed ascension (§6.2).
- Up to **6 saved decks** (page dots in reference).
- The reference's **"Defense deck" toggle is cut** — it is multiplayer-flavored and single-player TinyDecklings has no defense battles. _(Conscious divergence from `Decks.png`.)_
- **Deck Power** = sum of member Power, shown in the header.
- **Auto-equip / auto-build** helpers fill slots with the strongest available cards.

---

## 6. Card progression

Reference detail screen shows the full ladder: LEVEL UP, RANK, EVOLVE, TRAIT, FOIL, EQUIP, skills, artifact sets. Scope per phase is in `ROADMAP.md`; systems below.

### 6.1 Levels **[DECIDED]**

- Cards gain **XP** from battles (and later, XP items). Level raises Strength/Attack along a per-rarity curve.
- **Level cap scales with stars** (e.g. cap = 10 × stars), creating the level → ascend → level rhythm.

### 6.2 Stars / Ascension ("EVOLVE") **[DECIDED — Q8; shipped Phase 2]**

- Ascending consumes **cards of the same star grade** — duplicates included — plus gold, raising the grade up to **6★**.
- Fodder required = the card's current grade (a 3★ card needs three 3★ cards); gold scales with the grade.
- **Favourites and cards sitting in a deck are never eligible as fodder**, so nothing the player values can be fed away by accident.
- Each star: **×1.15 stats**, a level-cap raise, and one more skill slot; 6★ also opens the Artifact gear slot.

### 6.3 Skills **[DECIDED — Q18]**

- Each card has **1 basic attack + up to 5 skills** (reference shows a 6-slot skill grid; higher slots unlock by stars).
- Skills level up with **gold + a skill resource ("tomes")** earned from elites/events.
- Slot _n_ unlocks at _n_ stars, so every ascension adds a usable skill (shipped Phase 2).
- Skills have **cooldowns measured in rounds** — the **"2" badge** on battle cards is the rounds-until-ready counter **[DECIDED — Q4]**.
- Skills are data-driven effect bundles (see `CONTENT_SCHEMA.md`), never bespoke code per card.
- The vertical slice shipped 1 skill per card; the **full five-slot ladder shipped in Phase 2**, and the battle bar shows one button per unlocked skill.

### 6.4 Deferred systems **[DECIDED — Q22]**

**RANK**, **TRAIT**, **FOIL**, **Artifact sets** are **deferred past the first release**. Their buttons stay
visible but locked (matching the reference's locked-state language) so the sheet reads complete.

---

## 7. Combat **[DECIDED — Q3, Q4, Q7]**

Combat must be readable at phone size, one-handed, and distinctly _not_ Hearthstone's rules.

### 7.1 Battlefield

- Each side has a **2×3 grid**: a **front row** (3 slots) and a **back row** (3 slots), enemy on top, player below (reference `Battle.png`).
- Battle start: the Hero and the first units of the deck fill a preset **formation** (front/back placement chosen in a formation editor; slice: auto-placement).
- Remaining deck cards form the **Reinforcement Queue** (the deck counters at screen edge). When a card dies, the next queued card deploys into the empty slot at the start of the next round.

### 7.2 Turn structure

- **Round = player turn, then enemy turn** (the "TURN" banner marks handoff).
- On a side's turn, each living card acts once, in slot order (front-left → back-right).
- **Manual mode (default):** for the acting card, the player taps a valid target; ready skills can be tapped to fire instead of the basic attack.
- **AUTO** toggle delegates choices to a simple AI (fires skills when ready); **X1/X2 speed** toggle; **surrender flag** ends the battle as a defeat.

### 7.3 Targeting

- **Melee** cards must target the enemy **front row** while it holds any living card; when a column/row logic matters, nearest-first.
- **Ranged** cards target any enemy.
- **Attack patterns** (per card/skill; "Default" = single target) can widen hits: row, column, cross, splash, all — grid-shape driven (reference: "Attack Pattern" grid icon).

### 7.4 Resolution

- Damage = attacker's Attack (± effects); no dodge/crit in v1.
- **Win:** enemy side and its queue eliminated. **Loss:** player side and queue eliminated, or surrender.
- **Stars per stage [DECIDED — Q17]:** 3★ = flawless (no player card died), 2★ = ≤2 cards died, 1★ = any win.

### 7.5 Status effects **[DECIDED — Q20]**

Initial set: **Burn**, **Poison**, **Freeze/Stun**, **Shield**, **Taunt**, **Weaken**, **Strengthen**, **Regen**.
Data-driven; stacking/duration rules in `CONTENT_SCHEMA.md`. Slice ships ~3 (Burn, Shield, Stun); the rest land by Phase 2–4.

### 7.6 Elements **[SHIPPED Phase 4 — Q21]**

**Light stage-affinity system:** stages carry an element theme (the node badges: nature, fire, ice, lightning, dark…);
cards of the **counter-element get +12% Attack** on that stage — the low end of the decided 10–15% band. Flavor and
gentle deck-variety pressure, no full advantage wheel.

A region's biome sets the theme, but roughly a third of its ordinary stages theme themselves to something else, so
the counter you bring is worth reading the map for rather than picking once per region. A boss always fights on its
own ground. The bonus applies to whoever counters the stage, both sides alike — which is why enemies standing on
their own biome never gain from it. Dark answers only itself.

---

## 8. Map & encounters **[DECIDED — Q2, Q16]**

The reference map (`assets/examples/Map.png`) shows a **linear, numbered, endless stage path** (28 → 34…) winding upward through themed terrain (ocean → ice → volcano), each node a portrait medallion with a name plate, an element badge, and a 3-star rating.

- **Structure:** linear endless chain of **stages**, generated in themed **regions** (10 stages each) with escalating difficulty. Each region carries a **fork**: a 2-way choice that rejoins the main path after 1–3 stages — roguelike texture without abandoning the reference's linear look. Both sides occupy the same stage numbers; branch A is the region's own plan, branch B swaps vignettes for elites and pays a flat loot bonus on top. The choice can be changed right up until a fork stage is cleared, then it stands.
- **Node types:** Battle, **Elite**, **Boss**, **Event** (choice vignette), **Treasure**, **Camp**. Where each sits is authored per region as a **node plan**, so a biome's rhythm — where the elite lands, where you get to breathe — is a content decision rather than modular arithmetic. The registry refuses a region that plans a node kind it has no content for.
- **Stage modifiers [SHIPPED Phase 4]:** elites and bosses roll twists from their region's pool — Frenzied, Ironhide, Endless Tide, Scorched, Choking Dust, Quickened, Blessed Ground. The count climbs with depth (one in region one, up to three deep on the road). Every twist is printed on the stage sheet **before** energy is spent, and every one pays a matching loot bonus. A twist may never be a status that stops a side acting; the registry enforces it.
- **Endless [SHIPPED Phase 4]:** past the third region the road loops the authored biomes again at a compounding difficulty multiplier, with enemy levels jumping a flat step per lap and stage names taking a numeral (`Coral Keep II`).
- **Region star chests [SHIPPED Phase 4]:** stars earned inside a region unlock chests at authored thresholds. A first-lap reward — the endless loops replay the fights, not the chests. A fight is scored out of three stars; a vignette is worth one, which marks the node walked. The registry refuses a threshold above what the region's _safe_ road can earn.
- **Stars & replay [DECIDED — Q17]:** each stage stores its best star rating; replaying beaten stages for farming is allowed (costs Energy like any attempt, §10.1); star records are permanent.
- Completed path behind, current node highlighted, next nodes preview with grayed stars.

---

## 9. Gear **[DECIDED — Q9, Q10, Q11]**

Cards equip **Gear** — persistent items with their own identity and progression.

### 9.1 Slots **[DECIDED — Q10]**

Full reference set, **8 slots + 1 unlockable**:

**Weapon, Helmet, Shield, Gauntlets, Armor, Boots, Ring, Amulet** + **Artifact** slot (unlocks at 6★).

The vertical slice activated 4 slots; **Phase 2 switched on all eight**. The Artifact slot stays gated behind a 6★ card — a progression lock, not a phase lock.

### 9.2 Iconography — fixed per slot **[DECIDED — owner directive]**

> **Every gear piece of a given slot type always uses the same icon.** All boots use _the_ Boots icon, all helmets _the_ Helmet icon — in the inventory, on the equipment grid, everywhere. Individual items differ by name, stats, rarity color, and stars — **never** by icon. Empty slots show the same icon as a gray silhouette with a "+" affordance (as in the reference).

This is enforced structurally: the icon is looked up from the **slot type**, and gear content data has no per-item icon field (see `CONTENT_SCHEMA.md`).

### 9.3 Gear rarity **[DECIDED — Q9]** — _independent from card rarity_ **[DECIDED — owner directive]**

Gear uses its **own tier names and color scale**, deliberately distinct from card rarity:

| Gear rarity | Color        | Notes                                          |
| ----------- | ------------ | ---------------------------------------------- |
| Worn        | Gray         | Vendor trash / early drops                     |
| Sturdy      | Green        |                                                |
| Refined     | Blue         |                                                |
| Ornate      | Magenta/Pink |                                                |
| Exalted     | Orange       |                                                |
| Mythic      | Red          | Top tier (reference shows red-background gear) |

6 gear tiers vs 5 card tiers keeps the systems visually and mechanically unmistakable.

### 9.4 Gear stats & progression **[DECIDED — Q11]**

- A gear item has a **main stat** (by slot type) and **substats scaled by rarity**, plus **gear stars** (item grade shown in reference).
- **Enhancement**: +levels bought with gold, each adding 12% of the item's base main stat, capped by rarity (worn +3 … mythic +15). **No RNG substat rerolls/gambling** — Raid-flavour without its darkest grind.
- **Artifact sets** (equip N pieces for a bonus): deferred past first release (Q22).

### 9.5 Acquisition **[DECIDED]**

Battle drops (stage/region-scaled loot tables), event rewards, later shop. Auto-equip helper exists in references.

---

## 10. Economy & summon **[DECIDED — Q13, Q14(b), Q15]**

Currencies and their roles:

| Currency          | Icon                          | Role                                                                                              |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| **Gold**          | Coin                          | Soft currency: level-ups, enhancement, shop                                                       |
| **Gems**          | Pink gem                      | Premium-feel currency, **fully earnable in-game**; summons, refreshes                             |
| **Summon tokens** | Tiered medals                 | Gacha entry per pool (Unit 1–3★ / 3–5★ / 4–5★ / Hero)                                             |
| **Fragments**     | Shards                        | Pity/dust: assemble specific cards                                                                |
| **Energy**        | Lightning bolt (30/30 in HUD) | Per-attempt cost for combat stages — §10.1                                                        |
| **Player XP**     | —                             | Account level (avatar badge) gating features                                                      |
| ~~Battle tokens~~ | ~~Red swords (10/10)~~        | **Cut for v1 [DECIDED — Q15]** — HUD slot removed _(conscious divergence from the reference HUD)_ |

### 10.1 Energy pacing **[DECIDED — Q14 → option (b); shipped Phase 3]**

A **generous, fast-refilling energy system** for session pacing (mobile-typical), matching the HUD's 30/30 bolt:

- **Cap 30**; regenerates **1 energy / 2 minutes** (empty → full in 1 hour), computed lazily from save timestamps via injected time (engine purity rules).
- **Costs (initial tunables):** Battle 5 · Elite 6 · Boss 8. **Event / Treasure / Camp vignettes are free.**
- Defeat does **not** refund the attempt — the generous regen is the cushion.
- Energy from rewards/level-ups may **overflow the cap** (regen pauses while above cap).
- Out-of-energy → a friendly sheet showing time-to-next-attempt (and later, shop refill options — gems only, still no real money).
- Regen is **derived, never ticked**: the save stores the value plus the moment it was settled, so closing
  the app loses nothing and no timer runs. The dev panel can grant or drain energy for testing.

**Summon** (reference `Card_Summon.png`): token-gated pools, single & ×10 (discounted), **pity counters** per Epic/Legendary, reveal ceremony. **[DECIDED — Q13]:** the gacha is an _earnable reward cadence_ — tokens/gems come from play; **zero real-money IAP; the game is fully offline.**

---

## 11. Art & placeholder policy **[DECIDED — owner directive]**

- **One reusable placeholder avatar** stands in for _every_ card's art. Final art will be supplied **per individual card** by the owner later.
- **All interface icons** are placeholders from **Open Game Icons** (fork of game-icons.net; CC-BY attribution honored) and will also be replaced by the owner's own icon art later.
- Therefore **every art reference is a swappable key**: content data references `artKey` / semantic icon names resolved through a single manifest. Swapping placeholder → final art is an asset drop + manifest entry, **never** a code or data-schema change (see `ARCHITECTURE.md` §Assets).
- Gear icons are additionally constrained by §9.2 (slot-type icon, no per-item icons).

---

## 12. Screens & navigation **[DECIDED — Q23, Q24]**

| Screen                         | Reference                             | Phase                                                                                       |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Map** (home)                 | `Map.png`                             | Slice                                                                                       |
| **Battle**                     | `Battle.png`                          | Slice                                                                                       |
| **Cards** (collection + decks) | `Decks.png`                           | Slice (collection), Phase 2 (full decks)                                                    |
| **Card detail**                | `Card_Unit_Detail.png`                | Slice (level/equip subset)                                                                  |
| **Summon**                     | `Card_Summon.png`                     | Phase 3                                                                                     |
| **Shop**                       | `Shop.png` (style ref)                | Phase 3 (soft-currency v1)                                                                  |
| **Settings**                   | `Settings.png` (style ref)            | Phase 2 (minimal early)                                                                     |
| **More** (hub)                 | —                                     | Phase 5                                                                                     |
| **Profile**                    | `Player_Profile_Page.png` (style ref) | Phase 5 ✅                                                                                  |
| **Events hub**                 | `Events.png` (style ref)              | **Post-first-release backlog**                                                              |
| **Season pass**                | `Battlepass.png` (style ref)          | **Post-first-release backlog**                                                              |
| **Leaderboard**                | `Leaderboard.png` (style ref)         | **Cut for first release** (offline game, no backend); local records are a backlog candidate |

**Navigation [DECIDED — Q24]:** persistent **top HUD** (avatar/level, currencies, add button) + **bottom tab bar**
(MAP · CARDS · SUMMON · SHOP · MORE), modals for detail views, purple back button inside stacked screens.
**Map is home.** First release ships Map, Battle, Cards (+detail), Summon, Shop v1, More, Settings, Profile.

### 12.1 Profile & records **[SHIPPED Phase 5 — Q23]**

The profile is **derived, not tallied**. Stars, clears, the collection and the summon counters already record
what the player did, so the screen reads them rather than keeping a second copy that can drift. The only
stored record is battles lost, because a loss leaves no other trace; everything else — furthest stage, stars,
flawless clears, regions and chests, vignettes walked, risky roads taken, laps of the endless road, the
collection by rarity, gear held, summons made — is computed on read.

- **Commander level** is derived from stars earned (one per three), so the badge on the HUD is a summary of
  the journey and can never disagree with the stage records. The stored `profile.level`/`xp` fields were
  dropped in save v4.
- **Achievements-lite:** each names one of a closed set of profile metrics and a target, so authoring one is
  a data entry. Because the metrics are derived, an achievement added later is correctly already earned by a
  player who did the thing months ago. Each carries a small payout, claimed by hand, in currency the player
  earns (rule 12). The registry refuses a target the shipped content could never reach.
- **Locked facades (Q22):** Rank, Trait, Foil and artifact sets sit on the card sheet, and Events, Season pass
  and local records sit in the More tab — visible, locked, and each able to say what it would have been and
  why it is not here. One description per system, shared by every place it appears.

---

## 13. Failure, difficulty, scaling **[DECIDED — Q16, Q17]**

- Defeat: no collection loss; retry freely — the attempt's Energy is spent (no refund, §10.1).
- Difficulty: per-stage enemy budget grows with stage number; regions introduce mechanics; Elites/Bosses spike with modifiers.
- Endless scaling past the authored curve: multiplicative stat growth + procedurally combined modifiers.
- The wall is the pacing engine: hitting it sends the player to progression (level, gear, summon), which is the intended loop.

## 14. Out of scope

- Multiplayer, PvP, server backend, cloud saves. Local **save export/import ships in Phase 7 [DECIDED — Q27]**.
- **Real-money monetization: none [DECIDED — Q13].** Revisited only if the owner asks.
- Capacitor packaging (future delivery phase — architecture keeps the seam clean, see `TECH_STACK.md`).
- First release is **English-only**, with all strings centralized for later i18n **[DECIDED — Q30]**.
- Accessibility floor **[DECIDED — Q28]**: reduced-motion mode, color-blind-safe rarity cues (icon/label accompanies color), min 11px text, ≥48px touch targets.
- Onboarding **[DECIDED — Q25]**: guided first 2 stages (forced simple deck, tooltip beats), then free — built in Phase 6.
- First-release content targets **[DECIDED — Q29]**: ~30 units + 6 heroes, ~40 gear items, 3 authored regions + endless generation, 1 boss per region.

## 15. Glossary

| Term                | Meaning                                                     |
| ------------------- | ----------------------------------------------------------- |
| Card                | Collectible entity; class Unit or Hero                      |
| Hero                | Leader-class card; one per deck; has a Leader Skill         |
| Unit                | Standard combat card                                        |
| Deck                | 1 Hero + 8 Units                                            |
| Gear                | Equippable item; slot-typed; own rarity scale               |
| Strength            | Max HP stat                                                 |
| Attack              | Damage per basic attack                                     |
| Power               | Computed rating (display only)                              |
| Energy              | Per-attempt cost for combat stages; fast-refilling (cap 30) |
| Stage               | Numbered node on the endless map                            |
| Region              | Themed span of ~10 stages                                   |
| Encounter           | Content of a stage (battle, elite, boss, event…)            |
| Reinforcement Queue | Undeployed deck cards that refill empty slots               |
| Ascension           | Raising a card's star grade ("EVOLVE")                      |
| Round               | One player turn + one enemy turn                            |
| Tome                | Skill-upgrade resource from elites/events                   |
