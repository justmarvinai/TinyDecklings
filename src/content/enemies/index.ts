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

  // --- Sunken Isles elites ---------------------------------------------------
  {
    id: 'enemy.frozen_vigil',
    name: 'Frozen Vigil',
    members: [
      { cardId: 'card.brine_crab', slot: 0, level: 6 },
      { cardId: 'card.brine_crab', slot: 2, level: 6 },
      { cardId: 'card.salt_shaman', slot: 4, level: 6 },
      { cardId: 'card.tide_wraith', slot: 3, level: 6 },
    ],
    reinforcements: ['card.reef_stalker'],
  },
  {
    id: 'enemy.deep_court',
    name: 'Court of the Deep',
    members: [
      { cardId: 'card.deep_maw', slot: 1, level: 9 },
      { cardId: 'card.coral_brute', slot: 0, level: 9 },
      { cardId: 'card.tide_wraith', slot: 3, level: 9 },
      { cardId: 'card.tide_wraith', slot: 5, level: 9 },
    ],
    reinforcements: ['card.deep_maw'],
  },

  // --- Ashfall Reach ---------------------------------------------------------
  {
    id: 'enemy.cinder_pack',
    name: 'Cinder Pack',
    members: [
      { cardId: 'card.cinder_imp', slot: 0, level: 11 },
      { cardId: 'card.cinder_imp', slot: 1, level: 11 },
      { cardId: 'card.ash_crawler', slot: 4, level: 11 },
    ],
    reinforcements: ['card.cinder_imp'],
  },
  {
    id: 'enemy.ashfall_scouts',
    name: 'Ashfall Scouts',
    members: [
      { cardId: 'card.cinder_imp', slot: 1, level: 12 },
      { cardId: 'card.ash_crawler', slot: 3, level: 12 },
      { cardId: 'card.ash_crawler', slot: 5, level: 12 },
    ],
    reinforcements: ['card.cinder_imp', 'card.ash_crawler'],
  },
  {
    id: 'enemy.magma_line',
    name: 'Magma Line',
    members: [
      { cardId: 'card.magma_brute', slot: 1, level: 13 },
      { cardId: 'card.cinder_imp', slot: 0, level: 13 },
      { cardId: 'card.cinder_imp', slot: 2, level: 13 },
      { cardId: 'card.ash_crawler', slot: 4, level: 13 },
    ],
    reinforcements: ['card.magma_brute'],
  },
  {
    id: 'enemy.pyre_choir',
    name: 'Pyre Choir',
    members: [
      { cardId: 'card.magma_brute', slot: 1, level: 14 },
      { cardId: 'card.pyre_shade', slot: 3, level: 14 },
      { cardId: 'card.pyre_shade', slot: 5, level: 14 },
    ],
    reinforcements: ['card.cinder_imp', 'card.ash_crawler'],
  },
  {
    id: 'enemy.forge_watch',
    name: 'Forge Watch',
    members: [
      { cardId: 'card.forge_golem', slot: 1, level: 15 },
      { cardId: 'card.magma_brute', slot: 0, level: 15 },
      { cardId: 'card.ash_crawler', slot: 4, level: 15 },
      { cardId: 'card.cinder_imp', slot: 2, level: 15 },
    ],
    reinforcements: ['card.pyre_shade'],
  },
  {
    id: 'enemy.emberfall',
    name: 'Emberfall',
    members: [
      { cardId: 'card.forge_golem', slot: 0, level: 16 },
      { cardId: 'card.magma_brute', slot: 2, level: 16 },
      { cardId: 'card.pyre_shade', slot: 4, level: 16 },
      { cardId: 'card.ash_crawler', slot: 3, level: 16 },
    ],
    reinforcements: ['card.cinder_imp', 'card.magma_brute'],
  },
  {
    id: 'enemy.slag_vanguard',
    name: 'Slag Vanguard',
    members: [
      { cardId: 'card.forge_golem', slot: 0, level: 17 },
      { cardId: 'card.forge_golem', slot: 2, level: 17 },
      { cardId: 'card.pyre_shade', slot: 4, level: 17 },
      { cardId: 'card.magma_brute', slot: 1, level: 17 },
    ],
    reinforcements: ['card.pyre_shade'],
  },
  {
    id: 'enemy.the_furnace',
    name: 'The Furnace',
    members: [
      { cardId: 'card.ash_reaver', slot: 1, level: 18 },
      { cardId: 'card.forge_golem', slot: 0, level: 18 },
      { cardId: 'card.pyre_shade', slot: 4, level: 18 },
      { cardId: 'card.pyre_shade', slot: 5, level: 18 },
    ],
    reinforcements: ['card.magma_brute', 'card.forge_golem'],
  },
  {
    id: 'enemy.reaver_hunt',
    name: 'Reaver Hunt',
    members: [
      { cardId: 'card.ash_reaver', slot: 1, level: 15 },
      { cardId: 'card.magma_brute', slot: 0, level: 15 },
      { cardId: 'card.magma_brute', slot: 2, level: 15 },
      { cardId: 'card.ash_crawler', slot: 4, level: 15 },
    ],
    reinforcements: ['card.cinder_imp'],
  },
  {
    id: 'enemy.crucible_guard',
    name: 'Crucible Guard',
    members: [
      { cardId: 'card.ash_reaver', slot: 1, level: 18 },
      { cardId: 'card.forge_golem', slot: 0, level: 18 },
      { cardId: 'card.forge_golem', slot: 2, level: 18 },
      { cardId: 'card.pyre_shade', slot: 4, level: 18 },
    ],
    reinforcements: ['card.ash_reaver'],
  },
  {
    id: 'enemy.emberlord_court',
    name: 'The Emberlord',
    members: [
      { cardId: 'card.emberlord_vashk', slot: 1, level: 20 },
      { cardId: 'card.forge_golem', slot: 0, level: 19 },
      { cardId: 'card.forge_golem', slot: 2, level: 19 },
      { cardId: 'card.pyre_shade', slot: 4, level: 19 },
    ],
    reinforcements: ['card.ash_reaver', 'card.magma_brute'],
    bossCardId: 'card.emberlord_vashk',
  },

  // --- Verdant Wound ---------------------------------------------------------
  {
    id: 'enemy.thorn_pack',
    name: 'Thorn Pack',
    members: [
      { cardId: 'card.thorn_hound', slot: 0, level: 21 },
      { cardId: 'card.thorn_hound', slot: 1, level: 21 },
      { cardId: 'card.spore_drifter', slot: 4, level: 21 },
    ],
    reinforcements: ['card.thorn_hound'],
  },
  {
    id: 'enemy.spore_drift',
    name: 'Spore Drift',
    members: [
      { cardId: 'card.thorn_hound', slot: 1, level: 22 },
      { cardId: 'card.spore_drifter', slot: 3, level: 22 },
      { cardId: 'card.spore_drifter', slot: 5, level: 22 },
    ],
    reinforcements: ['card.spore_drifter', 'card.thorn_hound'],
  },
  {
    id: 'enemy.bramble_wall',
    name: 'Bramble Wall',
    members: [
      { cardId: 'card.bramble_ogre', slot: 1, level: 23 },
      { cardId: 'card.thorn_hound', slot: 0, level: 23 },
      { cardId: 'card.thorn_hound', slot: 2, level: 23 },
      { cardId: 'card.spore_drifter', slot: 4, level: 23 },
    ],
    reinforcements: ['card.bramble_ogre'],
  },
  {
    id: 'enemy.moss_circle',
    name: 'Moss Circle',
    members: [
      { cardId: 'card.bramble_ogre', slot: 1, level: 24 },
      { cardId: 'card.moss_shaman', slot: 4, level: 24 },
      { cardId: 'card.spore_drifter', slot: 3, level: 24 },
      { cardId: 'card.thorn_hound', slot: 0, level: 24 },
    ],
    reinforcements: ['card.moss_shaman'],
  },
  {
    id: 'enemy.creeping_dark',
    name: 'Creeping Dark',
    members: [
      { cardId: 'card.vine_horror', slot: 1, level: 25 },
      { cardId: 'card.moss_shaman', slot: 4, level: 25 },
      { cardId: 'card.thorn_hound', slot: 2, level: 25 },
      { cardId: 'card.spore_drifter', slot: 5, level: 25 },
    ],
    reinforcements: ['card.bramble_ogre'],
  },
  {
    id: 'enemy.rot_grove',
    name: 'Rot Grove',
    members: [
      { cardId: 'card.vine_horror', slot: 0, level: 26 },
      { cardId: 'card.bramble_ogre', slot: 2, level: 26 },
      { cardId: 'card.moss_shaman', slot: 4, level: 26 },
      { cardId: 'card.spore_drifter', slot: 3, level: 26 },
    ],
    reinforcements: ['card.vine_horror', 'card.thorn_hound'],
  },
  {
    id: 'enemy.blight_hunt',
    name: 'Blight Hunt',
    members: [
      { cardId: 'card.blightfang', slot: 4, level: 27 },
      { cardId: 'card.vine_horror', slot: 1, level: 27 },
      { cardId: 'card.bramble_ogre', slot: 0, level: 27 },
      { cardId: 'card.moss_shaman', slot: 5, level: 27 },
    ],
    reinforcements: ['card.thorn_hound'],
  },
  {
    id: 'enemy.the_wound',
    name: 'The Wound',
    members: [
      { cardId: 'card.vine_horror', slot: 0, level: 28 },
      { cardId: 'card.vine_horror', slot: 2, level: 28 },
      { cardId: 'card.blightfang', slot: 4, level: 28 },
      { cardId: 'card.moss_shaman', slot: 3, level: 28 },
    ],
    reinforcements: ['card.bramble_ogre', 'card.blightfang'],
  },
  {
    id: 'enemy.fangs_of_the_grove',
    name: 'Fangs of the Grove',
    members: [
      { cardId: 'card.blightfang', slot: 4, level: 25 },
      { cardId: 'card.vine_horror', slot: 0, level: 25 },
      { cardId: 'card.vine_horror', slot: 2, level: 25 },
      { cardId: 'card.spore_drifter', slot: 3, level: 25 },
    ],
    reinforcements: ['card.thorn_hound'],
  },
  {
    id: 'enemy.deep_roots',
    name: 'Deep Roots',
    members: [
      { cardId: 'card.bramble_ogre', slot: 0, level: 28 },
      { cardId: 'card.bramble_ogre', slot: 2, level: 28 },
      { cardId: 'card.blightfang', slot: 4, level: 28 },
      { cardId: 'card.moss_shaman', slot: 5, level: 28 },
    ],
    reinforcements: ['card.vine_horror'],
  },
  {
    id: 'enemy.rootmother_hollow',
    name: 'The Rootmother',
    members: [
      { cardId: 'card.rootmother_yal', slot: 4, level: 30 },
      { cardId: 'card.vine_horror', slot: 0, level: 29 },
      { cardId: 'card.vine_horror', slot: 1, level: 29 },
      { cardId: 'card.bramble_ogre', slot: 2, level: 29 },
    ],
    reinforcements: ['card.blightfang', 'card.moss_shaman'],
    bossCardId: 'card.rootmother_yal',
  },
];
