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
import {
  applyXp,
  ascendRequirement,
  canAscend,
  levelCap,
  levelUpGoldCost,
  powerRating,
  skillUpgradeCost,
  statAtGrade,
  unlockedSkillSlots,
} from '@/engine/progression';
import { addGearContribution, emptyContribution, enhanceCap, enhanceCost } from '@/engine/gear';
import type { GearDrop, RewardBundle } from '@/engine/economy/rewards';
import type { SaveDoc, OwnedCard, OwnedGear } from '@/services/saves';

export interface CardStats {
  strength: number;
  attack: number;
  speed: number;
  power: number;
}

/**
 * ⚠ Selector hazard: `statsFor` and `ascensionFodder` build a fresh object/array on
 * every call. Never pass them to `usePlayerStore(...)` as a selector — subscribe to
 * `save` and use the pure `computeCardStats` / `ascensionFodderFor` helpers instead.
 */
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

  /** Cards that may be fed to `uid` to raise its star grade (Q8). */
  ascensionFodder: (uid: string) => OwnedCard[];
  canAscend: (uid: string) => boolean;
  /** Consumes the chosen fodder and gold; returns false if the cost is not met. */
  ascend: (uid: string, fodderUids: readonly string[]) => boolean;

  /** How many of the card's five skill slots are unlocked at its current grade. */
  skillSlots: (uid: string) => number;
  canUpgradeSkill: (uid: string, index: number) => boolean;
  upgradeSkill: (uid: string, index: number) => boolean;

  canEnhance: (gearUid: string) => boolean;
  enhanceCostFor: (gearUid: string) => number;
  enhance: (gearUid: string) => boolean;

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
  const total = emptyContribution();

  for (const gearUid of Object.values(card.equippedGear)) {
    const owned = save.player.gear.find((g) => g.uid === gearUid);
    const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
    const slotDef = def ? CONTENT.gearSlots.get(def.slot) : undefined;
    if (!owned || !def || !slotDef) continue;
    addGearContribution(total, def, slotDef, owned.enhanceLevel, owned.substats);
  }

  return { flat: total.flat, percent: total.percent };
}

/**
 * Cards that may be fed to `uid` to raise its star grade (Q8).
 *
 * Pure and exported for the same reason as `computeCardStats`: it builds a fresh
 * array, so using it directly as a Zustand selector would re-render forever.
 * Components memoise it on `save`.
 */
export function ascensionFodderFor(save: SaveDoc, uid: string): OwnedCard[] {
  const card = save.player.cards.find((c) => c.uid === uid);
  if (!card) return [];

  const inDecks = new Set<string>();
  for (const deck of save.player.decks) {
    if (deck.heroUid) inDecks.add(deck.heroUid);
    for (const unit of deck.unitUids) if (unit) inDecks.add(unit);
  }

  // Fodder must match the card's current grade, and must never be the card itself,
  // a favourite, or something the player has slotted into a deck.
  return save.player.cards.filter(
    (c) => c.uid !== uid && c.stars === card.stars && !c.favorite && !inDecks.has(c.uid),
  );
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

  const baseStars = CARD_RARITY_BASE_STARS[def.rarity];
  const graded = (base: number) => statAtGrade(base, card.level, card.stars, baseStars, curve);

  const strength = withGear(graded(def.baseStats.strength), 'strength');
  const attack = withGear(graded(def.baseStats.attack), 'attack');
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
    if (card.level >= levelCap(card.stars, curve)) return false;
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

  ascensionFodder: (uid) => ascensionFodderFor(get().getSave(), uid),

  canAscend: (uid) => {
    const card = get().card(uid);
    if (!card || !canAscend(card.stars)) return false;
    const need = ascendRequirement(card.stars);
    return get().ascensionFodder(uid).length >= need.fodder && get().currency('gold') >= need.gold;
  },

  ascend: (uid, fodderUids) => {
    const card = get().card(uid);
    if (!card || !canAscend(card.stars)) return false;
    const need = ascendRequirement(card.stars);

    const eligible = new Set(
      get()
        .ascensionFodder(uid)
        .map((c) => c.uid),
    );
    const chosen = [...new Set(fodderUids)].filter((f) => eligible.has(f));
    if (chosen.length < need.fodder) return false;
    if (!get().spendCurrency('gold', need.gold)) return false;

    const consumed = new Set(chosen.slice(0, need.fodder));
    set((s) => {
      if (!s.save) return s;
      // Consumed cards simply drop their gear references; the items themselves stay
      // in the inventory to be re-equipped.
      const cards = s.save.player.cards
        .filter((c) => !consumed.has(c.uid))
        .map((c) => (c.uid === uid ? { ...c, stars: c.stars + 1 } : c));
      return { save: { ...s.save, player: { ...s.save.player, cards } } };
    });
    return true;
  },

  skillSlots: (uid) => {
    const card = get().card(uid);
    return card ? unlockedSkillSlots(card.stars) : 0;
  },

  canUpgradeSkill: (uid, index) => {
    const card = get().card(uid);
    if (!card || index >= get().skillSlots(uid)) return false;
    const def = CONTENT.cards.get(card.defId);
    const skillId = def?.skills[index]?.skillId;
    const skill = skillId ? CONTENT.skills.get(skillId) : undefined;
    if (!skill) return false;
    const level = card.skillLevels[index] ?? 1;
    if (level >= skill.maxLevel) return false;
    const cost = skillUpgradeCost(level);
    return get().currency('gold') >= cost.gold && get().currency('tome') >= cost.tomes;
  },

  upgradeSkill: (uid, index) => {
    if (!get().canUpgradeSkill(uid, index)) return false;
    const card = get().card(uid)!;
    const cost = skillUpgradeCost(card.skillLevels[index] ?? 1);
    if (!get().spendCurrency('gold', cost.gold)) return false;
    if (!get().spendCurrency('tome', cost.tomes)) {
      get().addCurrency('gold', cost.gold); // refund; never take one currency without the other
      return false;
    }
    set((s) => {
      if (!s.save) return s;
      const cards = s.save.player.cards.map((c) => {
        if (c.uid !== uid) return c;
        const levels = [...c.skillLevels];
        while (levels.length <= index) levels.push(1);
        levels[index] = (levels[index] ?? 1) + 1;
        return { ...c, skillLevels: levels };
      });
      return { save: { ...s.save, player: { ...s.save.player, cards } } };
    });
    return true;
  },

  enhanceCostFor: (gearUid) => {
    const owned = get().gearItem(gearUid);
    const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
    if (!owned || !def) return 0;
    return enhanceCost(def, owned.enhanceLevel);
  },

  canEnhance: (gearUid) => {
    const owned = get().gearItem(gearUid);
    const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
    if (!owned || !def) return false;
    if (owned.enhanceLevel >= enhanceCap(def.rarity)) return false;
    return get().currency('gold') >= get().enhanceCostFor(gearUid);
  },

  enhance: (gearUid) => {
    if (!get().canEnhance(gearUid)) return false;
    if (!get().spendCurrency('gold', get().enhanceCostFor(gearUid))) return false;
    set((s) => {
      if (!s.save) return s;
      const gear = s.save.player.gear.map((g) =>
        g.uid === gearUid ? { ...g, enhanceLevel: g.enhanceLevel + 1 } : g,
      );
      return { save: { ...s.save, player: { ...s.save.player, gear } } };
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
