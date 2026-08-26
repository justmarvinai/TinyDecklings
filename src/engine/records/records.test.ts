import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import type { ProfileSource } from './profile';
import { PROFILE_METRICS } from '@/content/schemas';
import { authoredStageCount, forkSpanFor, generateStage } from '../map/generate';
import { chestKey } from '../map/chests';
import { commanderLevel, profileRecord, STARS_PER_LEVEL, totalStarsOf } from './profile';
import {
  achievementStates,
  claimableAchievements,
  earnedCount,
  groupAchievements,
} from './achievements';

const TOTAL = authoredStageCount(CONTENT);

/**
 * A blank record source, shaped like the real save without importing it.
 *
 * The engine describes what it reads structurally (`ProfileSource`), so its tests
 * should not need the save module at all — and the `satisfies` below proves the
 * fixture is a legitimate stand-in rather than a convenient fiction.
 */
interface Fixture {
  createdAtMs: number;
  player: {
    profile: { name: string };
    currencies: Record<string, number>;
    cards: {
      uid: string;
      defId: string;
      level: number;
      xp: number;
      stars: number;
      skillLevels: number[];
      favorite: boolean;
      equippedGear: Record<string, string>;
    }[];
    gear: unknown[];
    stageRecords: Record<string, { bestStars: number; clears: number }>;
    summonCounts: Record<string, number>;
    claimedChests: string[];
    claimedAchievements: string[];
    stats: { battlesLost: number };
  };
  run: { seed: number; branches: Record<string, 'a' | 'b'> };
}

function blank(): Fixture {
  return {
    createdAtMs: 0,
    player: {
      profile: { name: 'Deckling' },
      currencies: {} as Record<string, number>,
      cards: [] as Fixture['player']['cards'],
      gear: [] as unknown[],
      stageRecords: {} as Record<string, { bestStars: number; clears: number }>,
      summonCounts: {} as Record<string, number>,
      claimedChests: [] as string[],
      claimedAchievements: [] as string[],
      stats: { battlesLost: 0 },
    },
    run: { seed: 4242, branches: {} as Record<string, 'a' | 'b'> },
  };
}

/** Compile-time proof that the fixture is a legitimate stand-in for a real save. */
const _isASource: ProfileSource = blank();
void _isASource;

/** Records a clear on `stage`, at the stars its kind can award. */
function clear(save: Fixture, stage: number, stars: number, clears = 1): void {
  save.player.stageRecords[String(stage)] = { bestStars: stars, clears };
}

function kindOf(stage: number, branch: 'a' | 'b' = 'a') {
  return generateStage(CONTENT, 4242, stage, branch).kind;
}

describe('the profile is derived, not tallied', () => {
  it('reads a brand-new save as a blank record', () => {
    const record = profileRecord(CONTENT, blank());
    expect(record.journey.furthestStage).toBe(0);
    expect(record.journey.battlesWon).toBe(0);
    expect(record.collection.distinct).toBe(0);
    expect(record.collection.collectible).toBeGreaterThan(0);
    for (const metric of PROFILE_METRICS) {
      expect(record.metrics[metric], metric).toBe(0);
    }
  });

  it('exposes every metric the achievement schema can name', () => {
    const record = profileRecord(CONTENT, blank());
    expect(Object.keys(record.metrics).sort()).toEqual([...PROFILE_METRICS].sort());
  });

  it('counts stars, clears and the furthest stage from the stage records', () => {
    const save = blank();
    clear(save, 1, 3, 2);
    clear(save, 2, 2, 1);
    clear(save, 4, 1, 3);

    const record = profileRecord(CONTENT, save);
    expect(record.journey.totalStars).toBe(6);
    expect(record.journey.flawlessClears).toBe(1);
    expect(record.journey.stagesCleared).toBe(3);
    expect(record.journey.furthestStage).toBe(4);
  });

  it('keeps battles won apart from vignettes walked', () => {
    const save = blank();
    // Region one's plan puts battles at 1 and 2 and an event at 3.
    clear(save, 1, 3, 2);
    clear(save, 2, 3, 1);
    clear(save, 3, 1, 1);

    expect(kindOf(1)).toBe('battle');
    expect(kindOf(3)).toBe('event');

    const record = profileRecord(CONTENT, save);
    expect(record.journey.battlesWon).toBe(3);
    expect(record.journey.vignettesResolved).toBe(1);
  });

  it('takes losses from the one number that is tracked', () => {
    const save = blank();
    save.player.stats.battlesLost = 7;
    expect(profileRecord(CONTENT, save).journey.battlesLost).toBe(7);
  });

  it('counts a region cleared only when its boss falls', () => {
    const save = blank();
    for (let n = 1; n <= 9; n++) clear(save, n, 3);
    expect(profileRecord(CONTENT, save).journey.regionsCleared).toBe(0);
    clear(save, 10, 1);
    expect(profileRecord(CONTENT, save).journey.regionsCleared).toBe(1);
  });

  it('counts a risky fork only once it has actually been walked', () => {
    const save = blank();
    const span = (() => {
      for (let n = 1; n <= TOTAL; n++) {
        const found = forkSpanFor(CONTENT, n);
        if (found) return found;
      }
      throw new Error('no fork authored');
    })();

    // Choosing the detour on the map is not the same as walking it.
    save.run.branches = { [String(span.start)]: 'b' };
    expect(profileRecord(CONTENT, save).journey.riskyForksWalked).toBe(0);

    clear(save, span.start, 3);
    expect(profileRecord(CONTENT, save).journey.riskyForksWalked).toBe(1);
  });

  it('counts the collection by distinct card, not by copy', () => {
    const save = blank();
    save.player.cards = [
      {
        uid: 'a',
        defId: 'card.ember_drake',
        level: 5,
        xp: 0,
        stars: 3,
        skillLevels: [],
        equippedGear: {},
        favorite: false,
      },
      {
        uid: 'b',
        defId: 'card.ember_drake',
        level: 9,
        xp: 0,
        stars: 3,
        skillLevels: [],
        equippedGear: {},
        favorite: false,
      },
      {
        uid: 'c',
        defId: 'card.captain_marrow',
        level: 2,
        xp: 0,
        stars: 4,
        skillLevels: [],
        equippedGear: {},
        favorite: false,
      },
    ];

    const record = profileRecord(CONTENT, save);
    expect(record.collection.copies).toBe(3);
    expect(record.collection.distinct).toBe(2);
    expect(record.collection.heroes).toBe(1);
    expect(record.collection.highestLevel).toBe(9);
    expect(record.collection.byRarity.rare).toBe(1);
    expect(record.collection.byRarity.epic).toBe(1);
  });

  it('counts chests from what was claimed', () => {
    const save = blank();
    const region = [...CONTENT.regions.values()][0];
    save.player.claimedChests = [chestKey(region.id, region.chestThresholds[0])];
    expect(profileRecord(CONTENT, save).journey.chestsOpened).toBe(1);
  });

  it('counts laps once the player is past the authored road', () => {
    const save = blank();
    clear(save, TOTAL, 3);
    expect(profileRecord(CONTENT, save).journey.loopsCompleted).toBe(1);
    clear(save, TOTAL - 1, 3);
    clear(save, TOTAL, 0, 0);
    expect(profileRecord(CONTENT, save).journey.loopsCompleted).toBe(0);
  });
});

describe('the commander level summarises the journey', () => {
  it('starts at one and rises with stars earned', () => {
    expect(commanderLevel(0)).toBe(1);
    expect(commanderLevel(STARS_PER_LEVEL - 1)).toBe(1);
    expect(commanderLevel(STARS_PER_LEVEL)).toBe(2);
    expect(commanderLevel(STARS_PER_LEVEL * 9)).toBe(10);
  });

  it('never disagrees with the stage records it is read from', () => {
    const save = blank();
    clear(save, 1, 3);
    clear(save, 2, 3);
    clear(save, 4, 3);
    expect(totalStarsOf(save)).toBe(9);

    const record = profileRecord(CONTENT, save);
    expect(record.level).toBe(commanderLevel(totalStarsOf(save)));
    expect(record.starsIntoLevel).toBe(0);
  });
});

describe('achievements read off the profile', () => {
  const states = (save: Fixture) =>
    achievementStates(CONTENT, profileRecord(CONTENT, save), save.player.claimedAchievements);

  it('starts a new save with nothing earned', () => {
    expect(earnedCount(states(blank()))).toBe(0);
  });

  it('earns itself the moment the save says so', () => {
    const save = blank();
    clear(save, 1, 3, 1);
    const first = states(save).find((s) => s.def.id === 'achievement.first_steps')!;
    expect(first.earned).toBe(true);
    expect(first.claimed).toBe(false);
    expect(claimableAchievements(states(save)).map((s) => s.def.id)).toContain(
      'achievement.first_steps',
    );
  });

  it('drops out of the claimable list once taken', () => {
    const save = blank();
    clear(save, 1, 3, 1);
    save.player.claimedAchievements = ['achievement.first_steps'];
    expect(claimableAchievements(states(save)).map((s) => s.def.id)).not.toContain(
      'achievement.first_steps',
    );
  });

  it('reports honest progress toward an unearned one', () => {
    const save = blank();
    clear(save, 1, 3, 1);
    clear(save, 2, 3, 1);
    const flawless = states(save).find((s) => s.def.id === 'achievement.flawless')!;
    expect(flawless.earned).toBe(false);
    expect(flawless.progress).toBe(2);
    expect(flawless.ratio).toBeCloseTo(0.2);
  });

  it('groups them and opens each group on what the player can act on', () => {
    const save = blank();
    clear(save, 1, 3, 1);
    const groups = groupAchievements(states(save));
    expect(groups.map((g) => g.group)).toContain('journey');
    const journey = groups.find((g) => g.group === 'journey')!;
    expect(journey.states[0].def.id).toBe('achievement.first_steps');
  });

  it('keeps "Full Roster" honest about the size of the roster', () => {
    // If this fails, a card was added and the achievement still asks for the old
    // count — which would quietly turn "own every card" into a lie.
    const collectible = [...CONTENT.cards.values()].filter((c) => !c.enemyOnly).length;
    expect(CONTENT.achievements.get('achievement.full_roster')?.target).toBe(collectible);
  });

  it('pays only in currency the player earns (rule 12)', () => {
    for (const def of CONTENT.achievements.values()) {
      if (!def.reward) continue;
      expect(['currency', 'cardXp', 'gearDrop', 'card', 'fragment']).toContain(def.reward.kind);
    }
  });
});
