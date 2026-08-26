/**
 * Slice gear.
 *
 * Note what is NOT here: no icon, no art, no per-item imagery of any kind. Every
 * Boots entry renders THE boots icon, every Helmet THE helmet icon (owner directive
 * / CLAUDE.md rule 5) — items are distinguished by name, slot, rarity colour, stars
 * and stats alone. The schema rejects an icon field outright.
 *
 * Slice activates four slots (Q10): weapon, helmet, armor, boots.
 */
import type { GearDef } from '../schemas';

export const GEAR_DEFS: readonly GearDef[] = [
  // --- weapons (main stat: attack) ---
  {
    id: 'gear.chipped_cutlass',
    name: 'Chipped Cutlass',
    slot: 'weapon',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 6,
  },
  {
    id: 'gear.tide_iron_blade',
    name: 'Tide Iron Blade',
    slot: 'weapon',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 11,
  },
  {
    id: 'gear.coral_edge',
    name: 'Coral Edge',
    slot: 'weapon',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 18,
  },
  {
    id: 'gear.stormcaller_pike',
    name: 'Stormcaller Pike',
    slot: 'weapon',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 27,
  },

  // --- helmets (main stat: strength) ---
  {
    id: 'gear.salted_cap',
    name: 'Salted Cap',
    slot: 'helmet',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 34,
  },
  {
    id: 'gear.diver_helm',
    name: "Diver's Helm",
    slot: 'helmet',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 62,
  },
  {
    id: 'gear.reefguard_crown',
    name: 'Reefguard Crown',
    slot: 'helmet',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 104,
  },
  {
    id: 'gear.tyrants_visor',
    name: "Tyrant's Visor",
    slot: 'helmet',
    rarity: 'exalted',
    stars: 5,
    mainStatBase: 186,
  },

  // --- armor (main stat: strength) ---
  {
    id: 'gear.kelp_weave_vest',
    name: 'Kelp Weave Vest',
    slot: 'armor',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 48,
  },
  {
    id: 'gear.barnacle_plate',
    name: 'Barnacle Plate',
    slot: 'armor',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 86,
  },
  {
    id: 'gear.deepscale_mail',
    name: 'Deepscale Mail',
    slot: 'armor',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 142,
  },
  {
    id: 'gear.abyssal_carapace',
    name: 'Abyssal Carapace',
    slot: 'armor',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 208,
  },

  // --- boots (main stat: speed) ---
  {
    id: 'gear.wave_worn_boots',
    name: 'Wave-Worn Boots',
    slot: 'boots',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 2,
  },
  {
    id: 'gear.springstep_boots',
    name: 'Springstep Boots',
    slot: 'boots',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 4,
  },
  {
    id: 'gear.tidewalkers',
    name: 'Tidewalkers',
    slot: 'boots',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 6,
  },
  {
    id: 'gear.stormstride_greaves',
    name: 'Stormstride Greaves',
    slot: 'boots',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 9,
  },
];
