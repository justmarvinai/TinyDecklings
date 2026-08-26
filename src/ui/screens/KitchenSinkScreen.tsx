import { useState, type CSSProperties } from 'react';
import { CARD_RARITIES, GEAR_RARITIES, GEAR_SLOTS, type GearSlot } from '@/content/schemas';
import { CONTENT } from '@/content';
import { cardRarityColor, gearRarityColor } from '@/ui/design/rarity';
import { PLACEHOLDER_AVATAR } from '@/ui/art/artManifest';
import { GearSlotIcon, Icon } from '@/ui/icons/Icon';
import {
  Button,
  IconChip,
  Modal,
  Panel,
  Pill,
  Ribbon,
  StarRow,
  StatBar,
  Tabs,
  TitleBanner,
  Toggle,
} from '@/ui/design/primitives';
import styles from './KitchenSinkScreen.module.css';

const DEMO_TABS = [
  { id: 'units', label: 'Units', count: '42/70' },
  { id: 'heroes', label: 'Heroes', count: '5/28', notifications: 1 },
] as const;

/**
 * The design-system reference screen.
 *
 * It exists so every primitive can be eyeballed against `assets/examples/` on a real
 * phone viewport before it is used in a real screen, and so the two rarity systems
 * are visibly distinct side by side (CLAUDE.md rule 4).
 */
export function KitchenSinkScreen() {
  const [tab, setTab] = useState<(typeof DEMO_TABS)[number]['id']>('units');
  const [sfx, setSfx] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={`${styles.screen} u-scroll-y`}>
      <section className={styles.section}>
        <h2 className={styles.heading}>Buttons</h2>
        <div className={styles.row}>
          <Button variant="positive">Level up</Button>
          <Button variant="info">Auto equip</Button>
          <Button variant="warning">Equip</Button>
          <Button variant="danger">Surrender</Button>
          <Button variant="neutral" disabled>
            Disabled
          </Button>
          <Button locked lockHint="6★">
            Rank
          </Button>
        </div>
        <div className={styles.row} style={{ marginTop: 'var(--space-2)' }}>
          <Button variant="positive" stacked icon="stat.power">
            Level up
          </Button>
          <Button variant="warning" stacked icon="ui.star">
            Evolve
          </Button>
          <Button variant="info" stacked icon="nav.cards" notifications={3}>
            Foil
          </Button>
          <Button variant="danger" iconOnly icon="ui.close" aria-label="Close" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Card rarity — frames</h2>
        <div className={styles.grid3}>
          {CARD_RARITIES.map((rarity) => (
            <div key={rarity}>
              <div
                className={styles.cardFrame}
                style={{ '--frame': cardRarityColor(rarity) } as CSSProperties}
              >
                <img className={styles.cardArt} src={PLACEHOLDER_AVATAR} alt="" />
                <span className={styles.cardCooldown}>2</span>
                <span className={`${styles.cardHp} u-number`}>118</span>
                <IconChip name="attackType.melee" size={26} className={styles.cardType} />
              </div>
              <div className={styles.cardCaption}>
                <StarRow value={CARD_RARITIES.indexOf(rarity) + 1} max={5} size={11} />
                <span className={styles.gearLabel}>{rarity}</span>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Cards carry rarity on the frame. Five tiers, card-only colour tokens.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Gear rarity — tiles</h2>
        <div className={styles.grid3}>
          {GEAR_RARITIES.map((rarity, i) => (
            <div key={rarity}>
              <div
                className={styles.gearTile}
                style={{ '--tile': gearRarityColor(rarity) } as CSSProperties}
              >
                <StarRow value={(i % 5) + 1} max={5} size={9} className={styles.gearStars} />
                <GearSlotIcon slot={GEAR_SLOTS[i % GEAR_SLOTS.length] as GearSlot} size={40} />
              </div>
              <div className={styles.gearLabel}>{rarity}</div>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Gear carries rarity as the tile background — six tiers, gear-only tokens, never a card
          colour.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Gear slots — one fixed icon each</h2>
        <div className={styles.grid3}>
          {GEAR_SLOTS.map((slot) => {
            const def = CONTENT.gearSlots.get(slot);
            return (
              <div key={slot}>
                <div className={`${styles.gearTile} ${def?.active ? '' : styles.gearEmpty}`}>
                  <GearSlotIcon slot={slot} size={40} title={slot} />
                </div>
                <div className={styles.gearLabel}>{slot}</div>
              </div>
            );
          })}
        </div>
        <p className={styles.note}>
          Every item in a slot shows this icon — in inventory, on equipment grids and in drops.
          Items differ by name, stats, rarity colour and stars only. Dimmed slots are not active in
          this phase.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Bars &amp; pills</h2>
        <div className={styles.stack}>
          <StatBar
            label="Offense"
            value={4}
            max={5}
            variant="segmented"
            icon="stat.attack"
            color="var(--accent-danger)"
          />
          <StatBar
            label="Defense"
            value={3}
            max={5}
            variant="segmented"
            icon="stat.strength"
            color="var(--accent-positive)"
          />
          <StatBar
            label="XP"
            value={62}
            max={100}
            variant="fill"
            color="var(--accent-xp)"
            showValue
          />
          <div className={styles.row}>
            <Pill
              leading={
                <IconChip name="currency.gold" size={24} background="var(--accent-warning)" />
              }
              value="1,313"
            />
            <Pill
              leading={
                <IconChip name="currency.gems" size={24} background="var(--rarity-card-epic)" />
              }
              value="2,815"
            />
            <Pill
              leading={
                <IconChip name="currency.energy" size={24} background="var(--accent-info)" />
              }
              value="30/30"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Tabs, toggles, panels</h2>
        <div className={styles.stack}>
          <Tabs items={DEMO_TABS} value={tab} onChange={setTab} ariaLabel="Demo tabs" />
          <Toggle value={sfx} onChange={setSfx} ariaLabel="Sound effects" />
          <Panel className={styles.ribbonDemo}>
            <Ribbon>New</Ribbon>
            <Ribbon tone="gold" side="right">
              Boss
            </Ribbon>
            <p className="u-prose">
              Panels use the same outline, bevel and hard drop shadow as every other surface. Prose
              like this stays in normal case, because full caps would hurt readability here.
            </p>
          </Panel>
          <Button variant="header" block onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Status icons</h2>
        <div className={styles.row}>
          {[...CONTENT.statuses.values()].map((status) => (
            <div key={status.id} className={styles.swatch}>
              <Icon name={status.iconKey} size={26} />
              {status.name}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Title banner</h2>
        <TitleBanner title="Cards" onClose={() => undefined} />
      </section>

      {modalOpen ? (
        <Modal title="Confirm" onClose={() => setModalOpen(false)}>
          <p className="u-prose" style={{ marginBottom: 'var(--space-4)' }}>
            Bottom sheet placement keeps the primary action inside comfortable thumb reach on tall
            phones.
          </p>
          <Button variant="positive" block onClick={() => setModalOpen(false)}>
            Got it
          </Button>
        </Modal>
      ) : null}
    </div>
  );
}
