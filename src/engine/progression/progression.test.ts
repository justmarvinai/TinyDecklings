import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { applyXp, levelCap, levelUpGoldCost, powerRating, statAt, xpForNextLevel } from './index';

const curve = CONTENT.growthCurves.get('growth.rare')!;

describe('stat growth', () => {
  it('returns the base at level 1', () => {
    expect(statAt(500, 1, curve)).toBe(500);
    expect(statAt(500, 0, curve)).toBe(500);
  });

  it('compounds and is monotonic', () => {
    const values = [1, 2, 5, 10, 20].map((level) => statAt(500, level, curve));
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[4]).toBeGreaterThan(values[0]);
  });

  it('golden table — a change here rebalances every existing save', () => {
    expect([1, 5, 10, 20].map((l) => statAt(560, l, curve))).toEqual([560, 762, 1119, 2417]);
  });
});

describe('levels and XP', () => {
  it('caps level at levelsPerStar x stars', () => {
    expect(levelCap(1, curve)).toBe(10);
    expect(levelCap(3, curve)).toBe(30);
    expect(levelCap(6, curve)).toBe(60);
  });

  it('needs progressively more XP per level', () => {
    expect(xpForNextLevel(2, curve)).toBeGreaterThan(xpForNextLevel(1, curve));
    expect(xpForNextLevel(10, curve)).toBeGreaterThan(xpForNextLevel(9, curve));
  });

  it('rolls multiple levels from one big XP award', () => {
    const result = applyXp(1, 0, 10_000, 3, curve);
    expect(result.levelsGained).toBeGreaterThan(1);
    expect(result.level).toBeLessThanOrEqual(levelCap(3, curve));
  });

  it('banks leftover XP below the cap instead of losing it', () => {
    const need = xpForNextLevel(1, curve);
    const result = applyXp(1, 0, need + 5, 3, curve);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(5);
    expect(result.overflow).toBe(0);
  });

  it('stops at the star-gated cap and reports overflow', () => {
    const result = applyXp(1, 0, 999_999, 1, curve);
    expect(result.level).toBe(levelCap(1, curve));
    expect(result.overflow).toBeGreaterThan(0);
    expect(result.xp).toBe(0);
  });

  it('ignores negative XP', () => {
    expect(applyXp(4, 20, -500, 3, curve)).toMatchObject({ level: 4, xp: 20 });
  });

  it('charges more gold at higher levels', () => {
    expect(levelUpGoldCost(10)).toBeGreaterThan(levelUpGoldCost(1));
  });
});

describe('power rating', () => {
  it('rises with every input', () => {
    const base = { strength: 500, attack: 60, speed: 10, stars: 3, skillLevels: [1] };
    const stronger = powerRating({ ...base, strength: 600 });
    expect(stronger).toBeGreaterThan(powerRating(base));
    expect(powerRating({ ...base, attack: 70 })).toBeGreaterThan(powerRating(base));
    expect(powerRating({ ...base, stars: 4 })).toBeGreaterThan(powerRating(base));
    expect(powerRating({ ...base, skillLevels: [3] })).toBeGreaterThan(powerRating(base));
  });
});
