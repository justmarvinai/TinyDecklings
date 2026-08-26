import { beforeEach, describe, expect, it } from 'vitest';
import { CONTENT, STARTER_CARD_IDS } from '@/content';
import { createNewSave } from '@/services/saves';
import { usePlayerStore, gearBonusesFor } from './playerStore';

const store = () => usePlayerStore.getState();

beforeEach(() => {
  usePlayerStore.setState({ save: createNewSave(0, 1, 30) });
});

describe('collection', () => {
  it('grants the starter collection', () => {
    store().grantStarterCollection();
    expect(store().cards()).toHaveLength(STARTER_CARD_IDS.length);
    const hero = store()
      .cards()
      .find((c) => CONTENT.cards.get(c.defId)?.cardClass === 'hero');
    expect(hero).toBeDefined();
  });

  it('gives a new card the base stars of its rarity (Q8)', () => {
    const uid = store().grantCard('card.ember_drake');
    expect(store().card(uid)?.stars).toBe(3); // rare
    const legendary = store().grantCard('card.tide_tyrant');
    expect(store().card(legendary)?.stars).toBe(5);
  });

  it('computes stats from level and gear', () => {
    const uid = store().grantCard('card.ember_drake');
    const bare = store().statsFor(uid);
    const gearUid = store().grantGear({ defId: 'gear.tyrants_visor', substats: [] });
    store().equip(uid, gearUid);
    const geared = store().statsFor(uid);
    expect(geared.strength).toBeGreaterThan(bare.strength);
    expect(geared.power).toBeGreaterThan(bare.power);
  });

  it('applies percentage substats on top of flat ones', () => {
    const cardUid = store().grantCard('card.ember_drake');
    const gearUid = store().grantGear({
      defId: 'gear.coral_edge',
      substats: [{ stat: 'attack', value: 10, isPercent: true }],
    });
    store().equip(cardUid, gearUid);
    const save = store().getSave();
    const card = store().card(cardUid)!;
    const bonuses = gearBonusesFor(save, card);
    expect(bonuses.percent.attack).toBe(10);
    expect(bonuses.flat.attack).toBeGreaterThan(0);
  });
});

describe('gear equipping', () => {
  it('puts gear in its own slot', () => {
    const cardUid = store().grantCard('card.stone_sentry');
    const bootsUid = store().grantGear({ defId: 'gear.tidewalkers', substats: [] });
    store().equip(cardUid, bootsUid);
    expect(store().card(cardUid)?.equippedGear.boots).toBe(bootsUid);
  });

  it('moves a piece rather than duplicating it across cards', () => {
    const a = store().grantCard('card.stone_sentry');
    const b = store().grantCard('card.ember_drake');
    const bootsUid = store().grantGear({ defId: 'gear.tidewalkers', substats: [] });

    store().equip(a, bootsUid);
    store().equip(b, bootsUid);

    expect(store().card(a)?.equippedGear.boots).toBeUndefined();
    expect(store().card(b)?.equippedGear.boots).toBe(bootsUid);
  });

  it('replaces whatever was in the slot', () => {
    const cardUid = store().grantCard('card.stone_sentry');
    const first = store().grantGear({ defId: 'gear.wave_worn_boots', substats: [] });
    const second = store().grantGear({ defId: 'gear.tidewalkers', substats: [] });
    store().equip(cardUid, first);
    store().equip(cardUid, second);
    expect(store().card(cardUid)?.equippedGear.boots).toBe(second);
  });

  it('unequips', () => {
    const cardUid = store().grantCard('card.stone_sentry');
    const bootsUid = store().grantGear({ defId: 'gear.tidewalkers', substats: [] });
    store().equip(cardUid, bootsUid);
    store().unequip(cardUid, 'boots');
    expect(store().card(cardUid)?.equippedGear.boots).toBeUndefined();
  });
});

describe('levelling', () => {
  it('refuses when gold is short', () => {
    const uid = store().grantCard('card.ember_drake');
    expect(store().canLevelUp(uid)).toBe(false);
    expect(store().levelUp(uid)).toBe(false);
  });

  it('spends gold and raises the level', () => {
    const uid = store().grantCard('card.ember_drake');
    store().addCurrency('gold', 100_000);
    const before = store().currency('gold');
    expect(store().levelUp(uid)).toBe(true);
    expect(store().card(uid)?.level).toBe(2);
    expect(store().currency('gold')).toBeLessThan(before);
  });

  it('stops at the star-gated cap', () => {
    const uid = store().grantCard('card.thorn_sprout'); // common -> 1 star -> cap 10
    store().addCurrency('gold', 10_000_000);
    for (let i = 0; i < 40; i++) store().levelUp(uid);
    expect(store().card(uid)?.level).toBe(10);
    expect(store().canLevelUp(uid)).toBe(false);
  });
});

describe('rewards and records', () => {
  it('applies a reward bundle to currencies, gear and XP', () => {
    const uid = store().grantCard('card.ember_drake');
    store().applyRewards({
      currencies: { gold: 500, gems: 4 },
      cardXp: 200,
      gear: [{ defId: 'gear.coral_edge', substats: [] }],
      cards: [],
      fragments: [],
    });
    expect(store().currency('gold')).toBe(500);
    expect(store().currency('gems')).toBe(4);
    expect(store().gear()).toHaveLength(1);
    expect(store().card(uid)!.xp + store().card(uid)!.level).toBeGreaterThan(1);
  });

  it('keeps the best star rating and counts clears (Q17)', () => {
    store().recordStage(3, 1);
    store().recordStage(3, 3);
    store().recordStage(3, 2);
    expect(store().bestStars(3)).toBe(3);
    expect(store().getSave().player.stageRecords['3'].clears).toBe(3);
  });

  it('a loss records no clear', () => {
    store().recordStage(5, 0);
    expect(store().bestStars(5)).toBe(0);
    expect(store().getSave().player.stageRecords['5'].clears).toBe(0);
  });

  it('never lets a currency go negative', () => {
    store().addCurrency('gold', 10);
    store().addCurrency('gold', -999);
    expect(store().currency('gold')).toBe(0);
    expect(store().spendCurrency('gold', 5)).toBe(false);
  });
});
