/**
 * Energy pacing — owner decision Q14, option (b).
 *
 * Generous and fast-refilling: cap 30, one point every two minutes (empty to full
 * in an hour). Combat stages cost energy; event, treasure and camp vignettes are
 * free. Defeat does not refund the attempt — the fast regen is the cushion.
 *
 * The system itself lands in Phase 3; these are its initial tunables.
 */
import type { EnergyConfig } from '../schemas';

export const ENERGY_CONFIG: EnergyConfig = {
  cap: 30,
  regenSeconds: 120,
  costs: {
    battle: 5,
    elite: 6,
    boss: 8,
    event: 0,
    treasure: 0,
    camp: 0,
  },
};
