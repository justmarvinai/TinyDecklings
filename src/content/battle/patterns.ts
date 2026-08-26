/**
 * Attack patterns — grid shapes over the 2x3 enemy board, anchored on the target.
 * Offsets that fall off the board are clipped by the engine, so one pattern works
 * from any anchor. "Default" in the reference card sheet is `pattern.single`.
 */
import type { AttackPatternDef } from '../schemas';

const ALL_CELLS: [number, number][] = [];
for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 1; dy++) ALL_CELLS.push([dx, dy]);

export const ATTACK_PATTERN_DEFS: readonly AttackPatternDef[] = [
  { id: 'pattern.single', name: 'Default', cells: [[0, 0]] },
  {
    id: 'pattern.row',
    name: 'Row',
    cells: [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
    ],
    falloff: 1,
  },
  {
    id: 'pattern.column',
    name: 'Column',
    cells: [
      [0, 0],
      [0, -1],
      [0, 1],
    ],
    falloff: 1,
  },
  {
    id: 'pattern.cross',
    name: 'Cross',
    cells: [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ],
    falloff: 0.6,
  },
  {
    id: 'pattern.splash',
    name: 'Splash',
    cells: [
      [0, 0],
      [-1, 0],
      [1, 0],
    ],
    falloff: 0.5,
  },
  { id: 'pattern.all', name: 'All', cells: ALL_CELLS, falloff: 0.4 },
];
