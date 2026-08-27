import { CONTENT } from '@/content';
import type { AttackType, CardRarity, StatusId } from '@/content/schemas';
import type { IconKey } from '@/content/schemas/iconKeys';
import { CARD_RARITY_LABEL } from '@/content/schemas';
import { cardRarityColor } from '@/ui/design/rarity';
import { attackTypeLabel } from '@/ui/text/labels';
import { Icon } from '@/ui/icons/Icon';
import styles from '@/ui/design/primitives/HoldTip.module.css';

export interface CardTipSkill {
  skillId: string;
  /** Rounds left, when the card is on a battlefield. */
  cooldownRemaining?: number;
}

export interface CardTipProps {
  name: string;
  rarity: CardRarity;
  attackType: AttackType;
  attack: number;
  hp: number;
  maxHp: number;
  speed?: number;
  level?: number;
  statuses?: readonly StatusId[];
  skills?: readonly CardTipSkill[];
  /** Shown under the stats — the one line explaining what this card is for. */
  note?: string;
}

/**
 * What a card is, for someone holding it down mid-fight.
 *
 * Numbers first and in the same order everywhere — strength, attack, speed, where
 * it stands — then what it can do. A player holding an enemy is asking "can it kill
 * me this round, and can I kill it", so those two numbers lead.
 */
export function CardTip({
  name,
  rarity,
  attackType,
  attack,
  hp,
  maxHp,
  speed,
  level,
  statuses,
  skills,
  note,
}: CardTipProps) {
  return (
    <>
      <span className={styles.title}>{name}</span>
      <span className={styles.subtitle} style={{ '--tone': cardRarityColor(rarity) } as never}>
        {CARD_RARITY_LABEL[rarity]}
        {level !== undefined ? ` · Level ${level}` : ''}
      </span>

      <div className={styles.stats}>
        <span className={styles.stat}>
          <Icon name="stat.strength" size={14} />
          {hp}
          {hp !== maxHp ? `/${maxHp}` : ''}
        </span>
        <span className={styles.stat}>
          <Icon name="stat.attack" size={14} />
          {attack}
        </span>
        {speed !== undefined ? (
          <span className={styles.stat}>
            <Icon name="stat.speed" size={14} />
            {speed}
          </span>
        ) : null}
        <span className={styles.stat}>
          <Icon
            name={attackType === 'melee' ? 'attackType.melee' : 'attackType.ranged'}
            size={14}
          />
          {attackTypeLabel(attackType)}
        </span>
      </div>

      {statuses && statuses.length > 0 ? (
        <div className={styles.stats}>
          {statuses.map((status, i) => {
            const def = CONTENT.statuses.get(status);
            return (
              <span key={`${status}-${i}`} className={styles.stat}>
                <Icon name={`status.${status}`} size={14} />
                {def?.name ?? status}
              </span>
            );
          })}
        </div>
      ) : null}

      {note ? <p className={styles.body}>{note}</p> : null}

      {skills && skills.length > 0 ? (
        <>
          <span className={styles.rule} />
          {skills.map((entry, i) => {
            const def = CONTENT.skills.get(entry.skillId);
            if (!def) return null;
            return (
              <div key={`${entry.skillId}-${i}`} className={styles.skill}>
                <Icon name={def.iconKey} size={20} />
                <span className={styles.skillText}>
                  <span className={styles.skillName}>
                    {def.name}
                    <span className={styles.skillCooldown}>
                      {entry.cooldownRemaining ? `${entry.cooldownRemaining} rounds` : 'Ready'}
                    </span>
                  </span>
                  <span className={styles.skillBody}>{def.description}</span>
                </span>
              </div>
            );
          })}
        </>
      ) : null}
    </>
  );
}

/**
 * The simplest shape: a name, and the sentence explaining it.
 *
 * For anything whose description is already authored content — stage modifiers,
 * element affinities — where the UI's job is only to make it reachable on a screen
 * with no hover.
 */
export function InfoTip({ icon, title, body }: { icon?: IconKey; title: string; body: string }) {
  return (
    <>
      <span className={styles.title}>
        {icon ? <Icon name={icon} size={20} /> : null}
        {title}
      </span>
      <p className={styles.body}>{body}</p>
    </>
  );
}

/**
 * What a skill does, for someone holding its button before spending it.
 *
 * The description is authored content, so this never builds prose of its own — it
 * only says whether the skill can be used right now, which the button's own badge
 * shows as a bare number.
 */
export function SkillTip({
  skillId,
  cooldownRemaining,
}: {
  skillId: string;
  cooldownRemaining: number;
}) {
  const def = CONTENT.skills.get(skillId);
  if (!def) return null;
  return (
    <>
      <span className={styles.title}>
        <Icon name={def.iconKey} size={20} />
        {def.name}
      </span>
      <p className={styles.body}>{def.description}</p>
      <div className={styles.stats}>
        <span className={styles.stat}>
          {cooldownRemaining > 0
            ? `Ready in ${cooldownRemaining} round${cooldownRemaining === 1 ? '' : 's'}`
            : 'Ready now'}
        </span>
        {def.cooldown > 0 ? (
          <span className={styles.stat}>
            Cooldown {def.cooldown} round{def.cooldown === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </>
  );
}
