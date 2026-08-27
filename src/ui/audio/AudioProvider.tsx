import type { ReactNode } from 'react';
import type { AudioService } from '@/services/audio';
import { AudioContext } from './audioContext';

export function AudioProvider({ audio, children }: { audio: AudioService; children: ReactNode }) {
  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>;
}
