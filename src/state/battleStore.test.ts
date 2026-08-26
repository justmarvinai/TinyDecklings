import { beforeEach, describe, expect, it } from 'vitest';
import { createNewSave } from '@/services/saves';
import type { BattleSetup, Intent } from '@/engine/battle';
import { useBattleStore } from './battleStore';
import { usePlayerStore } from './playerStore';
import { useRunStore } from './runStore';

const setup: BattleSetup = {
  stage: 1,
  attempt: 1,
  seed: 555,
  player: [
    { defId: 'card.ember_drake', level: 8, stars: 3, slot: 0 },
    { defId: 'card.gale_archer', level: 8, stars: 3, slot: 3 },
  ],
  enemy: [
    { defId: 'card.gloom_rat', level: 2, stars: 1, slot: 0 },
    { defId: 'card.gloom_bat', level: 2, stars: 1, slot: 4 },
  ],
};

const battle = () => useBattleStore.getState();

beforeEach(() => {
  const save = createNewSave(0, 555, 30);
  usePlayerStore.setState({ save });
  useRunStore.getState().hydrate(save);
  battle().clear();
});

/** Plays the fight out with the AI, recording what was played. */
function autoPlay(limit = 300): Intent[] {
  for (let i = 0; i < limit; i++) {
    const state = battle().state;
    if (!state || state.outcome !== 'ongoing') break;
    if (!battle().stepAi()) break;
  }
  return battle().intentLog;
}

describe('battle store', () => {
  it('starts a fight and queues its opening events for the UI', () => {
    battle().start(setup);
    expect(battle().state?.outcome).toBe('ongoing');
    const events = battle().consumeEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(battle().consumeEvents()).toHaveLength(0);
  });

  it('records every intent so the fight can be replayed', () => {
    battle().start(setup);
    battle().stepAi();
    expect(battle().intentLog).toHaveLength(1);
  });

  it('resume replays an intent log back to the same board (task 1.17)', () => {
    battle().start(setup);
    const intents = autoPlay();
    const finished = battle().state!;

    battle().clear();
    battle().resume(setup, intents);
    const resumed = battle().state!;

    expect(resumed.outcome).toBe(finished.outcome);
    expect(resumed.round).toBe(finished.round);
    expect(resumed.alliesLost).toBe(finished.alliesLost);
    expect(Object.values(resumed.cards).map((c) => c.hp)).toEqual(
      Object.values(finished.cards).map((c) => c.hp),
    );
  });

  it('offers an unfinished fight for saving and nothing once it is over', () => {
    battle().start(setup);
    battle().stepAi();
    const snapshot = battle().toSave();
    expect(snapshot?.stage).toBe(1);
    expect(snapshot?.intentLog.length).toBeGreaterThan(0);

    autoPlay();
    expect(battle().toSave()).toBeNull();
  });

  it('banks the result exactly once', () => {
    battle().start(setup);
    autoPlay();

    const goldBefore = usePlayerStore.getState().currency('gold');
    const first = battle().finish();
    const goldAfter = usePlayerStore.getState().currency('gold');
    const second = battle().finish();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    // Calling finish twice must not pay out twice.
    expect(usePlayerStore.getState().currency('gold')).toBe(goldAfter);
    if (first?.outcome === 'victory') expect(goldAfter).toBeGreaterThan(goldBefore);
  });

  it('records the stage and advances the run on a win', () => {
    battle().start(setup);
    autoPlay();
    const result = battle().finish();
    if (result?.outcome === 'victory') {
      expect(usePlayerStore.getState().bestStars(1)).toBeGreaterThan(0);
      expect(useRunStore.getState().currentStage).toBe(2);
    }
  });

  it('clears everything between fights', () => {
    battle().start(setup);
    battle().clear();
    expect(battle().state).toBeNull();
    expect(battle().intentLog).toHaveLength(0);
    expect(battle().result).toBeNull();
  });
});
