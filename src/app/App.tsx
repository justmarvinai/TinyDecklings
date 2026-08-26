import { Suspense, lazy, useEffect, useState } from 'react';
import { ENERGY_CONFIG } from '@/content';
import {
  activeTab,
  currentEntry,
  currentScreen,
  useScreenStore,
  type TabId,
} from '@/state/screenStore';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { commanderLevel, totalStarsOf } from '@/engine/records/profile';
import { AudioProvider } from '@/ui/audio/AudioProvider';
import { OnboardingCoach } from '@/ui/onboarding/OnboardingCoach';
import { SystemNotices } from '@/ui/components/SystemNotices';
import { TabBar, type TabBarItem } from '@/ui/components/TabBar';
import { TopHud, type HudResource } from '@/ui/components/TopHud';
import { MapScreen } from '@/ui/screens/MapScreen';

/**
 * Screens beyond the map load on demand.
 *
 * Map is the home screen, so it ships in the initial bundle; everything else is a
 * separate chunk fetched the first time the player opens it. That keeps cold start
 * on a mid-range phone about the map and the battle it leads to
 * (ARCHITECTURE.md §9).
 */
const BattleScreen = lazy(() =>
  import('@/ui/screens/BattleScreen').then((m) => ({ default: m.BattleScreen })),
);
const CardsScreen = lazy(() =>
  import('@/ui/screens/CardsScreen').then((m) => ({ default: m.CardsScreen })),
);
const SummonScreen = lazy(() =>
  import('@/ui/screens/SummonScreen').then((m) => ({ default: m.SummonScreen })),
);
const ShopScreen = lazy(() =>
  import('@/ui/screens/ShopScreen').then((m) => ({ default: m.ShopScreen })),
);
const SettingsScreen = lazy(() =>
  import('@/ui/screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const MoreScreen = lazy(() =>
  import('@/ui/screens/MoreScreen').then((m) => ({ default: m.MoreScreen })),
);
const ProfileScreen = lazy(() =>
  import('@/ui/screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const KitchenSinkScreen = lazy(() =>
  import('@/ui/screens/KitchenSinkScreen').then((m) => ({ default: m.KitchenSinkScreen })),
);
import { createGameServices } from './gameServices';
import { useAudioDirector } from './useAudioDirector';
import { useAutosaveLifecycle } from './useAutosaveLifecycle';
import { useBackButton } from './useBackButton';
import { useGameBootstrap } from './useGameBootstrap';
import { DevPanel } from './DevPanel';
import styles from './App.module.css';

const TAB_ITEMS: readonly TabBarItem<TabId>[] = [
  { id: 'map', label: 'Map', icon: 'nav.map' },
  { id: 'cards', label: 'Cards', icon: 'nav.cards' },
  { id: 'summon', label: 'Summon', icon: 'nav.summon' },
  { id: 'shop', label: 'Shop', icon: 'nav.shop' },
  { id: 'more', label: 'More', icon: 'nav.more' },
];

/**
 * Keeps the energy pill current.
 *
 * Regen is derived from the clock rather than ticked, so this only needs to nudge a
 * re-render occasionally — a minute is plenty for a bar that fills every two.
 */
function useEnergyTick() {
  const save = usePlayerStore((s) => s.save);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  void save;
  return useEconomyStore.getState().energy();
}

export function App() {
  // `useState` with an initialiser, not `useMemo`: React guarantees the factory
  // result is kept, where a memo is free to recompute. Creating a second set of
  // services would mean a second AudioContext playing over the first.
  const [services] = useState(() => createGameServices());
  const stack = useScreenStore((s) => s.stack);
  const switchTab = useScreenStore((s) => s.switchTab);
  const pop = useScreenStore((s) => s.pop);
  const push = useScreenStore((s) => s.push);
  const save = usePlayerStore((s) => s.save);
  // Ticks once a minute so the HUD counts down without a per-second timer.
  const energy = useEnergyTick();

  useBackButton();
  useAudioDirector(services.audio);
  useAutosaveLifecycle(services.saves);
  useGameBootstrap(services);

  if (!save) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  const screen = currentEntry({ stack }).screen;
  const tab = activeTab({ stack });
  const canGoBack = stack.length > 1;

  const resources: HudResource[] = [
    {
      key: 'energy',
      icon: 'currency.energy',
      value: `${Math.floor(energy.current)}/${ENERGY_CONFIG.cap}`,
      color: 'var(--accent-info)',
      label: 'Energy',
    },
    {
      key: 'gold',
      icon: 'currency.gold',
      value: String(save.player.currencies.gold ?? 0),
      color: 'var(--accent-warning)',
      label: 'Gold',
    },
    {
      key: 'gems',
      icon: 'currency.gems',
      value: String(save.player.currencies.gems ?? 0),
      color: 'var(--rarity-card-epic)',
      label: 'Gems',
    },
  ];

  // Battle is fullscreen: the reference gives the board the entire viewport, and on
  // a phone the HUD and tab bar are 120px the battlefield needs more.
  const immersive = screen.kind === 'battle';
  // Battles keep their own identity per stage so returning to the map replays the
  // entrance rather than treating it as the same screen.
  const screenKey = screen.kind === 'battle' ? `battle:${screen.stage}` : screen.kind;

  return (
    <AudioProvider audio={services.audio}>
      <div className={styles.app}>
        {immersive ? null : (
          <TopHud
            playerLevel={commanderLevel(totalStarsOf(save))}
            resources={resources}
            onBack={canGoBack ? pop : undefined}
            onAvatarPress={() => push({ kind: 'profile' })}
            onAddPress={() => switchTab('shop')}
          />
        )}

        <SystemNotices />

        <main className={styles.content}>
          {/* Keyed so every navigation remounts the wrapper and replays the entrance. */}
          <div className={styles.screenEnter} key={screenKey}>
            <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
              {screen.kind === 'devKitchenSink' ? (
                <KitchenSinkScreen />
              ) : screen.kind === 'battle' ? (
                <BattleScreen stage={screen.stage} />
              ) : screen.kind === 'map' ? (
                <MapScreen />
              ) : screen.kind === 'cards' ? (
                <CardsScreen />
              ) : screen.kind === 'summon' ? (
                <SummonScreen />
              ) : screen.kind === 'shop' ? (
                <ShopScreen />
              ) : screen.kind === 'more' ? (
                <MoreScreen />
              ) : screen.kind === 'settings' ? (
                <SettingsScreen />
              ) : (
                <ProfileScreen />
              )}
            </Suspense>
          </div>
        </main>

        {immersive ? null : <TabBar items={TAB_ITEMS} value={tab} onChange={switchTab} />}
        <OnboardingCoach />
        {import.meta.env.DEV ? <DevPanel /> : null}
      </div>
    </AudioProvider>
  );
}

export { currentScreen };
