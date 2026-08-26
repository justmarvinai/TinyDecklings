import { useEffect } from 'react';
import { canPop, useScreenStore } from '@/state/screenStore';

/**
 * Maps hardware/browser back to a stack pop.
 *
 * A dummy history entry is kept so the browser has something to pop; without it the
 * first back press would leave the app entirely. Capacitor's Android back button
 * later hooks the same store action (ARCHITECTURE.md AD-4).
 */
export function useBackButton(): void {
  useEffect(() => {
    history.pushState({ tdGuard: true }, '');

    const onPop = () => {
      const state = useScreenStore.getState();
      if (canPop(state)) {
        state.pop();
        history.pushState({ tdGuard: true }, '');
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
