/**
 * The player's persistent world: collection, gear, currencies and stage records.
 *
 * This store owns the save document. It calls the engine for maths and the save
 * service for persistence; it never contains rules of its own (ARCHITECTURE.md §1).
 */
import { create } from 'zustand';
import { CONTENT, STARTER_CARD_IDS } from '@/content';
import type { CurrencyId, GearSlot } from '@/content/schemas';
import { CARD_RARITY_BASE_STARS } from '@/content/schemas';
import { applyXp, levelUpGoldCost, powerRating, statAt } from '@/engine/progression';
import type { GearDrop, RewardBundle } from '@/engine/economy/rewards';
import type { SaveDoc, OwnedCard, OwnedGear } from '@/services/saves';

export interface CardStats {
  strength: number;
  attack: number;
  speed: number;
  power: number;
}

export interface PlayerState {
  save: SaveDoc | null;
  hydrate: (save: SaveDoc) => void;
  getSave: () => SaveDoc;

  currency: (id: CurrencyId) => number;
  addCurrency: (id: CurrencyId, amount: number) => void;
  spendCurrency: (id: CurrencyId, amount: number) => boolean;

  cards: () => OwnedCard[];
  card: (uid: string) => OwnedCard | undefined;
  gear: () => OwnedGear[];
  gearItem: (uid: string) => OwnedGear | undefined;

  /** Level, stars and equipped gear rolled into the numbers the UI shows. */
  statsFor: (uid: string) => CardStats;

  grantStarterCollection: () => void;
  grantCard: (defId: string) => string;
  grantGear: (drop: GearDrop) => string;
  applyRewards: (bundle: RewardBundle, xpTargets?: readonly string[]) => void;

  levelUpCost: (uid: string) => number;
  canLevelUp: (uid: string) => boolean;
  levelUp: (uid: string) => boolean;

  equip: (cardUid: string, gearUid: string) => void;
  unequip: (cardUid: string, slot: GearSlot) => void;

  recordStage: (stage: number, stars: 0 | 1 | 2 | 3) => void;
  bestStars: (stage: number) => 0 | 1 | 2 | 3;
}

let uidCounter = 0;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter.toString(36)}${Math.floor(performance.now() * 1000).toString(36)}`;
}

/** Everything an owned card's equipped gear contributes, flat and percentage. */
export interface GearBonuses {
  flat: { strength: number; attack: number; speed: number };
  percent: { strength: number; attack: number; speed: number };
}

export function gearBonusesFor(save: SaveDoc, card: OwnedCard): GearBonuses {
  const flat = { strength: 0, attack: 0, speed: 0 };
  const percent = { strength: 0, attack: 0, speed: 0 };

  for (const gearUid of Object.values(card.equippedGear)) {
    const owned = save.player.gear.find((g) => g.uid === gearUid);
    if (!owned) continue;
    const def = CONTENT.gear.get(owned.defId);
    const slotDef = def ? CONTENT.gearSlots.get(def.slot) : undefined;
    if (!def || !slotDef) continue;

    // Enhancement adds 12% of the base main stat per level (Q11).
    flat[slotDef.mainStat] += Math.round(def.mainStatBase * (1 + owned.enhanceLevel * 0.12));

    for (const sub of owned.substats) {
      if (sub.isPercent) percent[sub.stat] += sub.value;
      else flat[sub.stat] += sub.value;
    }
  }

  return { flat, percent };
}

/**
 * A card's live stats: level growth plus everything it has equipped.
 *
 * Pure and exported so components can memoise on `save` honestly rather than
 * subscribing to a selector that builds a fresh object every render.
 */
export function computeCardStats(save: SaveDoc, uid: string): CardStats {
  const card = save.player.cards.find((c) => c.uid === uid);
  const def = card ? CONTENT.cards.get(card.defId) : undefined;
  const curve = def ? CONTENT.growthCurves.get(def.growth) : undefined;
  if (!card || !def || !curve) return { strength: 0, attack: 0, speed: 0, power: 0 };

  const { flat, percent } = gearBonusesFor(save, card);
  const withGear = (base: number, stat: 'strength' | 'attack' | 'speed') =>
    Math.round((base + flat[stat]) * (1 + percent[stat] / 100));

  const strength = withGear(statAt(def.baseStats.strength, card.level, curve), 'strength');
  const attack = withGear(statAt(def.baseStats.attack, card.level, curve), 'attack');
  const speed = withGear(def.baseStats.speed, 'speed');

  return {
    strength,
    attack,
    speed,
    power: powerRating({
      strength,
      attack,
      speed,
      stars: card.stars,
      skillLevels: card.skillLevels,
    }),
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  save: null,

  hydrate: (save) => set({ save }),

  getSave: () => {
    const save = get().save;
    if (!save) throw new Error('Player store used before the save was loaded');
    return save;
  },

  currency: (id) => get().save?.player.currencies[id] ?? 0,

  addCurrency: (id, amount) =>
    set((s) => {
      if (!s.save || amount === 0) return s;
      const current = s.save.player.currencies[id] ?? 0;
      return {
        save: {
          ...s.save,
          player: {
            ...s.save.player,
            currencies: { ...s.save.player.currencies, [id]: Math.max(0, current + amount) },
          },
        },
      };
    }),

  spendCurrency: (id, amount) => {
    const save = get().save;
    if (!save) return false;
    if ((save.player.currencies[id] ?? 0) < amount) return false;
    get().addCurrency(id, -amount);
    return true;
  },

  cards: () => get().save?.player.cards ?? [],
  card: (uid) => get().save?.player.cards.find((c) => c.uid === uid),
  gear: () => get().save?.player.gear ?? [],
  gearItem: (uid) => get().save?.player.gear.find((g) => g.uid === uid),

  statsFor: (uid) => computeCardStats(get().getSave(), uid),

  grantStarterCollection: () => {
    for (const defId of STARTER_CARD_IDS) get().grantCard(defId);
  },

  grantCard: (defId) => {
    const def = CONTENT.cards.get(defId);
    const uid = nextUid('card');
    set((s) => {
      if (!s.save || !def) return s;
      const owned: OwnedCard = {
        uid,
        defId,
        level: 1,
        xp: 0,
        stars: CARD_RARITY_BASE_STARS[def.rarity],
        skillLevels: def.skills.map(() => 1),
        equippedGear: {},
        favorite: false,
      };
      return {
        save: { ...s.save, player: { ...s.save.player, cards: [...s.save.player.cards, owned] } },
      };
    });
    return uid;
  },

  grantGear: (drop) => {
    const uid = nextUid('gear');
    set((s) => {
      if (!s.save) return s;
      const owned: OwnedGear = {
        uid,
        defId: drop.defId,
        enhanceLevel: 0,
        substats: drop.substats,
      };
      return {
        save: { ...s.save, player: { ...s.save.player, gear: [...s.save.player.gear, owned] } },
      };
    });
    return uid;
  },

  applyRewards: (bundle, xpTargets) => {
    for (const [currency, amount] of Object.entries(bundle.currencies)) {
      get().addCurrency(currency as CurrencyId, amount ?? 0);
    }
    for (const drop of bundle.gear) get().grantGear(drop);
    for (const cardId of bundle.cards) get().grantCard(cardId);

    if (bundle.cardXp > 0) {
      const targets =
        xpTargets ??
        get()
          .cards()
          .map((c) => c.uid);
      set((s) => {
        if (!s.save) return s;
        const cards = s.save.player.cards.map((card) => {
          if (!targets.includes(card.uid)) return card;
          const def = CONTENT.cards.get(card.defId);
          const curve = def ? CONTENT.growthCurves.get(def.growth) : undefined;
          if (!curve) return card;
          const result = applyXp(card.level, card.xp, bundle.cardXp, card.stars, curve);
          return { ...card, level: result.level, xp: result.xp };
        });
        return { save: { ...s.save, player: { ...s.save.player, cards } } };
      });
    }
  },

  levelUpCost: (uid) => {
    const card = get().card(uid);
    return card ? levelUpGoldCost(card.level) : 0;
  },

  canLevelUp: (uid) => {
    const card = get().card(uid);
    if (!card) return false;
    const def = CONTENT.cards.get(card.defId);
    const curve = def ? CONTENT.growthCurves.get(def.growth) : undefined;
    if (!curve) return false;
    if (card.level >= curve.levelsPerStar * card.stars) return false;
    return get().currency('gold') >= get().levelUpCost(uid);
  },

  levelUp: (uid) => {
    if (!get().canLevelUp(uid)) return false;
    const cost = get().levelUpCost(uid);
    if (!get().spendCurrency('gold', cost)) return false;
    set((s) => {
      if (!s.save) return s;
      const cards = s.save.player.cards.map((c) =>
        c.uid === uid ? { ...c, level: c.level + 1, xp: 0 } : c,
      );
      return { save: { ...s.save, player: { ...s.save.player, cards } } };
    });
    return true;
  },

  equip: (cardUid, gearUid) =>
    set((s) => {
      if (!s.save) return s;
      const owned = s.save.player.gear.find((g) => g.uid === gearUid);
      const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
      if (!def) return s;

      const cards = s.save.player.cards.map((card) => {
        // A piece can only be worn by one card: strip it from whoever had it.
        const stripped = Object.fromEntries(
          Object.entries(card.equippedGear).filter(([, uid]) => uid !== gearUid),
        ) as Partial<Record<GearSlot, string>>;
        if (card.uid !== cardUid) return { ...card, equippedGear: stripped };
        return { ...card, equippedGear: { ...stripped, [def.slot]: gearUid } };
      });
      return { save: { ...s.save, player: { ...s.save.player, cards } } };
    }),

  unequip: (cardUid, slot) =>
    set((s) => {
      if (!s.save) return s;
      const cards = s.save.player.cards.map((card) => {
        if (card.uid !== cardUid) return card;
        const next = { ...card.equippedGear };
        delete next[slot];
        return { ...card, equippedGear: next };
      });
      return { save: { ...s.save, player: { ...s.save.player, cards } } };
    }),

  recordStage: (stage, stars) =>
    set((s) => {
      if (!s.save) return s;
      const key = String(stage);
      const existing = s.save.player.stageRecords[key];
      const record = {
        bestStars: Math.max(existing?.bestStars ?? 0, stars) as 0 | 1 | 2 | 3,
        clears: (existing?.clears ?? 0) + (stars > 0 ? 1 : 0),
      };
      return {
        save: {
          ...s.save,
          player: {
            ...s.save.player,
            stageRecords: { ...s.save.player.stageRecords, [key]: record },
          },
        },
      };
    }),

  bestStars: (stage) =>
    (get().save?.player.stageRecords[String(stage)]?.bestStars ?? 0) as 0 | 1 | 2 | 3,
}));
