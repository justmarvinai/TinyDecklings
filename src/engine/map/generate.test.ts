import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import { isCombatStage, regionPlanFor } from '@/content/schemas';
import {
  authoredStageCount,
  difficultyBudget,
  enemyLevelBonus,
  forkSpanFor,
  generateForkOptions,
  generateStage,
  generateWindow,
  lootTableForStage,
  placeStage,
  regionForStage,
  stageKindFor,
} from './generate';

const TOTAL = authoredStageCount(CONTENT);

describe('stage kinds follow the region plan', () => {
  it('places every node where its region says it goes', () => {
    for (let n = 1; n <= TOTAL; n++) {
      const { region, indexInRegion } = placeStage(CONTENT, n);
      expect(stageKindFor(CONTENT, n), `stage ${n}`).toBe(region.nodePlan[indexInRegion]);
    }
  });

  it('ends every authored region on a boss (Q16)', () => {
    let stage = 0;
    for (const region of CONTENT.regions.values()) {
      stage += region.stageCount;
      expect(stageKindFor(CONTENT, stage), `stage ${stage}`).toBe('boss');
    }
  });

  it('gives every region an elite and a full mix of vignettes', () => {
    for (const region of CONTENT.regions.values()) {
      const kinds = new Set(region.nodePlan);
      expect(kinds.has('elite'), region.id).toBe(true);
      expect(kinds.has('boss'), region.id).toBe(true);
      // Battles still dominate: vignettes are the breath between fights, not the road.
      const combat = region.nodePlan.filter(isCombatStage).length;
      expect(combat, region.id).toBeGreaterThan(region.nodePlan.length / 2);
    }
  });
});

describe('generation is deterministic and endless', () => {
  it('produces the same stage for the same run seed', () => {
    expect(generateStage(CONTENT, 1234, 7)).toEqual(generateStage(CONTENT, 1234, 7));
  });

  it('produces different roads for different run seeds at boss stages', () => {
    expect(generateStage(CONTENT, 1, 10).seed).not.toBe(generateStage(CONTENT, 2, 10).seed);
  });

  it('generating a far stage does not disturb a near one', () => {
    const near = generateStage(CONTENT, 99, 3);
    generateStage(CONTENT, 99, 400);
    expect(generateStage(CONTENT, 99, 3)).toEqual(near);
  });

  it('keeps producing stages past the authored regions', () => {
    const deep = generateStage(CONTENT, 5, TOTAL * 4 + 7);
    expect(deep.number).toBe(TOTAL * 4 + 7);
    expect(deep.name).toBeTruthy();
    expect(CONTENT.regions.has(deep.regionId)).toBe(true);
  });

  it('names later laps of the same road apart', () => {
    const first = generateStage(CONTENT, 5, 1);
    const second = generateStage(CONTENT, 5, TOTAL + 1);
    expect(second.name).not.toBe(first.name);
    expect(second.name.startsWith(first.name)).toBe(true);
  });
});

describe('forks (Q2)', () => {
  const forkStart = (() => {
    for (let n = 1; n <= TOTAL; n++) if (forkSpanFor(CONTENT, n)) return n;
    throw new Error('no fork authored');
  })();

  it('spans 1 to 3 stages and rejoins', () => {
    const span = forkSpanFor(CONTENT, forkStart)!;
    expect(span.length).toBeGreaterThanOrEqual(1);
    expect(span.length).toBeLessThanOrEqual(3);
    expect(forkSpanFor(CONTENT, span.start + span.length)).toBeNull();
  });

  it('offers two different roads over the same stage numbers', () => {
    const { a, b } = generateForkOptions(CONTENT, 7, forkStart);
    expect(a.map((s) => s.number)).toEqual(b.map((s) => s.number));
    expect(a.map((s) => s.kind)).not.toEqual(b.map((s) => s.kind));
    expect(a.every((s) => s.branch === 'a')).toBe(true);
    expect(b.every((s) => s.branch === 'b')).toBe(true);
  });

  it('pays more on the risky road', () => {
    const { a, b } = generateForkOptions(CONTENT, 7, forkStart);
    const total = (stages: typeof a) => stages.reduce((sum, s) => sum + s.rewardBonusPercent, 0);
    expect(total(b)).toBeGreaterThan(total(a));
  });

  it('leaves stages outside the fork identical whichever way you went', () => {
    const span = forkSpanFor(CONTENT, forkStart)!;
    const after = span.start + span.length;
    expect(generateStage(CONTENT, 7, after, 'b')).toEqual(generateStage(CONTENT, 7, after, 'a'));
  });

  it('threads the chosen branch through the window', () => {
    const window = generateWindow(CONTENT, 7, forkStart, { [String(forkStart)]: 'b' });
    const inFork = window.find((s) => s.number === forkStart)!;
    expect(inFork.branch).toBe('b');
    expect(inFork.forkOf).toBe(forkStart);
  });
});

describe('stage modifiers', () => {
  it('never puts a modifier on an ordinary battle', () => {
    for (let n = 1; n <= TOTAL; n++) {
      const stage = generateStage(CONTENT, 11, n);
      if (stage.kind === 'battle') expect(stage.modifiers, `stage ${n}`).toEqual([]);
    }
  });

  it('always twists an elite or a boss, and never the same twist twice', () => {
    for (let n = 1; n <= TOTAL * 2; n++) {
      const stage = generateStage(CONTENT, 11, n);
      if (stage.kind !== 'elite' && stage.kind !== 'boss') continue;
      expect(stage.modifiers.length, `stage ${n}`).toBeGreaterThan(0);
      expect(new Set(stage.modifiers).size).toBe(stage.modifiers.length);
      for (const id of stage.modifiers) {
        expect(CONTENT.stageModifiers.get(id)?.appliesTo).toContain(stage.kind);
      }
    }
  });

  it('stacks more twists the deeper the road goes', () => {
    const shallow = generateStage(CONTENT, 11, 5).modifiers.length;
    const deep = generateStage(CONTENT, 11, TOTAL * 3 + 5).modifiers.length;
    expect(deep).toBeGreaterThan(shallow);
  });

  it('pays a loot bonus for every twist it prints', () => {
    const stage = generateStage(CONTENT, 11, 5);
    const expected = stage.modifiers.reduce(
      (sum, id) => sum + (CONTENT.stageModifiers.get(id)?.rewardBonusPercent ?? 0),
      0,
    );
    expect(stage.rewardBonusPercent).toBe(expected);
  });
});

describe('difficulty', () => {
  it('climbs monotonically with the stage number', () => {
    const region = regionForStage(CONTENT, 1);
    const budgets = [1, 2, 3, 5, 9].map((n) => difficultyBudget(n, 'battle', region, 0));
    expect(budgets).toEqual([...budgets].sort((a, b) => a - b));
  });

  it('spikes on elites and harder still on bosses', () => {
    const region = regionForStage(CONTENT, 10);
    const battle = difficultyBudget(10, 'battle', region, 0);
    expect(difficultyBudget(10, 'elite', region, 0)).toBeGreaterThan(battle);
    expect(difficultyBudget(10, 'boss', region, 0)).toBeGreaterThan(
      difficultyBudget(10, 'elite', region, 0),
    );
  });

  it('restarts the authored road harder on every lap', () => {
    const region = regionForStage(CONTENT, 1);
    expect(difficultyBudget(1, 'battle', region, 1)).toBeGreaterThan(
      difficultyBudget(1, 'battle', region, 0),
    );
  });

  it('raises enemy levels as the road goes on', () => {
    expect(enemyLevelBonus(CONTENT, 1)).toBe(0);
    expect(enemyLevelBonus(CONTENT, 21)).toBeGreaterThan(enemyLevelBonus(CONTENT, 5));
    expect(enemyLevelBonus(CONTENT, TOTAL + 1)).toBeGreaterThan(enemyLevelBonus(CONTENT, TOTAL));
  });
});

describe('window and loot', () => {
  it('returns a contiguous window clamped at stage 1', () => {
    const window = generateWindow(CONTENT, 7, 2);
    expect(window[0].number).toBe(1);
    for (let i = 1; i < window.length; i++) {
      expect(window[i].number).toBe(window[i - 1].number + 1);
    }
  });

  it('references content that actually exists, on both sides of every fork', () => {
    for (const branch of ['a', 'b'] as const) {
      for (let n = 1; n <= TOTAL * 2; n++) {
        const stage = generateStage(CONTENT, 3, n, branch);
        const table = isCombatStage(stage.kind) ? CONTENT.enemies : CONTENT.encounters;
        expect(
          table.has(stage.encounterRef),
          `stage ${n} (${branch}) -> ${stage.encounterRef}`,
        ).toBe(true);
      }
    }
  });

  it('pays each region out of its own tables', () => {
    for (const region of CONTENT.regions.values()) {
      const plan = regionPlanFor(region, 'a');
      const bossIndex = plan.indexOf('boss');
      let start = 1;
      for (const r of CONTENT.regions.values()) {
        if (r.id === region.id) break;
        start += r.stageCount;
      }
      const boss = generateStage(CONTENT, 3, start + bossIndex);
      expect(lootTableForStage(CONTENT, boss)).toBe(region.bossLootTable);
      const battle = generateStage(CONTENT, 3, start + plan.indexOf('battle'));
      expect(lootTableForStage(CONTENT, battle)).toBe(region.lootTable);
    }
  });
});
