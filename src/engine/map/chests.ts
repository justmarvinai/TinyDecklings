/**
 * Region star chests (Phase 4).
 *
 * Every region tracks the stars earned on its own stretch of road and pays out at
 * authored thresholds. They are a first-lap reward: the endless loops past the
 * authored regions re-run the fights, not the chests, so a chest is opened once
 * and stays opened.
 *
 * The registry refuses a region whose highest threshold is above what its safe
 * fork branch can earn, so no chest here is unreachable.
 */
import type { Content } from '@/content';
import type { RegionDef } from '@/content/schemas';
import { maxRegionStars, maxStarsForKind, regionPlanFor, type ForkBranch } from '@/content/schemas';
import { authoredStageCount, forkSpanFor } from './generate';

export interface ChestState {
  threshold: number;
  /** Stable id stored in the save: `<regionId>#<threshold>`. */
  key: string;
  unlocked: boolean;
  claimed: boolean;
}

export interface RegionProgress {
  region: RegionDef;
  /** Absolute stage number this region starts on, first lap. */
  startStage: number;
  stars: number;
  maxStars: number;
  chests: ChestState[];
}

export function chestKey(regionId: string, threshold: number): string {
  return `${regionId}#${threshold}`;
}

/** Where each authored region begins, first lap. */
export function regionRanges(content: Content): { region: RegionDef; start: number }[] {
  let start = 1;
  return [...content.regions.values()].map((region) => {
    const entry = { region, start };
    start += region.stageCount;
    return entry;
  });
}

/** Which branch the player walked through a region's fork, if it has one. */
function branchOf(
  content: Content,
  region: RegionDef,
  start: number,
  branches: Readonly<Record<string, ForkBranch>>,
): ForkBranch {
  if (!region.fork) return 'a';
  const span = forkSpanFor(content, start + region.fork.startIndex - 1);
  return span ? (branches[String(span.start)] ?? 'a') : 'a';
}

export function regionProgress(
  content: Content,
  region: RegionDef,
  start: number,
  stageRecords: Readonly<Record<string, { bestStars: number }>>,
  branches: Readonly<Record<string, ForkBranch>>,
  claimedChests: readonly string[],
): RegionProgress {
  const branch = branchOf(content, region, start, branches);
  const plan = regionPlanFor(region, branch);

  // Each stage contributes at most what its kind can award, so the total can never
  // read above the maximum however the record got there (Q17).
  let stars = 0;
  for (let i = 0; i < region.stageCount; i++) {
    const recorded = stageRecords[String(start + i)]?.bestStars ?? 0;
    stars += Math.min(recorded, maxStarsForKind(plan[i]));
  }
  const claimed = new Set(claimedChests);

  return {
    region,
    startStage: start,
    stars,
    maxStars: maxRegionStars(region, branch),
    chests: region.chestThresholds.map((threshold) => {
      const key = chestKey(region.id, threshold);
      return { threshold, key, unlocked: stars >= threshold, claimed: claimed.has(key) };
    }),
  };
}

/** Progress for the region a stage falls in — null past the first authored lap. */
export function regionProgressForStage(
  content: Content,
  stageNumber: number,
  stageRecords: Readonly<Record<string, { bestStars: number }>>,
  branches: Readonly<Record<string, ForkBranch>>,
  claimedChests: readonly string[],
): RegionProgress | null {
  if (stageNumber > authoredStageCount(content)) return null;
  for (const { region, start } of regionRanges(content)) {
    if (stageNumber >= start && stageNumber < start + region.stageCount) {
      return regionProgress(content, region, start, stageRecords, branches, claimedChests);
    }
  }
  return null;
}

export function claimableChests(progress: RegionProgress): ChestState[] {
  return progress.chests.filter((c) => c.unlocked && !c.claimed);
}
