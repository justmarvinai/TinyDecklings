/**
 * Live battle state and the intent log that makes a fight resumable.
 *
 * The store holds the engine's state, feeds it intents, and hands the resulting
 * events to the UI to animate. It contains no rules: every outcome comes back from
 * `engine/battle` (ARCHITECTURE.md §3).
 */
import { create } from 'zustand';
import { CONTENT } from '@/content';
import { starsForResult } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { applyStarBonus, rollLoot, type RewardBundle } from '@/engine/economy/rewards';
import { lootTableForStage } from '@/engine/map/generate';
import { usePlayerStore } from './playerStore';
import { useRunStore } from './runStore';
import {
  activeCard,
  beginBattle,
  chooseIntent,
  createBattle,
  legalAttackTargets,
  step,
  type BattleCard,
  type BattleEvent,
  type BattleSetup,
  type BattleState,
  type Intent,
} from '@/engine/battle';

export interface BattleResult {
  outcome: 'victory' | 'defeat';
  stars: 0 | 1 | 2 | 3;
  rewards: RewardBundle;
}

export interface BattleSlice {
  state: BattleState | null;
  /** Set once the fight is over and its rewards have been banked. */
  result: BattleResult | null;
  /** Every intent applied since setup — replaying it restores the fight exactly. */
  intentLog: Intent[];
  setup: BattleSetup | null;
  /** Events the UI has not animated yet. */
  pending: BattleEvent[];
  auto: boolean;

  start: (setup: BattleSetup) => void;
  /** Rebuilds a battle from a persisted setup plus its intent log (task 1.17). */
  resume: (setup: BattleSetup, intents: readonly Intent[]) => void;
  submit: (intent: Intent) => void;
  /** Runs one AI step — used for enemy turns and for AUTO. */
  stepAi: () => boolean;
  setAuto: (on: boolean) => void;
  consumeEvents: () => BattleEvent[];
  /**
   * Banks the outcome exactly once: records the stage's stars, rolls and grants
   * loot on a win, and advances the run. Safe to call repeatedly.
   */
  finish: () => BattleResult | null;
  clear: () => void;

  active: () => BattleCard | null;
  targetsFor: (uid: string) => string[];
  stars: () => 0 | 1 | 2 | 3;
  /** What the save needs to rebuild this fight after the app is killed. */
  toSave: () => { stage: number; attempt: number; seed: number; intentLog: Intent[] } | null;
}

export const useBattleStore = create<BattleSlice>((set, get) => ({
  state: null,
  result: null,
  intentLog: [],
  setup: null,
  pending: [],
  auto: false,

  start: (setup) => {
    const created = createBattle(CONTENT, setup);
    const begun = beginBattle(created.state, CONTENT);
    set({
      setup,
      state: begun.state,
      intentLog: [],
      pending: [...created.events, ...begun.events],
      result: null,
    });
  },

  resume: (setup, intents) => {
    const created = createBattle(CONTENT, setup);
    let state = beginBattle(created.state, CONTENT).state;
    for (const intent of intents) {
      if (state.outcome !== 'ongoing') break;
      state = step(state, CONTENT, intent).state;
    }
    // A resumed fight skips the animation backlog: the player is dropped back in
    // where they left off, not shown the whole fight again.
    set({ setup, state, intentLog: [...intents], pending: [], result: null });
  },

  submit: (intent) => {
    const current = get().state;
    if (!current || current.outcome !== 'ongoing') return;
    const result = step(current, CONTENT, intent);
    set((s) => ({
      state: result.state,
      intentLog: [...s.intentLog, intent],
      pending: [...s.pending, ...result.events],
    }));
  },

  stepAi: () => {
    const current = get().state;
    if (!current || current.outcome !== 'ongoing') return false;
    const rng = createRng(current.seed, current.rngState);
    const intent = chooseIntent(current, CONTENT, rng);
    if (!intent) return false;
    get().submit(intent);
    return true;
  },

  setAuto: (on) => set({ auto: on }),

  consumeEvents: () => {
    const events = get().pending;
    if (events.length > 0) set({ pending: [] });
    return events;
  },

  finish: () => {
    const { state, result } = get();
    if (result) return result;
    if (!state || state.outcome === 'ongoing') return null;

    const player = usePlayerStore.getState();
    const run = useRunStore.getState();
    const stars = starsForResult(state.outcome === 'victory', state.alliesLost);
    player.recordStage(state.stage, stars);

    let rewards: RewardBundle = { currencies: {}, cardXp: 0, gear: [], cards: [], fragments: [] };
    if (state.outcome === 'victory') {
      const generated = run.stage(state.stage);
      const table = CONTENT.lootTables.get(lootTableForStage(CONTENT, generated));
      if (table) {
        // Rewards continue the battle's own rng stream, so a replayed fight pays
        // out exactly the same loot.
        rewards = applyStarBonus(
          rollLoot(CONTENT, table, createRng(state.seed, state.rngState)),
          stars,
        );
        player.applyRewards(rewards);
      }
      run.advanceTo(state.stage + 1);
    }

    const finished: BattleResult = { outcome: state.outcome, stars, rewards };
    set({ result: finished });
    return finished;
  },

  clear: () =>
    set({ state: null, setup: null, intentLog: [], pending: [], auto: false, result: null }),

  active: () => {
    const state = get().state;
    return state ? activeCard(state) : null;
  },

  targetsFor: (uid) => {
    const state = get().state;
    const card = state?.cards[uid];
    if (!state || !card) return [];
    return legalAttackTargets(state, card);
  },

  stars: () => {
    const state = get().state;
    if (!state) return 0;
    return starsForResult(state.outcome === 'victory', state.alliesLost);
  },

  toSave: () => {
    const { state, setup, intentLog } = get();
    // Only an unfinished fight is worth resuming.
    if (!state || !setup || state.outcome !== 'ongoing') return null;
    return { stage: setup.stage, attempt: setup.attempt, seed: setup.seed, intentLog };
  },
}));
