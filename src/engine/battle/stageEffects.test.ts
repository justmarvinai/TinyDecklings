import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { ELEMENT_AFFINITY_PERCENT } from '@/content/schemas';
import { createBattle, type BattleSetup, type BattleState } from './index';
import { CARRIED_BOON_ROUNDS } from './setup';

/**
 * What a stage brings to a fight: its element theme (Q21), its modifiers, and any
 * boon carried in from the vignette before it (Phase 4).
 */

function setup(overrides: Partial<BattleSetup> = {}): BattleSetup {
  return {
    stage: 5,
    attempt: 1,
    seed: 4242,
    player: [
      // Ice counters fire; nature does not.
      { defId: 'card.frost_imp', level: 5, stars: 2, slot: 0 },
      { defId: 'card.thorn_sprout', level: 5, stars: 1, slot: 1 },
    ],
    enemy: [
      { defId: 'card.gloom_rat', level: 3, stars: 1, slot: 0 },
      { defId: 'card.gloom_bat', level: 3, stars: 1, slot: 4 },
    ],
    ...overrides,
  };
}

const build = (overrides: Partial<BattleSetup> = {}) => createBattle(CONTENT, setup(overrides));
const card = (state: BattleState, defId: string) =>
  Object.values(state.cards).find((c) => c.defId === defId)!;

describe('element affinity (Q21)', () => {
  it('gives the counter-element card its bonus and nobody else', () => {
    const plain = build().state;
    const themed = build({ element: 'fire' }).state;

    const expected = Math.round(
      card(plain, 'card.frost_imp').baseAttack * (1 + ELEMENT_AFFINITY_PERCENT / 100),
    );
    expect(card(themed, 'card.frost_imp').baseAttack).toBe(expected);
    expect(card(themed, 'card.thorn_sprout').baseAttack).toBe(
      card(plain, 'card.thorn_sprout').baseAttack,
    );
  });

  it('stays inside the 10-15% band the owner chose', () => {
    expect(ELEMENT_AFFINITY_PERCENT).toBeGreaterThanOrEqual(10);
    expect(ELEMENT_AFFINITY_PERCENT).toBeLessThanOrEqual(15);
  });

  it('announces the bonus so the UI can show it', () => {
    const { events } = build({ element: 'fire' });
    expect(
      events.some(
        (e) =>
          e.kind === 'statModified' &&
          e.stat === 'attack' &&
          e.percent === ELEMENT_AFFINITY_PERCENT,
      ),
    ).toBe(true);
  });

  it('leaves an unthemed stage alone', () => {
    expect(build().state).toEqual(build({ element: undefined }).state);
  });
});

describe('stage modifiers', () => {
  it('scales the side the modifier names, and only that side', () => {
    const plain = build().state;
    const frenzied = build({ modifiers: ['modifier.frenzied'] }).state;

    expect(card(frenzied, 'card.gloom_rat').baseAttack).toBeGreaterThan(
      card(plain, 'card.gloom_rat').baseAttack,
    );
    expect(card(frenzied, 'card.frost_imp').baseAttack).toBe(
      card(plain, 'card.frost_imp').baseAttack,
    );
  });

  it('scales Strength into both max and current HP, so nobody starts hurt', () => {
    const state = build({ modifiers: ['modifier.ironhide'] }).state;
    const enemy = card(state, 'card.gloom_rat');
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.maxHp).toBeGreaterThan(card(build().state, 'card.gloom_rat').maxHp);
  });

  it('opens the fight with the status a modifier hangs on a side', () => {
    const state = build({ modifiers: ['modifier.scorched'] }).state;
    expect(card(state, 'card.frost_imp').statuses.map((s) => s.id)).toContain('burn');
    expect(card(state, 'card.gloom_rat').statuses).toEqual([]);
  });

  it('adds reserves without changing who starts on the board', () => {
    const plain = build().state;
    const swarmed = build({ modifiers: ['modifier.endless_tide'] }).state;

    expect(swarmed.queue.enemy.length).toBe(plain.queue.enemy.length + 2);
    const onBoard = (s: BattleState) =>
      Object.values(s.cards).filter((c) => c.side === 'enemy' && c.slot !== null).length;
    expect(onBoard(swarmed)).toBe(onBoard(plain));
  });

  it('stacks several modifiers on one stage', () => {
    const state = build({ modifiers: ['modifier.frenzied', 'modifier.ironhide'] }).state;
    const plain = build().state;
    expect(card(state, 'card.gloom_rat').baseAttack).toBeGreaterThan(
      card(plain, 'card.gloom_rat').baseAttack,
    );
    expect(card(state, 'card.gloom_rat').maxHp).toBeGreaterThan(
      card(plain, 'card.gloom_rat').maxHp,
    );
  });

  it('ignores a modifier the content does not define', () => {
    expect(build({ modifiers: ['modifier.does_not_exist'] }).state).toEqual(build().state);
  });
});

describe('carried boons', () => {
  it('hangs the vignette status on the side it names', () => {
    const state = build({
      carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
    }).state;
    expect(card(state, 'card.frost_imp').statuses.map((s) => s.id)).toContain('regen');
    expect(card(state, 'card.thorn_sprout').statuses.map((s) => s.id)).toContain('regen');
    expect(card(state, 'card.gloom_rat').statuses).toEqual([]);
  });

  it('opens the fight rather than deciding it — a few rounds, not the whole battle', () => {
    const state = build({
      carriedStatus: { status: 'poison', side: 'player', stacks: 2 },
    }).state;
    const status = card(state, 'card.frost_imp').statuses.find((s) => s.id === 'poison')!;
    expect(status.remaining).toBe(CARRIED_BOON_ROUNDS);
    expect(status.stacks).toBe(2);
  });

  it('never carries a status that would lock a side out of the fight', () => {
    for (const encounter of CONTENT.encounters.values()) {
      for (const choice of encounter.choices) {
        for (const outcome of choice.outcomes) {
          const carried = outcome.carriedStatus;
          if (!carried) continue;
          const def = CONTENT.statuses.get(carried.status)!;
          expect(def.blocksAction, `${encounter.id} carries ${carried.status}`).toBe(false);
          expect(def.tick, `${encounter.id} carries ${carried.status}`).toBeDefined();
        }
      }
    }
  });
});
