/**
 * Board geometry and targeting rules.
 *
 * The two rules that shape every fight (Q7):
 *  - melee attackers are locked to the enemy front row while anything lives there,
 *    so the back line has to be dug out;
 *  - taunt overrides that, pulling attacks onto the taunting card wherever it stands.
 */
import { BOARD_COLS, BOARD_SLOTS, type BattleCard, type BattleState, type Side } from './types';

export interface Coord {
  col: number;
  row: number;
}

export function slotToCoord(slot: number): Coord {
  return { col: slot % BOARD_COLS, row: Math.floor(slot / BOARD_COLS) };
}

export function coordToSlot(coord: Coord): number | null {
  if (coord.col < 0 || coord.col >= BOARD_COLS) return null;
  if (coord.row < 0 || coord.row >= BOARD_SLOTS / BOARD_COLS) return null;
  return coord.row * BOARD_COLS + coord.col;
}

export const FRONT_ROW = 0;

export function isFrontRow(slot: number): boolean {
  return slotToCoord(slot).row === FRONT_ROW;
}

export function opposing(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

/** Living, deployed cards on a side, in slot order. */
export function livingOn(state: BattleState, side: Side): BattleCard[] {
  return Object.values(state.cards)
    .filter((c) => c.side === side && c.alive && c.slot !== null)
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
}

export function cardAtSlot(state: BattleState, side: Side, slot: number): BattleCard | undefined {
  return livingOn(state, side).find((c) => c.slot === slot);
}

export function emptySlots(state: BattleState, side: Side): number[] {
  const taken = new Set(livingOn(state, side).map((c) => c.slot));
  const free: number[] = [];
  for (let slot = 0; slot < BOARD_SLOTS; slot++) if (!taken.has(slot)) free.push(slot);
  return free;
}

export function hasStatus(card: BattleCard, statusId: string): boolean {
  return card.statuses.some((s) => s.id === statusId);
}

/**
 * Which enemies `actor` may attack right now.
 *
 * Order of precedence: taunt first, then the melee front-row lock, then anything.
 */
export function legalAttackTargets(state: BattleState, actor: BattleCard): string[] {
  const enemies = livingOn(state, opposing(actor.side));
  if (enemies.length === 0) return [];

  const taunting = enemies.filter((c) => hasStatus(c, 'taunt'));
  if (taunting.length > 0) return taunting.map((c) => c.uid);

  if (actor.attackType === 'melee') {
    const front = enemies.filter((c) => c.slot !== null && isFrontRow(c.slot));
    if (front.length > 0) return front.map((c) => c.uid);
  }

  return enemies.map((c) => c.uid);
}

/**
 * Expands an attack pattern around an anchor slot, clipped to the board.
 *
 * Returns the anchor first so callers can apply falloff to the rest.
 */
export function patternSlots(
  anchorSlot: number,
  cells: readonly (readonly [number, number])[],
): number[] {
  const anchor = slotToCoord(anchorSlot);
  const out: number[] = [];
  for (const [dx, dy] of cells) {
    const slot = coordToSlot({ col: anchor.col + dx, row: anchor.row + dy });
    if (slot !== null && !out.includes(slot)) out.push(slot);
  }
  // Keep the anchor first even if the pattern lists it later.
  return [anchorSlot, ...out.filter((s) => s !== anchorSlot)];
}
