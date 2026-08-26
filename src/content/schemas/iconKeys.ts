/**
 * Semantic icon keys — the vocabulary content data may reference.
 *
 * This module is intentionally pure data: it names *meanings*, never files.
 * `src/ui/icons/iconManifest.ts` maps every key to actual art, so replacing the
 * placeholder set is an asset+manifest change with no touch to content or engine
 * (ARCHITECTURE.md §6, CLAUDE.md rule 6).
 */

export const GEAR_SLOTS = [
  'weapon',
  'helmet',
  'shield',
  'gauntlets',
  'armor',
  'boots',
  'ring',
  'amulet',
  'artifact',
] as const;

export type GearSlot = (typeof GEAR_SLOTS)[number];

/**
 * Gear icon keys are derived from the slot list and nothing else.
 *
 * Owner directive: every item in a slot shows THE icon for that slot — all Boots
 * show the boots icon, all Helmets the helmet icon — in inventory, on equipment
 * grids and in drops. Items differ by name, stats, rarity colour and stars only.
 * `GearDef` therefore has no icon field; see `gearSlotIcon()` in the UI manifest.
 */
export const GEAR_SLOT_ICON_KEYS = GEAR_SLOTS.map((slot) => `gear.${slot}` as const);

export const ICON_KEYS = [
  ...GEAR_SLOT_ICON_KEYS,

  // currencies & resources
  'currency.gold',
  'currency.gems',
  'currency.energy',
  'currency.token',
  'currency.fragment',
  'currency.tome',

  // stats
  'stat.strength',
  'stat.attack',
  'stat.speed',
  'stat.power',

  // attack types
  'attackType.melee',
  'attackType.ranged',

  // statuses
  'status.burn',
  'status.poison',
  'status.freeze',
  'status.stun',
  'status.shield',
  'status.taunt',
  'status.weaken',
  'status.strengthen',
  'status.regen',

  // map stage kinds
  'stage.battle',
  'stage.elite',
  'stage.boss',
  'stage.event',
  'stage.treasure',
  'stage.camp',

  // elements (Q21 stage affinity)
  'element.nature',
  'element.fire',
  'element.ice',
  'element.lightning',
  'element.dark',

  // stage modifiers (Phase 4)
  'modifier.frenzied',
  'modifier.ironhide',
  'modifier.endless_tide',
  'modifier.scorched',
  'modifier.choking_dust',
  'modifier.quickened',
  'modifier.blessed_ground',

  // map furniture
  'map.fork',
  'map.chest',
  'map.chestLocked',

  // navigation
  'nav.map',
  'nav.cards',
  'nav.summon',
  'nav.shop',
  'nav.more',

  // ui chrome
  'ui.back',
  'ui.close',
  'ui.lock',
  'ui.star',
  'ui.info',
  'ui.settings',
  'ui.filter',
  'ui.sort',
  'ui.check',
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** The only supported way to name gear art: from the slot, never from the item. */
export function gearSlotIconKey(slot: GearSlot): IconKey {
  return `gear.${slot}`;
}

/** Element art resolves through the manifest, same as everything else (rule 6). */
export function elementIconKey(element: string): IconKey {
  return `element.${element}` as IconKey;
}

const CURRENCY_ICON_KEYS: Readonly<Record<string, IconKey>> = {
  gold: 'currency.gold',
  gems: 'currency.gems',
  energy: 'currency.energy',
  fragment: 'currency.fragment',
  tome: 'currency.tome',
  token_unit_t1: 'currency.token',
  token_unit_t2: 'currency.token',
  token_unit_t3: 'currency.token',
  token_hero: 'currency.token',
};

/** Currency art resolves through the manifest too — one route per meaning. */
export function currencyIconKey(currency: string): IconKey {
  return CURRENCY_ICON_KEYS[currency] ?? 'currency.token';
}

/** Status art, by status id. */
export function statusIconKey(status: string): IconKey {
  return `status.${status}` as IconKey;
}

/** Stage-kind art, by node kind. */
export function stageKindIconKey(kind: string): IconKey {
  return `stage.${kind}` as IconKey;
}
