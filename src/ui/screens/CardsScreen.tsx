import { useMemo, useState, type CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { GearSlot, GearSlotDef } from '@/content/schemas';
import { CARD_RARITY_LABEL, GEAR_RARITY_LABEL } from '@/content/schemas';
import { describeSubstat, enhanceCap, gearMainStat } from '@/engine/gear';
import { MAX_STARS, ascendRequirement, skillUpgradeCost } from '@/engine/progression';
import { ascensionFodderFor, computeCardStats, usePlayerStore } from '@/state/playerStore';
import type { OwnedCard, OwnedGear } from '@/services/saves';
import { gearRarityColor } from '@/ui/design/rarity';
import { Button, IconChip, Modal, Panel, StarRow, Tabs, useHoldTip } from '@/ui/design/primitives';
import { TitleBanner } from '@/ui/design/primitives';
import { GearSlotIcon, Icon } from '@/ui/icons/Icon';
import { CardFrame } from '@/ui/components/CardFrame';
import { CardTip, GearTip } from '@/ui/components/Tips';
import { DeckScreen } from './DeckScreen';
import { LockedFeatureSheet } from '@/ui/components/LockedFeatureSheet';
import { useSfx } from '@/ui/audio/audioContext';
import { deferredLabel, type DeferredFeatureId } from '@/ui/text/deferred';
import { attackTypeLabel } from '@/ui/text/labels';
import styles from './CardsScreen.module.css';

type CollectionTab = 'units' | 'heroes' | 'deck';
type SortMode = 'power' | 'level' | 'stars' | 'name';

const SORT_LABEL: Record<SortMode, string> = {
  power: 'Power',
  level: 'Level',
  stars: 'Stars',
  name: 'Name',
};

const SORT_ORDER: SortMode[] = ['power', 'level', 'stars', 'name'];

/**
 * Collection and decks, in the shape of the reference `Decks.png`: the deck sits on
 * top, the owned cards below, with tabs splitting units from heroes.
 */
export function CardsScreen() {
  const cards = usePlayerStore((s) => s.cards());
  const statsFor = usePlayerStore((s) => s.statsFor);
  const [tab, setTab] = useState<CollectionTab>('units');
  const [sort, setSort] = useState<SortMode>('power');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [openUid, setOpenUid] = useState<string | null>(null);

  const heroCount = cards.filter((c) => CONTENT.cards.get(c.defId)?.cardClass === 'hero').length;

  const visible = useMemo(() => {
    // The deck tab lists everything below the builder, as in the reference layout.
    const wantHero = tab === 'heroes';
    return cards
      .filter(
        (c) => tab === 'deck' || (CONTENT.cards.get(c.defId)?.cardClass === 'hero') === wantHero,
      )
      .filter((c) => !favouritesOnly || c.favorite)
      .sort((a, b) => {
        switch (sort) {
          case 'level':
            return b.level - a.level;
          case 'stars':
            return b.stars - a.stars;
          case 'name':
            return (CONTENT.cards.get(a.defId)?.name ?? '').localeCompare(
              CONTENT.cards.get(b.defId)?.name ?? '',
            );
          default:
            return statsFor(b.uid).power - statsFor(a.uid).power;
        }
      });
  }, [cards, tab, sort, favouritesOnly, statsFor]);

  return (
    <div className={styles.screen}>
      <TitleBanner title="Cards" />
      <Tabs
        items={[
          { id: 'units', label: 'Units', count: `${cards.length - heroCount}` },
          { id: 'heroes', label: 'Heroes', count: `${heroCount}` },
          { id: 'deck', label: 'Deck' },
        ]}
        value={tab}
        onChange={setTab}
        ariaLabel="Collection tabs"
        className={styles.controls}
      />

      {tab === 'deck' ? (
        <div className={`${styles.deckPane} u-scroll-y`}>
          <div className={styles.deckStrip}>
            <DeckScreen />
          </div>
          <span className={styles.sectionTitle} style={{ padding: '0 var(--space-3)' }}>
            Collection
          </span>
          <CollectionGrid cards={visible} onOpen={setOpenUid} />
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <Button
              variant="neutral"
              icon="ui.sort"
              onClick={() =>
                setSort(SORT_ORDER[(SORT_ORDER.indexOf(sort) + 1) % SORT_ORDER.length])
              }
            >
              {SORT_LABEL[sort]}
            </Button>
            <Button
              variant={favouritesOnly ? 'warning' : 'neutral'}
              icon="ui.star"
              onClick={() => setFavouritesOnly((v) => !v)}
            >
              Favourites
            </Button>
            <span className={styles.controlsSpacer} />
            <span className={styles.count}>{visible.length}</span>
          </div>

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <p className="u-prose">
                {favouritesOnly
                  ? 'No favourites yet — mark a card in its detail sheet to keep it safe from ascension.'
                  : 'Nothing here yet. Win a stage to start collecting cards.'}
              </p>
            </div>
          ) : (
            <CollectionGrid cards={visible} onOpen={setOpenUid} scroll />
          )}
        </>
      )}

      {openUid ? <CardDetail uid={openUid} onClose={() => setOpenUid(null)} /> : null}
    </div>
  );
}

/**
 * The card sheet.
 *
 * Level up, evolve, gear and skills are live. RANK, TRAIT, FOIL and artifact sets
 * are deferred past first release (Q22) and render as visibly locked buttons, so
 * the sheet reads complete rather than half-built.
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
  const ownedGear = usePlayerStore((s) => s.gear());
  const [pickingSlot, setPickingSlot] = useState<GearSlot | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showEvolve, setShowEvolve] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<DeferredFeatureId | null>(null);
  const sfx = useSfx();

  const def = card ? CONTENT.cards.get(card.defId) : undefined;
  if (!card || !def) return null;

  const slots = [...CONTENT.gearSlots.values()].filter((s) => s.active);
  const atMaxStars = card ? card.stars >= MAX_STARS : true;
  const toggleFavourite = () => {
    usePlayerStore.setState((s) => ({
      save: s.save && {
        ...s.save,
        player: {
          ...s.save.player,
          cards: s.save.player.cards.map((c) =>
            c.uid === uid ? { ...c, favorite: !c.favorite } : c,
          ),
        },
      },
    }));
  };

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
            {slots.map((slot) => (
              <EquipSlot
                key={slot.id}
                slot={slot}
                owned={
                  card.equippedGear[slot.id]
                    ? ownedGear.find((g) => g.uid === card.equippedGear[slot.id])
                    : undefined
                }
                locked={card.stars < slot.unlockStars}
                onPick={() => setPickingSlot(slot.id)}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="positive"
            stacked
            icon="stat.power"
            disabled={!canLevel}
            onClick={() => {
              if (levelUp(uid)) sfx('reward.levelUp');
            }}
          >
            Level up
            <span className={styles.level}>{cost}g</span>
          </Button>
          <Button
            variant="warning"
            stacked
            icon="ui.star"
            disabled={atMaxStars}
            onClick={() => setShowEvolve(true)}
          >
            Evolve
          </Button>
          <Button variant="info" stacked icon="currency.tome" onClick={() => setShowSkills(true)}>
            Skills
          </Button>
          <Button
            variant={card.favorite ? 'warning' : 'neutral'}
            stacked
            icon="ui.check"
            onClick={toggleFavourite}
          >
            {card.favorite ? 'Favoured' : 'Favourite'}
          </Button>
        </div>

        <DeferredRow onOpen={setLockedFeature} />
      </div>

      {pickingSlot ? (
        <GearPicker cardUid={uid} slot={pickingSlot} onClose={() => setPickingSlot(null)} />
      ) : null}
      {showSkills ? <SkillSheet uid={uid} onClose={() => setShowSkills(false)} /> : null}
      {showEvolve ? <EvolveSheet uid={uid} onClose={() => setShowEvolve(false)} /> : null}
      {lockedFeature ? (
        <LockedFeatureSheet feature={lockedFeature} onClose={() => setLockedFeature(null)} />
      ) : null}
    </Modal>
  );
}

/**
 * The systems the card sheet shows but does not have yet (Q22).
 *
 * Visible but locked, set apart from the live actions so nothing here competes
 * with what the player can actually do. Tapping one explains what it would be.
 */
const DEFERRED_CARD_FEATURES: readonly DeferredFeatureId[] = [
  'rank',
  'trait',
  'foil',
  'artifactSet',
];

function DeferredRow({ onOpen }: { onOpen: (id: DeferredFeatureId) => void }) {
  return (
    <div className={styles.deferred}>
      <span className={styles.deferredLabel}>After the first release</span>
      <div className={styles.deferredRow}>
        {DEFERRED_CARD_FEATURES.map((id) => (
          <Button
            key={id}
            variant="neutral"
            className={styles.deferredButton}
            onClick={() => onOpen(id)}
          >
            <IconChip name="ui.lock" size={16} />
            {deferredLabel(id, true)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Skill ladder: one slot per star, upgraded with gold and tomes (Q18). */
function SkillSheet({ uid, onClose }: { uid: string; onClose: () => void }) {
  const card = usePlayerStore((s) => s.card(uid));
  const slots = usePlayerStore((s) => s.skillSlots(uid));
  const upgradeSkill = usePlayerStore((s) => s.upgradeSkill);
  const canUpgrade = usePlayerStore((s) => s.canUpgradeSkill);
  const def = card ? CONTENT.cards.get(card.defId) : undefined;
  if (!card || !def) return null;

  return (
    <Modal title="Skills" onClose={onClose}>
      <div className={styles.skillList}>
        {def.skills.map((ref, index) => {
          const skill = CONTENT.skills.get(ref.skillId);
          if (!skill) return null;
          const unlocked = index < slots;
          const level = card.skillLevels[index] ?? 1;
          const cost = skillUpgradeCost(level);
          const maxed = level >= skill.maxLevel;

          return (
            <div
              key={ref.skillId + index}
              className={[styles.skillRow, unlocked ? '' : styles.skillLocked]
                .filter(Boolean)
                .join(' ')}
            >
              <IconChip name={unlocked ? skill.iconKey : 'ui.lock'} size={34} shape="square" />
              <span className={styles.skillBody}>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={styles.skillDesc}>
                  {unlocked ? skill.description : `Unlocks at ${ref.unlockStars}★`}
                </span>
              </span>
              {unlocked ? (
                maxed ? (
                  <span className={styles.skillLevel}>Max</span>
                ) : (
                  <Button
                    variant="positive"
                    disabled={!canUpgrade(uid, index)}
                    onClick={() => upgradeSkill(uid, index)}
                  >
                    Lvl {level} → {level + 1}
                    <span className={styles.skillLevel}>
                      {cost.gold}g · {cost.tomes}
                    </span>
                  </Button>
                )
              ) : (
                <span className={styles.skillLevel}>{ref.unlockStars}★</span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/** EVOLVE: consume same-grade fodder to gain a star (Q8). */
function EvolveSheet({ uid, onClose }: { uid: string; onClose: () => void }) {
  const save = usePlayerStore((s) => s.save);
  const card = usePlayerStore((s) => s.card(uid));
  // Fresh array per call — memoise rather than select (see playerStore).
  const fodder = useMemo(() => (save ? ascensionFodderFor(save, uid) : []), [save, uid]);
  const gold = usePlayerStore((s) => s.currency('gold'));
  const ascend = usePlayerStore((s) => s.ascend);
  const [chosen, setChosen] = useState<string[]>([]);
  if (!card) return null;

  const need = ascendRequirement(card.stars);
  const shortOfFodder = Math.max(0, need.fodder - fodder.length);
  const shortOfGold = Math.max(0, need.gold - gold);
  const ready = chosen.length === need.fodder && shortOfGold === 0;

  return (
    <Modal title="Evolve" onClose={onClose}>
      <p className="u-prose" style={{ marginBottom: 'var(--space-2)' }}>
        Feed {need.fodder} card{need.fodder === 1 ? '' : 's'} of {card.stars}★ and {need.gold} gold
        to reach {card.stars + 1}★. Every star raises stats, the level cap and unlocks a skill slot.
      </p>
      <p className={styles.muted} style={{ marginBottom: 'var(--space-3)' }}>
        Favourites and cards sitting in a deck are never eaten — free one up if you are short.
      </p>

      {shortOfFodder > 0 || shortOfGold > 0 ? (
        <Panel tone="raised" style={{ marginBottom: 'var(--space-3)' }}>
          <p className={styles.muted}>
            {shortOfFodder > 0
              ? `You need ${shortOfFodder} more ${card.stars}★ card${shortOfFodder === 1 ? '' : 's'} to feed. `
              : ''}
            {shortOfGold > 0 ? `You are ${shortOfGold} gold short.` : ''}
          </p>
        </Panel>
      ) : null}

      <div className={styles.fodderGrid}>
        <div className={styles.grid} style={{ padding: 0 }}>
          {fodder.map((c) => {
            const def = CONTENT.cards.get(c.defId);
            if (!def) return null;
            const picked = chosen.includes(c.uid);
            return (
              <div key={c.uid} className={styles.tile}>
                <CardFrame
                  defId={c.defId}
                  rarity={def.rarity}
                  size="small"
                  showName
                  targetable={picked}
                  onClick={() =>
                    setChosen((prev) =>
                      prev.includes(c.uid)
                        ? prev.filter((u) => u !== c.uid)
                        : prev.length < need.fodder
                          ? [...prev, c.uid]
                          : prev,
                    )
                  }
                  ariaLabel={`${def.name}, level ${c.level}${picked ? ', selected' : ''}`}
                />
                <span className={styles.level}>Lvl {c.level}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Button
        variant="warning"
        block
        disabled={!ready}
        style={{ marginTop: 'var(--space-3)' }}
        onClick={() => {
          if (ascend(uid, chosen)) onClose();
        }}
      >
        {shortOfGold > 0
          ? 'Not enough gold'
          : ready
            ? `Evolve to ${card.stars + 1}★`
            : `Pick ${need.fodder - chosen.length} more`}
      </Button>
    </Modal>
  );
}

/** Inventory filtered to one slot — every entry shows that slot's fixed icon. */
/** A row in the gear picker: the same hold, so the two lists behave alike. */
function InventoryTile({
  owned,
  holderName,
  onInspect,
}: {
  owned: OwnedGear;
  holderName?: string;
  onInspect: () => void;
}) {
  const def = CONTENT.gear.get(owned.defId);
  const { bind, tip } = useHoldTip(
    def ? (
      <GearTip
        defId={owned.defId}
        enhanceLevel={owned.enhanceLevel}
        substats={owned.substats}
        equippedBy={holderName}
      />
    ) : null,
  );
  if (!def) return null;
  return (
    <>
      <button
        type="button"
        className={styles.gearSlot}
        style={{ '--tile': gearRarityColor(def.rarity), width: 44, height: 44 } as CSSProperties}
        onClick={onInspect}
        {...bind}
        aria-label={`Inspect ${def.name}`}
      >
        <GearSlotIcon slot={def.slot} size={24} />
      </button>
      {tip}
    </>
  );
}

/**
 * One equipment slot, holdable.
 *
 * Nine slots wearing nine identical icons, told apart by a rarity colour: what a
 * piece actually gives was two taps away, on a sheet the player has to leave the
 * card to reach. Its own component because each slot needs its own hold state.
 */
function EquipSlot({
  slot,
  owned,
  locked,
  onPick,
}: {
  slot: GearSlotDef;
  owned: OwnedGear | undefined;
  locked: boolean;
  onPick: () => void;
}) {
  const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
  const { bind, tip } = useHoldTip(
    owned && def ? (
      <GearTip defId={owned.defId} enhanceLevel={owned.enhanceLevel} substats={owned.substats} />
    ) : null,
  );

  return (
    <div>
      <button
        type="button"
        className={[styles.gearSlot, def ? '' : styles.gearEmpty, locked ? styles.gearLocked : '']
          .filter(Boolean)
          .join(' ')}
        style={def ? ({ '--tile': gearRarityColor(def.rarity) } as CSSProperties) : undefined}
        disabled={locked}
        onClick={onPick}
        {...bind}
        aria-label={
          locked
            ? `${slot.name} slot, unlocks at ${slot.unlockStars} stars`
            : def
              ? `${def.name}, tap to change`
              : `Empty ${slot.name} slot`
        }
      >
        {locked ? <Icon name="ui.lock" size={22} /> : <GearSlotIcon slot={slot.id} size={30} />}
      </button>
      <span className={styles.gearSlotLabel}>{locked ? `${slot.unlockStars}★` : slot.name}</span>
      {tip}
    </div>
  );
}

function GearPicker({
  cardUid,
  slot,
  onClose,
}: {
  cardUid: string;
  slot: GearSlot;
  onClose: () => void;
}) {
  const gear = usePlayerStore((s) => s.gear());
  const cards = usePlayerStore((s) => s.cards());
  const equip = usePlayerStore((s) => s.equip);
  const unequip = usePlayerStore((s) => s.unequip);
  const [inspecting, setInspecting] = useState<string | null>(null);
  const slotDef = CONTENT.gearSlots.get(slot);

  const forSlot = gear.filter((g) => CONTENT.gear.get(g.defId)?.slot === slot);
  const holderOf = (gearUid: string) =>
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
            const holder = holderOf(owned.uid);
            return (
              <div key={owned.uid} className={styles.inventoryRow}>
                <InventoryTile
                  owned={owned}
                  holderName={
                    holder && holder.uid !== cardUid
                      ? (CONTENT.cards.get(holder.defId)?.name ?? undefined)
                      : undefined
                  }
                  onInspect={() => setInspecting(owned.uid)}
                />
                <span className={styles.skillBody}>
                  <span className={styles.inventoryName}>
                    {def.name}
                    {owned.enhanceLevel > 0 ? (
                      <span className={styles.enhanceLevel}> +{owned.enhanceLevel}</span>
                    ) : null}
                  </span>
                  <StarRow value={def.stars} max={5} size={10} />
                  <span className={styles.skillDesc}>
                    {GEAR_RARITY_LABEL[def.rarity]}
                    {holder && holder.uid !== cardUid ? ' · equipped elsewhere' : ''}
                  </span>
                </span>
                <Button
                  variant="positive"
                  onClick={() => {
                    equip(cardUid, owned.uid);
                    onClose();
                  }}
                >
                  Equip
                </Button>
              </div>
            );
          })
        )}
        <Button
          variant="danger"
          block
          onClick={() => {
            unequip(cardUid, slot);
            onClose();
          }}
        >
          Unequip slot
        </Button>
      </div>

      {inspecting ? <GearDetail gearUid={inspecting} onClose={() => setInspecting(null)} /> : null}
    </Modal>
  );
}

/** Gear sheet: substats and gold enhancement (Q11 — guaranteed upgrades, no gambling). */
function GearDetail({ gearUid, onClose }: { gearUid: string; onClose: () => void }) {
  const owned = usePlayerStore((s) => s.gearItem(gearUid));
  const enhance = usePlayerStore((s) => s.enhance);
  const canEnhance = usePlayerStore((s) => s.canEnhance(gearUid));
  const cost = usePlayerStore((s) => s.enhanceCostFor(gearUid));
  const def = owned ? CONTENT.gear.get(owned.defId) : undefined;
  const slotDef = def ? CONTENT.gearSlots.get(def.slot) : undefined;
  if (!owned || !def || !slotDef) return null;

  const cap = enhanceCap(def.rarity);
  const maxed = owned.enhanceLevel >= cap;

  return (
    <Modal title={def.name} onClose={onClose}>
      <div className={styles.gearDetail}>
        <div className={styles.gearHeader}>
          <span
            className={styles.gearSlot}
            style={
              { '--tile': gearRarityColor(def.rarity), width: 64, height: 64 } as CSSProperties
            }
          >
            <GearSlotIcon slot={def.slot} size={36} />
          </span>
          <span className={styles.skillBody}>
            <span className={styles.detailName}>{GEAR_RARITY_LABEL[def.rarity]}</span>
            <StarRow value={def.stars} max={5} size={13} />
            <span className={styles.skillDesc}>
              {slotDef.name} · +{owned.enhanceLevel}/{cap}
            </span>
          </span>
        </div>

        <div className={styles.substats}>
          <div className={styles.substatRow}>
            <span>{slotDef.mainStat}</span>
            <span className={styles.statValue}>+{gearMainStat(def, owned.enhanceLevel)}</span>
          </div>
          {owned.substats.map((sub, i) => (
            <div key={i} className={styles.substatRow}>
              <span>{sub.stat}</span>
              <span className={styles.statValue}>{describeSubstat(sub).split(' ')[0]}</span>
            </div>
          ))}
          {owned.substats.length === 0 ? (
            <p className={styles.muted}>No substats — higher rarities roll more.</p>
          ) : null}
        </div>

        <Button
          variant="positive"
          block
          disabled={maxed || !canEnhance}
          onClick={() => enhance(gearUid)}
        >
          {maxed ? 'Fully enhanced' : `Enhance to +${owned.enhanceLevel + 1} — ${cost}g`}
        </Button>
      </div>
    </Modal>
  );
}

/** The owned-cards grid, shared by the collection tabs and the deck screen. */
function CollectionGrid({
  cards,
  onOpen,
  scroll,
}: {
  cards: readonly OwnedCard[];
  onOpen: (uid: string) => void;
  scroll?: boolean;
}) {
  return (
    <div className={[styles.grid, scroll ? 'u-scroll-y' : ''].filter(Boolean).join(' ')}>
      {cards.map((card) => (
        <CollectionTile key={card.uid} card={card} onOpen={() => onOpen(card.uid)} />
      ))}
    </div>
  );
}

/**
 * One card in the collection, with the numbers on its face.
 *
 * The grid used to show art, name, stars and level — everything except what the
 * card actually does. Strength and attack now ride on the card the same way they do
 * on the battlefield, so a tile reads identically in both places, and holding it
 * gives the skills without the trip into the sheet.
 */
function CollectionTile({ card, onOpen }: { card: OwnedCard; onOpen: () => void }) {
  const save = usePlayerStore((s) => s.save);
  const def = CONTENT.cards.get(card.defId);
  const stats = useMemo(() => (save ? computeCardStats(save, card.uid) : null), [save, card.uid]);
  const { bind, tip } = useHoldTip(
    def && stats ? (
      <CardTip
        name={def.name}
        rarity={def.rarity}
        attackType={def.attackType}
        attack={stats.attack}
        hp={stats.strength}
        maxHp={stats.strength}
        speed={stats.speed}
        level={card.level}
        // Only the rungs this card has actually unlocked — the ladder is gated on
        // stars, and promising a skill it cannot use would be a lie.
        skills={def.skills
          .filter((entry) => entry.unlockStars <= card.stars)
          .map((entry) => ({ skillId: entry.skillId }))}
        note={def.leaderSkill?.description}
      />
    ) : null,
  );
  if (!def) return null;

  return (
    <div className={`${styles.tile} ${styles.gridItem}`}>
      <span className={styles.tileWrap}>
        <CardFrame
          defId={card.defId}
          rarity={def.rarity}
          size="small"
          showName
          hp={stats?.strength}
          maxHp={stats?.strength}
          attack={stats?.attack}
          onClick={onOpen}
          bind={bind}
          ariaLabel={`${def.name}, level ${card.level}, ${stats?.strength ?? 0} strength, ${stats?.attack ?? 0} attack, ${attackTypeLabel(def.attackType)}`}
        />
        {card.favorite ? <Icon name="ui.star" size={14} className={styles.favouriteMark} /> : null}
      </span>
      <span className={styles.tileMeta}>
        <StarRow value={card.stars} max={6} size={11} />
        <span className={styles.level}>Lvl {card.level}</span>
      </span>
      {tip}
    </div>
  );
}
