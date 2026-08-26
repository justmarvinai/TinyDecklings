/**
 * Energy — owner decision Q14, option (b).
 *
 * Generous and fast-refilling: cap 30, one point every two minutes, so an empty
 * bar is full again in an hour. Combat stages cost energy; event, treasure and
 * camp vignettes are free. Defeat does not refund — the fast regen is the cushion.
 *
 * Regen is *derived*, never ticked: the save stores the current value plus the
 * moment it was last settled, and the amount owed is computed on read from an
 * injected clock. No timer runs, closing the app loses nothing, and the engine
 * still never reads ambient time (CLAUDE.md rule 7).
 */
import type { EnergyConfig, StageKind } from '@/content/schemas';

export interface EnergyState {
  current: number;
  /** When `current` was last settled, in epoch milliseconds. */
  regenAnchorMs: number;
}

export interface EnergyView {
  current: number;
  cap: number;
  /** Milliseconds until the next point arrives, or null when full/overflowing. */
  msToNext: number | null;
  /** Milliseconds until the bar reaches the cap, or null when already there. */
  msToFull: number | null;
}

/**
 * Settles a stored energy state up to `nowMs`.
 *
 * Rewards may push energy above the cap; while it is above, regen pauses rather
 * than stacking further. A clock that jumps backwards (device time changes) is
 * clamped rather than trusted.
 */
export function settleEnergy(state: EnergyState, config: EnergyConfig, nowMs: number): EnergyState {
  const elapsed = Math.max(0, nowMs - state.regenAnchorMs);

  // Already at or above the cap: nothing accrues, but re-anchor so a later spend
  // does not retroactively earn the idle time.
  if (state.current >= config.cap) {
    return { current: state.current, regenAnchorMs: nowMs };
  }

  const stepMs = config.regenSeconds * 1000;
  const earned = Math.floor(elapsed / stepMs);
  if (earned <= 0) return state;

  const current = Math.min(config.cap, state.current + earned);
  // Keep the remainder so partial progress toward the next point is not lost.
  const consumedMs = current >= config.cap ? elapsed : earned * stepMs;
  return { current, regenAnchorMs: state.regenAnchorMs + consumedMs };
}

export function energyView(state: EnergyState, config: EnergyConfig, nowMs: number): EnergyView {
  const settled = settleEnergy(state, config, nowMs);
  if (settled.current >= config.cap) {
    return { current: settled.current, cap: config.cap, msToNext: null, msToFull: null };
  }

  const stepMs = config.regenSeconds * 1000;
  const sinceAnchor = Math.max(0, nowMs - settled.regenAnchorMs);
  const msToNext = Math.max(0, stepMs - (sinceAnchor % stepMs));
  const missing = config.cap - settled.current;
  const msToFull = msToNext + (missing - 1) * stepMs;

  return { current: settled.current, cap: config.cap, msToNext, msToFull };
}

export function energyCost(config: EnergyConfig, kind: StageKind): number {
  return config.costs[kind] ?? 0;
}

export function canAfford(
  state: EnergyState,
  config: EnergyConfig,
  kind: StageKind,
  nowMs: number,
): boolean {
  return settleEnergy(state, config, nowMs).current >= energyCost(config, kind);
}

export interface SpendResult {
  ok: boolean;
  state: EnergyState;
}

/** Spends the stage's cost, settling regen first. Free stages always succeed. */
export function spendEnergy(
  state: EnergyState,
  config: EnergyConfig,
  kind: StageKind,
  nowMs: number,
): SpendResult {
  const settled = settleEnergy(state, config, nowMs);
  const cost = energyCost(config, kind);
  if (cost === 0) return { ok: true, state: settled };
  if (settled.current < cost) return { ok: false, state: settled };

  // Dropping below the cap starts the clock from now, so the first point after a
  // spend always takes a full interval.
  const wasAtCap = settled.current >= config.cap;
  return {
    ok: true,
    state: {
      current: settled.current - cost,
      regenAnchorMs: wasAtCap ? nowMs : settled.regenAnchorMs,
    },
  };
}

/** Grants energy — from rewards or a shop refill. May overflow the cap (Q14b). */
export function grantEnergy(
  state: EnergyState,
  config: EnergyConfig,
  amount: number,
  nowMs: number,
): EnergyState {
  const settled = settleEnergy(state, config, nowMs);
  return { current: Math.max(0, settled.current + amount), regenAnchorMs: settled.regenAnchorMs };
}

/** "12m 30s" — for the HUD and the out-of-energy sheet. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}
