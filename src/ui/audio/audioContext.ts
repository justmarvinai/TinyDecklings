import { createContext, useContext, useMemo } from 'react';
import type { AudioService, SoundKey } from '@/services/audio';

/**
 * How the interface reaches the sound device.
 *
 * The service itself is created at the composition root and injected (no globals,
 * ARCHITECTURE.md §1); this is the thread that carries it down to a button deep in
 * a modal without every screen having to pass it along.
 */
export const AudioContext = createContext<AudioService | null>(null);

/**
 * Fire-and-forget sound. Safe before the device is unlocked, and a no-op with no
 * provider above — components stay testable in isolation.
 */
export function useSfx(): (key: SoundKey) => void {
  const audio = useContext(AudioContext);
  return useMemo(() => (key: SoundKey) => audio?.play(key), [audio]);
}
