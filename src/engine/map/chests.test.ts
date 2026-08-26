import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { maxRegionStars } from '@/content/schemas';
import {
  chestKey,
  claimableChests,
  regionProgress,
  regionProgressForStage,
  regionRanges,
} from './chests';
import { authoredStageCount } from './generate';

const RANGES = regionRanges(CONTENT);
const [first] = RANGES;

/** Full marks on every stage of a region. */
function perfect(start: number, count: number): Record<string, { bestStars: number }> {
  const records: Record<string, { bestStars: number }> = {};
  for (let n = start; n < start + count; n++) records[String(n)] = { bestStars: 3 };
  return records;
}

describe('region ranges', () => {
  it('lays the authored regions end to end from stage 1', () => {
    expect(first.start).toBe(1);
    let expected = 1;
    for (const { region, start } of RANGES) {
      expect(start).toBe(expected);
      expected += region.stageCount;
    }
    expect(expected - 1).toBe(authoredStageCount(CONTENT));
  });
});

describe('star totals and chests', () => {
  it('counts only the stars earned inside the region', () => {
    const records = { '1': { bestStars: 3 }, '2': { bestStars: 2 }, '99': { bestStars: 3 } };
    const progress = regionProgress(CONTENT, first.region, first.start, records, {}, []);
    expect(progress.stars).toBe(5);
  });

  it('unlocks chests as the total passes each threshold', () => {
    const region = first.region;
    const records = { '1': { bestStars: 3 }, '2': { bestStars: 3 }, '4': { bestStars: 3 } };
    const progress = regionProgress(CONTENT, region, first.start, records, {}, []);
    expect(progress.stars).toBe(9);
    expect(progress.chests[0].unlocked).toBe(true);
    expect(progress.chests[1].unlocked).toBe(false);
  });

  it('never offers a chest twice', () => {
    const region = first.region;
    const records = perfect(first.start, region.stageCount);
    const claimed = [chestKey(region.id, region.chestThresholds[0])];
    const progress = regionProgress(CONTENT, region, first.start, records, {}, claimed);
    expect(progress.chests[0].claimed).toBe(true);
    expect(claimableChests(progress).some((c) => c.key === claimed[0])).toBe(false);
  });

  it('reports a maximum the safe road can actually reach', () => {
    for (const { region, start } of RANGES) {
      const progress = regionProgress(CONTENT, region, start, {}, {}, []);
      expect(progress.maxStars).toBe(maxRegionStars(region, 'a'));
      const highest = region.chestThresholds[region.chestThresholds.length - 1];
      expect(highest, region.id).toBeLessThanOrEqual(progress.maxStars);
    }
  });

  it('raises the maximum when the player took the risky road', () => {
    const withFork = RANGES.find(({ region }) => region.fork)!;
    const forkStart = withFork.start + withFork.region.fork!.startIndex - 1;
    const safe = regionProgress(CONTENT, withFork.region, withFork.start, {}, {}, []);
    const risky = regionProgress(
      CONTENT,
      withFork.region,
      withFork.start,
      {},
      { [String(forkStart)]: 'b' },
      [],
    );
    // The detour trades vignettes for fights, and fights are scored out of three.
    expect(risky.maxStars).toBeGreaterThan(safe.maxStars);
  });
});

describe('progress for a stage', () => {
  it('finds the region a stage sits in', () => {
    const progress = regionProgressForStage(CONTENT, 2, {}, {}, [])!;
    expect(progress.region.id).toBe(first.region.id);
  });

  it('stops at the end of the authored road — chests are a first-lap reward', () => {
    expect(regionProgressForStage(CONTENT, authoredStageCount(CONTENT) + 1, {}, {}, [])).toBeNull();
  });
});

describe('star totals stay honest', () => {
  it('never counts more stars from a stage than its kind can award', () => {
    // A vignette is worth one star however the record was written.
    const region = first.region;
    const records: Record<string, { bestStars: number }> = {};
    for (let n = first.start; n < first.start + region.stageCount; n++) {
      records[String(n)] = { bestStars: 3 };
    }
    const progress = regionProgress(CONTENT, region, first.start, records, {}, []);
    expect(progress.stars).toBe(progress.maxStars);
    expect(progress.stars).toBeLessThan(region.stageCount * 3);
  });
});
