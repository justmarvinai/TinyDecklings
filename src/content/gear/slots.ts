/**
 * Gear slots — the full reference set of 8 plus the artifact slot at 6 stars (Q10).
 *
 * `iconKey` is the ONLY place gear art is named: every item in a slot renders this
 * icon, everywhere (owner directive / CLAUDE.md rule 5). The registry asserts the
 * key always matches the slot, so a bespoke per-item icon cannot sneak in.
 *
 * `active` gates which slots the current phase switches on. The vertical slice uses
 * four; Phase 2 activates the rest, and locked slots render with a padlock.
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
    active: false,
  },
  {
    id: 'gauntlets',
    name: 'Gauntlets',
    iconKey: 'gear.gauntlets',
    mainStat: 'attack',
    unlockStars: 1,
    active: false,
  },
  {
    id: 'ring',
    name: 'Ring',
    iconKey: 'gear.ring',
    mainStat: 'attack',
    unlockStars: 1,
    active: false,
  },
  {
    id: 'amulet',
    name: 'Amulet',
    iconKey: 'gear.amulet',
    mainStat: 'strength',
    unlockStars: 1,
    active: false,
  },
  {
    id: 'artifact',
    name: 'Artifact',
    iconKey: 'gear.artifact',
    mainStat: 'attack',
    unlockStars: 6,
    active: false,
  },
];
