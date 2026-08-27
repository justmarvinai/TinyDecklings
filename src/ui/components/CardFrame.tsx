import type { CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { CardRarity, StatusId } from '@/content/schemas';
import { effectiveAttack, type BattleCard } from '@/engine/battle';
import { resolveCardArt } from '@/ui/art/artManifest';
import { cardRarityColor } from '@/ui/design/rarity';
import { IconChip, type HoldTipBind } from '@/ui/design/primitives';
import { attackTypeLabel, compactNumber } from '@/ui/text/labels';
import { Icon } from '@/ui/icons/Icon';
import styles from './CardFrame.module.css';

export interface CardFrameProps {
  defId: string;
  rarity: CardRarity;
  /** Current HP — omit outside battle. */
  hp?: number;
  maxHp?: number;
  /**
   * Damage this card deals, shown on the face.
   *
   * The number a player needs mid-fight and could previously only get by leaving
   * the battle; it rides on the attack-type badge, which was already saying *how*
   * this card attacks and had room to say how hard.
   */
  attack?: number;
  cooldown?: number;
  skillReady?: boolean;
  statuses?: readonly StatusId[];
  shield?: number;
  showName?: boolean;
  isBoss?: boolean;
  acting?: boolean;
  targetable?: boolean;
  dead?: boolean;
  /**
   * The white frame of an impact.
   *
   * An overlay rather than a CSS filter on the card: a filter would blow out the
   * rarity outline and the numbers along with the art, and the one thing that has
   * to stay readable while you are being hit is how much health is left.
   */
  flash?: boolean;
  size?: 'small' | 'medium';
  /** Size to the container's height — used on the battlefield. */
  fill?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  /**
   * Press-and-hold handlers from `useHoldTip`, when this card can be inspected.
   *
   * One target, the whole card. The status icons were briefly a second target of
   * their own; three 14px icons are well under the touch floor (rule 1), the press
   * was caught by the card underneath anyway, and the card's tip already names every
   * status with what it does and how long it lasts.
   */
  bind?: HoldTipBind;
}

/**
 * A card as it appears everywhere: battlefield, collection grid, detail sheet.
 *
 * Art comes from the manifest, so every card currently shows the shared placeholder
 * and the owner's final per-card art will appear here with no code change
 * (CLAUDE.md rule 6).
 */
export function CardFrame({
  defId,
  rarity,
  hp,
  maxHp,
  attack,
  cooldown,
  skillReady,
  statuses,
  shield,
  showName,
  isBoss,
  acting,
  targetable,
  dead,
  size = 'medium',
  fill,
  flash,
  onClick,
  ariaLabel,
  bind,
}: CardFrameProps) {
  const def = CONTENT.cards.get(defId);
  const ratio = hp !== undefined && maxHp ? Math.max(0, Math.min(1, hp / maxHp)) : 1;
  const low = ratio <= 0.3;
  const attackText = attack !== undefined ? compactNumber(attack) : '';
  /*
   * The footer fits about six digits across a board card. Under that the pill keeps
   * its slot icon; over it the icon is what goes, because the row the card stands in
   * already says melee or ranged and the hold-tip says it in words — where the two
   * numbers do not repeat anywhere the player can see mid-swing.
   */
  const roomForSlotIcon =
    attackText.length + (hp !== undefined ? compactNumber(hp).length : 0) <= 6;

  const classes = [
    styles.card,
    fill ? styles.fill : '',
    size === 'small' ? styles.small : '',
    rarity === 'legendary' ? styles.legendary : '',
    isBoss ? styles.boss : '',
    acting ? styles.acting : '',
    targetable ? styles.targetable : '',
    dead ? styles.dead : '',
    showName && hp !== undefined ? styles.named : '',
  ]
    .filter(Boolean)
    .join(' ');

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={classes}
      style={{ '--frame': cardRarityColor(rarity) } as CSSProperties}
      onClick={onClick}
      aria-label={ariaLabel ?? def?.name}
      {...(onClick ? { type: 'button' as const } : {})}
      {...bind}
    >
      <img className={styles.art} src={resolveCardArt(def?.artKey ?? defId)} alt="" />

      {flash ? <span className={styles.flash} aria-hidden="true" /> : null}

      {isBoss ? <span className={styles.bossTag}>Boss</span> : null}

      {cooldown !== undefined ? (
        <span
          className={[styles.cooldown, skillReady ? styles.ready : ''].filter(Boolean).join(' ')}
        >
          {skillReady ? '!' : cooldown}
        </span>
      ) : null}

      {statuses && statuses.length > 0 ? (
        <span className={styles.statuses}>
          {statuses.slice(0, 3).map((status) => (
            <Icon key={status} name={`status.${status}`} size={14} title={status} />
          ))}
        </span>
      ) : null}

      {shield ? (
        <span className={styles.shield}>
          <Icon name="status.shield" size={12} />
          {shield}
        </span>
      ) : null}

      {showName && def ? <span className={styles.name}>{def.name}</span> : null}

      {/*
        Strength and attack share one row rather than being pinned to opposite
        corners. Absolutely positioned they collided on a narrow card — a four-digit
        strength ran straight under the attack pill — and no amount of nudging fixes
        that for every number the game can produce. A flex row cannot overlap, and
        `compactNumber` keeps both ends of it inside five characters however far
        down the endless road the numbers have climbed.
      */}
      {hp !== undefined || (def && attack !== undefined) ? (
        <span className={styles.footer}>
          {hp !== undefined ? (
            <span
              className={[styles.hp, 'u-number', low ? styles.hpLow : ''].filter(Boolean).join(' ')}
            >
              {compactNumber(hp)}
            </span>
          ) : (
            <span />
          )}

          {def ? (
            <span
              className={[styles.type, attack !== undefined ? styles.typeWithAttack : '']
                .filter(Boolean)
                .join(' ')}
            >
              {/*
                With a number beside it the pill *is* the chip (UI_STYLE_GUIDE.md
                §8) — a second bordered plate inside it was a plate within a plate,
                and its border and padding were the width the strength beside it
                needed.
              */}
              {attack !== undefined && roomForSlotIcon ? (
                <Icon
                  name={def.attackType === 'melee' ? 'attackType.melee' : 'attackType.ranged'}
                  size={size === 'small' ? 14 : 18}
                  title={attackTypeLabel(def.attackType)}
                />
              ) : attack === undefined ? (
                <IconChip
                  name={def.attackType === 'melee' ? 'attackType.melee' : 'attackType.ranged'}
                  size={size === 'small' ? 18 : 24}
                  title={attackTypeLabel(def.attackType)}
                />
              ) : null}
              {attack !== undefined ? (
                <span className={`${styles.attackValue} u-number`}>{attackText}</span>
              ) : null}
            </span>
          ) : null}
        </span>
      ) : null}

      {hp !== undefined ? (
        <span className={styles.hpBar}>
          <span
            className={[styles.hpBarFill, low ? styles.hpBarLow : ''].filter(Boolean).join(' ')}
            style={{ width: `${ratio * 100}%` }}
          />
        </span>
      ) : null}
    </Tag>
  );
}

/** Convenience wrapper for battle: reads everything off the live battle card. */
export function BattleCardFrame({
  card,
  acting,
  targetable,
  flash,
  onClick,
  bind,
}: {
  card: BattleCard;
  acting?: boolean;
  targetable?: boolean;
  flash?: boolean;
  onClick?: () => void;
  /** Hold-to-inspect handlers, spread on the frame itself so the whole card is the target. */
  bind?: HoldTipBind;
}) {
  // Battlefield cards always fill their slot's height.
  const def = CONTENT.cards.get(card.defId);
  const skill = card.skills[0];
  // What it hits for right now, buffs and debuffs included — the number that
  // decides the turn, not the one printed on the card in the collection.
  const attack = effectiveAttack(card);
  return (
    <CardFrame
      fill
      defId={card.defId}
      rarity={def?.rarity ?? 'common'}
      hp={card.hp}
      maxHp={card.maxHp}
      attack={attack}
      cooldown={skill ? skill.cooldownRemaining : undefined}
      skillReady={skill ? skill.cooldownRemaining === 0 : false}
      statuses={card.statuses.map((s) => s.id)}
      shield={card.shield}
      isBoss={card.isBoss}
      acting={acting}
      targetable={targetable}
      flash={flash}
      dead={!card.alive}
      onClick={onClick}
      bind={bind}
      ariaLabel={`${card.name}, ${card.hp} of ${card.maxHp} strength, ${attack} attack`}
    />
  );
}

/** An empty battlefield slot. */
export function EmptySlot() {
  return <div className={`${styles.card} ${styles.fill} ${styles.empty}`} aria-hidden="true" />;
}
