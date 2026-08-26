# TinyDecklings — Content Schema

> Status: **DECISIONS LOCKED (2026-08-26)** — all owner questions answered (see `USER_QUESTIONS.md` decision log);
> `(Qn)` marks are provenance, not open items. Authoritative shapes will be Zod schemas in `src/content/schemas/`;
> this document is their human-readable blueprint and will be kept in sync. TypeScript-style notation below;
> all ids are stable snake_case strings. Numeric values are initial tunables in `content/economy`.

## 1. Rarity — two independent systems (owner directive)

```ts
// Cards and Gear DELIBERATELY use separate enums; they never mix,
// compare, or share color tokens.
type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; // decided (Q8)
type GearRarity = 'worn' | 'sturdy' | 'refined' | 'ornate' | 'exalted' | 'mythic'; // decided (Q9)

interface CardRarityDef {
  id: CardRarity;
  baseStars: 1 | 2 | 3 | 4 | 5; // rarity fixes base star grade
  frameToken: string; // css token, e.g. '--rarity-card-epic'
  statBudget: number; // balance multiplier
  summonWeight: number; // relative pull weight per pool
}

interface GearRarityDef {
  id: GearRarity;
  colorToken: string; // css token, e.g. '--rarity-gear-mythic'
  substatCount: number; // rarity-scaled (Q11a)
  mainStatMultiplier: number;
  dropWeight: number;
}
```

## 2. Stats

```ts
type StatKey = 'strength' | 'attack' | 'speed'; // decided (Q5a); speed dormant until post-slice

interface StatBlock {
  strength: number;
  attack: number;
  speed: number;
}

// Power is DERIVED for display only — never stored, never read by the engine.
// power = f(level, stars, statBlock, gearBonuses, skillLevels)  — progression/power.ts
```

## 3. Cards

```ts
type CardClass = 'unit' | 'hero';
type AttackType = 'melee' | 'ranged';

interface CardDef {
  id: string; // 'card.ember_drake'
  name: string; // display name (rendered ALL CAPS by UI)
  cardClass: CardClass;
  rarity: CardRarity;
  attackType: AttackType;
  element?: ElementId; // light stage-affinity system, lands Phase 4 (Q21a)
  baseStats: StatBlock; // at level 1, base stars
  growth: GrowthCurveId; // per-rarity level scaling curve (content/economy)
  attackPattern: AttackPatternId; // 'single' default
  skills: SkillRef[]; // slot-ordered; slots unlock by stars
  leaderSkill?: LeaderSkillDef; // heroes only (validated)
  artKey: string; // resolves via asset manifest; ALL cards may
  // point at the shared placeholder avatar now —
  // per-card final art swaps in later (owner)
  lore?: string;
}

interface SkillRef {
  skillId: string;
  unlockStars: number;
}

interface LeaderSkillDef {
  // e.g. "+12% Strength to all Melee allies"
  target: TargetFilter; // reuses effect targeting (see §6)
  modifier: StatModifier;
}
```

**Enemies are cards too.** Enemy rosters reference `CardDef`s (often enemy-only entries) plus per-stage scaling — no separate combat model:

```ts
interface EnemyGroupDef {
  id: string;
  members: { cardId: string; slot: SlotIndex; levelOffset?: number }[];
  reinforcements?: string[]; // queue card ids
  bossCardId?: string; // gets BOSS frame treatment
}
```

## 4. Gear

```ts
type GearSlot =
  'weapon' | 'helmet' | 'shield' | 'gauntlets' | 'armor' | 'boots' | 'ring' | 'amulet' | 'artifact'; // full set decided (Q10a);
// slice activates weapon/helmet/armor/boots

interface GearSlotDef {
  id: GearSlot;
  iconKey: string; // ← THE icon for every item of this slot
  mainStat: StatKey; // slot determines main stat family
  unlock?: { stars: number }; // e.g. artifact slot at 6★
}

interface GearDef {
  id: string; // 'gear.springstep_boots'
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  stars: 1 | 2 | 3 | 4 | 5; // item grade (reference shows starred gear)
  mainStatBase: number; // scaled by rarity/stars/enhancement
  substats?: SubstatRoll[]; // rolled on drop per rarity (Q11a); no rerolls
  setId?: string; // artifact sets — later phase (Q22)
  // ⚠ NO icon field, NO art field — icon ALWAYS resolves from slot
  //   (owner directive: every Boots shows THE boots icon, etc.)
}
```

**Owned gear instance** (inventory) vs definition:

```ts
interface OwnedGear {
  uid: string; // instance id
  defId: string;
  enhanceLevel: number; // gold enhancement (Q11a)
  substats: SubstatRoll[]; // as rolled
  equippedBy?: string; // owned-card uid
}
```

## 5. Skills

```ts
interface SkillDef {
  id: string;
  name: string;
  iconKey: string; // placeholder now, owner art later
  cooldown: number; // rounds; battle badge shows rounds-until-ready (Q4a)
  maxLevel: number;
  effects: EffectDef[]; // what it does — see §6
  levelScaling: Partial<Record<EffectParam, PerLevelCurve>>;
  attackPattern?: AttackPatternId; // overrides card pattern for this skill
}
```

## 6. Effects — the data-driven core

Effects are **interpreted primitives**, composed in data. New cards should combine primitives; new primitives are engine work and rare.

```ts
type EffectTrigger =
  | 'onCast' // active skill use
  | 'onAttack'
  | 'onHit'
  | 'onKill'
  | 'onDamaged'
  | 'onDeath'
  | 'onDeploy'
  | 'onRoundStart'
  | 'onRoundEnd'
  | 'passive'; // constant while alive (auras, leader skills)

interface TargetFilter {
  side: 'ally' | 'enemy' | 'self';
  scope: 'single' | 'row' | 'column' | 'all' | 'random' | 'lowestHp' | 'highestHp' | 'pattern';
  pattern?: AttackPatternId; // when scope = 'pattern'
  where?: { attackType?: AttackType; element?: ElementId; hasStatus?: StatusId };
}

type EffectAction =
  | { kind: 'damage'; amount: Magnitude }
  | { kind: 'heal'; amount: Magnitude }
  | { kind: 'shield'; amount: Magnitude; duration: Rounds }
  | { kind: 'applyStatus'; status: StatusId; duration: Rounds; potency?: Magnitude }
  | { kind: 'cleanse'; statuses: StatusId[] | 'all' }
  | { kind: 'modifyStat'; stat: StatKey; percent: number; duration: Rounds | 'battle' }
  | { kind: 'summon'; cardId: string; slotPreference: 'front' | 'back' }
  | { kind: 'taunt'; duration: Rounds };

// Magnitude is expressive but data-only:
type Magnitude =
  | { base: number }
  | { percentOfAttack: number }
  | { percentOfStrength: number; of: 'self' | 'target' };

interface EffectDef {
  trigger: EffectTrigger;
  target: TargetFilter;
  action: EffectAction;
  chance?: number; // 0..1, rolled on rng.battle
}
```

**Status effects** (initial set, `Q20`): each a `StatusDef` with stacking rule + tick behavior:

```ts
type StatusId =
  'burn' | 'poison' | 'freeze' | 'stun' | 'taunt' | 'weaken' | 'strengthen' | 'regen' | 'shield';

interface StatusDef {
  id: StatusId;
  iconKey: string;
  stacking: 'refresh' | 'stack' | 'ignore';
  maxStacks?: number;
  tick?: { on: 'roundStart' | 'roundEnd'; action: EffectAction };
  blocksAction?: boolean; // freeze/stun
}
```

**Escape hatch** for genuinely unique behavior: `{ kind: 'scripted', scriptId: string }` action resolved from a
typed registry in `engine/battle/scripts.ts` — used sparingly, every entry documented.

## 7. Attack patterns

```ts
// Grid shapes over the 2×3 enemy board, anchored at the chosen target.
interface AttackPatternDef {
  id: AttackPatternId; // 'single' | 'row' | 'column' | 'cross' | 'all' | …
  cells: [dx, dy][]; // offsets from anchor; clipped to board
  falloff?: number; // damage multiplier for non-anchor cells
}
```

## 8. Map & encounters

```ts
interface RegionDef {
  id: string; // 'region.sunken_isles'
  name: string;
  tagline: string; // one line under the region name on the map header
  themeToken: string; // background/palette set: 'theme-isles' | 'theme-ashfall' | ...
  stageCount: number; // 10 (Q16)
  nodePlan: StageKind[]; // what sits on each stage, in order; length === stageCount
  fork?: ForkDef; // the region's 2-way split (Q2)
  nameTable: string[];
  enemyPool: string[]; // EnemyGroupDef ids
  elitePool: string[];
  bossPool: string[];
  eventPool: string[]; // EncounterDef ids
  modifierPool: string[]; // StageModifierDef ids elites/bosses may roll
  lootTable: string;
  bossLootTable: string;
  elementBias?: ElementId; // node badges; counter-element bonus stages (Q21)
  difficultyScale: number;
  chestThresholds: number[]; // star totals that unlock this region's chests
  chestLootTable?: string;
}

/**
 * A 2-way fork (Q2). Branch A is simply the region's own plan for those stages;
 * branch B replaces it with a harder detour that pays more. Both sides occupy the
 * same stage numbers and rejoin afterwards, so the road stays one numbered chain.
 */
interface ForkDef {
  startIndex: number; // 1-based index into nodePlan
  length: 1 | 2 | 3; // stages per branch before they rejoin
  risky: StageKind[]; // branch B's kinds; length === length
  riskyRewardBonusPercent: number;
}

type StageKind = 'battle' | 'elite' | 'boss' | 'event' | 'treasure' | 'camp'; // (Q16)

/** The twist printed on an elite or boss medallion (Phase 4). */
interface StageModifierDef {
  id: string; // 'modifier.frenzied'
  name: string;
  description: string; // one line, shown before energy is spent
  iconKey: IconKey;
  appliesTo: StageKind[];
  effects: ModifierEffect[];
  rewardBonusPercent: number; // extra loot for the extra risk
}

type ModifierEffect =
  | { kind: 'statScale'; side: 'player' | 'enemy'; stat: StatKey; percent: number }
  | { kind: 'startingStatus'; side: 'player' | 'enemy'; status: StatusId; stacks: number }
  | { kind: 'extraReinforcements'; count: number };

interface GeneratedStage {
  // engine/map output — lives in run save
  number: number; // endless global index (map shows "33. FAR ISLAND")
  kind: StageKind;
  regionId: string;
  name: string; // from region name tables; later laps take a numeral
  seed: number;
  encounterRef: string; // enemy group on combat stages, encounter id on vignettes
  difficultyBudget: number; // monotonic in stage number
  elementBias?: ElementId;
  bestStars: 0 | 1 | 2 | 3; // 3★ flawless / 2★ ≤2 deaths / 1★ win (Q17)
  modifiers: string[]; // StageModifierDef ids
  rewardBonusPercent: number; // from the modifiers and the risky fork branch
  forkOf?: number; // first stage of the fork this sits in
  branch?: 'a' | 'b';
}

interface EncounterDef {
  // non-battle vignettes (event/treasure/camp)
  id: string;
  kind: 'event' | 'treasure' | 'camp';
  title: string;
  prompt: string; // prose, normal case (rule 9)
  choices: {
    label: string;
    hint?: string; // one line under the button explaining the trade
    requires?: Requirement; // a `currency` requirement is a PRICE: it gates and is deducted
    outcomes: WeightedOutcome[];
  }[]; // 1-3
}

interface WeightedOutcome {
  weight: number;
  description: string;
  rewards: string[]; // LootTableDef ids
  /** A boon or curse carried into the next fight, spent by it. */
  carriedStatus?: { status: StatusId; side: 'player' | 'enemy'; stacks: number };
}
```

**Rules the registry enforces** (`content/registry.ts`):

- `nodePlan.length === stageCount`; a fork must fit inside the region and never open on its first stage.
- Both branches must be walkable: a planned elite needs an `elitePool`, a planned boss a `bossPool`, and a planned
  event/treasure/camp needs an encounter of that kind in the `eventPool`.
- A modifier may not apply a status that blocks actions — a twist must never lock a side out of its own fight.
- A carried status must tick and must not block actions, so a boon always means something and can never hand the
  player an unwinnable stage.
- `chestThresholds` ascend and the highest must be reachable on the region's **safe** branch.

## 9. Economy

```ts
type CurrencyId =
  | 'gold'
  | 'gems'
  | 'energy' // energy decided (Q14b) — live value +
  // regen anchor live in SaveDoc.player.energy,
  // not the currencies record; rewards may grant it
  | 'token_unit_t1'
  | 'token_unit_t2'
  | 'token_unit_t3' // summon tokens (earnable only — Q13a)
  | 'token_hero'
  | 'fragment'; // red-swords counter cut (Q15a)

interface LootTableDef {
  id: string;
  rolls: { weight: number; reward: RewardDef }[];
}

type RewardDef =
  | { kind: 'currency'; currency: CurrencyId; amount: NumberRange }
  | { kind: 'cardXp'; amount: NumberRange }
  | { kind: 'gearDrop'; table: GearDropSpec } // slot/rarity weights per region
  | { kind: 'card'; cardId: string }
  | { kind: 'fragment'; cardId: string; amount: NumberRange };

interface SummonPoolDef {
  id: string; // 'pool.unit_t1' … 'pool.hero'
  tokenCurrency: CurrencyId;
  entries: { cardId: string; weight: number }[];
  pity?: { rarity: CardRarity; threshold: number }[]; // "Legendary 18/55"
  x10Discount?: number;
}

// Energy pacing (decided Q14b; system lands Phase 3). Initial tunables in
// content/economy/energy.ts. Regen is computed lazily from the save's regen
// anchor via injected time — never Date.now in the engine.
interface EnergyConfig {
  cap: number; // 30
  regenSeconds: number; // 120 (1 energy / 2 min)
  costs: Record<StageKind, number>; // battle 5 · elite 6 · boss 8 ·
  // event/treasure/camp 0 (free)
  // rewards may push current energy above cap; regen pauses while above cap
}
```

## 10. Player save (versioned — see `ARCHITECTURE.md` §7)

```ts
interface SaveDoc {
  saveVersion: number;
  createdAt: string;
  updatedAt: string;
  player: {
    profile: { name: string; avatarKey: string; level: number; xp: number };
    currencies: Record<CurrencyId, number>;
    energy: { current: number; regenAnchor: string }; // Q14b — lazy regen from anchor
    cards: OwnedCard[];
    gear: OwnedGear[];
    decks: DeckConfig[]; // 1 hero + 8 units each, max 6 decks (Q6a)
    activeDeckIndex: number;
    stageRecords: Record<number, { bestStars: 0 | 1 | 2 | 3; clears: number }>;
    unlocks: string[]; // feature flags: forge, pools, slots…
    pity: Record<string, Record<CardRarity, number>>; // per pool
    summonCounts: Record<string, number>; // v2 — pulls per pool
    shop: { dayKey: string; purchased: Record<string, number> }; // v2
    claimedChests: string[]; // v3 — `<regionId>#<threshold>`
  };
  run: {
    seed: number;
    currentStage: number;
    generatedWindow: GeneratedStage[]; // rolling window around position
    // v3 — the road is derived from the seed; which fork the player took is not.
    branches: Record<string, 'a' | 'b'>; // keyed by the fork's first stage number
    pendingBoon: { status: StatusId; side: 'player' | 'enemy'; stacks: number } | null; // v3
    pendingBattle?: { stage: number; attempt: number; intentLog: Intent[] }; // mid-battle resume
  };
  settings: { sfx: boolean; music: boolean; speed: 1 | 2; language: string /* … */ };
}

interface OwnedCard {
  uid: string;
  defId: string;
  level: number;
  xp: number;
  stars: number;
  skillLevels: number[];
  equippedGear: Partial<Record<GearSlot, string /* OwnedGear.uid */>>;
  favorite: boolean;
}
```

## 11. Authoring & validation rules

- Every content file exports typed literals; `content/index.ts` registers and **Zod-validates all entries at dev-start and in tests**.
- Referential integrity checks: every `skillId`, `cardId`, `iconKey`, `lootTable` resolves; hero cards have `leaderSkill`; units don't; `GearDef` **must not** carry icon/art fields (lint rule — slot icon directive).
- Balance tables (growth curves, costs, drop weights) live in `content/economy/…`, one concern per file, so tuning never touches logic.
- Naming: ids `domain.snake_name` (`card.ember_drake`, `gear.springstep_boots`, `skill.cinder_volley`).
