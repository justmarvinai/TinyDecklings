/**
 * Battle setup.
 *
 * Deck order fills the board front-to-back; whatever does not fit waits in the
 * reinforcement queue and drops into the first empty slot at the start of a later
 * round (Q7). Hero leader skills are applied once here, before any HP is computed,
 * so the buff is baked into max Strength exactly as the reference describes it.
 */
import type { Content } from '@/content';
import type { CardDef } from '@/content/schemas';
import { deriveSeed } from '../rng';
import { statAt } from '../progression';
import {
  BOARD_SLOTS,
  type BattleCard,
  type BattleEvent,
  type BattleState,
  type Side,
} from './types';

export interface CombatantSpec {
  defId: string;
  level: number;
  stars: number;
  /** Preferred slot; omitted specs fill the first free slot in deck order. */
  slot?: number;
  /**
   * Held back in the reinforcement queue even if the board has room.
   *
   * Enemy groups use this for their reinforcements: a formation of four must start
   * as four, with the rest arriving only after something dies (Q7).
   */
  reserve?: boolean;
  /** Flat bonuses from equipped gear, already summed by the caller. */
  gearBonuses?: { strength: number; attack: number; speed: number };
  isBoss?: boolean;
}

export interface BattleSetup {
  stage: number;
  attempt: number;
  seed: number;
  player: readonly CombatantSpec[];
  enemy: readonly CombatantSpec[];
}

function buildCard(
  content: Content,
  spec: CombatantSpec,
  def: CardDef,
  side: Side,
  uid: string,
  slot: number | null,
): BattleCard {
  const curve = content.growthCurves.get(def.growth);
  if (!curve) throw new Error(`Card "${def.id}" references unknown growth curve "${def.growth}"`);

  const gear = spec.gearBonuses ?? { strength: 0, attack: 0, speed: 0 };
  const strength = statAt(def.baseStats.strength, spec.level, curve) + gear.strength;
  const attack = statAt(def.baseStats.attack, spec.level, curve) + gear.attack;
  const speed = def.baseStats.speed + gear.speed;

  return {
    uid,
    defId: def.id,
    name: def.name,
    side,
    slot,
    level: spec.level,
    stars: spec.stars,
    maxHp: strength,
    hp: strength,
    baseAttack: attack,
    speed,
    attackType: def.attackType,
    attackPattern: def.attackPattern,
    skills: def.skills
      .filter((s) => s.unlockStars <= spec.stars)
      .map((s) => ({ skillId: s.skillId, level: 1, cooldownRemaining: 0 })),
    statuses: [],
    mods: [],
    shield: 0,
    isBoss: spec.isBoss ?? false,
    alive: true,
    hasActed: false,
  };
}

function placeSide(
  content: Content,
  specs: readonly CombatantSpec[],
  side: Side,
  cards: Record<string, BattleCard>,
  queue: string[],
): void {
  const taken = new Set<number>();
  for (const spec of specs) {
    if (spec.slot !== undefined && !taken.has(spec.slot)) taken.add(spec.slot);
  }

  let nextFree = 0;
  specs.forEach((spec, index) => {
    const def = content.cards.get(spec.defId);
    if (!def) throw new Error(`Battle setup references unknown card "${spec.defId}"`);

    let slot: number | null = spec.slot ?? null;
    if (slot === null && !spec.reserve) {
      while (nextFree < BOARD_SLOTS && taken.has(nextFree)) nextFree++;
      if (nextFree < BOARD_SLOTS) {
        slot = nextFree;
        taken.add(nextFree);
      }
    }

    const uid = `${side}:${index}:${spec.defId}`;
    const card = buildCard(content, spec, def, side, uid, slot);
    cards[uid] = card;
    if (slot === null) queue.push(uid);
  });
}

/** Applies hero leader skills to their side, once, at battle start (Q12). */
function applyLeaderSkills(content: Content, cards: Record<string, BattleCard>): void {
  for (const leader of Object.values(cards)) {
    const def = content.cards.get(leader.defId);
    if (!def?.leaderSkill) continue;
    const { target, stat, percent } = def.leaderSkill;

    for (const card of Object.values(cards)) {
      if (card.side !== leader.side) continue;
      if (card.uid === leader.uid) continue; // "all OTHER allies"
      if (target.where?.attackType && card.attackType !== target.where.attackType) continue;
      if (target.where?.element) {
        const cardDef = content.cards.get(card.defId);
        if (cardDef?.element !== target.where.element) continue;
      }

      if (stat === 'strength') {
        const bonus = Math.round((card.maxHp * percent) / 100);
        card.maxHp += bonus;
        card.hp = card.maxHp;
      } else if (stat === 'attack') {
        card.baseAttack = Math.round(card.baseAttack * (1 + percent / 100));
      } else {
        card.speed = Math.round(card.speed * (1 + percent / 100));
      }
    }
  }
}

export function createBattle(
  content: Content,
  setup: BattleSetup,
): { state: BattleState; events: BattleEvent[] } {
  const cards: Record<string, BattleCard> = {};
  const queue: Record<Side, string[]> = { player: [], enemy: [] };

  placeSide(content, setup.player, 'player', cards, queue.player);
  placeSide(content, setup.enemy, 'enemy', cards, queue.enemy);
  applyLeaderSkills(content, cards);

  const state: BattleState = {
    stage: setup.stage,
    attempt: setup.attempt,
    seed: setup.seed,
    rngState: deriveSeed(setup.seed, `battle:${setup.stage}#${setup.attempt}`),
    round: 1,
    turn: 'player',
    cards,
    queue,
    order: [],
    outcome: 'ongoing',
    alliesLost: 0,
    enemiesLost: 0,
  };

  const events: BattleEvent[] = [
    { kind: 'battleStarted', stage: setup.stage, round: 1 },
    { kind: 'roundStarted', round: 1 },
    { kind: 'turnStarted', side: 'player', round: 1 },
  ];

  return { state, events };
}
