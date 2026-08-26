import type { CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { CardRarity, StatusId } from '@/content/schemas';
import type { BattleCard } from '@/engine/battle';
import { resolveCardArt } from '@/ui/art/artManifest';
import { cardRarityColor } from '@/ui/design/rarity';
import { IconChip } from '@/ui/design/primitives';
import { Icon } from '@/ui/icons/Icon';
import styles from './CardFrame.module.css';

export interface CardFrameProps {
  defId: string;
  rarity: CardRarity;
  /** Current HP — omit outside battle. */
  hp?: number;
  maxHp?: number;
  cooldown?: number;
  skillReady?: boolean;
  statuses?: readonly StatusId[];
  shield?: number;
  showName?: boolean;
  isBoss?: boolean;
  acting?: boolean;
  targetable?: boolean;
  dead?: boolean;
  size?: 'small' | 'medium';
  /** Size to the container's height — used on the battlefield. */
  fill?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
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
  onClick,
  ariaLabel,
}: CardFrameProps) {
  const def = CONTENT.cards.get(defId);
  const ratio = hp !== undefined && maxHp ? Math.max(0, Math.min(1, hp / maxHp)) : 1;
  const low = ratio <= 0.3;

  const classes = [
    styles.card,
    fill ? styles.fill : '',
    size === 'small' ? styles.small : '',
    rarity === 'legendary' ? styles.legendary : '',
    isBoss ? styles.boss : '',
    acting ? styles.acting : '',
    targetable ? styles.targetable : '',
    dead ? styles.dead : '',
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
    >
      <img className={styles.art} src={resolveCardArt(def?.artKey ?? defId)} alt="" />

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

      {hp !== undefined ? (
        <>
          <span
            className={[styles.hp, 'u-number', low ? styles.hpLow : ''].filter(Boolean).join(' ')}
          >
            {hp}
          </span>
          <span className={styles.hpBar}>
            <span
              className={[styles.hpBarFill, low ? styles.hpBarLow : ''].filter(Boolean).join(' ')}
              style={{ width: `${ratio * 100}%` }}
            />
          </span>
        </>
      ) : null}

      {def ? (
        <IconChip
          name={def.attackType === 'melee' ? 'attackType.melee' : 'attackType.ranged'}
          size={size === 'small' ? 20 : 26}
          className={styles.type}
          title={def.attackType}
        />
      ) : null}

      {showName && def ? <span className={styles.name}>{def.name}</span> : null}
    </Tag>
  );
}

/** Convenience wrapper for battle: reads everything off the live battle card. */
export function BattleCardFrame({
  card,
  acting,
  targetable,
  onClick,
}: {
  card: BattleCard;
  acting?: boolean;
  targetable?: boolean;
  onClick?: () => void;
}) {
  // Battlefield cards always fill their slot's height.
  const def = CONTENT.cards.get(card.defId);
  const skill = card.skills[0];
  return (
    <CardFrame
      fill
      defId={card.defId}
      rarity={def?.rarity ?? 'common'}
      hp={card.hp}
      maxHp={card.maxHp}
      cooldown={skill ? skill.cooldownRemaining : undefined}
      skillReady={skill ? skill.cooldownRemaining === 0 : false}
      statuses={card.statuses.map((s) => s.id)}
      shield={card.shield}
      isBoss={card.isBoss}
      acting={acting}
      targetable={targetable}
      dead={!card.alive}
      onClick={onClick}
      ariaLabel={`${card.name}, ${card.hp} of ${card.maxHp} strength`}
    />
  );
}

/** An empty battlefield slot. */
export function EmptySlot() {
  return <div className={`${styles.card} ${styles.fill} ${styles.empty}`} aria-hidden="true" />;
}
