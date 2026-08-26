/**
 * The effect interpreter.
 *
 * Every skill, status tick and passive resolves through here. Cards never get their
 * own engine branch (CLAUDE.md rule 3): new behaviour is either a new composition of
 * these primitives in data, or — rarely, and deliberately visible — a new primitive.
 */
import type { Content } from '@/content';
import type { EffectAction, EffectDef, Magnitude, StatusId, TargetFilter } from '@/content/schemas';
import type { Rng } from '../rng';
import { legalAttackTargets, livingOn, opposing, patternSlots, slotToCoord } from './board';
import type { BattleCard, BattleEvent, BattleState, StatMod } from './types';

/** Attack after temporary modifiers; never negative. */
export function effectiveAttack(card: BattleCard): number {
  const percent = card.mods
    .filter((m) => m.stat === 'attack')
    .reduce((sum, m) => sum + m.percent, 0);
  return Math.max(0, Math.round(card.baseAttack * (1 + percent / 100)));
}

/** True when a status stops the card acting this turn (freeze, stun). */
export function blockingStatus(content: Content, card: BattleCard): StatusId | null {
  for (const status of card.statuses) {
    if (content.statuses.get(status.id)?.blocksAction) return status.id;
  }
  return null;
}

function scaleForLevel(
  value: number,
  level: number,
  scaling?: { flatPerLevel: number; multiplierPerLevel: number },
): number {
  if (!scaling || level <= 1) return value;
  const steps = level - 1;
  return value * Math.pow(scaling.multiplierPerLevel, steps) + scaling.flatPerLevel * steps;
}

export function resolveMagnitude(
  magnitude: Magnitude,
  source: BattleCard,
  target: BattleCard,
): number {
  if ('base' in magnitude) return magnitude.base;
  if ('percentOfAttack' in magnitude) {
    return (effectiveAttack(source) * magnitude.percentOfAttack) / 100;
  }
  const anchor = magnitude.of === 'self' ? source : target;
  return (anchor.maxHp * magnitude.percentOfStrength) / 100;
}

/**
 * Picks the cards an effect lands on.
 *
 * `explicitUid` is the player's chosen target; scopes that do not need a choice
 * (all / row / lowestHp / …) resolve themselves so the UI never has to ask.
 */
export function resolveTargets(
  state: BattleState,
  content: Content,
  source: BattleCard,
  filter: TargetFilter,
  rng: Rng,
  explicitUid?: string,
): BattleCard[] {
  if (filter.side === 'self') return [source];

  const side = filter.side === 'ally' ? source.side : opposing(source.side);
  let pool = livingOn(state, side);

  if (filter.where?.attackType)
    pool = pool.filter((c) => c.attackType === filter.where?.attackType);
  if (filter.where?.element) {
    pool = pool.filter((c) => content.cards.get(c.defId)?.element === filter.where?.element);
  }
  if (filter.where?.hasStatus) {
    pool = pool.filter((c) => c.statuses.some((s) => s.id === filter.where?.hasStatus));
  }
  if (pool.length === 0) return [];

  const explicit = explicitUid ? pool.find((c) => c.uid === explicitUid) : undefined;

  switch (filter.scope) {
    case 'all':
      return pool;
    case 'single': {
      if (explicit) return [explicit];
      if (filter.side === 'enemy') {
        const legal = new Set(legalAttackTargets(state, source));
        const preferred = pool.filter((c) => legal.has(c.uid));
        return preferred.length > 0 ? [preferred[0]] : [pool[0]];
      }
      return [pool[0]];
    }
    case 'lowestHp':
      return [[...pool].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
    case 'highestHp':
      return [[...pool].sort((a, b) => b.hp / b.maxHp - a.hp / a.maxHp)[0]];
    case 'random':
      return [rng.pick(pool)];
    case 'row': {
      const anchor = explicit ?? (filter.side === 'ally' ? source : pool[0]);
      const row = slotToCoord(anchor.slot ?? 0).row;
      return pool.filter((c) => c.slot !== null && slotToCoord(c.slot).row === row);
    }
    case 'column': {
      const anchor = explicit ?? (filter.side === 'ally' ? source : pool[0]);
      const col = slotToCoord(anchor.slot ?? 0).col;
      return pool.filter((c) => c.slot !== null && slotToCoord(c.slot).col === col);
    }
    case 'pattern': {
      const pattern = filter.pattern ? content.patterns.get(filter.pattern) : undefined;
      if (!pattern) return explicit ? [explicit] : [pool[0]];
      const anchor = explicit ?? pool[0];
      const slots = patternSlots(anchor.slot ?? 0, pattern.cells);
      return slots
        .map((slot) => pool.find((c) => c.slot === slot))
        .filter((c): c is BattleCard => c !== undefined);
    }
  }
}

export function applyDamage(
  state: BattleState,
  source: BattleCard,
  target: BattleCard,
  rawAmount: number,
  events: BattleEvent[],
): void {
  if (!target.alive) return;
  const amount = Math.max(0, Math.round(rawAmount));
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  const toHp = amount - absorbed;
  target.hp = Math.max(0, target.hp - toHp);

  events.push({
    kind: 'damageDealt',
    sourceUid: source.uid,
    targetUid: target.uid,
    amount: toHp,
    absorbed,
  });

  if (target.hp === 0) killCard(state, target, events);
}

export function killCard(state: BattleState, card: BattleCard, events: BattleEvent[]): void {
  if (!card.alive) return;
  card.alive = false;
  card.slot = null;
  card.statuses = [];
  card.mods = [];
  card.shield = 0;
  if (card.side === 'player') state.alliesLost++;
  else state.enemiesLost++;
  events.push({ kind: 'cardDied', uid: card.uid, side: card.side });
}

function applyStatus(
  content: Content,
  target: BattleCard,
  statusId: StatusId,
  duration: number | 'battle',
  events: BattleEvent[],
): void {
  const def = content.statuses.get(statusId);
  if (!def) return;
  const existing = target.statuses.find((s) => s.id === statusId);

  if (existing) {
    if (def.stacking === 'ignore') return;
    if (def.stacking === 'refresh') {
      existing.remaining = duration;
    } else {
      existing.stacks = Math.min(existing.stacks + 1, def.maxStacks ?? existing.stacks + 1);
      existing.remaining = duration;
    }
    events.push({
      kind: 'statusApplied',
      targetUid: target.uid,
      status: statusId,
      stacks: existing.stacks,
    });
    return;
  }

  target.statuses.push({ id: statusId, remaining: duration, stacks: 1 });
  events.push({ kind: 'statusApplied', targetUid: target.uid, status: statusId, stacks: 1 });
}

export function performAction(
  state: BattleState,
  content: Content,
  source: BattleCard,
  target: BattleCard,
  action: EffectAction,
  events: BattleEvent[],
  multiplier = 1,
): void {
  switch (action.kind) {
    case 'damage':
      applyDamage(
        state,
        source,
        target,
        resolveMagnitude(action.amount, source, target) * multiplier,
        events,
      );
      break;

    case 'heal': {
      if (!target.alive) break;
      const amount = Math.round(resolveMagnitude(action.amount, source, target) * multiplier);
      const healed = Math.min(amount, target.maxHp - target.hp);
      target.hp += healed;
      events.push({ kind: 'healed', sourceUid: source.uid, targetUid: target.uid, amount: healed });
      break;
    }

    case 'shield': {
      if (!target.alive) break;
      const amount = Math.round(resolveMagnitude(action.amount, source, target) * multiplier);
      target.shield += amount;
      applyStatus(content, target, 'shield', action.duration, events);
      events.push({ kind: 'shieldGained', targetUid: target.uid, amount });
      break;
    }

    case 'applyStatus':
      if (target.alive) applyStatus(content, target, action.status, action.duration, events);
      break;

    case 'cleanse': {
      const removing =
        action.statuses === 'all' ? target.statuses.map((s) => s.id) : action.statuses;
      target.statuses = target.statuses.filter((s) => {
        if (!removing.includes(s.id)) return true;
        events.push({ kind: 'statusExpired', targetUid: target.uid, status: s.id });
        return false;
      });
      break;
    }

    case 'modifyStat': {
      if (!target.alive) break;
      const mod: StatMod = {
        stat: action.stat,
        percent: action.percent,
        remaining: action.duration,
      };
      target.mods.push(mod);
      events.push({
        kind: 'statModified',
        targetUid: target.uid,
        stat: action.stat,
        percent: action.percent,
      });
      break;
    }

    case 'taunt':
      if (target.alive) applyStatus(content, target, 'taunt', action.duration, events);
      break;

    case 'summon':
      // Reserved for Phase 2+ content; no slice card summons, and silently doing
      // nothing beats pretending it worked.
      break;

    case 'scripted':
      // Escape hatch for genuinely unique behaviour. The registry stays empty until
      // a card actually needs one, so an unknown id is a content bug, not a crash.
      break;
  }
}

/**
 * Resolves one authored effect: picks targets, rolls its chance, applies the action.
 * `skillLevel` scales damage/heal magnitudes through the skill's own curve.
 */
export function resolveEffect(
  state: BattleState,
  content: Content,
  source: BattleCard,
  effect: EffectDef,
  rng: Rng,
  events: BattleEvent[],
  options: {
    explicitTargetUid?: string;
    skillLevel?: number;
    scaling?: { flatPerLevel: number; multiplierPerLevel: number };
  } = {},
): void {
  const targets = resolveTargets(
    state,
    content,
    source,
    effect.target,
    rng,
    options.explicitTargetUid,
  );
  if (targets.length === 0) return;

  const multiplier = scaleForLevel(1, options.skillLevel ?? 1, options.scaling);

  for (const target of targets) {
    // The chance roll is per target, so a 60% burn on a row is not all-or-nothing.
    if (effect.chance !== undefined && !rng.chance(effect.chance)) continue;
    performAction(state, content, source, target, effect.action, events, multiplier);
  }
}
