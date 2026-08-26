import { useState } from 'react';
import { CONTENT } from '@/content';
import { DECK_UNIT_SLOTS, MAX_DECKS, useDeckStore } from '@/state/deckStore';
import { usePlayerStore } from '@/state/playerStore';
import { Button, Modal, StarRow } from '@/ui/design/primitives';
import { CardFrame } from '@/ui/components/CardFrame';
import styles from './DeckScreen.module.css';

type SlotTarget = { kind: 'hero' } | { kind: 'unit'; slot: number };

/**
 * The deck builder (Q6): six decks, one hero plus eight units, no duplicates.
 *
 * No defense deck — that is multiplayer furniture from the reference and this game
 * is single-player only.
 */
export function DeckScreen() {
  const activeIndex = useDeckStore((s) => s.activeIndex);
  const setActive = useDeckStore((s) => s.setActive);
  const save = usePlayerStore((s) => s.save);
  const [picking, setPicking] = useState<SlotTarget | null>(null);

  const store = useDeckStore.getState();
  const deck = store.deck(activeIndex);
  const summary = store.summary(activeIndex);
  void save; // re-render when the collection or decks change

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.powerPill}>
          <span className={styles.powerLabel}>Deck power</span>
          <span className={styles.powerValue}>{summary.power}</span>
        </span>
        <span className={styles.muted}>
          {summary.filled}/{DECK_UNIT_SLOTS + 1} slots
        </span>
      </div>

      <div className={styles.board}>
        <div className={styles.slot}>
          {deck.heroUid ? (
            <DeckCard uid={deck.heroUid} onClick={() => setPicking({ kind: 'hero' })} />
          ) : (
            <button
              type="button"
              className={styles.emptySlot}
              onClick={() => setPicking({ kind: 'hero' })}
              aria-label="Choose a hero"
            >
              +
            </button>
          )}
          <span className={styles.slotLabel}>Hero</span>
        </div>

        <div className={styles.units}>
          {Array.from({ length: DECK_UNIT_SLOTS }, (_, slot) => {
            const uid = deck.unitUids[slot];
            return (
              <div key={slot} className={styles.slot}>
                {uid ? (
                  <DeckCard uid={uid} small onClick={() => setPicking({ kind: 'unit', slot })} />
                ) : (
                  <button
                    type="button"
                    className={styles.emptySlot}
                    onClick={() => setPicking({ kind: 'unit', slot })}
                    aria-label={`Choose a unit for slot ${slot + 1}`}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.pager}>
        {Array.from({ length: MAX_DECKS }, (_, i) => (
          <button
            key={i}
            type="button"
            className={[styles.dot, i === activeIndex ? styles.dotActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setActive(i)}
            aria-label={`Deck ${i + 1}`}
            aria-current={i === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="info" block onClick={() => useDeckStore.getState().autoBuild(activeIndex)}>
          Auto build
        </Button>
        <Button variant="neutral" block onClick={() => useDeckStore.getState().clear(activeIndex)}>
          Clear
        </Button>
      </div>

      {picking ? (
        <CardPicker target={picking} deckIndex={activeIndex} onClose={() => setPicking(null)} />
      ) : null}
    </div>
  );
}

function DeckCard({ uid, small, onClick }: { uid: string; small?: boolean; onClick: () => void }) {
  const card = usePlayerStore((s) => s.card(uid));
  const def = card ? CONTENT.cards.get(card.defId) : undefined;
  if (!card || !def) return null;
  return (
    <>
      <CardFrame
        defId={card.defId}
        rarity={def.rarity}
        size={small ? 'small' : 'medium'}
        onClick={onClick}
        ariaLabel={`${def.name}, level ${card.level}`}
      />
      <StarRow value={card.stars} max={6} size={small ? 7 : 10} />
    </>
  );
}

function CardPicker({
  target,
  deckIndex,
  onClose,
}: {
  target: SlotTarget;
  deckIndex: number;
  onClose: () => void;
}) {
  const cards = usePlayerStore((s) => s.cards());
  const statsFor = usePlayerStore((s) => s.statsFor);
  const deck = useDeckStore.getState().deck(deckIndex);

  const wantsHero = target.kind === 'hero';
  const candidates = cards
    .filter((c) => (CONTENT.cards.get(c.defId)?.cardClass === 'hero') === wantsHero)
    .sort((a, b) => statsFor(b.uid).power - statsFor(a.uid).power);

  const inDeck = new Set([deck.heroUid, ...deck.unitUids].filter(Boolean) as string[]);

  const choose = (uid: string | null) => {
    const store = useDeckStore.getState();
    if (target.kind === 'hero') store.setHero(deckIndex, uid);
    else store.setUnit(deckIndex, target.slot, uid);
    onClose();
  };

  return (
    <Modal title={wantsHero ? 'Choose hero' : 'Choose unit'} onClose={onClose}>
      {candidates.length === 0 ? (
        <p className="u-prose">
          {wantsHero
            ? 'You have no heroes yet. Heroes lead a deck and buff it with a leader skill.'
            : 'No units available.'}
        </p>
      ) : (
        <div className={styles.pickerList}>
          {candidates.map((card) => {
            const def = CONTENT.cards.get(card.defId);
            if (!def) return null;
            return (
              <div
                key={card.uid}
                className={[styles.pickerTile, inDeck.has(card.uid) ? styles.inDeck : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <CardFrame
                  defId={card.defId}
                  rarity={def.rarity}
                  size="small"
                  showName
                  onClick={() => choose(card.uid)}
                  ariaLabel={`${def.name}, power ${statsFor(card.uid).power}`}
                />
                <span className={styles.slotLabel}>Lvl {card.level}</span>
              </div>
            );
          })}
        </div>
      )}
      <Button
        variant="danger"
        block
        onClick={() => choose(null)}
        style={{ marginTop: 'var(--space-3)' }}
      >
        Empty this slot
      </Button>
    </Modal>
  );
}
