/**
 * Seeded RNG with named streams.
 *
 * The engine never reads ambient randomness (CLAUDE.md rule 7, enforced by lint):
 * every random draw comes from an explicitly created stream. Streams are derived
 * from (rootSeed, name), so consuming randomness in one system can never shift the
 * sequence another system sees — map generation stays stable while loot rolls vary,
 * and a battle replays identically from its seed.
 */

/** Named stream identities used across the game (ARCHITECTURE.md §4). */
export const RNG_STREAMS = ['map', 'battle', 'loot', 'summon', 'event'] as const;
export type RngStreamName = (typeof RNG_STREAMS)[number];

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Uniform float in [min, max). */
  float(min: number, max: number): number;
  /** True with probability `p` (0..1). */
  chance(p: number): boolean;
  /** Uniform element. Throws on an empty list so bad content data fails loudly. */
  pick<T>(items: readonly T[]): T;
  /** Weighted element; weights must be non-negative and not all zero. */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T;
  /** Fisher-Yates copy; never mutates the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** Current internal state — persist it to resume a sequence mid-run. */
  getState(): number;
}

/** mulberry32 — small, fast, statistically fine for gameplay, trivially serialisable. */
export function createRng(seed: number, state?: number): Rng {
  let s = (state ?? seed) >>> 0;

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (min, max) => {
      if (max < min) throw new Error(`rng.int: max (${max}) < min (${min})`);
      return min + Math.floor(next() * (max - min + 1));
    },
    float: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('rng.pick: empty list');
      return items[Math.floor(next() * items.length)];
    },
    pickWeighted: (items, weightOf) => {
      if (items.length === 0) throw new Error('rng.pickWeighted: empty list');
      let total = 0;
      for (const item of items) {
        const w = weightOf(item);
        if (w < 0 || !Number.isFinite(w)) throw new Error(`rng.pickWeighted: bad weight ${w}`);
        total += w;
      }
      if (total <= 0) throw new Error('rng.pickWeighted: all weights are zero');
      let roll = next() * total;
      for (const item of items) {
        roll -= weightOf(item);
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const swap = out[i];
        out[i] = out[j];
        out[j] = swap;
      }
      return out;
    },
    getState: () => s,
  };
  return rng;
}

/** Stable 32-bit string hash (FNV-1a) — used to derive stream seeds from names. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mixes a root seed with a name so each stream is independent but reproducible. */
export function deriveSeed(rootSeed: number, name: string): number {
  return (Math.imul(rootSeed >>> 0, 0x9e3779b1) ^ hashString(name)) >>> 0;
}

export interface RngBundle {
  readonly rootSeed: number;
  /** A stream for one of the canonical systems. */
  stream(name: RngStreamName): Rng;
  /**
   * A sub-stream scoped to a specific thing — a stage, a battle attempt, a chest.
   * `fork('battle', 'stage:12#2')` is stable across sessions and independent of
   * how much randomness anything else consumed.
   */
  fork(name: RngStreamName, key: string): Rng;
}

export function createRngBundle(rootSeed: number): RngBundle {
  const streams = new Map<string, Rng>();
  const get = (key: string): Rng => {
    let rng = streams.get(key);
    if (!rng) {
      rng = createRng(deriveSeed(rootSeed, key));
      streams.set(key, rng);
    }
    return rng;
  };
  return {
    rootSeed,
    stream: (name) => get(name),
    fork: (name, key) => get(`${name}:${key}`),
  };
}
