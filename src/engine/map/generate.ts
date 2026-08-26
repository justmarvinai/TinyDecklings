/**
 * Endless map generation.
 *
 * The road is a linear, numbered chain of stage medallions (Q2). Each authored
 * region declares what sits on each of its stages — battles, an elite, a boss,
 * and the vignettes between them — plus an optional 2-way fork. Past the last
 * authored region the road loops back through them at a higher difficulty, so
 * the map is endless without the authoring being.
 *
 * Everything derives from (runSeed, stage number), so the same save always sees
 * the same road and generating stage 40 never disturbs stage 12. The one thing
 * that is *not* derived is which side of a fork the player took: that is a
 * decision, so it lives in the save and is passed back in.
 *
 * Only stages inside a fork depend on the branch. Everything outside one is
 * generated from the region's canonical plan, which keeps the road stable no
 * matter which way the player went.
 */
import type { Content } from '@/content';
import { DIFFICULTY_CURVE, MODIFIER_COUNTS } from '@/content';
import type {
  ElementId,
  ForkBranch,
  GeneratedStage,
  RegionDef,
  StageKind,
} from '@/content/schemas';
import { ELEMENTS, regionPlanFor } from '@/content/schemas';
import { createRng, deriveSeed, type Rng } from '../rng';

/** Chance that a non-boss stage themes itself to something other than its biome. */
const OFF_ELEMENT_CHANCE = 0.35;

/** Where a stage number lands on the authored road. */
export interface StagePlacement {
  region: RegionDef;
  /** 0-based index into the region's node plan. */
  indexInRegion: number;
  /** Absolute stage number the region starts on. */
  regionStart: number;
  /** How many complete passes over the authored regions came before this one. */
  loop: number;
}

export function authoredStageCount(content: Content): number {
  return [...content.regions.values()].reduce((sum, r) => sum + r.stageCount, 0);
}

export function placeStage(content: Content, stageNumber: number): StagePlacement {
  const regions = [...content.regions.values()];
  if (regions.length === 0) throw new Error('No regions registered');

  const total = authoredStageCount(content);
  const offset = stageNumber - 1;
  const loop = Math.floor(offset / total);
  let within = offset % total;
  let regionStart = stageNumber - within;

  for (const region of regions) {
    if (within < region.stageCount) {
      return { region, indexInRegion: within, regionStart, loop };
    }
    within -= region.stageCount;
    regionStart += region.stageCount;
  }
  // Unreachable: `within` is always inside the summed stage counts.
  throw new Error(`Could not place stage ${stageNumber}`);
}

/** Which region a stage falls in — regions repeat once the authored list runs out. */
export function regionForStage(content: Content, stageNumber: number): RegionDef {
  return placeStage(content, stageNumber).region;
}

/** The absolute stage span of the fork a stage sits in, or null if it is not in one. */
export function forkSpanFor(
  content: Content,
  stageNumber: number,
): { start: number; length: number } | null {
  const { region, indexInRegion, regionStart } = placeStage(content, stageNumber);
  if (!region.fork) return null;
  const firstIndex = region.fork.startIndex - 1;
  const lastIndex = firstIndex + region.fork.length - 1;
  if (indexInRegion < firstIndex || indexInRegion > lastIndex) return null;
  return { start: regionStart + firstIndex, length: region.fork.length };
}

export function isForkStage(content: Content, stageNumber: number): boolean {
  return forkSpanFor(content, stageNumber) !== null;
}

export function stageKindFor(
  content: Content,
  stageNumber: number,
  branch: ForkBranch = 'a',
): StageKind {
  const { region, indexInRegion } = placeStage(content, stageNumber);
  return regionPlanFor(region, effectiveBranch(content, stageNumber, branch))[indexInRegion];
}

/** Outside a fork the branch is always the canonical road. */
function effectiveBranch(content: Content, stageNumber: number, branch: ForkBranch): ForkBranch {
  return isForkStage(content, stageNumber) ? branch : 'a';
}

export function difficultyBudget(
  stageNumber: number,
  kind: StageKind,
  region: RegionDef,
  loop: number,
): number {
  const base = DIFFICULTY_CURVE.base * Math.pow(DIFFICULTY_CURVE.perStage, stageNumber - 1);
  const kindMultiplier =
    kind === 'boss'
      ? DIFFICULTY_CURVE.bossMultiplier
      : kind === 'elite'
        ? DIFFICULTY_CURVE.eliteMultiplier
        : 1;
  const loopMultiplier = Math.pow(DIFFICULTY_CURVE.perLoop, loop);
  return Math.round(base * kindMultiplier * region.difficultyScale * loopMultiplier);
}

/** How many kinds of `kind` sit at or before `index` in a plan. */
function ordinalOf(plan: readonly StageKind[], index: number, kind: StageKind): number {
  let count = 0;
  for (let i = 0; i <= index; i++) if (plan[i] === kind) count++;
  return count;
}

/**
 * The twists on an elite or boss node.
 *
 * The count climbs with depth (`MODIFIER_COUNTS`), so a first-region elite wears
 * one and a deep one wears three. Never the same twist twice on one stage.
 */
export function rollModifiers(
  content: Content,
  region: RegionDef,
  kind: StageKind,
  stageNumber: number,
  rng: Rng,
): string[] {
  const rule =
    kind === 'elite' ? MODIFIER_COUNTS.elite : kind === 'boss' ? MODIFIER_COUNTS.boss : null;
  if (!rule) return [];

  const eligible = region.modifierPool.filter((id) =>
    content.stageModifiers.get(id)?.appliesTo.includes(kind),
  );
  if (eligible.length === 0) return [];

  const wanted = Math.min(rule.max, rule.base + Math.floor(stageNumber / rule.perStages));
  const picked: string[] = [];
  const remaining = [...eligible];
  for (let i = 0; i < wanted && remaining.length > 0; i++) {
    const index = rng.int(0, remaining.length - 1);
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return picked;
}

/** Total loot bonus a stage carries, from its modifiers and its fork branch. */
export function rewardBonusFor(
  content: Content,
  region: RegionDef,
  modifiers: readonly string[],
  branch: ForkBranch | undefined,
): number {
  const fromModifiers = modifiers.reduce(
    (sum, id) => sum + (content.stageModifiers.get(id)?.rewardBonusPercent ?? 0),
    0,
  );
  const fromFork = branch === 'b' ? (region.fork?.riskyRewardBonusPercent ?? 0) : 0;
  return fromModifiers + fromFork;
}

const LOOP_NUMERALS = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

function stageName(
  region: RegionDef,
  indexInRegion: number,
  loop: number,
  branch?: ForkBranch,
): string {
  const table = region.nameTable;
  // Both sides of a fork occupy the same number, so they take their names from
  // opposite halves of the table rather than sharing one with a suffix bolted on.
  const offset = branch === 'b' ? Math.floor(table.length / 2) : 0;
  const base = table[(indexInRegion + offset) % table.length];
  return `${base}${LOOP_NUMERALS[Math.min(loop, LOOP_NUMERALS.length - 1)]}`;
}

/** Which enemy group, encounter or boss sits on a stage. */
function referenceFor(
  content: Content,
  region: RegionDef,
  plan: readonly StageKind[],
  indexInRegion: number,
  kind: StageKind,
  loop: number,
  rng: Rng,
): string {
  const ordinal = ordinalOf(plan, indexInRegion, kind);

  if (kind === 'boss') {
    return region.bossPool[loop % region.bossPool.length];
  }
  if (kind === 'elite') {
    return region.elitePool[(ordinal - 1 + loop) % region.elitePool.length];
  }
  if (kind === 'battle') {
    const pool = region.enemyPool;
    // The first pass walks the pool in order so the region ramps; later loops
    // rotate it so the same road does not replay in the same sequence.
    return loop === 0
      ? pool[Math.min(ordinal - 1, pool.length - 1)]
      : pool[(ordinal - 1 + loop * 3) % pool.length];
  }

  const vignettes = region.eventPool.filter((id) => content.encounters.get(id)?.kind === kind);
  // The registry refuses a region that plans a vignette kind it has no encounter
  // for, so this pool is never empty in shipped content.
  return vignettes.length > 0 ? rng.pick(vignettes) : region.eventPool[0];
}

function elementFor(region: RegionDef, kind: StageKind, rng: Rng): ElementId | undefined {
  if (!region.elementBias) return undefined;
  // A boss always fights on its own ground; ordinary stages sometimes theme
  // themselves to something else, so the counter bonus is worth planning for (Q21).
  if (kind === 'boss' || !rng.chance(OFF_ELEMENT_CHANCE)) return region.elementBias;
  const others = ELEMENTS.filter((e) => e !== region.elementBias);
  return rng.pick(others);
}

export function generateStage(
  content: Content,
  runSeed: number,
  stageNumber: number,
  branch: ForkBranch = 'a',
): GeneratedStage {
  const { region, indexInRegion, loop } = placeStage(content, stageNumber);
  const inFork = isForkStage(content, stageNumber);
  const side = inFork ? branch : 'a';

  const plan = regionPlanFor(region, side);
  const kind = plan[indexInRegion];

  const seed = deriveSeed(runSeed, `map:stage:${stageNumber}:${side}`);
  const rng = createRng(seed);

  const encounterRef = referenceFor(content, region, plan, indexInRegion, kind, loop, rng);
  const elementBias = elementFor(region, kind, rng);
  const modifiers = rollModifiers(content, region, kind, stageNumber, rng);
  const forkBranch = inFork ? side : undefined;

  return {
    number: stageNumber,
    kind,
    regionId: region.id,
    name: stageName(region, indexInRegion, loop, forkBranch),
    seed,
    encounterRef,
    difficultyBudget: difficultyBudget(stageNumber, kind, region, loop),
    ...(elementBias ? { elementBias } : {}),
    bestStars: 0,
    modifiers,
    rewardBonusPercent: rewardBonusFor(content, region, modifiers, forkBranch),
    ...(inFork ? { forkOf: forkSpanFor(content, stageNumber)!.start, branch: side } : {}),
  };
}

/** Both sides of the fork starting at `forkStart`, for the map's choice UI. */
export function generateForkOptions(
  content: Content,
  runSeed: number,
  forkStart: number,
): Record<ForkBranch, GeneratedStage[]> {
  const span = forkSpanFor(content, forkStart);
  if (!span) return { a: [], b: [] };
  const build = (branch: ForkBranch) =>
    Array.from({ length: span.length }, (_, i) =>
      generateStage(content, runSeed, span.start + i, branch),
    );
  return { a: build('a'), b: build('b') };
}

/** A rolling window of stages around the player, as persisted in the run save. */
export function generateWindow(
  content: Content,
  runSeed: number,
  currentStage: number,
  branches: Readonly<Record<string, ForkBranch>> = {},
  behind = 4,
  ahead = 6,
): GeneratedStage[] {
  const first = Math.max(1, currentStage - behind);
  const last = currentStage + ahead;
  const stages: GeneratedStage[] = [];
  for (let n = first; n <= last; n++) {
    const span = forkSpanFor(content, n);
    const branch = span ? (branches[String(span.start)] ?? 'a') : 'a';
    stages.push(generateStage(content, runSeed, n, branch));
  }
  return stages;
}

/** Loot table for a stage: bosses pay out of their region's boss table. */
export function lootTableForStage(content: Content, stage: GeneratedStage): string {
  const region = content.regions.get(stage.regionId) ?? regionForStage(content, stage.number);
  return stage.kind === 'boss' ? region.bossLootTable : region.lootTable;
}

/**
 * Extra enemy levels an elite node carries.
 *
 * The difficulty curve says an elite is worth ~1.4 ordinary stages; levels are the
 * lever that actually delivers that, so the multiplier is spent here rather than
 * sitting in `difficultyBudget` as a number nothing reads. Bosses get none: a boss
 * formation is already the region's hardest, authored that way.
 */
export const ELITE_LEVEL_BONUS = 5;

export function kindLevelBonus(kind: StageKind): number {
  return kind === 'elite' ? ELITE_LEVEL_BONUS : 0;
}

/**
 * Enemy levels scale with the stage so the authored formations stay relevant deep
 * into the endless road.
 *
 * Within a pass the climb is gentle — the regions already author rising levels —
 * and each completed pass adds a flat jump on top, which is what actually makes
 * the second lap of the road a different fight.
 */
export function enemyLevelBonus(content: Content, stageNumber: number): number {
  const total = authoredStageCount(content);
  const loop = Math.floor((stageNumber - 1) / total);
  const within = (stageNumber - 1) % total;
  return Math.floor(within / 2) + loop * Math.round(total * 1.5);
}
