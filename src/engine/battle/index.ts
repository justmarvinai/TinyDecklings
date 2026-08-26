export { createBattle, type BattleSetup, type CarriedStatus, type CombatantSpec } from './setup';
export { beginBattle, step, activeCard, isPlayerTurn } from './turn';
export { chooseIntent } from './ai';
export {
  legalAttackTargets,
  livingOn,
  cardAtSlot,
  emptySlots,
  slotToCoord,
  coordToSlot,
  isFrontRow,
  opposing,
  hasStatus,
  patternSlots,
} from './board';
export { BOARD_COLS, BOARD_ROWS, BOARD_SLOTS } from './types';
export { effectiveAttack, blockingStatus } from './effects';
export type {
  ActiveStatus,
  BattleCard,
  BattleEvent,
  BattleOutcome,
  BattleSkill,
  BattleState,
  Intent,
  Side,
  StatMod,
  StepResult,
} from './types';
