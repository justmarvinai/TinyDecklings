/**
 * Battle setup.
 *
 * Deck order fills the board front-to-back; whatever does not fit waits in the
 * reinforcement queue and drops into the first empty slot at the start of a later
 * round (Q7). Hero leader skills are applied once here, before any HP is computed,
 * so the buff is baked into max Strength exactly as the reference describes it.
 *
 * Everything a stage brings to a fight lands here too, in a fixed order: leader
 * skills, then the stage's element affinity (Q21), then its modifiers, then any
 * status carried in from a vignette. Order matters because each step reads the
 * numbers the one before it wrote.
 */
import type { Content } from '@/content';
import type { CardDef, ElementId, StatKey, StatusId } from '@/content/schemas';
import { deriveSeed } from '../rng';
import { statAtGrade } from '../progression';
import {
  CARD_RARITY_BASE_STARS,
  ELEMENT_AFFINITY_PERCENT,
  countersElement,
} from '@/content/schemas';
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

/** A status a vignette hung on the party, spent by the next fight (Phase 4). */
export interface CarriedStatus {
  status: StatusId;
  side: Side;
  stacks: number;
}

export interface BattleSetup {
  stage: number;
  attempt: number;
  seed: number;
  player: readonly CombatantSpec[];
  enemy: readonly CombatantSpec[];
  /** Stage modifier ids in play on this node (Phase 4). */
  modifiers?: readonly string[];
  /** What the stage is themed to; counter-element cards hit harder (Q21). */
  element?: ElementId;
  /** A boon or curse carried in from the vignette before this fight. */
  carriedStatus?: CarriedStatus;
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
  const baseStars = CARD_RARITY_BASE_STARS[def.rarity];
  const graded = (base: number) => statAtGrade(base, spec.level, spec.stars, baseStars, curve);

  const strength = graded(def.baseStats.strength) + gear.strength;
  const attack = graded(def.baseStats.attack) + gear.attack;
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

/**
 * The stage's element bonus (Q21).
 *
 * A card whose element counters what the stage is themed to swings harder. It
 * applies to both sides, which is what makes an off-element stage worth reading:
 * the enemies standing on their own ground get nothing from it, and the counter
 * you brought does.
 */
function applyElementAffinity(
  content: Content,
  cards: Record<string, BattleCard>,
  stageElement: ElementId | undefined,
  events: BattleEvent[],
): void {
  if (!stageElement) return;
  for (const card of Object.values(cards)) {
    const def = content.cards.get(card.defId);
    if (!countersElement(def?.element, stageElement)) continue;
    card.baseAttack = Math.round(card.baseAttack * (1 + ELEMENT_AFFINITY_PERCENT / 100));
    events.push({
      kind: 'statModified',
      targetUid: card.uid,
      stat: 'attack',
      percent: ELEMENT_AFFINITY_PERCENT,
    });
  }
}

function scaleStat(card: BattleCard, stat: StatKey, percent: number): void {
  const factor = 1 + percent / 100;
  if (stat === 'strength') {
    card.maxHp = Math.max(1, Math.round(card.maxHp * factor));
    card.hp = card.maxHp;
  } else if (stat === 'attack') {
    card.baseAttack = Math.max(0, Math.round(card.baseAttack * factor));
  } else {
    card.speed = Math.max(1, Math.round(card.speed * factor));
  }
}

/**
 * Extra bodies for `extraReinforcements`.
 *
 * They are copies of the formation the stage already fields, held in reserve — a
 * longer fight rather than a different one, which is exactly what the modifier
 * promises on the stage sheet.
 */
function withExtraReinforcements(specs: readonly CombatantSpec[], count: number): CombatantSpec[] {
  if (count <= 0 || specs.length === 0) return [...specs];
  const extras: CombatantSpec[] = [];
  for (let i = 0; i < count; i++) {
    const source = specs[i % specs.length];
    extras.push({ ...source, slot: undefined, reserve: true, isBoss: false });
  }
  return [...specs, ...extras];
}

/** How many extra reserves the stage's modifiers add to the enemy side. */
function extraReinforcementCount(content: Content, modifiers: readonly string[]): number {
  let count = 0;
  for (const id of modifiers) {
    for (const effect of content.stageModifiers.get(id)?.effects ?? []) {
      if (effect.kind === 'extraReinforcements') count += effect.count;
    }
  }
  return count;
}

function applyModifiers(
  content: Content,
  cards: Record<string, BattleCard>,
  modifiers: readonly string[],
  events: BattleEvent[],
): void {
  for (const id of modifiers) {
    const def = content.stageModifiers.get(id);
    if (!def) continue;
    for (const effect of def.effects) {
      if (effect.kind === 'extraReinforcements') continue; // handled before placement
      for (const card of Object.values(cards)) {
        if (card.side !== effect.side) continue;
        if (effect.kind === 'statScale') scaleStat(card, effect.stat, effect.percent);
        else setStatus(content, card, effect.status, effect.stacks, 'battle', events);
      }
    }
  }
}

/**
 * How long a boon carried in from a vignette lasts.
 *
 * Bounded on purpose: a vignette gives a fight a different opening, it does not
 * decide it. A stage's own modifiers are the stage, so those do last the fight.
 */
export const CARRIED_BOON_ROUNDS = 3;

/** Opens a fight with a status already on a card, as modifiers and boons do. */
function setStatus(
  content: Content,
  card: BattleCard,
  status: StatusId,
  stacks: number,
  duration: number | 'battle',
  events: BattleEvent[],
): void {
  const def = content.statuses.get(status);
  if (!def) return;
  const capped = def.maxStacks ? Math.min(stacks, def.maxStacks) : stacks;
  card.statuses.push({ id: status, remaining: duration, stacks: capped });
  events.push({ kind: 'statusApplied', targetUid: card.uid, status, stacks: capped });
}

export function createBattle(
  content: Content,
  setup: BattleSetup,
): { state: BattleState; events: BattleEvent[] } {
  const cards: Record<string, BattleCard> = {};
  const queue: Record<Side, string[]> = { player: [], enemy: [] };
  const modifiers = setup.modifiers ?? [];
  const setupEvents: BattleEvent[] = [];

  const enemySpecs = withExtraReinforcements(
    setup.enemy,
    extraReinforcementCount(content, modifiers),
  );

  placeSide(content, setup.player, 'player', cards, queue.player);
  placeSide(content, enemySpecs, 'enemy', cards, queue.enemy);
  applyLeaderSkills(content, cards);
  applyElementAffinity(content, cards, setup.element, setupEvents);
  applyModifiers(content, cards, modifiers, setupEvents);
  if (setup.carriedStatus) {
    const { status, side, stacks } = setup.carriedStatus;
    for (const card of Object.values(cards)) {
      if (card.side === side) {
        setStatus(content, card, status, stacks, CARRIED_BOON_ROUNDS, setupEvents);
      }
    }
  }

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
    ...setupEvents,
    { kind: 'roundStarted', round: 1 },
    { kind: 'turnStarted', side: 'player', round: 1 },
  ];

  return { state, events };
}
