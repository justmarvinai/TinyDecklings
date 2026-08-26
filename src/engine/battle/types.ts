/**
 * Battle types.
 *
 * `BattleState` is plain, serialisable JSON — no class instances, no Maps — because
 * it is persisted for mid-battle resume and replayed from an intent log
 * (ARCHITECTURE.md §7). The RNG lives in it as a single integer for the same reason.
 */
import type { AttackType, StatKey, StatusId } from '@/content/schemas';

export type Side = 'player' | 'enemy';

/** 2 rows x 3 columns per side: slots 0-2 are the front row, 3-5 the back row. */
export const BOARD_COLS = 3;
export const BOARD_ROWS = 2;
export const BOARD_SLOTS = BOARD_COLS * BOARD_ROWS;

export interface StatMod {
  stat: StatKey;
  /** Additive percentage, e.g. +20 or -15. */
  percent: number;
  remaining: number | 'battle';
}

export interface ActiveStatus {
  id: StatusId;
  remaining: number | 'battle';
  stacks: number;
}

export interface BattleSkill {
  skillId: string;
  level: number;
  /** Rounds until usable — this is the number on the battle card's badge (Q4). */
  cooldownRemaining: number;
}

export interface BattleCard {
  uid: string;
  defId: string;
  name: string;
  side: Side;
  /** Board position, or null while waiting in the reinforcement queue / after death. */
  slot: number | null;
  level: number;
  stars: number;
  maxHp: number;
  hp: number;
  /** Attack before temporary modifiers; `effectiveAttack()` applies those. */
  baseAttack: number;
  speed: number;
  attackType: AttackType;
  attackPattern: string;
  skills: BattleSkill[];
  statuses: ActiveStatus[];
  mods: StatMod[];
  shield: number;
  isBoss: boolean;
  alive: boolean;
  hasActed: boolean;
}

export type BattleOutcome = 'ongoing' | 'victory' | 'defeat';

export interface BattleState {
  stage: number;
  attempt: number;
  seed: number;
  /** Serialised RNG position, so a resumed battle continues the same sequence. */
  rngState: number;
  round: number;
  turn: Side;
  cards: Record<string, BattleCard>;
  /** Undeployed cards, in the order they will fill empty slots (Q7). */
  queue: Record<Side, string[]>;
  /** Uids still to act this turn; `order[0]` is whoever needs an intent. */
  order: string[];
  outcome: BattleOutcome;
  alliesLost: number;
  enemiesLost: number;
}

export type Intent =
  | { kind: 'attack'; targetUid: string }
  /** `targetUid` is only needed for single-target skills; others resolve themselves. */
  | { kind: 'skill'; skillIndex: number; targetUid?: string }
  | { kind: 'surrender' };

/**
 * Battle events.
 *
 * The engine emits these in resolution order and the UI animates them
 * (ARCHITECTURE.md §3). The engine never animates; the UI never decides.
 */
export type BattleEvent =
  | { kind: 'battleStarted'; stage: number; round: number }
  | { kind: 'roundStarted'; round: number }
  | { kind: 'turnStarted'; side: Side; round: number }
  | { kind: 'cardDeployed'; uid: string; side: Side; slot: number }
  | { kind: 'turnSkipped'; uid: string; reason: StatusId | 'noTargets' }
  | { kind: 'attackDeclared'; actorUid: string; targetUid: string }
  | { kind: 'skillCast'; actorUid: string; skillId: string; targetUid?: string }
  | { kind: 'damageDealt'; sourceUid: string; targetUid: string; amount: number; absorbed: number }
  | { kind: 'healed'; sourceUid: string; targetUid: string; amount: number }
  | { kind: 'shieldGained'; targetUid: string; amount: number }
  | { kind: 'statusApplied'; targetUid: string; status: StatusId; stacks: number }
  | { kind: 'statusExpired'; targetUid: string; status: StatusId }
  | { kind: 'statModified'; targetUid: string; stat: StatKey; percent: number }
  | { kind: 'cardDied'; uid: string; side: Side }
  | { kind: 'skillReady'; uid: string; skillId: string }
  | { kind: 'battleEnded'; outcome: BattleOutcome; stars: 0 | 1 | 2 | 3; alliesLost: number };

export interface StepResult {
  state: BattleState;
  events: BattleEvent[];
}
