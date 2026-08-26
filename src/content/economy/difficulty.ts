/**
 * The endless difficulty curve. Enemy budget grows every stage and spikes on
 * elites and bosses; regions apply their own multiplier on top (Q16).
 */
import type { z } from 'zod';
import type { difficultyCurve } from '../schemas/map';

export type DifficultyCurve = z.infer<typeof difficultyCurve>;

export const DIFFICULTY_CURVE: DifficultyCurve = {
  id: 'difficulty.endless',
  base: 100,
  perStage: 1.07,
  eliteMultiplier: 1.4,
  bossMultiplier: 2,
  // Each full pass over the authored regions restarts them harder (Phase 4).
  perLoop: 1.6,
};
