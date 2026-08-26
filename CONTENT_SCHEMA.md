# TinyDecklings — Content Schema

> Status: **PLANNING**. Authoritative shapes will be Zod schemas in `src/content/schemas/`; this document is their
> human-readable blueprint and will be kept in sync. TypeScript-style notation below; all ids are stable snake_case strings.
> Open balance questions are flagged with `Qn` (see `USER_QUESTIONS.md`).

## 1. Rarity — two independent systems (owner directive)

```ts
// Cards and Gear DELIBERATELY use separate enums; they never mix,
// compare, or share color tokens.
type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';        // Q8
type GearRarity = 'worn' | 'sturdy' | 'refined' | 'ornate' | 'exalted' | 'mythic'; // Q9

interface CardRarityDef {
  id: CardRarity;
  baseStars: 1 | 2 | 3 | 4 | 5;    // rarity fixes base star grade
  frameToken: string;               // css token, e.g. '--rarity-card-epic'
  statBudget: number;               // balance multiplier
  summonWeight: number;             // relative pull weight per pool
}

interface GearRarityDef {
  id: GearRarity;
  colorToken: string;               // css token, e.g. '--rarity-gear-mythic'
  substatCount: number;             // Q11
  mainStatMultiplier: number;
  dropWeight: number;
}
```

## 2. Stats

```ts
type StatKey = 'strength' | 'attack' | 'speed';   // speed dormant in slice (Q5)

interface StatBlock { strength: number; attack: number; speed: number; }

// Power is DERIVED for display only — never stored, never read by the engine.
// power = f(level, stars, statBlock, gearBonuses, skillLevels)  — progression/power.ts
```

## 3. Cards

```ts
type CardClass = 'unit' | 'hero';
type AttackType = 'melee' | 'ranged';

interface CardDef {
  id: string;                     // 'card.ember_drake'
  name: string;                   // display name (rendered ALL CAPS by UI)
  cardClass: CardClass;
  rarity: CardRarity;
  attackType: AttackType;
  element?: ElementId;            // Q21 — dormant until elements decided
  baseStats: StatBlock;           // at level 1, base stars
  growth: GrowthCurveId;          // per-rarity level scaling curve (content/economy)
  attackPattern: AttackPatternId; // 'single' default
  skills: SkillRef[];             // slot-ordered; slots unlock by stars
  leaderSkill?: LeaderSkillDef;   // heroes only (validated)
  artKey: string;                 // resolves via asset manifest; ALL cards may
                                  // point at the shared placeholder avatar now —
                                  // per-card final art swaps in later (owner)
  lore?: string;
}

interface SkillRef { skillId: string; unlockStars: number; }

interface LeaderSkillDef {        // e.g. "+12% Strength to all Melee allies"
  target: TargetFilter;           // reuses effect targeting (see §6)
  modifier: StatModifier;
}
```

**Enemies are cards too.** Enemy rosters reference `CardDef`s (often enemy-only entries) plus per-stage scaling — no separate combat model:

```ts
interface EnemyGroupDef {
  id: string;
  members: { cardId: string; slot: SlotIndex; levelOffset?: number }[];
  reinforcements?: string[];      // queue card ids
  bossCardId?: string;            // gets BOSS frame treatment
}
```

## 4. Gear

```ts
type GearSlot =
  | 'weapon' | 'helmet' | 'shield' | 'gauntlets'
  | 'armor' | 'boots' | 'ring' | 'amulet' | 'artifact';   // set trimmed by Q10

interface GearSlotDef {
  id: GearSlot;
  iconKey: string;           // ← THE icon for every item of this slot
  mainStat: StatKey;         // slot determines main stat family
  unlock?: { stars: number };// e.g. artifact slot at 6★
}

interface GearDef {
  id: string;                // 'gear.springstep_boots'
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  stars: 1 | 2 | 3 | 4 | 5;  // item grade (reference shows starred gear)
  mainStatBase: number;      // scaled by rarity/stars/enhancement
  substats?: SubstatRoll[];  // rolled on drop per rarity (Q11)
  setId?: string;            // artifact sets — later phase (Q22)
  // ⚠ NO icon field, NO art field — icon ALWAYS resolves from slot
  //   (owner directive: every Boots shows THE boots icon, etc.)
}
```

**Owned gear instance** (inventory) vs definition:

```ts
interface OwnedGear {
  uid: string;               // instance id
  defId: string;
  enhanceLevel: number;      // Q11
  substats: SubstatRoll[];   // as rolled
  equippedBy?: string;       // owned-card uid
}
```

## 5. Skills

```ts
interface SkillDef {
  id: string;
  name: string;
  iconKey: string;               // placeholder now, owner art later
  cooldown: number;              // rounds; battle badge shows remaining (Q4)
  maxLevel: number;
  effects: EffectDef[];          // what it does — see §6
  levelScaling: Partial<Record<EffectParam, PerLevelCurve>>;
  attackPattern?: AttackPatternId; // overrides card pattern for this skill
}
```

## 6. Effects — the data-driven core

Effects are **interpreted primitives**, composed in data. New cards should combine primitives; new primitives are engine work and rare.

```ts
type EffectTrigger =
  | 'onCast'        // active skill use
  | 'onAttack' | 'onHit' | 'onKill'
  | 'onDamaged' | 'onDeath' | 'onDeploy'
  | 'onRoundStart' | 'onRoundEnd'
  | 'passive';      // constant while alive (auras, leader skills)

interface TargetFilter {
  side: 'ally' | 'enemy' | 'self';
  scope: 'single' | 'row' | 'column' | 'all' | 'random' | 'lowestHp' | 'highestHp' | 'pattern';
  pattern?: AttackPatternId;      // when scope = 'pattern'
  where?: { attackType?: AttackType; element?: ElementId; hasStatus?: StatusId };
}

type EffectAction =
  | { kind: 'damage';      amount: Magnitude }
  | { kind: 'heal';        amount: Magnitude }
  | { kind: 'shield';      amount: Magnitude; duration: Rounds }
  | { kind: 'applyStatus'; status: StatusId; duration: Rounds; potency?: Magnitude }
  | { kind: 'cleanse';     statuses: StatusId[] | 'all' }
  | { kind: 'modifyStat';  stat: StatKey; percent: number; duration: Rounds | 'battle' }
  | { kind: 'summon';      cardId: string; slotPreference: 'front' | 'back' }
  | { kind: 'taunt';       duration: Rounds };

// Magnitude is expressive but data-only:
type Magnitude =
  | { base: number }
  | { percentOfAttack: number }
  | { percentOfStrength: number; of: 'self' | 'target' };

interface EffectDef {
  trigger: EffectTrigger;
  target: TargetFilter;
  action: EffectAction;
  chance?: number;               // 0..1, rolled on rng.battle
}
```

**Status effects** (initial set, `Q20`): each a `StatusDef` with stacking rule + tick behavior:

```ts
type StatusId = 'burn' | 'poison' | 'freeze' | 'stun' | 'taunt'
              | 'weaken' | 'strengthen' | 'regen' | 'shield';

interface StatusDef {
  id: StatusId;
  iconKey: string;
  stacking: 'refresh' | 'stack' | 'ignore';
  maxStacks?: number;
  tick?: { on: 'roundStart' | 'roundEnd'; action: EffectAction };
  blocksAction?: boolean;        // freeze/stun
}
```

**Escape hatch** for genuinely unique behavior: `{ kind: 'scripted', scriptId: string }` action resolved from a
typed registry in `engine/battle/scripts.ts` — used sparingly, every entry documented.

## 7. Attack patterns

```ts
// Grid shapes over the 2×3 enemy board, anchored at the chosen target.
interface AttackPatternDef {
  id: AttackPatternId;           // 'single' | 'row' | 'column' | 'cross' | 'all' | …
  cells: [dx, dy][];             // offsets from anchor; clipped to board
  falloff?: number;              // damage multiplier for non-anchor cells
}
```

## 8. Map & encounters

```ts
interface RegionDef {
  id: string;                    // 'region.frostfjord'
  name: string;
  themeToken: string;            // background/palette set
  stageCount: number;            // ~10 (Q16)
  enemyPool: string[];           // EnemyGroupDef ids
  elitePool: string[];
  bossPool: string[];
  eventPool: string[];           // EncounterDef ids
  elementBias?: ElementId;       // node badges (Q21)
}

type StageKind = 'battle' | 'elite' | 'boss' | 'event' | 'treasure' | 'camp'; // Q16

interface GeneratedStage {       // engine/map output — lives in run save
  number: number;                // endless global index (map shows "33. FAR ISLAND")
  kind: StageKind;
  regionId: string;
  name: string;                  // from region name tables
  seed: number;
  encounterRef: string;          // enemy group or event id
  difficultyBudget: number;      // monotonic in stage number
  bestStars: 0 | 1 | 2 | 3;      // persisted record (Q17)
}

interface EncounterDef {         // non-battle vignettes (event/treasure/camp)
  id: string;
  kind: 'event' | 'treasure' | 'camp';
  prompt: string;
  choices: {
    label: string;
    requires?: Requirement;      // currency, card class present, etc.
    outcomes: WeightedOutcome[]; // rewards, statuses for next battle, loot…
  }[];
}
```

## 9. Economy

```ts
type CurrencyId = 'gold' | 'gems' | 'energy'            // energy → Q14
  | 'token_unit_t1' | 'token_unit_t2' | 'token_unit_t3' // summon tokens
  | 'token_hero' | 'fragment';                          // Q13/Q15 refine

interface LootTableDef {
  id: string;
  rolls: { weight: number; reward: RewardDef }[];
}

type RewardDef =
  | { kind: 'currency'; currency: CurrencyId; amount: NumberRange }
  | { kind: 'cardXp';   amount: NumberRange }
  | { kind: 'gearDrop'; table: GearDropSpec }   // slot/rarity weights per region
  | { kind: 'card';     cardId: string }
  | { kind: 'fragment'; cardId: string; amount: NumberRange };

interface SummonPoolDef {
  id: string;                    // 'pool.unit_t1' … 'pool.hero'
  tokenCurrency: CurrencyId;
  entries: { cardId: string; weight: number }[];
  pity?: { rarity: CardRarity; threshold: number }[]; // "Legendary 18/55"
  x10Discount?: number;
}
```

## 10. Player save (versioned — see `ARCHITECTURE.md` §7)

```ts
interface SaveDoc {
  saveVersion: number;
  createdAt: string; updatedAt: string;
  player: {
    profile: { name: string; avatarKey: string; level: number; xp: number };
    currencies: Record<CurrencyId, number>;
    cards: OwnedCard[];
    gear: OwnedGear[];
    decks: DeckConfig[];         // 1 hero + 8 units each (Q6)
    activeDeckIndex: number;
    stageRecords: Record<number, { bestStars: 0|1|2|3; clears: number }>;
    unlocks: string[];           // feature flags: forge, pools, slots…
    pity: Record<string, Record<CardRarity, number>>; // per pool
  };
  run: {
    seed: number;
    currentStage: number;
    generatedWindow: GeneratedStage[];  // rolling window around position
    pendingBattle?: { stage: number; attempt: number; intentLog: Intent[] }; // mid-battle resume
  };
  settings: { sfx: boolean; music: boolean; speed: 1 | 2; language: string; /* … */ };
}

interface OwnedCard {
  uid: string; defId: string;
  level: number; xp: number; stars: number;
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
