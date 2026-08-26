import { describe, expect, it } from 'vitest';
import { CONTENT, STARTER_CARD_IDS } from '@/content';
import { CARD_RARITY_BASE_STARS } from '@/content/schemas';
import { createRng } from '../rng';
import { enemyLevelBonus } from '../map/generate';
import { beginBattle, chooseIntent, createBattle, step, type CombatantSpec } from './index';

/**
 * Balance guard for the vertical slice.
 *
 * The slice has to be completable: stage 1 winnable with the starter deck as it is
 * handed out, the middle stages asking for a few levels, and the boss asking for
 * real investment. These assertions are deliberately loose — they catch "the slice
 * became unplayable", not "a number moved".
 */

function starterDeck(level: number): CombatantSpec[] {
  const cards = STARTER_CARD_IDS.map((id) => CONTENT.cards.get(id)!);
  const front = cards.filter((c) => c.attackType === 'melee').slice(0, 3);
  const back = cards.filter((c) => c.attackType === 'ranged').slice(0, 3);
  const bench = cards.filter((c) => !front.includes(c) && !back.includes(c));
  const spec = (c: (typeof cards)[number], slot?: number): CombatantSpec => ({
    defId: c.id,
    level,
    stars: CARD_RARITY_BASE_STARS[c.rarity],
    ...(slot === undefined ? {} : { slot }),
  });
  return [
    ...front.map((c, i) => spec(c, i)),
    ...back.map((c, i) => spec(c, 3 + i)),
    ...bench.map((c) => spec(c)),
  ];
}

function stageGroupId(stage: number): string {
  const region = [...CONTENT.regions.values()][0];
  return stage % 10 === 0
    ? region.bossPool[0]
    : region.enemyPool[(stage - 1) % region.enemyPool.length];
}

function simulate(stage: number, level: number, seed: number): 'victory' | 'defeat' | 'stalled' {
  const group = CONTENT.enemies.get(stageGroupId(stage))!;
  const bonus = enemyLevelBonus(stage);

  const created = createBattle(CONTENT, {
    stage,
    attempt: 1,
    seed,
    player: starterDeck(level),
    enemy: [
      ...group.members.map((m) => ({
        defId: m.cardId,
        level: m.level + bonus,
        stars: 3,
        slot: m.slot,
        isBoss: m.cardId === group.bossCardId,
      })),
      ...group.reinforcements.map((cardId) => ({
        defId: cardId,
        level: 1 + bonus,
        stars: 3,
        reserve: true,
      })),
    ],
  });

  let state = beginBattle(created.state, CONTENT).state;
  const rng = createRng(seed);
  for (let i = 0; i < 1000 && state.outcome === 'ongoing'; i++) {
    const intent = chooseIntent(state, CONTENT, rng);
    if (!intent) return 'stalled';
    state = step(state, CONTENT, intent).state;
  }
  if (state.outcome === 'ongoing') return 'stalled';
  return state.outcome;
}

const SEEDS = [1, 2, 3, 4, 5];
const winRate = (stage: number, level: number) =>
  SEEDS.filter((s) => simulate(stage, level, s) === 'victory').length / SEEDS.length;

describe('the slice is playable end to end', () => {
  it('never stalls a fight, at any stage or deck level', () => {
    for (const stage of [1, 5, 8, 10]) {
      for (const level of [1, 10, 25]) {
        for (const seed of SEEDS) {
          expect(
            simulate(stage, level, seed),
            `stage ${stage}, level ${level}, seed ${seed}`,
          ).not.toBe('stalled');
        }
      }
    }
  });

  it('lets a brand-new player win stage 1 with the deck they are given', () => {
    expect(winRate(1, 1)).toBe(1);
  });

  it('asks for a few levels by the middle of the region', () => {
    expect(winRate(8, 1)).toBeLessThan(0.5);
    expect(winRate(8, 12)).toBe(1);
  });

  it('makes the boss a real wall that levelling gets you past (Q17/Q16)', () => {
    expect(winRate(10, 5)).toBe(0);
    expect(winRate(10, 22)).toBe(1);
  });

  it('keeps difficulty climbing across the region', () => {
    // A level that comfortably clears an early stage should not clear the boss.
    expect(winRate(3, 8)).toBe(1);
    expect(winRate(10, 8)).toBeLessThan(1);
  });
});
