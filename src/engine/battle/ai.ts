/**
 * Battle AI.
 *
 * Drives enemy turns and the player's AUTO toggle (Q3) — both produce ordinary
 * intents and go through `step()` like a tap would, so the AI can never do
 * something the player could not.
 *
 * Heuristics, in order: fire a ready skill when it is worth it, otherwise attack
 * the target that dies soonest.
 */
import type { Content } from '@/content';
import type { Rng } from '../rng';
import { legalAttackTargets, livingOn, opposing } from './board';
import { effectiveAttack } from './effects';
import { activeCard } from './turn';
import type { BattleCard, BattleState, Intent } from './types';

/** Does this skill mostly hurt the other side, or mostly help ours? */
function skillIsOffensive(content: Content, skillId: string): boolean {
  const def = content.skills.get(skillId);
  if (!def) return false;
  return def.effects.some((e) => e.target.side === 'enemy');
}

/** How many enemies a skill would plausibly touch — favours hitting a crowd. */
function skillBreadth(content: Content, skillId: string): number {
  const def = content.skills.get(skillId);
  if (!def) return 0;
  return def.effects.reduce((max, effect) => {
    const scope = effect.target.scope;
    const width =
      scope === 'all' ? 6 : scope === 'row' || scope === 'pattern' ? 3 : scope === 'column' ? 2 : 1;
    return Math.max(max, width);
  }, 0);
}

function pickAttackTarget(
  state: BattleState,
  actor: BattleCard,
  content: Content,
): string | undefined {
  const legal = legalAttackTargets(state, actor);
  if (legal.length === 0) return undefined;

  const damage = effectiveAttack(actor);
  const scored = legal
    .map((uid) => state.cards[uid])
    .filter((c): c is BattleCard => Boolean(c))
    .map((card) => {
      const effectiveHp = card.hp + card.shield;
      // Prefer a kill this turn; otherwise chip at whoever is closest to dying,
      // with a nudge toward high-attack threats.
      const killsNow = damage >= effectiveHp ? 1000 : 0;
      const threat = effectiveAttack(card) / 10;
      return { uid: card.uid, score: killsNow + threat - effectiveHp / 100 };
    });

  scored.sort((a, b) => b.score - a.score);
  void content;
  return scored[0]?.uid;
}

/**
 * Chooses an intent for whoever is currently acting.
 *
 * Returns `null` when nobody can act, which the caller treats as "battle over".
 */
export function chooseIntent(state: BattleState, content: Content, rng: Rng): Intent | null {
  const actor = activeCard(state);
  if (!actor) return null;

  const enemies = livingOn(state, opposing(actor.side));
  const allies = livingOn(state, actor.side);

  const readySkills = actor.skills
    .map((skill, index) => ({ skill, index }))
    .filter(({ skill }) => skill.cooldownRemaining === 0);

  for (const { skill, index } of readySkills) {
    const offensive = skillIsOffensive(content, skill.skillId);

    if (offensive) {
      const breadth = skillBreadth(content, skill.skillId);
      // Hold a wide skill for a crowd; single-target ones can fire freely.
      const worthIt = breadth === 1 || enemies.length >= 2;
      if (worthIt && enemies.length > 0) {
        const targetUid = pickAttackTarget(state, actor, content);
        return { kind: 'skill', skillIndex: index, targetUid };
      }
    } else {
      // Support: only when it would actually do something — someone hurt, or a
      // buff with allies to buff.
      const hurt = allies.some((c) => c.hp < c.maxHp * 0.75);
      if (hurt || allies.length > 1) {
        return { kind: 'skill', skillIndex: index };
      }
    }
  }

  const targetUid = pickAttackTarget(state, actor, content);
  if (!targetUid) return null;
  void rng;
  return { kind: 'attack', targetUid };
}
