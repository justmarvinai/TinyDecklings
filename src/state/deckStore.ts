/**
 * Decks (Q6): six saved decks, each 1 Hero + 8 Units, no duplicates within a deck.
 *
 * The reference's "Defense deck" is deliberately absent — it is multiplayer
 * furniture and this game is single-player only (CLAUDE.md rule 11).
 *
 * Decks live in the player's save; this store is the editing surface over them.
 */
import { create } from 'zustand';
import { CONTENT } from '@/content';
import type { DeckConfig, SaveDoc } from '@/services/saves';
import { usePlayerStore } from './playerStore';

export const MAX_DECKS = 6;
export const DECK_UNIT_SLOTS = 8;

export interface DeckSummary {
  index: number;
  name: string;
  heroUid: string | null;
  unitUids: (string | null)[];
  /** Sum of member Power — the header number in the reference deck screen. */
  power: number;
  filled: number;
}

export interface DeckState {
  activeIndex: number;
  setActive: (index: number) => void;

  decks: () => DeckConfig[];
  deck: (index: number) => DeckConfig;
  summary: (index: number) => DeckSummary;
  activeDeck: () => DeckConfig;

  /** Card uids in board order: hero first, then the filled unit slots. */
  lineup: (index?: number) => string[];

  setHero: (index: number, cardUid: string | null) => void;
  setUnit: (index: number, slot: number, cardUid: string | null) => void;
  removeCard: (index: number, cardUid: string) => void;
  rename: (index: number, name: string) => void;
  /** Fills the deck with the strongest legal cards, hero included. */
  autoBuild: (index: number) => void;
  clear: (index: number) => void;

  hydrate: (save: SaveDoc) => void;
}

function emptyDeck(index: number): DeckConfig {
  return {
    name: `Deck ${index + 1}`,
    heroUid: null,
    unitUids: Array.from({ length: DECK_UNIT_SLOTS }, () => null),
  };
}

/** Pads a stored deck up to the full slot count without mutating the save. */
function normalise(deck: DeckConfig | undefined, index: number): DeckConfig {
  if (!deck) return emptyDeck(index);
  const unitUids = [...deck.unitUids];
  while (unitUids.length < DECK_UNIT_SLOTS) unitUids.push(null);
  return { ...deck, unitUids: unitUids.slice(0, DECK_UNIT_SLOTS) };
}

function writeDecks(mutate: (decks: DeckConfig[]) => DeckConfig[]): void {
  const player = usePlayerStore.getState();
  const save = player.save;
  if (!save) return;
  const current = Array.from({ length: MAX_DECKS }, (_, i) => normalise(save.player.decks[i], i));
  usePlayerStore.setState({
    save: { ...save, player: { ...save.player, decks: mutate(current) } },
  });
}

export const useDeckStore = create<DeckState>((set, get) => ({
  activeIndex: 0,

  setActive: (index) => {
    const clamped = Math.max(0, Math.min(index, MAX_DECKS - 1));
    set({ activeIndex: clamped });
    const save = usePlayerStore.getState().save;
    if (save) {
      usePlayerStore.setState({
        save: { ...save, player: { ...save.player, activeDeckIndex: clamped } },
      });
    }
  },

  decks: () => {
    const save = usePlayerStore.getState().save;
    return Array.from({ length: MAX_DECKS }, (_, i) => normalise(save?.player.decks[i], i));
  },

  deck: (index) => get().decks()[Math.max(0, Math.min(index, MAX_DECKS - 1))],

  activeDeck: () => get().deck(get().activeIndex),

  summary: (index) => {
    const deck = get().deck(index);
    const player = usePlayerStore.getState();
    const members = [deck.heroUid, ...deck.unitUids].filter((uid): uid is string => Boolean(uid));
    const power = members.reduce((sum, uid) => sum + player.statsFor(uid).power, 0);
    return {
      index,
      name: deck.name,
      heroUid: deck.heroUid,
      unitUids: deck.unitUids,
      power,
      filled: members.length,
    };
  },

  lineup: (index) => {
    const deck = get().deck(index ?? get().activeIndex);
    const owned = new Set(
      usePlayerStore
        .getState()
        .cards()
        .map((c) => c.uid),
    );
    // Cards can be ascended away underneath a deck; skip anything no longer owned.
    return [deck.heroUid, ...deck.unitUids].filter(
      (uid): uid is string => Boolean(uid) && owned.has(uid as string),
    );
  },

  setHero: (index, cardUid) =>
    writeDecks((decks) =>
      decks.map((deck, i) => {
        if (i !== index) return deck;
        // A card can only appear once in a deck (Q6).
        const unitUids = deck.unitUids.map((uid) => (uid === cardUid ? null : uid));
        return { ...deck, heroUid: cardUid, unitUids };
      }),
    ),

  setUnit: (index, slot, cardUid) =>
    writeDecks((decks) =>
      decks.map((deck, i) => {
        if (i !== index) return deck;
        const unitUids = deck.unitUids.map((uid, s) => {
          if (s === slot) return cardUid;
          return uid === cardUid ? null : uid;
        });
        const heroUid = deck.heroUid === cardUid ? null : deck.heroUid;
        return { ...deck, heroUid, unitUids };
      }),
    ),

  removeCard: (index, cardUid) =>
    writeDecks((decks) =>
      decks.map((deck, i) =>
        i === index
          ? {
              ...deck,
              heroUid: deck.heroUid === cardUid ? null : deck.heroUid,
              unitUids: deck.unitUids.map((uid) => (uid === cardUid ? null : uid)),
            }
          : deck,
      ),
    ),

  rename: (index, name) =>
    writeDecks((decks) =>
      decks.map((deck, i) =>
        i === index ? { ...deck, name: name.slice(0, 24) || deck.name } : deck,
      ),
    ),

  autoBuild: (index) => {
    const player = usePlayerStore.getState();
    const ranked = player
      .cards()
      .map((card) => ({
        card,
        def: CONTENT.cards.get(card.defId),
        power: player.statsFor(card.uid).power,
      }))
      .sort((a, b) => b.power - a.power);

    const hero = ranked.find((r) => r.def?.cardClass === 'hero');
    const units = ranked
      .filter((r) => r.def?.cardClass === 'unit')
      .slice(0, DECK_UNIT_SLOTS)
      .map((r) => r.card.uid);

    writeDecks((decks) =>
      decks.map((deck, i) =>
        i === index
          ? {
              ...deck,
              heroUid: hero?.card.uid ?? null,
              unitUids: Array.from({ length: DECK_UNIT_SLOTS }, (_, s) => units[s] ?? null),
            }
          : deck,
      ),
    );
  },

  clear: (index) =>
    writeDecks((decks) => decks.map((deck, i) => (i === index ? emptyDeck(i) : deck))),

  hydrate: (save) => {
    set({ activeIndex: Math.max(0, Math.min(save.player.activeDeckIndex, MAX_DECKS - 1)) });
    // Materialise the six decks so the builder always has something to edit.
    writeDecks((decks) => decks);
  },
}));
