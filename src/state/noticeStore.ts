/**
 * System notices: the few things the game has to tell the player about itself.
 *
 * Not gameplay messages — those belong on the screen they happen on. This is for
 * conditions the player cannot see any other way: a device that will not accept a
 * save, a save that could not be read. Rare, important, and dismissible.
 */
import { create } from 'zustand';

export type NoticeTone = 'warning' | 'danger';

export interface Notice {
  id: string;
  tone: NoticeTone;
  title: string;
  body: string;
}

export interface NoticeState {
  notices: Notice[];
  /** Idempotent: pushing the same id twice leaves one notice, not two. */
  notify: (notice: Notice) => void;
  dismiss: (id: string) => void;
  clear: (id: string) => void;
}

export const useNoticeStore = create<NoticeState>((set) => ({
  notices: [],

  notify: (notice) =>
    set((s) =>
      s.notices.some((n) => n.id === notice.id) ? s : { notices: [...s.notices, notice] },
    ),

  dismiss: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

  clear: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
}));
