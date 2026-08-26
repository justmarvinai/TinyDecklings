/**
 * Gear slots — the full reference set of 8 plus the artifact slot at 6 stars (Q10).
 *
 * `iconKey` is the ONLY place gear art is named: every item in a slot renders this
 * icon, everywhere (owner directive / CLAUDE.md rule 5). The registry asserts the
 * key always matches the slot, so a bespoke per-item icon cannot sneak in.
 *
 * `active` gates which slots the game has switched on. Phase 2 activates all eight;
 * the Artifact slot stays gated behind a 6-star card, which is a progression lock
 * rather than a phase lock, so it renders with a padlock and its requirement.
 */
import type { GearSlotDef } from '../schemas';

export const GEAR_SLOT_DEFS: readonly GearSlotDef[] = [
  {
    id: 'weapon',
    name: 'Weapon',
    iconKey: 'gear.weapon',
    mainStat: 'attack',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'helmet',
    name: 'Helmet',
    iconKey: 'gear.helmet',
    mainStat: 'strength',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'armor',
    name: 'Armor',
    iconKey: 'gear.armor',
    mainStat: 'strength',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'boots',
    name: 'Boots',
    iconKey: 'gear.boots',
    mainStat: 'speed',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'shield',
    name: 'Shield',
    iconKey: 'gear.shield',
    mainStat: 'strength',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'gauntlets',
    name: 'Gauntlets',
    iconKey: 'gear.gauntlets',
    mainStat: 'attack',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'ring',
    name: 'Ring',
    iconKey: 'gear.ring',
    mainStat: 'attack',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'amulet',
    name: 'Amulet',
    iconKey: 'gear.amulet',
    mainStat: 'strength',
    unlockStars: 1,
    active: true,
  },
  {
    id: 'artifact',
    name: 'Artifact',
    iconKey: 'gear.artifact',
    mainStat: 'attack',
    unlockStars: 6,
    active: true,
  },
];
