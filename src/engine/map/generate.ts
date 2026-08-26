/**
 * Endless map generation.
 *
 * The reference map is a linear, numbered chain of stage medallions (Q2), so that
 * is what this produces: stages 1..N in themed regions, a boss every tenth stage,
 * enemy groups drawn per stage from the region's pool, and a difficulty budget that
 * only ever climbs. Elites, events, treasure, camps and fork nodes are Phase 4 —
 * the shape here already allows them.
 *
 * Everything derives from (runSeed, stage number), so the same save always sees the
 * same road, and generating stage 40 never disturbs stage 12.
 */
import type { Content } from '@/content';
import { BOSS_LOOT_TABLE, DIFFICULTY_CURVE } from '@/content';
import type { GeneratedStage, RegionDef, StageKind } from '@/content/schemas';
import { createRng, deriveSeed } from '../rng';

export const STAGES_PER_BOSS = 10;
export const STAGES_PER_ELITE = 5;

export function stageKindFor(stageNumber: number): StageKind {
  if (stageNumber % STAGES_PER_BOSS === 0) return 'boss';
  // Elites arrive with Phase 4; until then every non-boss stage is a battle so the
  // slice stays honest about what it actually implements.
  return 'battle';
}

/** Which region a stage falls in — regions repeat once the authored list runs out. */
export function regionForStage(content: Content, stageNumber: number): RegionDef {
  const regions = [...content.regions.values()];
  if (regions.length === 0) throw new Error('No regions registered');
  let remaining = stageNumber - 1;
  for (const region of regions) {
    if (remaining < region.stageCount) return region;
    remaining -= region.stageCount;
  }
  // Past the authored road, cycle the regions and keep going — the map is endless.
  return regions[remaining % regions.length];
}

export function difficultyBudget(stageNumber: number, kind: StageKind, region: RegionDef): number {
  const base = DIFFICULTY_CURVE.base * Math.pow(DIFFICULTY_CURVE.perStage, stageNumber - 1);
  const kindMultiplier =
    kind === 'boss'
      ? DIFFICULTY_CURVE.bossMultiplier
      : kind === 'elite'
        ? DIFFICULTY_CURVE.eliteMultiplier
        : 1;
  return Math.round(base * kindMultiplier * region.difficultyScale);
}

export function generateStage(
  content: Content,
  runSeed: number,
  stageNumber: number,
): GeneratedStage {
  const region = regionForStage(content, stageNumber);
  const kind = stageKindFor(stageNumber);
  const seed = deriveSeed(runSeed, `map:stage:${stageNumber}`);
  const rng = createRng(seed);

  const pool =
    kind === 'boss' && region.bossPool.length > 0
      ? region.bossPool
      : kind === 'elite' && region.elitePool.length > 0
        ? region.elitePool
        : region.enemyPool;

  // Walk the pool in step with the stage number so early stages stay easy and the
  // roster still varies; the rng only breaks ties past the authored list.
  const indexInRegion = (stageNumber - 1) % Math.max(1, region.stageCount);
  const encounterRef =
    kind === 'boss'
      ? pool[rng.int(0, pool.length - 1)]
      : pool[Math.min(indexInRegion, pool.length - 1)];

  const nameIndex = indexInRegion % region.nameTable.length;

  return {
    number: stageNumber,
    kind,
    regionId: region.id,
    name: region.nameTable[nameIndex],
    seed,
    encounterRef,
    difficultyBudget: difficultyBudget(stageNumber, kind, region),
    elementBias: region.elementBias,
    bestStars: 0,
  };
}

/** A rolling window of stages around the player, as persisted in the run save. */
export function generateWindow(
  content: Content,
  runSeed: number,
  currentStage: number,
  behind = 4,
  ahead = 6,
): GeneratedStage[] {
  const first = Math.max(1, currentStage - behind);
  const last = currentStage + ahead;
  const stages: GeneratedStage[] = [];
  for (let n = first; n <= last; n++) stages.push(generateStage(content, runSeed, n));
  return stages;
}

/** Loot table for a stage: bosses pay out of the boss table. */
export function lootTableForStage(content: Content, stage: GeneratedStage): string {
  if (stage.kind === 'boss') return BOSS_LOOT_TABLE;
  return regionForStage(content, stage.number).lootTable;
}

/**
 * Enemy levels scale with the stage so the authored formations stay relevant deep
 * into the endless road.
 */
export function enemyLevelBonus(stageNumber: number): number {
  return Math.floor((stageNumber - 1) / 2);
}
