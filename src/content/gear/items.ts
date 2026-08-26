/**
 * Slice gear.
 *
 * Note what is NOT here: no icon, no art, no per-item imagery of any kind. Every
 * Boots entry renders THE boots icon, every Helmet THE helmet icon (owner directive
 * / CLAUDE.md rule 5) — items are distinguished by name, slot, rarity colour, stars
 * and stats alone. The schema rejects an icon field outright.
 *
 * All eight slots carry items across the six gear rarities (Q9/Q10); the Artifact
 * slot opens on a 6-star card and has its own short list.
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
  // --- shields (main stat: strength) ---
  {
    id: 'gear.driftwood_buckler',
    name: 'Driftwood Buckler',
    slot: 'shield',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 40,
  },
  {
    id: 'gear.barnacle_guard',
    name: 'Barnacle Guard',
    slot: 'shield',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 74,
  },
  {
    id: 'gear.tidewall',
    name: 'Tidewall',
    slot: 'shield',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 126,
  },
  {
    id: 'gear.leviathan_bulwark',
    name: 'Leviathan Bulwark',
    slot: 'shield',
    rarity: 'exalted',
    stars: 5,
    mainStatBase: 232,
  },

  // --- gauntlets (main stat: attack) ---
  {
    id: 'gear.frayed_wraps',
    name: 'Frayed Wraps',
    slot: 'gauntlets',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 5,
  },
  {
    id: 'gear.crabclaw_grips',
    name: 'Crabclaw Grips',
    slot: 'gauntlets',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 9,
  },
  {
    id: 'gear.riptide_gauntlets',
    name: 'Riptide Gauntlets',
    slot: 'gauntlets',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 24,
  },
  {
    id: 'gear.kraken_clutch',
    name: 'Kraken Clutch',
    slot: 'gauntlets',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 38,
  },

  // --- rings (main stat: attack) ---
  {
    id: 'gear.pitted_band',
    name: 'Pitted Band',
    slot: 'ring',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 4,
  },
  {
    id: 'gear.seaglass_ring',
    name: 'Seaglass Ring',
    slot: 'ring',
    rarity: 'refined',
    stars: 3,
    mainStatBase: 15,
  },
  {
    id: 'gear.stormcallers_signet',
    name: "Stormcaller's Signet",
    slot: 'ring',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 23,
  },
  {
    id: 'gear.tyrants_seal',
    name: "Tyrant's Seal",
    slot: 'ring',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 36,
  },

  // --- amulets (main stat: strength) ---
  {
    id: 'gear.knotted_cord',
    name: 'Knotted Cord',
    slot: 'amulet',
    rarity: 'worn',
    stars: 1,
    mainStatBase: 30,
  },
  {
    id: 'gear.pearl_pendant',
    name: 'Pearl Pendant',
    slot: 'amulet',
    rarity: 'sturdy',
    stars: 2,
    mainStatBase: 58,
  },
  {
    id: 'gear.deeptide_charm',
    name: 'Deeptide Charm',
    slot: 'amulet',
    rarity: 'ornate',
    stars: 4,
    mainStatBase: 164,
  },
  {
    id: 'gear.drowned_heart',
    name: 'Drowned Heart',
    slot: 'amulet',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 250,
  },

  // --- artifacts (main stat: attack) — the 6-star slot ---
  {
    id: 'gear.tidebound_idol',
    name: 'Tidebound Idol',
    slot: 'artifact',
    rarity: 'exalted',
    stars: 5,
    mainStatBase: 30,
  },
  {
    id: 'gear.heart_of_the_deep',
    name: 'Heart of the Deep',
    slot: 'artifact',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 44,
  },

  // --- higher-rarity fills for the original four slots ---
  {
    id: 'gear.tyrantfang',
    name: 'Tyrantfang',
    slot: 'weapon',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 42,
  },
  {
    id: 'gear.abyss_crown',
    name: 'Abyss Crown',
    slot: 'helmet',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 268,
  },
  {
    id: 'gear.tyrantscale_plate',
    name: 'Tyrantscale Plate',
    slot: 'armor',
    rarity: 'mythic',
    stars: 5,
    mainStatBase: 296,
  },
  {
    id: 'gear.deepwalkers',
    name: 'Deepwalkers',
    slot: 'boots',
    rarity: 'exalted',
    stars: 5,
    mainStatBase: 12,
  },
];
