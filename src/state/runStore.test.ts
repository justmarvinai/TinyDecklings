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
