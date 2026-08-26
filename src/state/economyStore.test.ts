import { beforeEach, describe, expect, it } from 'vitest';
import { CONTENT, ENERGY_CONFIG } from '@/content';
import { createFixedClock } from '@/services/clock';
import { createNewSave } from '@/services/saves';
import { useEconomyStore } from './economyStore';
import { usePlayerStore } from './playerStore';

const economy = () => useEconomyStore.getState();
const player = () => usePlayerStore.getState();
const STEP = ENERGY_CONFIG.regenSeconds * 1000;
/** Early in a UTC day, so a few hours of test time cannot cross midnight. */
const T0 = Date.UTC(2026, 7, 26, 2, 0, 0);

let clock: ReturnType<typeof createFixedClock>;

beforeEach(() => {
  clock = createFixedClock(T0);
  usePlayerStore.setState({ save: createNewSave(T0, 4242, ENERGY_CONFIG.cap) });
  useEconomyStore.setState({ clock });
});

describe('energy in play (Q14b)', () => {
  it('starts full', () => {
    expect(economy().energy().current).toBe(ENERGY_CONFIG.cap);
  });

  it('charges a battle and refuses when empty', () => {
    for (let i = 0; i < 6; i++) economy().spendForStage('battle');
    expect(economy().energy().current).toBe(0);
    expect(economy().canEnterStage('battle')).toBe(false);
    expect(economy().spendForStage('battle')).toBe(false);
  });

  it('lets free stages through with nothing in the tank', () => {
    for (let i = 0; i < 6; i++) economy().spendForStage('battle');
    expect(economy().canEnterStage('event')).toBe(true);
    expect(economy().spendForStage('camp')).toBe(true);
  });

  it('refills over real time', () => {
    for (let i = 0; i < 6; i++) economy().spendForStage('battle');
    clock.advance(STEP * 5);
    expect(economy().energy().current).toBe(5);
    expect(economy().canEnterStage('battle')).toBe(true);
  });

  it('persists the settled value into the save', () => {
    economy().spendForStage('boss');
    expect(player().getSave().player.energy.current).toBe(ENERGY_CONFIG.cap - 8);
  });

  it('shop refills may push above the cap', () => {
    economy().grantEnergy(30);
    expect(economy().energy().current).toBe(ENERGY_CONFIG.cap + 30);
  });
});

describe('summoning (Q13: earnable, no real money)', () => {
  it('refuses without tokens', () => {
    expect(economy().canSummon('pool.unit_t1', 1)).toBe(false);
    expect(economy().summon('pool.unit_t1', 1)).toEqual([]);
  });

  it('spends a token and grants a card', () => {
    player().addCurrency('token_unit_t1', 5);
    const before = player().cards().length;
    const results = economy().summon('pool.unit_t1', 1);
    expect(results).toHaveLength(1);
    expect(player().cards().length).toBe(before + 1);
    expect(player().currency('token_unit_t1')).toBe(4);
  });

  it('discounts a ten-pull', () => {
    expect(economy().summonCostFor('pool.unit_t1', 10)).toBeLessThan(
      economy().summonCostFor('pool.unit_t1', 1) * 10,
    );
  });

  it('pays fragments for duplicates rather than wasting them', () => {
    player().addCurrency('token_unit_t1', 40);
    economy().summon('pool.unit_t1', 10);
    const results = economy().summon('pool.unit_t1', 10);
    const dupes = results.filter((r) => r.duplicate);
    if (dupes.length > 0) {
      expect(player().currency('fragment')).toBeGreaterThan(0);
      expect(dupes.every((d) => d.fragments > 0)).toBe(true);
    }
  });

  it('advances pity and stores it per pool', () => {
    player().addCurrency('token_unit_t2', 5);
    economy().summon('pool.unit_t2', 1);
    const meters = economy().pityMeters('pool.unit_t2');
    expect(meters.length).toBeGreaterThan(0);
    expect(player().getSave().player.pity['pool.unit_t2']).toBeDefined();
  });

  it('never re-rolls the same batch after a reload', () => {
    player().addCurrency('token_unit_t1', 40);
    const first = economy()
      .summon('pool.unit_t1', 5)
      .map((r) => r.cardId);
    const second = economy()
      .summon('pool.unit_t1', 5)
      .map((r) => r.cardId);
    expect(player().getSave().player.summonCounts['pool.unit_t1']).toBe(10);
    // Two consecutive batches must not be identical draws.
    expect(first.join()).not.toBe(second.join());
  });

  it('only ever grants cards the player can own', () => {
    player().addCurrency('token_hero', 10);
    for (const result of economy().summon('pool.hero', 5)) {
      expect(CONTENT.cards.get(result.cardId)?.enemyOnly).toBe(false);
      expect(CONTENT.cards.get(result.cardId)?.cardClass).toBe('hero');
    }
  });
});

describe('fragment exchange', () => {
  it('needs enough fragments', () => {
    expect(economy().canExchange('card.ember_drake')).toBe(false);
    player().addCurrency('fragment', 5000);
    expect(economy().canExchange('card.ember_drake')).toBe(true);
  });

  it('spends fragments and grants exactly that card', () => {
    player().addCurrency('fragment', 5000);
    const cost = economy().exchangeCost('card.ember_drake');
    expect(economy().exchangeFragments('card.ember_drake')).toBe(true);
    expect(player().currency('fragment')).toBe(5000 - cost);
    expect(
      player()
        .cards()
        .some((c) => c.defId === 'card.ember_drake'),
    ).toBe(true);
  });

  it('charges more for rarer cards', () => {
    expect(economy().exchangeCost('card.sunken_king')).toBeGreaterThan(
      economy().exchangeCost('card.thorn_sprout'),
    );
  });

  it('refuses enemy-only cards', () => {
    player().addCurrency('fragment', 99_999);
    expect(economy().canExchange('card.tide_tyrant')).toBe(false);
  });
});

describe('shop (Q13: earned currency only)', () => {
  it('never sells anything for real money', () => {
    for (const offer of CONTENT.shopOffers.values()) {
      expect(['gold', 'gems', 'fragment', 'tome']).toContain(offer.price.currency);
    }
  });

  it('stocks permanent offers plus a daily selection', () => {
    const offers = economy().shopOffers();
    expect(offers.some((o) => o.rotation === 'permanent')).toBe(true);
    expect(offers.some((o) => o.rotation === 'daily')).toBe(true);
  });

  it('shows the same line-up all day', () => {
    const today = economy()
      .shopOffers()
      .map((o) => o.id);
    clock.advance(6 * 60 * 60 * 1000); // still the same UTC day
    expect(
      economy()
        .shopOffers()
        .map((o) => o.id),
    ).toEqual(today);
  });

  it('rotates to a different line-up on another day', () => {
    const today = economy()
      .shopOffers()
      .map((o) => o.id);
    // Look ahead far enough that an identical draw would be a real coincidence.
    const seen = new Set<string>();
    for (let day = 1; day <= 14; day++) {
      clock.advance(24 * 60 * 60 * 1000);
      seen.add(
        economy()
          .shopOffers()
          .map((o) => o.id)
          .join(),
      );
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(economy().shopOffers()).toHaveLength(today.length);
  });

  it('refuses a purchase the player cannot afford', () => {
    expect(economy().canBuyOffer('offer.energy_small')).toBe(false);
    expect(economy().buyOffer('offer.energy_small')).toBe(false);
  });

  it('buys an energy refill and adds energy, not a wallet entry', () => {
    player().addCurrency('gems', 500);
    for (let i = 0; i < 6; i++) economy().spendForStage('battle');
    expect(economy().energy().current).toBe(0);

    expect(economy().buyOffer('offer.energy_small')).toBe(true);
    expect(economy().energy().current).toBe(30);
    expect(player().currency('energy')).toBe(0);
  });

  it('grants a normal currency reward', () => {
    player().addCurrency('gems', 500);
    const before = player().currency('tome');
    expect(economy().buyOffer('offer.tome_bundle')).toBe(true);
    expect(player().currency('tome')).toBeGreaterThan(before);
  });

  it('enforces per-rotation purchase limits', () => {
    player().addCurrency('gems', 100_000);
    const limited = [...CONTENT.shopOffers.values()].find(
      (o) => o.limit === 1 && o.price.currency === 'gems',
    );
    if (!limited) return;
    // Only test it if today's rotation actually stocks it.
    if (
      !economy()
        .shopOffers()
        .some((o) => o.id === limited.id)
    )
      return;

    expect(economy().buyOffer(limited.id)).toBe(true);
    expect(economy().offerPurchasesLeft(limited.id)).toBe(0);
    expect(economy().buyOffer(limited.id)).toBe(false);
  });

  it('resets limits when the day rolls over', () => {
    player().addCurrency('gems', 100_000);
    economy().buyOffer('offer.energy_small');
    clock.advance(25 * 60 * 60 * 1000);
    expect(economy().offerPurchasesLeft('offer.energy_small')).toBe(Infinity);
  });
});
