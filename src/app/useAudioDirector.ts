import { useEffect } from 'react';
import { CONTENT } from '@/content';
import { regionForStage } from '@/engine/map/generate';
import { useRunStore } from '@/state/runStore';
import { useScreenStore, currentScreen } from '@/state/screenStore';
import { useSettingsStore } from '@/state/settingsStore';
import { musicForTheme, type AudioService } from '@/services/audio';

/**
 * Keeps the audio device in step with the game (Q26).
 *
 * Two jobs, both of them subscriptions rather than call sites: the mix follows the
 * settings store, and the music bed follows where the player is — the biome's theme
 * on the road, a battle bed in a fight and a heavier one against a boss. Screens
 * never call `playMusic` themselves, so no screen can forget to.
 */
export function useAudioDirector(audio: AudioService): void {
  // The mix.
  useEffect(() => {
    const push = () => {
      const { sfx, music, sfxVolume, musicVolume } = useSettingsStore.getState();
      audio.setSettings({ sfx, music, sfxVolume, musicVolume });
    };
    push();
    return useSettingsStore.subscribe(push);
  }, [audio]);

  // The bed, plus the gesture that is allowed to start it at all.
  useEffect(() => {
    const pick = () => {
      if (!audio.unlocked) return;
      const screen = currentScreen(useScreenStore.getState());
      if (screen.kind === 'battle') {
        const stage = useRunStore.getState().stage(screen.stage);
        audio.playMusic(stage.kind === 'boss' ? 'music.boss' : 'music.battle');
        return;
      }
      const region = regionForStage(CONTENT, useRunStore.getState().currentStage);
      audio.playMusic(musicForTheme(region.themeToken));
    };

    // Mobile browsers refuse to start audio before a gesture, so the first tap
    // both unlocks the device and starts whatever bed the player is standing in.
    const unlock = () => {
      audio.unlock();
      pick();
    };
    window.addEventListener('pointerdown', unlock, { once: true });

    pick();
    const unsubScreen = useScreenStore.subscribe(pick);
    const unsubRun = useRunStore.subscribe(pick);
    const unsubSettings = useSettingsStore.subscribe(pick);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      unsubScreen();
      unsubRun();
      unsubSettings();
      // Oscillators do not stop themselves: a bed left running after teardown
      // plays under whatever mounts next.
      audio.stopMusic();
    };
  }, [audio]);
}
