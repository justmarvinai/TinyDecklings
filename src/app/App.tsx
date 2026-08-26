import { useEffect, useMemo, useState } from 'react';
import { CONTENT, ENERGY_CONFIG } from '@/content';
import type { SaveDoc } from '@/services/saves';
import {
  activeTab,
  currentEntry,
  currentScreen,
  useScreenStore,
  type TabId,
} from '@/state/screenStore';
import { useSettingsStore } from '@/state/settingsStore';
import { TabBar, type TabBarItem } from '@/ui/components/TabBar';
import { TopHud, type HudResource } from '@/ui/components/TopHud';
import { Button } from '@/ui/design/primitives';
import { KitchenSinkScreen } from '@/ui/screens/KitchenSinkScreen';
import { createGameServices } from './gameServices';
import { useAutosaveLifecycle } from './useAutosaveLifecycle';
import { useBackButton } from './useBackButton';
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
  const [save, setSave] = useState<SaveDoc | null>(null);
  const stack = useScreenStore((s) => s.stack);
  const switchTab = useScreenStore((s) => s.switchTab);
  const pop = useScreenStore((s) => s.pop);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useBackButton();
  useAutosaveLifecycle(services.saves);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Seeded from the clock once, then persisted: the run's randomness is
      // reproducible from the save alone (ARCHITECTURE.md §4).
      const result = await services.saves.load(services.clock.now() >>> 0);
      if (cancelled) return;
      if (result.status === 'corrupt') {
        console.warn(
          `[TinyDecklings] save unreadable, kept a backup at ${result.backupKey}`,
          result.reason,
        );
      }
      hydrateSettings(result.save.settings);
      services.audio.setSettings({
        sfx: result.save.settings.sfx,
        music: result.save.settings.music,
      });
      setSave(result.save);
      if (result.status === 'new') await services.saves.save(result.save);
    })();
    return () => {
      cancelled = true;
    };
  }, [services, hydrateSettings]);

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

  return (
    <div className={styles.app}>
      <TopHud playerLevel={save.player.profile.level} resources={resources} />

      <main className={styles.content}>
        {screen.kind === 'devKitchenSink' ? (
          <KitchenSinkScreen />
        ) : screen.kind === 'map' ? (
          <ComingSoon title="Map" phase="Phase 1" />
        ) : screen.kind === 'cards' ? (
          <ComingSoon title="Cards" phase="Phase 1" />
        ) : screen.kind === 'summon' ? (
          <ComingSoon title="Summon" phase="Phase 3" />
        ) : screen.kind === 'shop' ? (
          <ComingSoon title="Shop" phase="Phase 3" />
        ) : (
          <ComingSoon title="More" phase="Phase 2" />
        )}

        {canGoBack ? (
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

      <TabBar items={TAB_ITEMS} value={tab} onChange={switchTab} />
      {import.meta.env.DEV ? <DevPanel /> : null}
    </div>
  );
}

/** Content validation runs at import time; surface the count once in dev. */
if (import.meta.env.DEV) {
  console.warn(
    `[TinyDecklings] content ok — ${CONTENT.gearSlots.size} gear slots, ${CONTENT.statuses.size} statuses, ${CONTENT.patterns.size} patterns`,
  );
}

export { currentScreen };
