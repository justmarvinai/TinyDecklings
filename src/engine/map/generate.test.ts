import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import {
  STAGES_PER_BOSS,
  difficultyBudget,
  enemyLevelBonus,
  generateStage,
  generateWindow,
  lootTableForStage,
  regionForStage,
  stageKindFor,
} from './generate';

describe('stage kinds', () => {
  it('puts a boss on every tenth stage (Q16)', () => {
    expect(stageKindFor(STAGES_PER_BOSS)).toBe('boss');
    expect(stageKindFor(STAGES_PER_BOSS * 2)).toBe('boss');
    expect(stageKindFor(1)).toBe('battle');
    expect(stageKindFor(9)).toBe('battle');
  });
});

describe('generation is deterministic and endless', () => {
  it('produces the same stage for the same run seed', () => {
    expect(generateStage(CONTENT, 1234, 7)).toEqual(generateStage(CONTENT, 1234, 7));
  });

  it('produces different roads for different run seeds at boss stages', () => {
    const a = generateStage(CONTENT, 1, 10);
    const b = generateStage(CONTENT, 2, 10);
    expect(a.seed).not.toBe(b.seed);
  });

  it('generating a far stage does not disturb a near one', () => {
    const near = generateStage(CONTENT, 99, 3);
    generateStage(CONTENT, 99, 400);
    expect(generateStage(CONTENT, 99, 3)).toEqual(near);
  });

  it('keeps producing stages past the authored region', () => {
    const deep = generateStage(CONTENT, 5, 137);
    expect(deep.number).toBe(137);
    expect(deep.name).toBeTruthy();
    expect(CONTENT.regions.has(deep.regionId)).toBe(true);
  });
});

describe('difficulty', () => {
  it('climbs monotonically with the stage number', () => {
    const region = regionForStage(CONTENT, 1);
    const budgets = [1, 2, 3, 5, 9].map((n) => difficultyBudget(n, 'battle', region));
    expect(budgets).toEqual([...budgets].sort((a, b) => a - b));
  });

  it('spikes on bosses', () => {
    const region = regionForStage(CONTENT, 10);
    expect(difficultyBudget(10, 'boss', region)).toBeGreaterThan(
      difficultyBudget(10, 'battle', region),
    );
  });

  it('raises enemy levels as the road goes on', () => {
    expect(enemyLevelBonus(1)).toBe(0);
    expect(enemyLevelBonus(21)).toBeGreaterThan(enemyLevelBonus(5));
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

  it('references only enemy groups that exist', () => {
    for (let n = 1; n <= 25; n++) {
      const stage = generateStage(CONTENT, 3, n);
      expect(CONTENT.enemies.has(stage.encounterRef), `stage ${n} -> ${stage.encounterRef}`).toBe(
        true,
      );
    }
  });

  it('pays bosses out of the boss table', () => {
    const boss = generateStage(CONTENT, 3, 10);
    const normal = generateStage(CONTENT, 3, 4);
    expect(lootTableForStage(CONTENT, boss)).toBe('loot.slice_boss');
    expect(lootTableForStage(CONTENT, normal)).toBe('loot.slice_battle');
    expect(CONTENT.lootTables.has(lootTableForStage(CONTENT, boss))).toBe(true);
  });
});
