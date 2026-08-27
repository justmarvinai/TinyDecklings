import { describe, expect, it } from 'vitest';
import { CONTENT, STARTER_CARD_IDS } from '@/content';
import { CARD_RARITY_BASE_STARS, isCombatStage } from '@/content/schemas';
import { createRng } from '../rng';
import { authoredStageCount, generateStage } from '../map/generate';
import { battleSetupFor } from '../map/stageBattle';
import { beginBattle, chooseIntent, createBattle, step, type CombatantSpec } from './index';

/**
 * Balance guard for the whole authored road.
 *
 * The road has to be walkable: stage 1 winnable with the starter deck as it is
 * handed out, the middle of a region asking for a few levels, and a boss asking
 * for real investment — in every biome, on both sides of every fork. These
 * assertions are deliberately loose. They catch "a region became unplayable" and
 * "a fight can hang", not "a number moved".
 */

const SEED = 4242;
const TOTAL = authoredStageCount(CONTENT);

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

type Result = 'victory' | 'defeat' | 'stalled';

function simulate(
  stageNumber: number,
  level: number,
  seed: number,
  branch: 'a' | 'b' = 'a',
): Result {
  const generated = generateStage(CONTENT, SEED, stageNumber, branch);
  const setup = battleSetupFor(CONTENT, generated, {
    player: starterDeck(level),
    seed,
    attempt: 1,
  });
  if (!setup) throw new Error(`Stage ${stageNumber} has no fight to simulate`);

  let state = beginBattle(createBattle(CONTENT, setup).state, CONTENT).state;
  const rng = createRng(seed);
  for (let i = 0; i < 1500 && state.outcome === 'ongoing'; i++) {
    const intent = chooseIntent(state, CONTENT, rng);
    if (!intent) return 'stalled';
    state = step(state, CONTENT, intent).state;
  }
  if (state.outcome === 'ongoing') return 'stalled';
  return state.outcome;
}

const SEEDS = [1, 2, 3, 4, 5];
const winRate = (stage: number, level: number, branch: 'a' | 'b' = 'a') =>
  SEEDS.filter((s) => simulate(stage, level, s, branch) === 'victory').length / SEEDS.length;

/** Every combat stage on the authored road, on the branch that reaches it. */
function combatStages(branch: 'a' | 'b'): number[] {
  const stages: number[] = [];
  for (let n = 1; n <= TOTAL; n++) {
    if (isCombatStage(generateStage(CONTENT, SEED, n, branch).kind)) stages.push(n);
  }
  return stages;
}

describe('no fight can hang', () => {
  it('resolves every combat stage on both sides of every fork', () => {
    for (const branch of ['a', 'b'] as const) {
      for (const stage of combatStages(branch)) {
        // A high level so the fight ends by winning rather than by dying early —
        // stalls hide behind quick defeats.
        expect(simulate(stage, 60, 7, branch), `stage ${stage} (${branch})`).not.toBe('stalled');
      }
    }
  });

  it('resolves deep endless stages too', () => {
    for (const stage of [TOTAL + 5, TOTAL * 2 + 10, TOTAL * 3 + 5]) {
      expect(simulate(stage, 200, 3), `stage ${stage}`).not.toBe('stalled');
    }
  });
});

describe('every card in the roster can actually fight', () => {
  /** One card, at six stars so all five of its skills are unlocked, against a real formation. */
  function soloRun(defId: string, seed: number): Result {
    const generated = generateStage(CONTENT, SEED, 4);
    const setup = battleSetupFor(CONTENT, generated, {
      player: [
        { defId, level: 60, stars: 6, slot: 0 },
        { defId, level: 60, stars: 6, slot: 3 },
      ],
      seed,
      attempt: 1,
    });
    if (!setup) throw new Error('no fight to simulate');

    let state = beginBattle(createBattle(CONTENT, setup).state, CONTENT).state;
    const rng = createRng(seed);
    for (let i = 0; i < 1500 && state.outcome === 'ongoing'; i++) {
      const intent = chooseIntent(state, CONTENT, rng);
      if (!intent) return 'stalled';
      state = step(state, CONTENT, intent).state;
    }
    return state.outcome === 'ongoing' ? 'stalled' : state.outcome;
  }

  it('resolves a fight for every collectible card, with all five skills live', () => {
    // Thirty-six cards times five skills is a lot of authored effect data; this is
    // the sweep that catches one of them targeting something that is never there.
    for (const card of CONTENT.cards.values()) {
      if (card.enemyOnly) continue;
      expect(soloRun(card.id, 11), `${card.id} hangs`).not.toBe('stalled');
    }
  });

  it('hits the first-release roster targets (Q29)', () => {
    const collectible = [...CONTENT.cards.values()].filter((c) => !c.enemyOnly);
    expect(collectible.filter((c) => c.cardClass === 'unit').length).toBeGreaterThanOrEqual(30);
    expect(collectible.filter((c) => c.cardClass === 'hero').length).toBeGreaterThanOrEqual(6);
    expect(CONTENT.gear.size).toBeGreaterThanOrEqual(40);
    expect(CONTENT.regions.size).toBe(3);
    for (const region of CONTENT.regions.values()) {
      expect(region.bossPool.length, region.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('gives every rarity something to pull at every tier', () => {
    for (const pool of CONTENT.summonPools.values()) {
      expect(pool.entries.length, `${pool.id} is thin`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('the first region is a fair on-ramp', () => {
  it('lets a brand-new player win stage 1 with the deck they are given', () => {
    expect(winRate(1, 1)).toBe(1);
  });

  it('asks for a few levels by the middle of the region', () => {
    expect(winRate(9, 1)).toBeLessThan(0.5);
    expect(winRate(9, 14)).toBe(1);
  });

  it('makes the boss a real wall that levelling gets you past (Q16/Q17)', () => {
    expect(winRate(10, 5)).toBe(0);
    expect(winRate(10, 26)).toBe(1);
  });
});

describe('the road keeps climbing', () => {
  it('makes each region boss ask more than the one before it', () => {
    expect(winRate(10, 22)).toBe(1);
    expect(winRate(20, 22)).toBe(0);
    expect(winRate(20, 50)).toBe(1);
    expect(winRate(30, 50)).toBe(0);
    expect(winRate(30, 80)).toBe(1);
  });

  it('opens each region with a breather rather than a second wall', () => {
    // Whatever the last boss demanded should walk into the next region's first
    // fight. A region ramps; it does not open on a cliff.
    expect(winRate(11, 22)).toBe(1);
    expect(winRate(21, 50)).toBe(1);
  });
});

describe('elites and forks are the risk they advertise', () => {
  it('makes an elite a wall the battles around it are not', () => {
    const level = 10;
    expect(winRate(7, level)).toBe(1);
    expect(winRate(6, level, 'b')).toBe(0);
  });

  it('pays more for taking the risky road', () => {
    const safe = generateStage(CONTENT, SEED, 6, 'a');
    const risky = generateStage(CONTENT, SEED, 6, 'b');
    expect(risky.rewardBonusPercent).toBeGreaterThan(safe.rewardBonusPercent);
  });
});
