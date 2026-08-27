import { useNoticeStore } from '@/state/noticeStore';

/**
 * Registering the offline shell.
 *
 * The game is single-player, offline and local-save, and installs to a home screen
 * — but a home-screen icon that needs a network to open is not an offline game.
 * The worker (built by `scripts/sw-plugin.mjs`) is what closes that gap.
 *
 * Production only. In dev the module graph changes on every keystroke and a cache
 * in front of it turns "why is my edit not showing" into an afternoon.
 */
const UPDATE_NOTICE = 'app-update-ready';

export function registerOfflineShell(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  // After load: registering during boot competes with the assets the first screen
  // is waiting for, and this is worth nothing until the second visit anyway.
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // A worker already waiting means the player opened a session over a build
        // that had already been replaced.
        if (registration.waiting) announceUpdate();

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // `controller` is null on the very first install — that is a fresh
            // offline copy, not an update, and saying so would be nonsense.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              announceUpdate();
            }
          });
        });
      })
      .catch(() => {
        // Offline support is a bonus, not a dependency. A registration that fails
        // (private mode, an unsupported host) leaves a game that still plays.
      });
  });
}

/**
 * Tell the player, do not act.
 *
 * The new build is installed and waiting; it takes over the next time the app is
 * opened fresh. Swapping the code out mid-session would mean reloading during a
 * fight, and a surprise reload is worse than running yesterday's build for one
 * more session.
 */
function announceUpdate(): void {
  useNoticeStore.getState().notify({
    id: UPDATE_NOTICE,
    tone: 'warning',
    title: 'Update ready',
    body: 'A new version is installed. Close and reopen TinyDecklings to use it.',
  });
}
