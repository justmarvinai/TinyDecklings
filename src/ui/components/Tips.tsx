import { CONTENT } from '@/content';
import type { AttackType, CardRarity, StatusId } from '@/content/schemas';
import type { IconKey } from '@/content/schemas/iconKeys';
import { CARD_RARITY_LABEL } from '@/content/schemas';
import type { SubstatRoll } from '@/content/schemas';
import { GEAR_RARITY_LABEL } from '@/content/schemas';
import { describeSubstat, gearMainStat } from '@/engine/gear';
import { cardRarityColor, gearRarityColor } from '@/ui/design/rarity';
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
  /** What it is carrying, with how long — the card tip spells these out in full. */
  statuses?: readonly ActiveStatusView[];
  skills?: readonly CardTipSkill[];
  /** Shown under the stats — the one line explaining what this card is for. */
  note?: string;
  /**
   * Skills as names and cooldowns only.
   *
   * For the battlefield, where five full descriptions make a bubble taller than the
   * phone — and where each skill's own button already gives its description on a
   * hold. Here the question is only which of them are ready.
   */
  compactSkills?: boolean;
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
  compactSkills,
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
        <>
          <span className={styles.rule} />
          <StatusTip statuses={statuses} />
        </>
      ) : null}

      {note ? <p className={styles.body}>{note}</p> : null}

      {skills && skills.length > 0 && compactSkills ? (
        <>
          <span className={styles.rule} />
          <div className={styles.stats}>
            {skills.map((entry, i) => {
              const def = CONTENT.skills.get(entry.skillId);
              if (!def) return null;
              return (
                <span key={`${entry.skillId}-${i}`} className={styles.stat}>
                  <Icon name={def.iconKey} size={14} />
                  {def.name}
                  <span className={styles.skillCooldown}>
                    {entry.cooldownRemaining ? entry.cooldownRemaining : 'Ready'}
                  </span>
                </span>
              );
            })}
          </div>
        </>
      ) : null}

      {skills && skills.length > 0 && !compactSkills ? (
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
 * What a status is doing to the card carrying it.
 *
 * Statuses are 14px icons on a card corner — enough to say "something is happening"
 * and nothing else. The rounds left matter as much as the name: burn with one round
 * to go and burn with four are different decisions.
 */
export function StatusTip({ statuses }: { statuses: readonly ActiveStatusView[] }) {
  if (statuses.length === 0) return null;
  return (
    <>
      {statuses.map((status, i) => {
        const def = CONTENT.statuses.get(status.id);
        if (!def) return null;
        return (
          <div key={`${status.id}-${i}`} className={styles.skill}>
            <Icon name={def.iconKey} size={20} />
            <span className={styles.skillText}>
              <span className={styles.skillName}>
                {def.name}
                <span className={styles.skillCooldown}>{remainingLabel(status)}</span>
              </span>
              <span className={styles.skillBody}>{def.description}</span>
            </span>
          </div>
        );
      })}
    </>
  );
}

export interface ActiveStatusView {
  id: StatusId;
  /** Rounds left, or 'battle' for one that lasts the whole fight. */
  remaining: number | 'battle';
  stacks: number;
}

/** "3 rounds", "×2", "all fight" — whichever of those the player needs to know. */
function remainingLabel(status: ActiveStatusView): string {
  const stacks = status.stacks > 1 ? `×${status.stacks} · ` : '';
  if (status.remaining === 'battle') return `${stacks}All fight`;
  return `${stacks}${status.remaining} round${status.remaining === 1 ? '' : 's'}`;
}

/**
 * What a piece of gear gives, without opening it.
 *
 * Gear is nine identical slot icons told apart by a rarity colour: the numbers
 * that decide whether to equip it were behind two taps, on a screen the player has
 * to leave the card to reach.
 */
export function GearTip({
  defId,
  enhanceLevel,
  substats,
  equippedBy,
}: {
  defId: string;
  enhanceLevel: number;
  substats: readonly SubstatRoll[];
  /** Name of the card already wearing it, when that is somebody else. */
  equippedBy?: string;
}) {
  const def = CONTENT.gear.get(defId);
  const slotDef = def ? CONTENT.gearSlots.get(def.slot) : undefined;
  if (!def || !slotDef) return null;
  return (
    <>
      <span className={styles.title}>
        {def.name}
        {enhanceLevel > 0 ? <span className={styles.skillCooldown}>+{enhanceLevel}</span> : null}
      </span>
      <span className={styles.subtitle} style={{ '--tone': gearRarityColor(def.rarity) } as never}>
        {GEAR_RARITY_LABEL[def.rarity]} · {slotDef.name} · {def.stars}★
      </span>

      <div className={styles.stats}>
        <span className={styles.stat}>
          <Icon name={`stat.${slotDef.mainStat}`} size={14} />+{gearMainStat(def, enhanceLevel)}{' '}
          {slotDef.mainStat}
        </span>
        {substats.map((sub, i) => (
          <span key={`${sub.stat}-${i}`} className={styles.stat}>
            {describeSubstat(sub)}
          </span>
        ))}
      </div>

      {equippedBy ? <p className={styles.body}>Currently worn by {equippedBy}.</p> : null}
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
