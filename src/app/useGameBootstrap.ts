import { useEffect } from 'react';
import { useBattleStore } from '@/state/battleStore';
import { useDeckStore } from '@/state/deckStore';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { useSettingsStore } from '@/state/settingsStore';
import type { GameServices } from './gameServices';

/**
 * Loads the save, hydrates every store from it, and keeps it written back.
 *
 * A brand-new player is handed the starter collection here rather than at first
 * battle, so the collection screen is never mysteriously empty.
 */
export function useGameBootstrap(services: GameServices): void {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // The run seed is drawn from the clock once and then persisted: from that
      // point the whole journey is reproducible from the save (ARCHITECTURE.md §4).
      const result = await services.saves.load(services.clock.now() >>> 0);
      if (cancelled) return;

      if (result.status === 'corrupt') {
        console.warn(
          `[TinyDecklings] save unreadable, kept a backup at ${result.backupKey}`,
          result.reason,
        );
      }

      useSettingsStore.getState().hydrate(result.save.settings);
      services.audio.setSettings({
        sfx: result.save.settings.sfx,
        music: result.save.settings.music,
      });

      usePlayerStore.getState().hydrate(result.save);
      useRunStore.getState().hydrate(result.save);
      useDeckStore.getState().hydrate(result.save);

      if (result.status === 'new' || result.status === 'corrupt') {
        usePlayerStore.getState().grantStarterCollection();
        // A fresh player gets a ready-to-fight deck rather than an empty one.
        useDeckStore.getState().autoBuild(0);
        await services.saves.save(usePlayerStore.getState().getSave());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [services]);

  // Autosave whenever the player's world or their position on the road changes.
  useEffect(() => {
    const write = () => {
      const player = usePlayerStore.getState().save;
      if (!player) return;
      const run = useRunStore.getState().toSave();
      const settings = useSettingsStore.getState().toSave();
      // A fight in progress is stored as its seed plus the intents played so far;
      // replaying that log rebuilds the exact board (ARCHITECTURE.md §7).
      const pendingBattle = useBattleStore.getState().toSave();
      services.saves.autosave({
        ...player,
        run: { ...player.run, ...run, pendingBattle },
        settings,
      });
    };

    const unsubPlayer = usePlayerStore.subscribe(write);
    const unsubRun = useRunStore.subscribe(write);
    const unsubSettings = useSettingsStore.subscribe(write);
    const unsubBattle = useBattleStore.subscribe(write);
    const unsubDeck = useDeckStore.subscribe(write);
    return () => {
      unsubPlayer();
      unsubRun();
      unsubSettings();
      unsubBattle();
      unsubDeck();
    };
  }, [services]);
}
