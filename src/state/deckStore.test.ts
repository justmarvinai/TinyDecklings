import { beforeEach, describe, expect, it } from 'vitest';
import { createNewSave } from '@/services/saves';
import { DECK_UNIT_SLOTS, MAX_DECKS, useDeckStore } from './deckStore';
import { usePlayerStore } from './playerStore';

const decks = () => useDeckStore.getState();
const player = () => usePlayerStore.getState();

beforeEach(() => {
  const save = createNewSave(0, 1, 30);
  usePlayerStore.setState({ save });
  decks().hydrate(save);
  player().grantStarterCollection();
});

describe('deck shape (Q6)', () => {
  it('materialises six decks, each with eight unit slots', () => {
    expect(decks().decks()).toHaveLength(MAX_DECKS);
    for (const deck of decks().decks()) {
      expect(deck.unitUids).toHaveLength(DECK_UNIT_SLOTS);
    }
  });

  it('has no defense deck — this is a single-player game', () => {
    const deck = decks().deck(0) as Record<string, unknown>;
    expect(deck).not.toHaveProperty('defense');
    expect(deck).not.toHaveProperty('defenseUids');
  });

  it('clamps the active index to the deck count', () => {
    decks().setActive(99);
    expect(decks().activeIndex).toBe(MAX_DECKS - 1);
    decks().setActive(-3);
    expect(decks().activeIndex).toBe(0);
  });
});

describe('editing', () => {
  it('sets a hero and units', () => {
    const cards = player().cards();
    decks().setHero(0, cards[0].uid);
    decks().setUnit(0, 0, cards[1].uid);
    expect(decks().deck(0).heroUid).toBe(cards[0].uid);
    expect(decks().deck(0).unitUids[0]).toBe(cards[1].uid);
  });

  it('never lets one card occupy two slots in a deck', () => {
    const uid = player().cards()[1].uid;
    decks().setUnit(0, 0, uid);
    decks().setUnit(0, 3, uid);
    expect(
      decks()
        .deck(0)
        .unitUids.filter((u) => u === uid),
    ).toHaveLength(1);
    expect(decks().deck(0).unitUids[3]).toBe(uid);
  });

  it('moving a card into the hero slot pulls it out of the unit row', () => {
    const uid = player().cards()[2].uid;
    decks().setUnit(0, 4, uid);
    decks().setHero(0, uid);
    expect(decks().deck(0).heroUid).toBe(uid);
    expect(decks().deck(0).unitUids).not.toContain(uid);
  });

  it('removes a card from wherever it sits', () => {
    const uid = player().cards()[1].uid;
    decks().setUnit(0, 2, uid);
    decks().removeCard(0, uid);
    expect(decks().deck(0).unitUids).not.toContain(uid);
  });

  it('keeps decks independent of one another', () => {
    const uid = player().cards()[1].uid;
    decks().setUnit(0, 0, uid);
    expect(decks().deck(1).unitUids[0]).toBeNull();
  });

  it('renames, with a sensible limit', () => {
    decks().rename(0, 'Front Line');
    expect(decks().deck(0).name).toBe('Front Line');
    decks().rename(0, '');
    expect(decks().deck(0).name).toBe('Front Line');
  });

  it('clears back to empty', () => {
    decks().autoBuild(0);
    decks().clear(0);
    expect(decks().deck(0).heroUid).toBeNull();
    expect(
      decks()
        .deck(0)
        .unitUids.every((u) => u === null),
    ).toBe(true);
  });
});

describe('auto-build', () => {
  it('fills the deck with a hero and the strongest units', () => {
    decks().autoBuild(0);
    const deck = decks().deck(0);
    expect(deck.heroUid).not.toBeNull();
    expect(deck.unitUids.filter(Boolean).length).toBeGreaterThan(0);
  });

  it('puts a hero in the hero slot, never among the units', () => {
    decks().autoBuild(0);
    const deck = decks().deck(0);
    const heroUids = new Set(
      player()
        .cards()
        .filter((c) => c.defId === 'card.captain_marrow')
        .map((c) => c.uid),
    );
    for (const uid of deck.unitUids) {
      if (uid) expect(heroUids.has(uid)).toBe(false);
    }
  });

  it('never repeats a card', () => {
    decks().autoBuild(0);
    const members = decks().lineup(0);
    expect(new Set(members).size).toBe(members.length);
  });
});

describe('lineup', () => {
  it('lists the hero first, then filled unit slots', () => {
    const cards = player().cards();
    decks().setHero(0, cards[0].uid);
    decks().setUnit(0, 1, cards[1].uid);
    expect(decks().lineup(0)).toEqual([cards[0].uid, cards[1].uid]);
  });

  it('drops members that are no longer owned (e.g. eaten by an ascension)', () => {
    const cards = player().cards();
    decks().setHero(0, cards[0].uid);
    decks().setUnit(0, 0, cards[1].uid);

    usePlayerStore.setState((s) => ({
      save: s.save && {
        ...s.save,
        player: {
          ...s.save.player,
          cards: s.save.player.cards.filter((c) => c.uid !== cards[1].uid),
        },
      },
    }));

    expect(decks().lineup(0)).toEqual([cards[0].uid]);
  });

  it('reports power and fill for the deck header', () => {
    decks().autoBuild(0);
    const summary = decks().summary(0);
    expect(summary.power).toBeGreaterThan(0);
    expect(summary.filled).toBeGreaterThan(0);
  });
});
