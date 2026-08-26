import { useEffect, useMemo } from 'react';
import { ENERGY_CONFIG } from '@/content';
import {
  activeTab,
  currentEntry,
  currentScreen,
  useScreenStore,
  type TabId,
} from '@/state/screenStore';
import { usePlayerStore } from '@/state/playerStore';
import { TabBar, type TabBarItem } from '@/ui/components/TabBar';
import { TopHud, type HudResource } from '@/ui/components/TopHud';
import { Button } from '@/ui/design/primitives';
import { BattleScreen } from '@/ui/screens/BattleScreen';
import { CardsScreen } from '@/ui/screens/CardsScreen';
import { KitchenSinkScreen } from '@/ui/screens/KitchenSinkScreen';
import { MapScreen } from '@/ui/screens/MapScreen';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { createGameServices } from './gameServices';
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

/** Placeholder for screens that land in later phases, so navigation is walkable now. */
function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className={styles.placeholder}>
      <h1 className={styles.placeholderTitle}>{title}</h1>
      <p className={styles.placeholderBody}>
        This screen is built in {phase}. The shell, design system and content pipeline it stands on
        are in place.
      </p>
    </div>
  );
}

export function App() {
  const services = useMemo(() => createGameServices(), []);
  const stack = useScreenStore((s) => s.stack);
  const switchTab = useScreenStore((s) => s.switchTab);
  const pop = useScreenStore((s) => s.pop);
  const save = usePlayerStore((s) => s.save);

  useBackButton();
  useAutosaveLifecycle(services.saves);
  useGameBootstrap(services);

  // Mobile browsers only allow audio to start from a gesture.
  useEffect(() => {
    const unlock = () => services.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [services]);

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
      // Energy is wired up in Phase 3 (Q14b); until then the slot shows the cap so
      // the HUD matches its final shape.
      key: 'energy',
      icon: 'currency.energy',
      value: `${Math.floor(save.player.energy.current)}/${ENERGY_CONFIG.cap}`,
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

  return (
    <div className={styles.app}>
      {immersive ? null : <TopHud playerLevel={save.player.profile.level} resources={resources} />}

      <main className={styles.content}>
        {screen.kind === 'devKitchenSink' ? (
          <KitchenSinkScreen />
        ) : screen.kind === 'battle' ? (
          <BattleScreen stage={screen.stage} />
        ) : screen.kind === 'map' ? (
          <MapScreen />
        ) : screen.kind === 'cards' ? (
          <CardsScreen />
        ) : screen.kind === 'summon' ? (
          <ComingSoon title="Summon" phase="Phase 3" />
        ) : screen.kind === 'shop' ? (
          <ComingSoon title="Shop" phase="Phase 3" />
        ) : screen.kind === 'settings' || screen.kind === 'more' ? (
          <SettingsScreen />
        ) : (
          <ComingSoon title="Profile" phase="Phase 5" />
        )}

        {canGoBack && screen.kind !== 'battle' ? (
          <Button
            variant="header"
            icon="ui.back"
            iconOnly
            aria-label="Back"
            onClick={pop}
            style={{ position: 'absolute', left: 'var(--space-3)', bottom: 'var(--space-3)' }}
          />
        ) : null}
      </main>

      {immersive ? null : <TabBar items={TAB_ITEMS} value={tab} onChange={switchTab} />}
      {import.meta.env.DEV ? <DevPanel /> : null}
    </div>
  );
}

export { currentScreen };
