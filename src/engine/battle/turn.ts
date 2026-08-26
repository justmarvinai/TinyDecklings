/**
 * The turn loop.
 *
 * Structure (Q3/Q4/Q7): a round is the player's turn then the enemy's. On a side's
 * turn each living card acts once in slot order, front-left to back-right. The
 * player picks a target for the acting card, or fires a ready skill instead; AUTO
 * feeds the same intents through the same door, so nothing about the rules changes.
 *
 * `step()` maintains one invariant the UI depends on: when it returns, either the
 * battle is over, or `order[0]` is a living, unblocked card waiting for an intent.
 */
import type { Content } from '@/content';
import { starsForResult } from '@/content/schemas';
import { createRng, type Rng } from '../rng';
import { emptySlots, legalAttackTargets, livingOn, opposing, patternSlots } from './board';
import {
  applyDamage,
  blockingStatus,
  effectiveAttack,
  performAction,
  resolveEffect,
} from './effects';
import type { BattleCard, BattleEvent, BattleState, Intent, Side, StepResult } from './types';

function clone(state: BattleState): BattleState {
  return structuredClone(state);
}

function rngFor(state: BattleState): Rng {
  return createRng(state.seed, state.rngState);
}

/** The card currently waiting for an intent, or null when the battle is over. */
export function activeCard(state: BattleState): BattleCard | null {
  const uid = state.order[0];
  return uid ? (state.cards[uid] ?? null) : null;
}

export function isPlayerTurn(state: BattleState): boolean {
  return state.turn === 'player' && state.outcome === 'ongoing';
}

function buildOrder(state: BattleState, side: Side): string[] {
  return livingOn(state, side).map((c) => c.uid);
}

function checkOutcome(state: BattleState): boolean {
  if (state.outcome !== 'ongoing') return true;
  const playerLeft = livingOn(state, 'player').length + state.queue.player.length;
  const enemyLeft = livingOn(state, 'enemy').length + state.queue.enemy.length;
  if (enemyLeft === 0) {
    state.outcome = 'victory';
    return true;
  }
  if (playerLeft === 0) {
    state.outcome = 'defeat';
    return true;
  }
  return false;
}

function endBattle(state: BattleState, events: BattleEvent[]): void {
  state.order = [];
  events.push({
    kind: 'battleEnded',
    outcome: state.outcome,
    stars: starsForResult(state.outcome === 'victory', state.alliesLost),
    alliesLost: state.alliesLost,
  });
}

/** Empty slots pull the next queued card in at the start of a round (Q7). */
function deployReinforcements(state: BattleState, events: BattleEvent[]): void {
  for (const side of ['player', 'enemy'] as const) {
    const queue = state.queue[side];
    while (queue.length > 0) {
      const free = emptySlots(state, side);
      if (free.length === 0) break;
      const uid = queue.shift();
      if (!uid) break;
      const card = state.cards[uid];
      if (!card || !card.alive) continue;
      card.slot = free[0];
      events.push({ kind: 'cardDeployed', uid, side, slot: card.slot });
    }
  }
}

function tickStatuses(
  state: BattleState,
  content: Content,
  phase: 'roundStart' | 'roundEnd',
  rng: Rng,
  events: BattleEvent[],
): void {
  for (const card of Object.values(state.cards)) {
    if (!card.alive || card.slot === null) continue;
    for (const status of [...card.statuses]) {
      const def = content.statuses.get(status.id);
      if (!def?.tick || def.tick.on !== phase) continue;
      // Stacks scale the tick — three stacks of burn hurt three times as much.
      for (let i = 0; i < status.stacks; i++) {
        performAction(state, content, card, card, def.tick.action, events);
      }
      if (!card.alive) break;
    }
  }
  void rng;
}

/** Durations tick down once per round; expiries emit so the UI can drop the badge. */
function expireDurations(state: BattleState, events: BattleEvent[]): void {
  for (const card of Object.values(state.cards)) {
    if (!card.alive) continue;

    card.statuses = card.statuses.filter((status) => {
      if (status.remaining === 'battle') return true;
      status.remaining -= 1;
      if (status.remaining > 0) return true;
      if (status.id === 'shield') card.shield = 0;
      events.push({ kind: 'statusExpired', targetUid: card.uid, status: status.id });
      return false;
    });

    card.mods = card.mods.filter((mod) => {
      if (mod.remaining === 'battle') return true;
      mod.remaining -= 1;
      return mod.remaining > 0;
    });
  }
}

function tickCooldowns(state: BattleState, side: Side, events: BattleEvent[]): void {
  for (const card of livingOn(state, side)) {
    for (const skill of card.skills) {
      if (skill.cooldownRemaining > 0) {
        skill.cooldownRemaining -= 1;
        if (skill.cooldownRemaining === 0) {
          events.push({ kind: 'skillReady', uid: card.uid, skillId: skill.skillId });
        }
      }
    }
  }
}

/**
 * Walks forward until a card actually needs an intent.
 *
 * Cards that died before their turn came up, or that are frozen/stunned, are
 * skipped here rather than forcing the caller to send throwaway intents.
 */
function advanceToActionable(state: BattleState, content: Content, events: BattleEvent[]): void {
  const rng = rngFor(state);

  for (let guard = 0; guard < 200; guard++) {
    if (checkOutcome(state)) {
      endBattle(state, events);
      state.rngState = rng.getState();
      return;
    }

    // Drop uids that can no longer act.
    while (state.order.length > 0) {
      const card = state.cards[state.order[0]];
      if (!card || !card.alive || card.slot === null) {
        state.order.shift();
        continue;
      }
      const blocker = blockingStatus(content, card);
      if (blocker) {
        events.push({ kind: 'turnSkipped', uid: card.uid, reason: blocker });
        card.hasActed = true;
        state.order.shift();
        continue;
      }
      if (legalAttackTargets(state, card).length === 0) {
        // Nothing on the board to act against — the enemy side is wiped but a
        // reinforcement is still queued. Pass, rather than wait forever for an
        // intent that cannot exist.
        events.push({ kind: 'turnSkipped', uid: card.uid, reason: 'noTargets' });
        card.hasActed = true;
        state.order.shift();
        continue;
      }
      state.rngState = rng.getState();
      return; // this card needs an intent
    }

    // The side's turn is over.
    if (state.turn === 'player') {
      state.turn = 'enemy';
      state.order = buildOrder(state, 'enemy');
      events.push({ kind: 'turnStarted', side: 'enemy', round: state.round });
      continue;
    }

    // Round over: ticks, expiries, reinforcements, then a fresh player turn.
    tickStatuses(state, content, 'roundEnd', rng, events);
    if (checkOutcome(state)) {
      endBattle(state, events);
      state.rngState = rng.getState();
      return;
    }
    expireDurations(state, events);

    state.round += 1;
    for (const card of Object.values(state.cards)) card.hasActed = false;
    deployReinforcements(state, events);
    events.push({ kind: 'roundStarted', round: state.round });
    tickCooldowns(state, 'player', events);
    tickCooldowns(state, 'enemy', events);
    tickStatuses(state, content, 'roundStart', rng, events);

    state.turn = 'player';
    state.order = buildOrder(state, 'player');
    events.push({ kind: 'turnStarted', side: 'player', round: state.round });
  }

  throw new Error('Battle turn loop failed to reach an actionable state.');
}

/** Basic attack: the card's own pattern, with falloff on non-anchor cells. */
function performAttack(
  state: BattleState,
  content: Content,
  actor: BattleCard,
  targetUid: string,
  events: BattleEvent[],
): void {
  const target = state.cards[targetUid];
  if (!target || !target.alive) return;

  events.push({ kind: 'attackDeclared', actorUid: actor.uid, targetUid });

  const pattern = content.patterns.get(actor.attackPattern);
  const damage = effectiveAttack(actor);

  if (!pattern || pattern.cells.length <= 1 || target.slot === null) {
    applyDamage(state, actor, target, damage, events);
    return;
  }

  const slots = patternSlots(target.slot, pattern.cells);
  const enemies = livingOn(state, opposing(actor.side));
  for (const slot of slots) {
    const hit = enemies.find((c) => c.slot === slot);
    if (!hit) continue;
    const multiplier = slot === target.slot ? 1 : (pattern.falloff ?? 1);
    applyDamage(state, actor, hit, damage * multiplier, events);
  }
}

function performSkill(
  state: BattleState,
  content: Content,
  actor: BattleCard,
  skillIndex: number,
  targetUid: string | undefined,
  rng: Rng,
  events: BattleEvent[],
): boolean {
  const battleSkill = actor.skills[skillIndex];
  if (!battleSkill || battleSkill.cooldownRemaining > 0) return false;
  const def = content.skills.get(battleSkill.skillId);
  if (!def) return false;

  events.push({ kind: 'skillCast', actorUid: actor.uid, skillId: def.id, targetUid });

  for (const effect of def.effects) {
    if (effect.trigger !== 'onCast') continue;
    resolveEffect(state, content, actor, effect, rng, events, {
      explicitTargetUid: targetUid,
      skillLevel: battleSkill.level,
      scaling: def.scaling,
    });
  }

  battleSkill.cooldownRemaining = def.cooldown;
  return true;
}

/**
 * Applies one intent for the active card and advances to the next decision point.
 *
 * Returns a fresh state — never mutates the input — so React state updates and
 * save snapshots stay honest.
 */
export function step(state: BattleState, content: Content, intent: Intent): StepResult {
  const next = clone(state);
  const events: BattleEvent[] = [];

  if (next.outcome !== 'ongoing') return { state: next, events };

  if (intent.kind === 'surrender') {
    next.outcome = 'defeat';
    endBattle(next, events);
    return { state: next, events };
  }

  const actor = activeCard(next);
  if (!actor) {
    advanceToActionable(next, content, events);
    return { state: next, events };
  }

  const rng = rngFor(next);

  if (intent.kind === 'attack') {
    const legal = legalAttackTargets(next, actor);
    // An illegal target would let the UI break the front-row rule; fall back to a
    // legal one rather than trusting the caller.
    const targetUid = legal.includes(intent.targetUid) ? intent.targetUid : legal[0];
    if (targetUid) performAttack(next, content, actor, targetUid, events);
  } else {
    const cast = performSkill(
      next,
      content,
      actor,
      intent.skillIndex,
      intent.targetUid,
      rng,
      events,
    );
    if (!cast) {
      const legal = legalAttackTargets(next, actor);
      if (legal[0]) performAttack(next, content, actor, legal[0], events);
    }
  }

  next.rngState = rng.getState();
  actor.hasActed = true;
  next.order.shift();

  advanceToActionable(next, content, events);
  return { state: next, events };
}

/**
 * Runs the opening bookkeeping so the first player card is ready to act.
 * Call once, right after `createBattle`.
 */
export function beginBattle(state: BattleState, content: Content): StepResult {
  const next = clone(state);
  const events: BattleEvent[] = [];
  next.order = buildOrder(next, 'player');
  advanceToActionable(next, content, events);
  return { state: next, events };
}

export { starsForResult };
