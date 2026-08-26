/**
 * Turning a generated stage into a battle setup.
 *
 * The formation, the level bonus, the stage's modifiers and its element theme all
 * come from the stage itself, so the UI, the resume path and the balance guard all
 * build the same fight from the same data instead of each assembling their own.
 */
import type { Content } from '@/content';
import type { GeneratedStage } from '@/content/schemas';
import type { BattleSetup, CarriedStatus, CombatantSpec } from '../battle';
import { enemyLevelBonus, kindLevelBonus } from './generate';

/** Every enemy a stage fields, its formation first and its reserves behind it. */
export function enemySpecsFor(content: Content, stage: GeneratedStage): CombatantSpec[] | null {
  const group = content.enemies.get(stage.encounterRef);
  if (!group) return null;

  const levelBonus = enemyLevelBonus(content, stage.number) + kindLevelBonus(stage.kind);
  return [
    ...group.members.map((m) => ({
      defId: m.cardId,
      level: m.level + levelBonus,
      stars: 3,
      slot: m.slot,
      isBoss: m.cardId === group.bossCardId,
    })),
    ...group.reinforcements.map((cardId) => ({
      defId: cardId,
      level: 1 + levelBonus,
      stars: 3,
      reserve: true,
    })),
  ];
}

export function battleSetupFor(
  content: Content,
  stage: GeneratedStage,
  options: {
    player: readonly CombatantSpec[];
    seed: number;
    attempt: number;
    carriedStatus?: CarriedStatus | null;
  },
): BattleSetup | null {
  const enemy = enemySpecsFor(content, stage);
  if (!enemy) return null;

  return {
    stage: stage.number,
    attempt: options.attempt,
    seed: options.seed,
    player: options.player,
    enemy,
    modifiers: stage.modifiers,
    ...(stage.elementBias ? { element: stage.elementBias } : {}),
    ...(options.carriedStatus ? { carriedStatus: options.carriedStatus } : {}),
  };
}
