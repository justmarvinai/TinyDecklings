import { useCallback } from 'react';
import { CONTENT } from '@/content';
import type { BattleSetup, CombatantSpec } from '@/engine/battle';
import { enemyLevelBonus } from '@/engine/map/generate';
import { useDeckStore } from '@/state/deckStore';
import { gearBonusesFor, usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';

/**
 * Builds a battle setup from the collection as it stands *right now*.
 *
 * Deliberately not reactive: a fight snapshots the roster when it starts. Deriving
 * the setup from live store state would rebuild it the moment victory rewards land,
 * restarting the battle you just won.
 *
 * The lineup comes from the player's active deck (Q6). If that deck is empty — a
 * brand-new save, or every member ascended away — it falls back to the strongest
 * cards owned, so a battle is never unwinnable for want of a deck.
 */
export function useBattleSetupFactory(): (stage: number) => BattleSetup | null {
  return useCallback((stage: number) => {
    const player = usePlayerStore.getState();
    const run = useRunStore.getState();
    const save = player.save;
    if (!save || save.player.cards.length === 0) return null;

    const generated = run.stage(stage);
    const group = CONTENT.enemies.get(generated.encounterRef);
    if (!group) return null;

    const toSpec = (uid: string): CombatantSpec => {
      const owned = save.player.cards.find((c) => c.uid === uid)!;
      const { flat } = gearBonusesFor(save, owned);
      return { defId: owned.defId, level: owned.level, stars: owned.stars, gearBonuses: flat };
    };

    // The lineup is the player's active deck (Q6); an empty deck falls back to the
    // whole collection so a battle is never unwinnable for want of a deck.
    const lineupUids = useDeckStore.getState().lineup();
    const chosen =
      lineupUids.length > 0
        ? lineupUids
            .map((uid) => save.player.cards.find((c) => c.uid === uid))
            .filter((c): c is NonNullable<typeof c> => Boolean(c))
        : save.player.cards;

    const ranked = chosen
      .map((card) => ({
        card,
        power: player.statsFor(card.uid).power,
        def: CONTENT.cards.get(card.defId),
      }))
      .sort((a, b) => {
        // Hero first so its leader skill is always in play, then by Power.
        const heroA = a.def?.cardClass === 'hero' ? 1 : 0;
        const heroB = b.def?.cardClass === 'hero' ? 1 : 0;
        if (heroA !== heroB) return heroB - heroA;
        return b.power - a.power;
      })
      .slice(0, 9);

    // Melee holds the front row, ranged sits behind — the formation the targeting
    // rules reward (Q7).
    const front = ranked.filter((r) => r.def?.attackType === 'melee').slice(0, 3);
    const back = ranked.filter((r) => r.def?.attackType === 'ranged').slice(0, 3);
    const placed = new Set([...front, ...back].map((r) => r.card.uid));
    const bench = ranked.filter((r) => !placed.has(r.card.uid));

    const playerSpecs: CombatantSpec[] = [
      ...front.map((r, i) => ({ ...toSpec(r.card.uid), slot: i })),
      ...back.map((r, i) => ({ ...toSpec(r.card.uid), slot: 3 + i })),
      ...bench.map((r) => toSpec(r.card.uid)),
    ];

    const levelBonus = enemyLevelBonus(stage);
    const enemySpecs: CombatantSpec[] = [
      ...group.members.map((m) => ({
        defId: m.cardId,
        level: m.level + levelBonus,
        stars: 3,
        slot: m.slot,
        isBoss: m.cardId === group.bossCardId,
      })),
      ...group.reinforcements.map((cardId) => ({
        defId: cardId,
        level: 1 + levelBonus,
        stars: 3,
        reserve: true,
      })),
    ];

    const attempt = (save.player.stageRecords[String(stage)]?.clears ?? 0) + 1;
    return { stage, attempt, seed: run.seed, player: playerSpecs, enemy: enemySpecs };
  }, []);
}
