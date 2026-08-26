import { describe, expect, it } from 'vitest';
import { createRng, createRngBundle, deriveSeed, hashString } from './rng';

describe('createRng determinism', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = Array.from({ length: 10 }, () => createRng(1234).next());
    const b = createRng(1234);
    const seq = Array.from({ length: 10 }, () => b.next());
    expect(a[0]).toBe(seq[0]);
    expect(createRng(1234).shuffle([1, 2, 3, 4, 5])).toEqual(
      createRng(1234).shuffle([1, 2, 3, 4, 5]),
    );
  });

  it('golden sequence — a change here means saved runs would desync', () => {
    const rng = createRng(42);
    const draws = Array.from({ length: 5 }, () => Number(rng.next().toFixed(10)));
    expect(draws).toEqual([0.6011037519, 0.448290559, 0.8524657935, 0.6697340414, 0.1748138987]);
  });

  it('differs across seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('resumes exactly from a persisted state', () => {
    const a = createRng(7);
    a.next();
    a.next();
    const state = a.getState();
    const rest = [a.next(), a.next(), a.next()];
    const resumed = createRng(7, state);
    expect([resumed.next(), resumed.next(), resumed.next()]).toEqual(rest);
  });
});

describe('distribution helpers', () => {
  it('int stays in range and covers both bounds', () => {
    const rng = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it('int throws when the range is inverted', () => {
    expect(() => createRng(1).int(5, 2)).toThrow(/max/);
  });

  it('chance(0) never fires and chance(1) always fires', () => {
    const rng = createRng(5);
    for (let i = 0; i < 200; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pickWeighted respects weights within tolerance', () => {
    const rng = createRng(2024);
    const items = [
      { id: 'common', w: 90 },
      { id: 'rare', w: 10 },
    ];
    const counts: Record<string, number> = { common: 0, rare: 0 };
    for (let i = 0; i < 10_000; i++) counts[rng.pickWeighted(items, (i2) => i2.w).id]++;
    expect(counts.rare / 10_000).toBeGreaterThan(0.08);
    expect(counts.rare / 10_000).toBeLessThan(0.12);
  });

  it('pickWeighted skips zero-weight entries and rejects an all-zero table', () => {
    const rng = createRng(3);
    const items = [
      { id: 'never', w: 0 },
      { id: 'always', w: 1 },
    ];
    for (let i = 0; i < 100; i++) expect(rng.pickWeighted(items, (x) => x.w).id).toBe('always');
    expect(() => rng.pickWeighted([{ w: 0 }], (x) => x.w)).toThrow(/zero/);
  });

  it('rejects empty lists loudly so bad content data cannot pass silently', () => {
    expect(() => createRng(1).pick([])).toThrow(/empty/);
    expect(() => createRng(1).pickWeighted([], () => 1)).toThrow(/empty/);
  });

  it('shuffle permutes without mutating the input', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const frozen = [...source];
    const shuffled = createRng(11).shuffle(source);
    expect(source).toEqual(frozen);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(frozen);
  });
});

describe('named streams', () => {
  it('keeps streams independent — draining one does not shift another', () => {
    const bundle = createRngBundle(777);
    const untouched = createRngBundle(777).stream('loot').next();
    for (let i = 0; i < 500; i++) bundle.stream('battle').next();
    expect(bundle.stream('loot').next()).toBe(untouched);
  });

  it('gives different streams different sequences', () => {
    const bundle = createRngBundle(500);
    expect(bundle.stream('map').next()).not.toBe(bundle.stream('battle').next());
  });

  it('returns the same stream instance for repeated lookups', () => {
    const bundle = createRngBundle(1);
    expect(bundle.stream('map')).toBe(bundle.stream('map'));
  });

  it('forks reproducibly per key and independently across keys', () => {
    const a = createRngBundle(31).fork('battle', 'stage:12#1').next();
    const b = createRngBundle(31).fork('battle', 'stage:12#1').next();
    const other = createRngBundle(31).fork('battle', 'stage:12#2').next();
    expect(a).toBe(b);
    expect(a).not.toBe(other);
  });

  it('derives distinct seeds per name and hashes stably', () => {
    expect(deriveSeed(1, 'map')).not.toBe(deriveSeed(1, 'loot'));
    expect(deriveSeed(1, 'map')).toBe(deriveSeed(1, 'map'));
    expect(hashString('battle')).toBe(hashString('battle'));
    expect(hashString('battle')).not.toBe(hashString('loot'));
  });
});
