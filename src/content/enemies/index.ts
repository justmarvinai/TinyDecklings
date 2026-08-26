/**
 * Enemy formations for the slice region.
 *
 * Slots 0-2 are the front row, 3-5 the back row. Melee attackers are locked to the
 * living front row (Q7), so putting a squishy caster at slot 4 behind a crab at
 * slot 1 is a real defensive choice the player has to solve.
 */
import type { EnemyGroupDef } from '../schemas';

export const ENEMY_GROUP_DEFS: readonly EnemyGroupDef[] = [
  {
    id: 'enemy.shore_scavengers',
    name: 'Shore Scavengers',
    members: [
      { cardId: 'card.gloom_rat', slot: 0, level: 1 },
      { cardId: 'card.gloom_rat', slot: 1, level: 1 },
      { cardId: 'card.gloom_bat', slot: 4, level: 1 },
    ],
    reinforcements: [],
  },
  {
    id: 'enemy.tidepool_pack',
    name: 'Tidepool Pack',
    members: [
      { cardId: 'card.brine_crab', slot: 1, level: 2 },
      { cardId: 'card.gloom_rat', slot: 0, level: 2 },
      { cardId: 'card.gloom_bat', slot: 3, level: 2 },
      { cardId: 'card.gloom_bat', slot: 5, level: 2 },
    ],
    reinforcements: ['card.gloom_rat'],
  },
  {
    id: 'enemy.reef_ambush',
    name: 'Reef Ambush',
    members: [
      { cardId: 'card.brine_crab', slot: 0, level: 3 },
      { cardId: 'card.brine_crab', slot: 2, level: 3 },
      { cardId: 'card.reef_stalker', slot: 4, level: 3 },
    ],
    reinforcements: ['card.reef_stalker'],
  },
  {
    id: 'enemy.wraith_tide',
    name: 'Wraith Tide',
    members: [
      { cardId: 'card.coral_brute', slot: 1, level: 4 },
      { cardId: 'card.tide_wraith', slot: 3, level: 4 },
      { cardId: 'card.tide_wraith', slot: 5, level: 4 },
    ],
    reinforcements: ['card.gloom_bat'],
  },
  {
    id: 'enemy.salt_circle',
    name: 'Salt Circle',
    members: [
      { cardId: 'card.brine_crab', slot: 0, level: 5 },
      { cardId: 'card.coral_brute', slot: 2, level: 5 },
      { cardId: 'card.salt_shaman', slot: 4, level: 5 },
      { cardId: 'card.reef_stalker', slot: 3, level: 5 },
    ],
    reinforcements: ['card.gloom_rat', 'card.gloom_bat'],
  },
  {
    id: 'enemy.deep_hunger',
    name: 'Deep Hunger',
    members: [
      { cardId: 'card.deep_maw', slot: 1, level: 6 },
      { cardId: 'card.coral_brute', slot: 0, level: 6 },
      { cardId: 'card.salt_shaman', slot: 4, level: 6 },
      { cardId: 'card.tide_wraith', slot: 5, level: 6 },
    ],
    reinforcements: ['card.brine_crab'],
  },
  {
    id: 'enemy.drowned_vanguard',
    name: 'Drowned Vanguard',
    members: [
      { cardId: 'card.coral_brute', slot: 0, level: 7 },
      { cardId: 'card.deep_maw', slot: 1, level: 7 },
      { cardId: 'card.coral_brute', slot: 2, level: 7 },
      { cardId: 'card.salt_shaman', slot: 4, level: 7 },
    ],
    reinforcements: ['card.tide_wraith', 'card.reef_stalker'],
  },
  {
    id: 'enemy.black_current',
    name: 'Black Current',
    members: [
      { cardId: 'card.deep_maw', slot: 1, level: 8 },
      { cardId: 'card.brine_crab', slot: 0, level: 8 },
      { cardId: 'card.brine_crab', slot: 2, level: 8 },
      { cardId: 'card.tide_wraith', slot: 3, level: 8 },
      { cardId: 'card.salt_shaman', slot: 5, level: 8 },
    ],
    reinforcements: ['card.deep_maw'],
  },
  {
    id: 'enemy.tide_tyrant',
    name: 'The Tide Tyrant',
    members: [
      { cardId: 'card.tide_tyrant', slot: 1, level: 10 },
      { cardId: 'card.coral_brute', slot: 0, level: 9 },
      { cardId: 'card.coral_brute', slot: 2, level: 9 },
      { cardId: 'card.salt_shaman', slot: 4, level: 9 },
    ],
    reinforcements: ['card.deep_maw', 'card.tide_wraith'],
    bossCardId: 'card.tide_tyrant',
  },
];
