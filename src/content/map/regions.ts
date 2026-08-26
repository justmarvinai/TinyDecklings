/**
 * The slice region.
 *
 * Ten stages on a linear path (Q2): nine battles and a boss at stage 10, matching
 * the reference map's numbered medallion chain. Elites, events, treasure, camps and
 * fork nodes are Phase 4 — the pools exist so the generator can stay unchanged when
 * they arrive.
 */
import type { RegionDef } from '../schemas';

export const REGION_DEFS: readonly RegionDef[] = [
  {
    id: 'region.slice_isles',
    name: 'Sunken Isles',
    themeToken: 'theme-isles',
    stageCount: 10,
    nameTable: [
      'Shallow Reach',
      'Coral Keep',
      'Salt Flats',
      'Drowned Pier',
      'Kelp Maze',
      'Screaming Tomb',
      'Under Ice',
      'Pirate Ship',
      'Far Island',
      'Tyrant Deep',
    ],
    enemyPool: [
      'enemy.shore_scavengers',
      'enemy.tidepool_pack',
      'enemy.reef_ambush',
      'enemy.wraith_tide',
      'enemy.salt_circle',
      'enemy.deep_hunger',
      'enemy.drowned_vanguard',
      'enemy.black_current',
    ],
    elitePool: [],
    bossPool: ['enemy.tide_tyrant'],
    eventPool: [],
    lootTable: 'loot.slice_battle',
    elementBias: 'ice',
    difficultyScale: 1,
  },
];

/** Loot table used when a stage is a boss node. */
export const BOSS_LOOT_TABLE = 'loot.slice_boss';
