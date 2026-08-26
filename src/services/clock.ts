/**
 * Time seam.
 *
 * The engine never reads ambient time (CLAUDE.md rule 7, lint-enforced). Anything
 * that needs "now" — energy regen above all (Q14b) — takes a Clock, so tests can
 * fast-forward hours deterministically.
 */

export interface Clock {
  /** Milliseconds since the epoch. */
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

/** Test/dev clock with explicit control over the passage of time. */
export function createFixedClock(
  startMs = 0,
): Clock & { advance(ms: number): void; set(ms: number): void } {
  let current = startMs;
  return {
    now: () => current,
    advance: (ms) => {
      current += ms;
    },
    set: (ms) => {
      current = ms;
    },
  };
}
