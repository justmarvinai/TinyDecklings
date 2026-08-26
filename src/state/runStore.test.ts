import { beforeEach, describe, expect, it } from 'vitest';
import { createNewSave } from '@/services/saves';
import { useRunStore } from './runStore';

const store = () => useRunStore.getState();

beforeEach(() => {
  const save = createNewSave(0, 4242, 30);
  store().hydrate(save);
});

describe('run store', () => {
  it('hydrates from the save and builds a window around the player', () => {
    expect(store().seed).toBe(4242);
    expect(store().currentStage).toBe(1);
    expect(store().window.length).toBeGreaterThan(1);
    expect(store().window[0].number).toBe(1);
  });

  it('returns a stage even outside the current window', () => {
    const far = store().stage(250);
    expect(far.number).toBe(250);
  });

  it('re-windows when the player advances', () => {
    store().advanceTo(12);
    expect(store().currentStage).toBe(12);
    expect(store().window.some((s) => s.number === 12)).toBe(true);
  });

  it('never walks below stage 1', () => {
    store().advanceTo(-5);
    expect(store().currentStage).toBe(1);
  });

  it('round-trips through the save shape', () => {
    store().advanceTo(6);
    const saved = store().toSave();
    expect(saved.currentStage).toBe(6);
    expect(saved.seed).toBe(4242);
  });
});

describe('forks and boons survive the save (Q2, Phase 4)', () => {
  const forkStart = () => {
    for (let n = 1; n <= 40; n++) {
      const span = store().forkAt(n);
      if (span) return span.start;
    }
    throw new Error('no fork on the authored road');
  };

  it('threads a chosen branch into the window', () => {
    const start = forkStart();
    store().advanceTo(start);
    expect(store().branchFor(start)).toBe('a');

    store().chooseBranch(start, 'b');
    expect(store().branchFor(start)).toBe('b');
    expect(store().window.find((s) => s.number === start)?.branch).toBe('b');
  });

  it('offers both roads over the same stage numbers', () => {
    const start = forkStart();
    const { a, b } = store().forkOptions(start);
    expect(a.map((s) => s.number)).toEqual(b.map((s) => s.number));
    expect(a.map((s) => s.kind)).not.toEqual(b.map((s) => s.kind));
  });

  it('carries a boon until a fight spends it', () => {
    store().setBoon({ status: 'regen', side: 'player', stacks: 1 });
    expect(store().pendingBoon?.status).toBe('regen');
    expect(store().takeBoon()?.status).toBe('regen');
    expect(store().pendingBoon).toBeNull();
    expect(store().takeBoon()).toBeNull();
  });

  it('round-trips branch and boon through the save shape', () => {
    const start = forkStart();
    store().chooseBranch(start, 'b');
    store().setBoon({ status: 'burn', side: 'player', stacks: 2 });

    const saved = store().toSave();
    expect(saved.branches[String(start)]).toBe('b');
    expect(saved.pendingBoon).toEqual({ status: 'burn', side: 'player', stacks: 2 });

    // A fresh boot from that document lands on the same road, carrying the same thing.
    const reloaded = { ...createNewSave(0, 4242, 30) };
    reloaded.run = { ...reloaded.run, ...saved };
    store().hydrate(reloaded);
    expect(store().branchFor(start)).toBe('b');
    expect(store().pendingBoon).toEqual({ status: 'burn', side: 'player', stacks: 2 });
    expect(store().window.find((s) => s.number === start)?.branch).toBe('b');
  });
});
