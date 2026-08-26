/**
 * Reward rolls.
 *
 * Loot tables are data (`content/economy/loot.ts`); this only rolls them. Gear
 * drops pick a slot and a rarity from the table's weights, then a matching item
 * from the registry — items carry no art, so a drop is fully described by
 * (definition, rolled substats).
 */
import type { Content } from '@/content';
import type {
  CurrencyId,
  GearRarity,
  GearSlot,
  LootTableDef,
  RewardDef,
  SubstatRoll,
} from '@/content/schemas';
import { GEAR_RARITY_SUBSTATS, STAT_KEYS } from '@/content/schemas';
import type { Rng } from '../rng';

export interface GearDrop {
  defId: string;
  substats: SubstatRoll[];
}

export interface RewardBundle {
  currencies: Partial<Record<CurrencyId, number>>;
  cardXp: number;
  gear: GearDrop[];
  cards: string[];
  fragments: { cardId: string; amount: number }[];
}

function emptyBundle(): RewardBundle {
  return { currencies: {}, cardXp: 0, gear: [], cards: [], fragments: [] };
}

function addCurrency(bundle: RewardBundle, currency: CurrencyId, amount: number): void {
  bundle.currencies[currency] = (bundle.currencies[currency] ?? 0) + amount;
}

function rollSubstats(rarity: GearRarity, slot: GearSlot, rng: Rng): SubstatRoll[] {
  const count = GEAR_RARITY_SUBSTATS[rarity];
  const rolls: SubstatRoll[] = [];
  const pool = STAT_KEYS.filter((s) => s !== 'speed' || slot === 'boots');

  for (let i = 0; i < count; i++) {
    const stat = rng.pick(pool);
    const isPercent = rng.chance(0.4);
    rolls.push({
      stat,
      value: isPercent ? rng.int(2, 8) : stat === 'strength' ? rng.int(10, 60) : rng.int(2, 9),
      isPercent,
    });
  }
  return rolls;
}

function rollGearDrop(
  content: Content,
  slots: readonly GearSlot[],
  rarityWeights: Partial<Record<GearRarity, number>>,
  rng: Rng,
): GearDrop | null {
  const entries = Object.entries(rarityWeights).filter(([, w]) => (w ?? 0) > 0) as [
    GearRarity,
    number,
  ][];
  if (entries.length === 0) return null;

  const slot = rng.pick(slots);
  const rarity = rng.pickWeighted(entries, ([, weight]) => weight)[0];

  const candidates = [...content.gear.values()].filter(
    (g) => g.slot === slot && g.rarity === rarity,
  );
  // A table may name a rarity the current content has no item for; fall back to the
  // slot rather than dropping nothing at all.
  const fallback = [...content.gear.values()].filter((g) => g.slot === slot);
  const pool = candidates.length > 0 ? candidates : fallback;
  if (pool.length === 0) return null;

  const def = rng.pick(pool);
  return { defId: def.id, substats: rollSubstats(def.rarity, def.slot, rng) };
}

function applyReward(content: Content, bundle: RewardBundle, reward: RewardDef, rng: Rng): void {
  switch (reward.kind) {
    case 'currency':
      addCurrency(bundle, reward.currency, rng.int(reward.amount.min, reward.amount.max));
      break;
    case 'cardXp':
      bundle.cardXp += rng.int(reward.amount.min, reward.amount.max);
      break;
    case 'gearDrop': {
      const drop = rollGearDrop(content, reward.slots, reward.rarityWeights, rng);
      if (drop) bundle.gear.push(drop);
      break;
    }
    case 'card':
      bundle.cards.push(reward.cardId);
      break;
    case 'fragment':
      bundle.fragments.push({
        cardId: reward.cardId,
        amount: rng.int(reward.amount.min, reward.amount.max),
      });
      break;
  }
}

export function rollLoot(content: Content, table: LootTableDef, rng: Rng): RewardBundle {
  const bundle = emptyBundle();

  for (const reward of table.guaranteed) applyReward(content, bundle, reward, rng);

  for (let i = 0; i < table.rolls; i++) {
    if (table.entries.length === 0) break;
    const entry = rng.pickWeighted(table.entries, (e) => e.weight);
    applyReward(content, bundle, entry.reward, rng);
  }

  return bundle;
}

/** Stars multiply the payout, so a flawless clear is worth replaying for (Q17). */
export function applyStarBonus(bundle: RewardBundle, stars: 0 | 1 | 2 | 3): RewardBundle {
  const multiplier = stars === 3 ? 1.25 : stars === 2 ? 1.1 : 1;
  if (multiplier === 1) return bundle;

  const currencies: Partial<Record<CurrencyId, number>> = {};
  for (const [key, value] of Object.entries(bundle.currencies)) {
    currencies[key as CurrencyId] = Math.round((value ?? 0) * multiplier);
  }
  return { ...bundle, currencies, cardXp: Math.round(bundle.cardXp * multiplier) };
}
