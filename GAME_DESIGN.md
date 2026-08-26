# TinyDecklings — Game Design Document

> Status: **PLANNING**. Items are tagged **[DECIDED]** (fixed by the project brief or reference assets),
> **[PROPOSED]** (recommended design, awaiting owner sign-off in `USER_QUESTIONS.md`), or **[OPEN]**
> (no recommendation yet — needs an owner decision). Question IDs (e.g. `Q3`) link to `USER_QUESTIONS.md`.

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
        │  pick next stage / encounter                   │
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

## 3. Meta model — what persists **[PROPOSED → Q1]**

The reference screens (permanent card levels, gacha summon, gear inventory) point to a **persistent-collection game**, not a run-reset roguelike:

- The **collection is permanent**: cards, levels, stars, gear, and currencies are never lost.
- The **map is the endless "run"**: the journey itself is the roguelike — procedurally extended stages, escalating danger, encounter variety, and choice events.
- **Defeat is soft**: losing a battle costs only the attempt (and any per-attempt cost, see Q14); the player retunes their deck and retries.
- Roguelike *texture* comes from procedural stage generation, encounter modifiers, risk/reward choice events, and (later, optional) a rotating **Expedition mode** with drafted temporary buffs (`Q22`).

`Q1` asks the owner to confirm this model versus a "true roguelike" with resetting runs.

---

## 4. Cards

### 4.1 Card classes **[PROPOSED → Q12]**

| Class | Role | Notes |
|---|---|---|
| **Unit** | Standard combat card | Bulk of the collection (reference: "UNITS 42/70") |
| **Hero** | Leader-class card | One per deck; fights on the battlefield **and** provides a passive **Leader Skill** that buffs the deck (reference: leader card with "Buffs all other Melee allies by 12% of this card's max Strength") |

### 4.2 Card anatomy **[DECIDED — visible in references]**

Every card shows, at minimum:

- **Art** (single reusable placeholder avatar until final per-card art arrives — see §11)
- **Strength** — max Hit Points; the big number on the card in battle shows *current* HP
- **Attack type** — **Melee** or **Ranged** (icon badge, bottom-right)
- **Rarity** — expressed by frame color + banner (see §4.3)
- **Stars** — ascension grade (see §6.2)
- **Level**
- **Skill cooldown badge** (in battle; see §7)

Detail view adds: **Power** (computed rating), XP bar, attack pattern, gear grid, skills.

### 4.3 Card rarity **[PROPOSED → Q8]**

Cards and Gear use **separate, independent rarity systems** (owner directive). Card rarity:

| Rarity | Base stars | Frame color | Summon feel |
|---|---|---|---|
| Common | 1★ | Gray | Filler / fodder |
| Uncommon | 2★ | Green | Early workhorses |
| Rare | 3★ | Blue | Solid, buildable |
| Epic | 4★ | Magenta/Pink | Exciting pull (pity counter exists) |
| Legendary | 5★ | Gold/Orange | Jackpot (pity counter, "LEGENDARY" banner) |

- Rarity fixes the card's **base star grade** and stat/skill budget; ascension can raise stars above base (§6.2).
- Reference: summon pools "Unit 1–3★ / 3–5★ / 4–5★", pity counters "Legendary 18/55", "Epic 1/15".

### 4.4 Stats **[PROPOSED → Q5]**

Recommended stat model — **one visible pool, simple internals**:

| Stat | Visibility | Meaning |
|---|---|---|
| **Strength** | Primary (heart icon) | Max HP. The battle card shows current HP. |
| **Attack** | Detail view | Damage per basic attack |
| **Speed** | Detail view (later) | Acting order within a side's turn *(slice: fixed slot order)* |
| **Power** | Detail view (fist icon) | Computed rating from level, stars, gear, skills — a comparison number, never used by the simulation |

No defense/armor stat in v1; mitigation comes from effects (Shield, buffs). `Q5` confirms whether Attack is a visible first-class stat (recommended) or derived from Strength.

---

## 5. Decks **[PROPOSED → Q6]**

- A deck = **1 Hero + 8 Units** (reference: large leader card + 8 slots).
- **No duplicate cards** within a deck; duplicates in the collection feed ascension (§6.2).
- Up to **6 saved decks** (page dots in reference); a separate **Defense deck** marker exists in the reference — for single-player this is likely unnecessary (`Q6` asks to cut or repurpose).
- **Deck Power** = sum of member Power, shown in the header.
- **Auto-equip / auto-build** helpers fill slots with the strongest available cards.

---

## 6. Card progression

Reference detail screen shows the full ladder: LEVEL UP, RANK, EVOLVE, TRAIT, FOIL, EQUIP, skills, artifact sets. Scope per phase is in `ROADMAP.md`; systems below.

### 6.1 Levels **[PROPOSED]**

- Cards gain **XP** from battles (and later, XP items). Level raises Strength/Attack along a per-rarity curve.
- **Level cap scales with stars** (e.g. cap = 10 × stars), creating the level → ascend → level rhythm.

### 6.2 Stars / Ascension ("EVOLVE") **[PROPOSED → Q10-adjacent, scope in Q22]**

- Ascending consumes **duplicates or class-fodder** to raise the star grade (up to **6★**; the reference shows a 5★ card with a 6th empty slot and a gear slot locked behind "6★").
- Each star: stat multiplier + level cap raise; milestone stars unlock skill slots / the last gear slot.

### 6.3 Skills **[PROPOSED → Q18]**

- Each card has **1 basic attack + up to 5 skills** (reference shows a 6-slot skill grid; higher slots locked by stars).
- Skills have **levels** (upgraded with a resource, `Q18`) and **cooldowns** measured in rounds — the **"2" badge** on battle cards is the rounds-until-ready counter **[PROPOSED → Q4]**.
- Skills are data-driven effect bundles (see `CONTENT_SCHEMA.md`), never bespoke code per card.

### 6.4 Later-phase systems **[OPEN → Q22]**

**RANK** (account-gated), **TRAIT**, **FOIL** (premium cosmetic variant), **Artifact sets** — visible in references; recommended to defer past the first release unless the owner prioritizes them.

---

## 7. Combat **[PROPOSED → Q3, Q4, Q7]**

Combat must be readable at phone size, one-handed, and distinctly *not* Hearthstone's rules.

### 7.1 Battlefield

- Each side has a **2×3 grid**: a **front row** (3 slots) and a **back row** (3 slots), enemy on top, player below (reference `Battle.png`).
- Battle start: the Hero and the first units of the deck fill a preset **formation** (front/back placement chosen in a formation editor; slice: auto-placement).
- Remaining deck cards form the **Reinforcement Queue** (the deck counters at screen edge). When a card dies, the next queued card deploys into the empty slot at the start of the next round.

### 7.2 Turn structure

- **Round = player turn, then enemy turn** (the "TURN" banner marks handoff).
- On a side's turn, each living card acts once, in slot order (front-left → back-right).
- **Manual mode (default):** for the acting card, the player taps a valid target; ready skills can be tapped to fire instead of the basic attack.
- **AUTO** toggle delegates choices to a simple AI; **X1/X2 speed** toggle; **surrender flag** ends the battle as a defeat.

### 7.3 Targeting

- **Melee** cards must target the enemy **front row** while it holds any living card; when a column/row logic matters, nearest-first.
- **Ranged** cards target any enemy.
- **Attack patterns** (per card/skill; "Default" = single target) can widen hits: row, column, cross, splash, all — grid-shape driven (reference: "Attack Pattern" grid icon).

### 7.4 Resolution

- Damage = attacker's Attack (± effects); no dodge/crit in v1 (`Q5`).
- **Win:** enemy side and its queue eliminated. **Loss:** player side and queue eliminated, or surrender.
- **Stars per stage:** 3★ = flawless (no player card died), 2★ = minor losses, 1★ = any win **[PROPOSED → Q17]**.

### 7.5 Status effects **[PROPOSED → Q20]**

Initial set: **Burn**, **Poison**, **Freeze/Stun**, **Shield**, **Taunt**, **Weaken**, **Strengthen**, **Heal over time**. Data-driven; stacking/duration rules in `CONTENT_SCHEMA.md`.

### 7.6 Elements **[OPEN → Q21]**

Map nodes carry element badges (nature, fire, ice, lightning, dark…). Options: full elemental advantage wheel, light "stage affinity" modifiers, or purely thematic. Recommendation in `Q21`.

---

## 8. Map & encounters **[PROPOSED → Q2, Q16]**

The reference map (`assets/examples/Map.png`) shows a **linear, numbered, endless stage path** (28 → 34…) winding upward through themed terrain (ocean → ice → volcano), each node a portrait medallion with a name plate, an element badge, and a 3-star rating.

- **Structure:** linear endless chain of **stages**, generated in themed **regions** (~10 stages each) with escalating difficulty. Occasional **fork nodes** offer a 2-way choice (risk/reward) that rejoins the main path — roguelike texture without abandoning the reference's linear look (`Q2`).
- **Node types:** Battle, **Elite** (every ~5th), **Boss** (every ~10th, gold "BOSS" card frame in battle), **Event** (choice vignette), **Treasure**, **Camp/Forge** (heal/upgrade vignette) — mix confirmed in `Q16`.
- **Stars & replay:** each stage stores its best star rating; replaying beaten stages for farming is allowed **[PROPOSED → Q17]**.
- Completed path behind, current node highlighted, next nodes preview with grayed stars.

---

## 9. Gear **[PROPOSED → Q9, Q10, Q11]**

Cards equip **Gear** — persistent items with their own identity and progression.

### 9.1 Slots **[PROPOSED → Q10]**

Reference shows a 3×3 grid: 8 slots + 1 locked behind 6★. Proposed slots:

**Weapon, Helmet, Shield, Gauntlets, Armor, Boots, Ring, Amulet** (+ **Artifact** slot unlocked at 6★).

`Q10` asks whether to trim to 6 slots for scope.

### 9.2 Iconography — fixed per slot **[DECIDED — owner directive]**

> **Every gear piece of a given slot type always uses the same icon.** All boots use *the* Boots icon, all helmets *the* Helmet icon — in the inventory, on the equipment grid, everywhere. Individual items differ by name, stats, rarity color, and stars — **never** by icon. Empty slots show the same icon as a gray silhouette with a "+" affordance (as in the reference).

This is enforced structurally: the icon is looked up from the **slot type**, and gear content data has no per-item icon field (see `CONTENT_SCHEMA.md`).

### 9.3 Gear rarity **[PROPOSED → Q9]** — *independent from card rarity* **[DECIDED — owner directive]**

Gear uses its **own tier names and color scale**, deliberately distinct from card rarity:

| Gear rarity | Color | Notes |
|---|---|---|
| Worn | Gray | Vendor trash / early drops |
| Sturdy | Green | |
| Refined | Blue | |
| Ornate | Magenta/Pink | |
| Exalted | Orange | |
| Mythic | Red | Top tier (reference shows red-background gear) |

6 gear tiers vs 5 card tiers keeps the systems visually and mechanically unmistakable. Names/colors/count are `Q9`.

### 9.4 Gear stats & progression **[PROPOSED → Q11]**

- A gear item has a **main stat** (by slot type) and 0–N **substats** (by rarity), plus **gear stars** (item grade shown in reference).
- Optional **enhancement** (+levels with gold) — `Q11` decides depth for v1.
- **Artifact sets** (equip N pieces of a set for a bonus) visible in reference — recommended later phase (`Q22`).

### 9.5 Acquisition **[PROPOSED → Q11]**

Battle drops (stage/region-scaled loot tables), event rewards, later shop/forge. Auto-equip helper exists in references.

---

## 10. Economy & summon **[PROPOSED → Q13, Q14, Q15]**

Currencies observed across references, proposed roles:

| Currency | Icon | Role |
|---|---|---|
| **Gold** | Coin | Soft currency: level-ups, enhancement, shop |
| **Gems** | Pink gem | Premium-feel currency, fully earnable in-game; summons, refreshes |
| **Summon tokens** | Tiered medals | Gacha entry per pool (Unit 1–3★ / 3–5★ / 4–5★ / Hero) |
| **Fragments** | Shards | Pity/dust: assemble specific cards |
| **Energy** | Lightning bolt (30/30) | Per-attempt stage cost — **existence is `Q14`** (recommend: none, or generous & fast-refilling) |
| **Battle tokens** | Red swords (10/10) | Unclear in reference — `Q15` (recommend: cut for v1) |
| **Player XP** | — | Account level (avatar badge) gating features/RANK |

**Summon** (reference `Card_Summon.png`): token-gated pools, single & ×10 (discounted), **pity counters** per Epic/Legendary, reveal ceremony. As a single-player offline game, the gacha is an *earnable reward cadence*, not a paywall — **no real-money monetization is planned** unless the owner says otherwise (`Q13`).

---

## 11. Art & placeholder policy **[DECIDED — owner directive]**

- **One reusable placeholder avatar** stands in for *every* card's art. Final art will be supplied **per individual card** by the owner later.
- **All interface icons** are placeholders from **Open Game Icons** (fork of game-icons.net; CC-BY attribution honored) and will also be replaced by the owner's own icon art later.
- Therefore **every art reference is a swappable key**: content data references `artKey` / semantic icon names resolved through a single manifest. Swapping placeholder → final art is an asset drop + manifest entry, **never** a code or data-schema change (see `ARCHITECTURE.md` §Assets).
- Gear icons are additionally constrained by §9.2 (slot-type icon, no per-item icons).

---

## 12. Screens & navigation **[PROPOSED → Q24]**

| Screen | Reference | Phase |
|---|---|---|
| **Map** (home) | `Map.png` | Slice |
| **Battle** | `Battle.png` | Slice |
| **Cards** (collection + decks) | `Decks.png` | Slice (collection), Phase 2 (full decks) |
| **Card detail** | `Card_Unit_Detail.png` | Slice (level/equip subset) |
| **Summon** | `Card_Summon.png` | Phase 3 |
| **Shop** | `Shop.png` (style ref) | Phase 3+ |
| **Events hub** | `Events.png` (style ref) | Phase 5 |
| **Season pass** | `Battlepass.png` (style ref) | Phase 5 / `Q23` |
| **Profile** | `Player_Profile_Page.png` (style ref) | Phase 5 |
| **Leaderboard** | `Leaderboard.png` (style ref) | `Q23` (offline game — likely cut or local records) |
| **Settings** | `Settings.png` (style ref) | Phase 2+ (minimal early) |

Navigation proposal: persistent **top HUD** (avatar/level, currencies, add button) + **bottom tab bar** (MAP · CARDS · SUMMON · SHOP · MORE), modals for detail views, purple back button inside stacked screens. `Q24` confirms.

---

## 13. Failure, difficulty, scaling **[PROPOSED → Q16, Q17]**

- Defeat: no collection loss; retry freely (minus per-attempt Energy if kept).
- Difficulty: per-stage enemy budget grows with stage number; regions introduce mechanics; Elites/Bosses spike with modifiers.
- Endless scaling past the authored curve: multiplicative stat growth + procedurally combined modifiers **[PROPOSED]**.
- The wall is the pacing engine: hitting it sends the player to progression (level, gear, summon), which is the intended loop.

## 14. Out of scope (for now)

- Multiplayer, PvP, server backend, cloud saves (`Q27`)
- Real-money monetization (`Q13`)
- Capacitor packaging (future delivery phase — architecture keeps the seam clean, see `TECH_STACK.md`)

## 15. Glossary

| Term | Meaning |
|---|---|
| Card | Collectible entity; class Unit or Hero |
| Hero | Leader-class card; one per deck; has a Leader Skill |
| Unit | Standard combat card |
| Deck | 1 Hero + 8 Units |
| Gear | Equippable item; slot-typed; own rarity scale |
| Strength | Max HP stat |
| Power | Computed rating (display only) |
| Stage | Numbered node on the endless map |
| Region | Themed span of ~10 stages |
| Encounter | Content of a stage (battle, elite, boss, event…) |
| Reinforcement Queue | Undeployed deck cards that refill empty slots |
| Ascension | Raising a card's star grade ("EVOLVE") |
| Round | One player turn + one enemy turn |
