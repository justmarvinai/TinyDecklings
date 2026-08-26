import { useMemo, useState, type CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { GearSlot } from '@/content/schemas';
import { CARD_RARITY_LABEL, GEAR_RARITY_LABEL } from '@/content/schemas';
import { computeCardStats, usePlayerStore } from '@/state/playerStore';
import { gearRarityColor } from '@/ui/design/rarity';
import { Button, Modal, Panel, StarRow } from '@/ui/design/primitives';
import { GearSlotIcon, Icon } from '@/ui/icons/Icon';
import { CardFrame } from '@/ui/components/CardFrame';
import styles from './CardsScreen.module.css';

export function CardsScreen() {
  const cards = usePlayerStore((s) => s.cards());
  const statsFor = usePlayerStore((s) => s.statsFor);
  const [openUid, setOpenUid] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...cards].sort((a, b) => statsFor(b.uid).power - statsFor(a.uid).power),
    [cards, statsFor],
  );

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>Units</span>
        <span className={styles.count}>{cards.length} owned</span>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <p className="u-prose">
            Your collection is empty. Win a stage to start collecting cards.
          </p>
        </div>
      ) : (
        <div className={`${styles.grid} u-scroll-y`}>
          {sorted.map((card) => {
            const def = CONTENT.cards.get(card.defId);
            if (!def) return null;
            return (
              <div key={card.uid} className={styles.tile}>
                <CardFrame
                  defId={card.defId}
                  rarity={def.rarity}
                  size="small"
                  showName
                  onClick={() => setOpenUid(card.uid)}
                />
                <span className={styles.tileMeta}>
                  <StarRow value={card.stars} max={6} size={9} />
                  <span className={styles.level}>Lvl {card.level}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {openUid ? <CardDetail uid={openUid} onClose={() => setOpenUid(null)} /> : null}
    </div>
  );
}

/**
 * The card sheet.
 *
 * The slice ships level-up and gear; RANK, EVOLVE, TRAIT and FOIL are deferred past
 * first release (Q22) and render as visibly locked buttons, so the sheet reads
 * complete rather than half-built.
 */
function CardDetail({ uid, onClose }: { uid: string; onClose: () => void }) {
  // Stats are computed, not selected: a selector returning a fresh object every
  // render would loop forever.
  const save = usePlayerStore((s) => s.save);
  const card = usePlayerStore((s) => s.card(uid));
  const stats = useMemo(
    () => (save ? computeCardStats(save, uid) : { strength: 0, attack: 0, speed: 0, power: 0 }),
    [save, uid],
  );
  const cost = usePlayerStore((s) => s.levelUpCost(uid));
  const canLevel = usePlayerStore((s) => s.canLevelUp(uid));
  const levelUp = usePlayerStore((s) => s.levelUp);
  const unequip = usePlayerStore((s) => s.unequip);
  const ownedGear = usePlayerStore((s) => s.gear());
  const [pickingSlot, setPickingSlot] = useState<GearSlot | null>(null);

  const def = card ? CONTENT.cards.get(card.defId) : undefined;
  if (!card || !def) return null;

  const activeSlots = [...CONTENT.gearSlots.values()].filter((s) => s.active);

  return (
    <Modal title={def.name} onClose={onClose}>
      <div className={styles.detail}>
        <div className={styles.detailTop}>
          <CardFrame defId={card.defId} rarity={def.rarity} />

          <div className={styles.detailInfo}>
            <span className={styles.detailName}>{CARD_RARITY_LABEL[def.rarity]}</span>
            <StarRow value={card.stars} max={6} size={16} variant="ascension" />

            <div className={styles.statRow}>
              <Icon name="stat.strength" size={18} />
              <span className={styles.statLabel}>Strength</span>
              <span className={styles.statValue}>{stats.strength}</span>
            </div>
            <div className={styles.statRow}>
              <Icon name="stat.attack" size={18} />
              <span className={styles.statLabel}>Attack</span>
              <span className={styles.statValue}>{stats.attack}</span>
            </div>
            <div className={styles.statRow}>
              <Icon name="stat.power" size={18} />
              <span className={styles.statLabel}>Power</span>
              <span className={styles.statValue}>{stats.power}</span>
            </div>
            <div className={styles.statRow}>
              <Icon
                name={def.attackType === 'melee' ? 'attackType.melee' : 'attackType.ranged'}
                size={18}
              />
              <span className={styles.statLabel}>Type</span>
              <span className={styles.statValue}>{def.attackType}</span>
            </div>
          </div>
        </div>

        {def.leaderSkill ? (
          <Panel tone="raised">
            <span className={styles.sectionTitle}>Leader skill</span>
            <p className={styles.muted}>{def.leaderSkill.description}</p>
          </Panel>
        ) : null}

        <div>
          <span className={styles.sectionTitle}>Gear</span>
          <div className={styles.gearGrid}>
            {activeSlots.map((slot) => {
              const equippedUid = card.equippedGear[slot.id];
              const owned = equippedUid ? ownedGear.find((g) => g.uid === equippedUid) : undefined;
              const gearDef = owned ? CONTENT.gear.get(owned.defId) : undefined;

              return (
                <div key={slot.id}>
                  <button
                    type="button"
                    className={[styles.gearSlot, gearDef ? '' : styles.gearEmpty]
                      .filter(Boolean)
                      .join(' ')}
                    style={
                      gearDef
                        ? ({ '--tile': gearRarityColor(gearDef.rarity) } as CSSProperties)
                        : undefined
                    }
                    onClick={() => setPickingSlot(slot.id)}
                    aria-label={
                      gearDef ? `${gearDef.name}, tap to change` : `Empty ${slot.name} slot`
                    }
                  >
                    <GearSlotIcon slot={slot.id} size={30} />
                  </button>
                  <span className={styles.gearSlotLabel}>{slot.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="positive"
            stacked
            icon="stat.power"
            disabled={!canLevel}
            onClick={() => levelUp(uid)}
          >
            Level up
            <span className={styles.level}>{cost}g</span>
          </Button>
          <Button stacked locked lockHint="Phase 2">
            Evolve
          </Button>
          <Button stacked locked lockHint="Later">
            Foil
          </Button>
        </div>
      </div>

      {pickingSlot ? (
        <GearPicker
          cardUid={uid}
          slot={pickingSlot}
          onClose={() => setPickingSlot(null)}
          onUnequip={() => {
            unequip(uid, pickingSlot);
            setPickingSlot(null);
          }}
        />
      ) : null}
    </Modal>
  );
}

/** Inventory filtered to one slot — every entry shows that slot's fixed icon. */
function GearPicker({
  cardUid,
  slot,
  onClose,
  onUnequip,
}: {
  cardUid: string;
  slot: GearSlot;
  onClose: () => void;
  onUnequip: () => void;
}) {
  const gear = usePlayerStore((s) => s.gear());
  const cards = usePlayerStore((s) => s.cards());
  const equip = usePlayerStore((s) => s.equip);
  const slotDef = CONTENT.gearSlots.get(slot);

  const forSlot = gear.filter((g) => CONTENT.gear.get(g.defId)?.slot === slot);
  const equippedBy = (gearUid: string) =>
    cards.find((c) => Object.values(c.equippedGear).includes(gearUid));

  return (
    <Modal title={slotDef?.name ?? slot} onClose={onClose}>
      <div className={styles.inventoryList}>
        {forSlot.length === 0 ? (
          <p className="u-prose">No {slotDef?.name.toLowerCase()} yet — they drop from battles.</p>
        ) : (
          forSlot.map((owned) => {
            const def = CONTENT.gear.get(owned.defId);
            if (!def) return null;
            const holder = equippedBy(owned.uid);
            return (
              <button
                key={owned.uid}
                type="button"
                className={styles.inventoryRow}
                onClick={() => {
                  equip(cardUid, owned.uid);
                  onClose();
                }}
              >
                <span
                  className={styles.gearSlot}
                  style={
                    {
                      '--tile': gearRarityColor(def.rarity),
                      width: 44,
                      height: 44,
                    } as CSSProperties
                  }
                >
                  <GearSlotIcon slot={def.slot} size={24} />
                </span>
                <span>
                  <span className={styles.inventoryName}>{def.name}</span>
                  <StarRow value={def.stars} max={5} size={10} />
                </span>
                <span className={styles.inventoryMeta}>
                  {GEAR_RARITY_LABEL[def.rarity]}
                  <br />
                  {holder && holder.uid !== cardUid ? 'Equipped elsewhere' : ''}
                </span>
              </button>
            );
          })
        )}
        <Button variant="danger" block onClick={onUnequip}>
          Unequip slot
        </Button>
      </div>
    </Modal>
  );
}
