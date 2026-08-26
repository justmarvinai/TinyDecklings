import { describe, expect, it } from 'vitest';
import { ENERGY_CONFIG } from '@/content';
import {
  canAfford,
  energyCost,
  energyView,
  formatDuration,
  grantEnergy,
  settleEnergy,
  spendEnergy,
  type EnergyState,
} from './energy';

const CFG = ENERGY_CONFIG;
const STEP = CFG.regenSeconds * 1000;
const T0 = 1_700_000_000_000;

const at = (current: number, anchorMs = T0): EnergyState => ({ current, regenAnchorMs: anchorMs });

describe('the owner-chosen shape (Q14b)', () => {
  it('caps at 30 and refills a point every two minutes', () => {
    expect(CFG.cap).toBe(30);
    expect(CFG.regenSeconds).toBe(120);
  });

  it('goes from empty to full in an hour', () => {
    const full = settleEnergy(at(0), CFG, T0 + 60 * 60 * 1000);
    expect(full.current).toBe(CFG.cap);
  });

  it('charges combat stages and lets vignettes through free', () => {
    expect(energyCost(CFG, 'battle')).toBe(5);
    expect(energyCost(CFG, 'elite')).toBe(6);
    expect(energyCost(CFG, 'boss')).toBe(8);
    for (const kind of ['event', 'treasure', 'camp'] as const) {
      expect(energyCost(CFG, kind)).toBe(0);
    }
  });
});

describe('regen is derived, not ticked', () => {
  it('accrues nothing before a full interval has passed', () => {
    expect(settleEnergy(at(10), CFG, T0 + STEP - 1).current).toBe(10);
  });

  it('accrues exactly one point per interval', () => {
    expect(settleEnergy(at(10), CFG, T0 + STEP).current).toBe(11);
    expect(settleEnergy(at(10), CFG, T0 + STEP * 4).current).toBe(14);
  });

  it('keeps the remainder so partial progress is never lost', () => {
    const half = settleEnergy(at(10), CFG, T0 + STEP + STEP / 2);
    expect(half.current).toBe(11);
    // Half an interval of credit carries forward.
    expect(settleEnergy(half, CFG, T0 + STEP * 2).current).toBe(12);
  });

  it('never exceeds the cap by regen alone', () => {
    expect(settleEnergy(at(0), CFG, T0 + STEP * 1000).current).toBe(CFG.cap);
  });

  it('ignores a clock that jumps backwards', () => {
    expect(settleEnergy(at(10), CFG, T0 - 999_999).current).toBe(10);
  });

  it('survives a long offline gap in one step', () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    expect(settleEnergy(at(0), CFG, T0 + week).current).toBe(CFG.cap);
  });
});

describe('spending', () => {
  it('refuses a stage the player cannot afford', () => {
    const result = spendEnergy(at(4), CFG, 'battle', T0);
    expect(result.ok).toBe(false);
    expect(result.state.current).toBe(4);
  });

  it('spends the stage cost', () => {
    const result = spendEnergy(at(30), CFG, 'boss', T0);
    expect(result.ok).toBe(true);
    expect(result.state.current).toBe(22);
  });

  it('settles regen before spending, so waiting really does help', () => {
    const result = spendEnergy(at(3), CFG, 'battle', T0 + STEP * 2);
    expect(result.ok).toBe(true);
    expect(result.state.current).toBe(0);
  });

  it('free stages always succeed and cost nothing', () => {
    const result = spendEnergy(at(0), CFG, 'camp', T0);
    expect(result.ok).toBe(true);
    expect(result.state.current).toBe(0);
  });

  it('starts a fresh interval when dropping from a full bar', () => {
    const spent = spendEnergy(at(CFG.cap, T0 - STEP * 5), CFG, 'battle', T0);
    // The idle time at cap must not be banked into an instant refill.
    expect(settleEnergy(spent.state, CFG, T0 + STEP - 1).current).toBe(CFG.cap - 5);
    expect(settleEnergy(spent.state, CFG, T0 + STEP).current).toBe(CFG.cap - 4);
  });

  it('canAfford agrees with spendEnergy', () => {
    for (const [energy, kind, expected] of [
      [5, 'battle', true],
      [4, 'battle', false],
      [8, 'boss', true],
      [7, 'boss', false],
      [0, 'event', true],
    ] as const) {
      expect(canAfford(at(energy), CFG, kind, T0)).toBe(expected);
      expect(spendEnergy(at(energy), CFG, kind, T0).ok).toBe(expected);
    }
  });
});

describe('grants may overflow the cap (Q14b)', () => {
  it('allows going above the cap', () => {
    expect(grantEnergy(at(28), CFG, 20, T0).current).toBe(48);
  });

  it('pauses regen while above the cap', () => {
    const over = grantEnergy(at(28), CFG, 20, T0);
    expect(settleEnergy(over, CFG, T0 + STEP * 10).current).toBe(48);
  });

  it('resumes regen once spending drops it back under', () => {
    const over = grantEnergy(at(CFG.cap, T0), CFG, 10, T0);
    let state = over;
    for (let i = 0; i < 3; i++) state = spendEnergy(state, CFG, 'boss', T0).state;
    expect(state.current).toBeLessThan(CFG.cap);
    expect(settleEnergy(state, CFG, T0 + STEP).current).toBe(state.current + 1);
  });

  it('never goes negative', () => {
    expect(grantEnergy(at(2), CFG, -50, T0).current).toBe(0);
  });
});

describe('the view the HUD reads', () => {
  it('reports time to the next point and to full', () => {
    const view = energyView(at(10), CFG, T0);
    expect(view.current).toBe(10);
    expect(view.cap).toBe(30);
    expect(view.msToNext).toBe(STEP);
    expect(view.msToFull).toBe(STEP * 20);
  });

  it('reports no countdown when full', () => {
    const view = energyView(at(CFG.cap), CFG, T0);
    expect(view.msToNext).toBeNull();
    expect(view.msToFull).toBeNull();
  });

  it('counts down as time passes', () => {
    const early = energyView(at(10), CFG, T0 + 30_000);
    expect(early.msToNext).toBe(STEP - 30_000);
  });

  it('formats durations readably', () => {
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(125_000)).toBe('2m 05s');
    expect(formatDuration(3_700_000)).toBe('1h 1m');
    expect(formatDuration(-5)).toBe('0s');
  });
});
