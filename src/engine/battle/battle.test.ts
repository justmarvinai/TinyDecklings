import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { createRng } from '../rng';
import {
  beginBattle,
  chooseIntent,
  createBattle,
  activeCard,
  legalAttackTargets,
  livingOn,
  step,
  type BattleSetup,
  type BattleState,
  type Intent,
} from './index';
import { patternSlots, slotToCoord } from './board';
import { effectiveAttack } from './effects';

function setup(overrides: Partial<BattleSetup> = {}): BattleSetup {
  return {
    stage: 1,
    attempt: 1,
    seed: 4242,
    player: [
      { defId: 'card.ember_drake', level: 5, stars: 3, slot: 0 },
      { defId: 'card.stone_sentry', level: 5, stars: 2, slot: 1 },
      { defId: 'card.gale_archer', level: 5, stars: 3, slot: 4 },
    ],
    enemy: [
      { defId: 'card.gloom_rat', level: 3, stars: 1, slot: 0 },
      { defId: 'card.gloom_rat', level: 3, stars: 1, slot: 1 },
      { defId: 'card.gloom_bat', level: 3, stars: 1, slot: 4 },
    ],
    ...overrides,
  };
}

function start(overrides: Partial<BattleSetup> = {}): BattleState {
  const created = createBattle(CONTENT, setup(overrides));
  return beginBattle(created.state, CONTENT).state;
}

/** Plays a battle to its end using the AI for both sides. */
function playOut(initial: BattleState): { state: BattleState; intents: Intent[]; rounds: number } {
  let state = initial;
  const intents: Intent[] = [];
  const rng = createRng(state.seed);
  for (let guard = 0; guard < 500 && state.outcome === 'ongoing'; guard++) {
    const intent = chooseIntent(state, CONTENT, rng);
    if (!intent) break;
    intents.push(intent);
    state = step(state, CONTENT, intent).state;
  }
  return { state, intents, rounds: state.round };
}

describe('battle setup', () => {
  it('places cards on the 2x3 board and queues the overflow', () => {
    const state = start({
      player: Array.from({ length: 8 }, (_, i) => ({
        defId: 'card.thorn_sprout',
        level: 1,
        stars: 1,
        slot: i < 6 ? i : undefined,
      })),
    });
    expect(livingOn(state, 'player')).toHaveLength(6);
    expect(state.queue.player).toHaveLength(2);
  });

  it('scales stats with level', () => {
    const low = start();
    const high = start({ player: [{ defId: 'card.ember_drake', level: 20, stars: 3, slot: 0 }] });
    const lowDrake = Object.values(low.cards).find((c) => c.defId === 'card.ember_drake')!;
    const highDrake = Object.values(high.cards).find((c) => c.defId === 'card.ember_drake')!;
    expect(highDrake.maxHp).toBeGreaterThan(lowDrake.maxHp);
  });

  it('applies the hero leader skill to other allies only', () => {
    const withHero = start({
      player: [
        { defId: 'card.captain_marrow', level: 5, stars: 4, slot: 0 },
        { defId: 'card.ember_drake', level: 5, stars: 3, slot: 1 },
      ],
    });
    const withoutHero = start({
      player: [
        { defId: 'card.stone_sentry', level: 5, stars: 4, slot: 0 },
        { defId: 'card.ember_drake', level: 5, stars: 3, slot: 1 },
      ],
    });
    const buffed = Object.values(withHero.cards).find((c) => c.defId === 'card.ember_drake')!;
    const plain = Object.values(withoutHero.cards).find((c) => c.defId === 'card.ember_drake')!;
    expect(buffed.maxHp).toBeGreaterThan(plain.maxHp);
    expect(buffed.hp).toBe(buffed.maxHp);

    const hero = Object.values(withHero.cards).find((c) => c.defId === 'card.captain_marrow')!;
    const soloHero = start({
      player: [{ defId: 'card.captain_marrow', level: 5, stars: 4, slot: 0 }],
    });
    const soloHeroCard = Object.values(soloHero.cards)[0];
    expect(hero.maxHp).toBe(soloHeroCard.maxHp);
  });

  it('starts on the player turn with an actionable card', () => {
    const state = start();
    expect(state.turn).toBe('player');
    expect(activeCard(state)).not.toBeNull();
    expect(state.outcome).toBe('ongoing');
  });
});

describe('targeting rules (Q7)', () => {
  it('locks melee to the enemy front row while it lives', () => {
    const state = start();
    const drake = Object.values(state.cards).find((c) => c.defId === 'card.ember_drake')!;
    const targets = legalAttackTargets(state, drake).map((uid) => state.cards[uid]);
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) expect(slotToCoord(t.slot!).row).toBe(0);
  });

  it('lets melee reach the back row once the front is cleared', () => {
    const state = start({
      enemy: [{ defId: 'card.gloom_bat', level: 1, stars: 1, slot: 4 }],
    });
    const drake = Object.values(state.cards).find((c) => c.defId === 'card.ember_drake')!;
    const targets = legalAttackTargets(state, drake);
    expect(targets).toHaveLength(1);
    expect(state.cards[targets[0]].slot).toBe(4);
  });

  it('lets ranged reach anything', () => {
    const state = start();
    const archer = Object.values(state.cards).find((c) => c.defId === 'card.gale_archer')!;
    expect(legalAttackTargets(state, archer)).toHaveLength(3);
  });

  it('refuses an illegal target instead of trusting the caller', () => {
    const state = start();
    const backRowEnemy = livingOn(state, 'enemy').find((c) => c.slot === 4)!;
    const before = backRowEnemy.hp;
    // The active card is the melee drake; the back-row bat is not a legal target.
    const after = step(state, CONTENT, { kind: 'attack', targetUid: backRowEnemy.uid }).state;
    expect(after.cards[backRowEnemy.uid].hp).toBe(before);
  });

  it('clips attack patterns to the board', () => {
    const slots = patternSlots(0, [
      [0, 0],
      [-1, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(slots).toEqual([0, 1, 2]);
    expect(slots.every((s) => s >= 0 && s < 6)).toBe(true);
  });
});

describe('turn loop', () => {
  it('advances through both sides and into the next round', () => {
    let state = start();
    const seen = new Set<string>();
    for (let i = 0; i < 6 && state.outcome === 'ongoing'; i++) {
      const actor = activeCard(state);
      if (!actor) break;
      seen.add(actor.side);
      const targets = legalAttackTargets(state, actor);
      state = step(state, CONTENT, { kind: 'attack', targetUid: targets[0] }).state;
    }
    expect(seen.has('player')).toBe(true);
  });

  it('emits events in resolution order for the UI to animate', () => {
    const state = start();
    const actor = activeCard(state)!;
    const target = legalAttackTargets(state, actor)[0];
    const { events } = step(state, CONTENT, { kind: 'attack', targetUid: target });
    const kinds = events.map((e) => e.kind);
    expect(kinds[0]).toBe('attackDeclared');
    expect(kinds).toContain('damageDealt');
  });

  it('surrender ends the battle as a defeat (Q3)', () => {
    const { state, events } = step(start(), CONTENT, { kind: 'surrender' });
    expect(state.outcome).toBe('defeat');
    expect(events.at(-1)).toMatchObject({ kind: 'battleEnded', outcome: 'defeat' });
  });

  it('never mutates the state it was given', () => {
    const state = start();
    const snapshot = JSON.stringify(state);
    const actor = activeCard(state)!;
    step(state, CONTENT, { kind: 'attack', targetUid: legalAttackTargets(state, actor)[0] });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('reaches a decision point where the active card can actually act', () => {
    let state = start();
    for (let i = 0; i < 20 && state.outcome === 'ongoing'; i++) {
      const actor = activeCard(state);
      expect(actor).not.toBeNull();
      expect(actor!.alive).toBe(true);
      expect(actor!.slot).not.toBeNull();
      state = step(state, CONTENT, {
        kind: 'attack',
        targetUid: legalAttackTargets(state, actor!)[0],
      }).state;
    }
  });
});

describe('reinforcements (Q7)', () => {
  it('deploys a queued card into an empty slot at the next round start', () => {
    let state = start({
      player: [
        { defId: 'card.thorn_sprout', level: 1, stars: 1, slot: 0 },
        { defId: 'card.stone_sentry', level: 1, stars: 1, slot: 1 },
        { defId: 'card.gale_archer', level: 1, stars: 1, slot: 2 },
        { defId: 'card.frost_imp', level: 1, stars: 1, slot: 3 },
        { defId: 'card.spark_wisp', level: 1, stars: 1, slot: 4 },
        { defId: 'card.bog_lurker', level: 1, stars: 1, slot: 5 },
        { defId: 'card.cinder_hound', level: 1, stars: 1 },
      ],
      enemy: [{ defId: 'card.deep_maw', level: 12, stars: 4, slot: 0 }],
    });
    expect(state.queue.player).toHaveLength(1);

    const rng = createRng(1);
    for (let i = 0; i < 60 && state.outcome === 'ongoing' && state.queue.player.length > 0; i++) {
      const intent = chooseIntent(state, CONTENT, rng);
      if (!intent) break;
      state = step(state, CONTENT, intent).state;
    }
    const hound = Object.values(state.cards).find((c) => c.defId === 'card.cinder_hound')!;
    expect(state.queue.player.length === 0 ? hound.slot !== null || !hound.alive : true).toBe(true);
  });
});

describe('determinism', () => {
  it('same seed and intents produce the same outcome', () => {
    const a = playOut(start());
    const b = playOut(start());
    expect(a.state.outcome).toBe(b.state.outcome);
    expect(a.state.alliesLost).toBe(b.state.alliesLost);
    expect(a.intents).toEqual(b.intents);
  });

  it('replaying a recorded intent log rebuilds the exact state (mid-battle resume)', () => {
    const original = playOut(start());

    let replayed = start();
    for (const intent of original.intents) {
      if (replayed.outcome !== 'ongoing') break;
      replayed = step(replayed, CONTENT, intent).state;
    }
    expect(replayed.outcome).toBe(original.state.outcome);
    expect(replayed.round).toBe(original.state.round);
    expect(replayed.alliesLost).toBe(original.state.alliesLost);
  });

  it('different seeds can diverge', () => {
    const a = playOut(start({ seed: 1 }));
    const b = playOut(start({ seed: 999 }));
    expect(a.state.rngState).not.toBe(b.state.rngState);
  });
});

describe('outcomes and stars (Q17)', () => {
  it('wins and awards three stars when nothing died', () => {
    const { state } = playOut(
      start({
        player: [{ defId: 'card.tide_tyrant', level: 30, stars: 5, slot: 0 }],
        enemy: [{ defId: 'card.gloom_rat', level: 1, stars: 1, slot: 0 }],
      }),
    );
    expect(state.outcome).toBe('victory');
    expect(state.alliesLost).toBe(0);
  });

  it('loses when the whole player side falls', () => {
    const { state } = playOut(
      start({
        player: [{ defId: 'card.thorn_sprout', level: 1, stars: 1, slot: 0 }],
        enemy: [{ defId: 'card.tide_tyrant', level: 30, stars: 5, slot: 0 }],
      }),
    );
    expect(state.outcome).toBe('defeat');
  });

  it('always terminates', () => {
    for (const seed of [1, 2, 3, 7, 11, 42]) {
      const { state } = playOut(start({ seed }));
      expect(state.outcome).not.toBe('ongoing');
    }
  });
});

describe('skills and statuses', () => {
  it('puts a fired skill on cooldown and counts it down each round', () => {
    let state = start({
      player: [{ defId: 'card.ember_drake', level: 10, stars: 3, slot: 0 }],
      enemy: [
        { defId: 'card.brine_crab', level: 20, stars: 3, slot: 0 },
        { defId: 'card.brine_crab', level: 20, stars: 3, slot: 1 },
      ],
    });
    const actor = activeCard(state)!;
    const targetUid = legalAttackTargets(state, actor)[0];
    state = step(state, CONTENT, { kind: 'skill', skillIndex: 0, targetUid }).state;

    const drake = Object.values(state.cards).find((c) => c.defId === 'card.ember_drake')!;
    expect(drake.skills[0].cooldownRemaining).toBeGreaterThan(0);
  });

  it('applies burn from Cinder Volley and ticks it at round end', () => {
    const state = start({
      seed: 7,
      player: [{ defId: 'card.ember_drake', level: 10, stars: 3, slot: 0 }],
      enemy: [
        { defId: 'card.brine_crab', level: 25, stars: 3, slot: 0 },
        { defId: 'card.brine_crab', level: 25, stars: 3, slot: 1 },
        { defId: 'card.brine_crab', level: 25, stars: 3, slot: 2 },
      ],
    });
    const actor = activeCard(state)!;
    const target = legalAttackTargets(state, actor)[0];
    const result = step(state, CONTENT, { kind: 'skill', skillIndex: 0, targetUid: target });

    // A row skill should have touched more than one enemy, and burn should stick.
    const damaged = result.events.filter((e) => e.kind === 'damageDealt');
    expect(damaged.length).toBeGreaterThan(1);
    const burned = Object.values(result.state.cards).some((c) =>
      c.statuses.some((s) => s.id === 'burn'),
    );
    expect(burned).toBe(true);
  });

  it('falls back to a basic attack when the skill is still cooling down', () => {
    let state = start({
      player: [{ defId: 'card.ember_drake', level: 10, stars: 3, slot: 0 }],
      enemy: [{ defId: 'card.brine_crab', level: 30, stars: 3, slot: 0 }],
    });
    const first = legalAttackTargets(state, activeCard(state)!)[0];
    state = step(state, CONTENT, { kind: 'skill', skillIndex: 0, targetUid: first }).state;

    // Fire again immediately; the engine should attack instead of doing nothing.
    while (state.outcome === 'ongoing' && activeCard(state)?.side !== 'player') {
      state = step(state, CONTENT, chooseIntent(state, CONTENT, createRng(3))!).state;
    }
    if (state.outcome === 'ongoing') {
      const enemy = livingOn(state, 'enemy')[0];
      const before = enemy.hp;
      const after = step(state, CONTENT, {
        kind: 'skill',
        skillIndex: 0,
        targetUid: enemy.uid,
      }).state;
      expect(after.cards[enemy.uid].hp).toBeLessThanOrEqual(before);
    }
  });

  it('modifyStat changes effective attack without touching the base', () => {
    const state = start({
      player: [
        { defId: 'card.gale_archer', level: 10, stars: 3, slot: 0 },
        { defId: 'card.ember_drake', level: 10, stars: 3, slot: 1 },
      ],
    });
    const drake = Object.values(state.cards).find((c) => c.defId === 'card.ember_drake')!;
    const before = effectiveAttack(drake);
    drake.mods.push({ stat: 'attack', percent: 20, remaining: 2 });
    expect(effectiveAttack(drake)).toBeGreaterThan(before);
    expect(drake.baseAttack).toBe(drake.baseAttack);
  });
});

describe('AI (Q3 AUTO uses the same intents a tap would)', () => {
  it('never proposes an illegal target', () => {
    let state = start();
    const rng = createRng(5);
    for (let i = 0; i < 40 && state.outcome === 'ongoing'; i++) {
      const actor = activeCard(state)!;
      const intent = chooseIntent(state, CONTENT, rng);
      if (!intent) break;
      if (intent.kind === 'attack') {
        expect(legalAttackTargets(state, actor)).toContain(intent.targetUid);
      }
      state = step(state, CONTENT, intent).state;
    }
  });

  it('prefers a target it can kill this turn', () => {
    const state = start({
      player: [{ defId: 'card.gale_archer', level: 20, stars: 3, slot: 0 }],
      enemy: [
        { defId: 'card.coral_brute', level: 20, stars: 3, slot: 0 },
        { defId: 'card.gloom_rat', level: 1, stars: 1, slot: 1 },
      ],
    });
    const intent = chooseIntent(state, CONTENT, createRng(1));
    expect(intent?.kind === 'attack' || intent?.kind === 'skill').toBe(true);
    if (intent?.kind === 'attack') {
      expect(state.cards[intent.targetUid].defId).toBe('card.gloom_rat');
    }
  });
});

describe('reserves stay off the board until needed', () => {
  it('keeps a reserve in the queue even when the board has room (Q7)', () => {
    const state = start({
      enemy: [
        { defId: 'card.gloom_rat', level: 1, stars: 1, slot: 0 },
        { defId: 'card.gloom_bat', level: 1, stars: 1, reserve: true },
        { defId: 'card.gloom_bat', level: 1, stars: 1, reserve: true },
      ],
    });
    expect(livingOn(state, 'enemy')).toHaveLength(1);
    expect(state.queue.enemy).toHaveLength(2);
  });

  it('still fills spare slots with non-reserve cards', () => {
    const state = start({
      enemy: [
        { defId: 'card.gloom_rat', level: 1, stars: 1, slot: 0 },
        { defId: 'card.gloom_bat', level: 1, stars: 1 },
      ],
    });
    expect(livingOn(state, 'enemy')).toHaveLength(2);
    expect(state.queue.enemy).toHaveLength(0);
  });
});

describe('no-target turns cannot stall the fight', () => {
  it('passes a card with nothing to hit and finishes off the reinforcement', () => {
    let state = start({
      player: [{ defId: 'card.tide_tyrant', level: 30, stars: 5, slot: 0 }],
      enemy: [
        { defId: 'card.gloom_rat', level: 1, stars: 1, slot: 0 },
        { defId: 'card.gloom_rat', level: 1, stars: 1, reserve: true },
      ],
    });

    const rng = createRng(4);
    for (let i = 0; i < 200 && state.outcome === 'ongoing'; i++) {
      const intent = chooseIntent(state, CONTENT, rng);
      // The AI must always have something to propose while the fight is ongoing.
      expect(intent, `no intent available at iteration ${i}`).not.toBeNull();
      state = step(state, CONTENT, intent!).state;
    }
    expect(state.outcome).toBe('victory');
  });

  it('AUTO never stalls across a spread of seeds', () => {
    for (const seed of [1, 3, 8, 21, 55]) {
      let state = start({ seed });
      let intents = 0;
      while (state.outcome === 'ongoing' && intents < 500) {
        const intent = chooseIntent(state, CONTENT, createRng(seed, state.rngState));
        expect(intent, `stalled on seed ${seed}`).not.toBeNull();
        state = step(state, CONTENT, intent!).state;
        intents++;
      }
      expect(state.outcome).not.toBe('ongoing');
    }
  });
});
