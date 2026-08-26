/**
 * Semantic icon key -> placeholder art.
 *
 * The `satisfies Record<IconKey, IconSourceName>` makes the mapping exhaustive:
 * adding a semantic key without art is a compile error, and every value must be a
 * file that actually exists in `src/ui/icons/svg/`.
 *
 * All art here is placeholder art (Game Icons, CC BY 3.0 — see CREDITS.md). The
 * owner replaces it later by dropping .svg files in and re-running
 * `npm run vendor:icons`; no code or content changes (CLAUDE.md rule 6).
 */
import type { GearSlot, IconKey } from '@/content/schemas/iconKeys';
import { gearSlotIconKey } from '@/content/schemas/iconKeys';
import { ICON_PATHS, type IconSourceName, type IconPath } from './generated/iconPaths';

const MANIFEST = {
  // --- gear: exactly one icon per slot type (owner directive) -----------------
  'gear.weapon': 'broadsword',
  'gear.helmet': 'crested-helmet',
  'gear.shield': 'bordered-shield',
  'gear.gauntlets': 'gauntlet',
  'gear.armor': 'armor-vest',
  'gear.boots': 'boots',
  'gear.ring': 'diamond-ring',
  'gear.amulet': 'gem-pendant',
  'gear.artifact': 'crystal-shine',

  'currency.gold': 'two-coins',
  'currency.gems': 'gems',
  'currency.energy': 'electric',
  'currency.token': 'medal',
  'currency.fragment': 'fragmented-meteor',
  'currency.tome': 'book-cover',

  'stat.strength': 'health-normal',
  'stat.attack': 'piercing-sword',
  'stat.speed': 'sprint',
  'stat.power': 'fist',

  'attackType.melee': 'plain-dagger',
  'attackType.ranged': 'high-shot',

  'status.burn': 'flame',
  'status.poison': 'poison',
  'status.freeze': 'frozen-orb',
  'status.stun': 'knocked-out-stars',
  'status.shield': 'shield-reflect',
  'status.taunt': 'shouting',
  'status.weaken': 'health-decrease',
  'status.strengthen': 'muscle-up',
  'status.regen': 'health-increase',

  'stage.battle': 'crossed-swords',
  'stage.elite': 'barbed-star',
  'stage.boss': 'crowned-skull',
  'stage.event': 'scroll-unfurled',
  'stage.treasure': 'open-treasure-chest',
  'stage.camp': 'campfire',

  'element.nature': 'oak-leaf',
  'element.fire': 'fire-bowl',
  'element.ice': 'snowflake-2',
  'element.lightning': 'lightning-trio',
  'element.dark': 'evil-moon',

  'modifier.frenzied': 'enrage',
  'modifier.ironhide': 'spiked-armor',
  'modifier.endless_tide': 'hive-mind',
  'modifier.scorched': 'hazard-sign',
  'modifier.choking_dust': 'dust-cloud',
  'modifier.quickened': 'stopwatch',
  'modifier.blessed_ground': 'heart-plus',

  'map.fork': 'crossroad',
  'map.chest': 'chest',
  'map.chestLocked': 'locked-chest',

  'nav.map': 'treasure-map',
  'nav.cards': 'card-play',
  'nav.summon': 'portal',
  'nav.shop': 'shop',
  'nav.more': 'hamburger-menu',

  'ui.back': 'return-arrow',
  'ui.close': 'cross-mark',
  'ui.lock': 'padlock',
  'ui.star': 'round-star',
  'ui.info': 'info',
  'ui.settings': 'settings-knobs',
  'ui.filter': 'funnel',
  'ui.sort': 'upgrade',
  'ui.check': 'check-mark',
} as const satisfies Record<IconKey, IconSourceName>;

export function iconPath(key: IconKey): IconPath {
  return ICON_PATHS[MANIFEST[key]];
}

/**
 * The only supported way to get gear art.
 *
 * There is deliberately no `gearIcon(item)`: gear identity is name + stats +
 * rarity colour + stars, never a bespoke icon.
 */
export function gearSlotIcon(slot: GearSlot): IconPath {
  return iconPath(gearSlotIconKey(slot));
}

export { MANIFEST as ICON_MANIFEST };
