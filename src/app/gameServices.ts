/**
 * Composition root for the service layer.
 *
 * Nothing below the UI reaches for a global: the storage backend, the clock and the
 * audio device are created here and injected, which is what keeps the engine pure
 * and the Capacitor swap a one-file change (ARCHITECTURE.md §1, AD-6).
 */
import { createAudioService, type AudioService } from '@/services/audio';
import { systemClock, type Clock } from '@/services/clock';
import { createLocalStorageService, type StorageService } from '@/services/storage';
import { SaveService } from '@/services/saves';
import { ENERGY_CONFIG } from '@/content';

export interface GameServices {
  storage: StorageService;
  clock: Clock;
  audio: AudioService;
  saves: SaveService;
}

export function createGameServices(overrides: Partial<GameServices> = {}): GameServices {
  const storage = overrides.storage ?? createLocalStorageService();
  const clock = overrides.clock ?? systemClock;
  const audio = overrides.audio ?? createAudioService();
  const saves =
    overrides.saves ?? new SaveService({ storage, clock, energyCap: ENERGY_CONFIG.cap });
  return { storage, clock, audio, saves };
}
