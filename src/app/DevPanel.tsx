import { useState } from 'react';
import { CONTENT_SOURCE, ENERGY_CONFIG, validateContent } from '@/content';
import { useScreenStore, type TabId } from '@/state/screenStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Button } from '@/ui/design/primitives';
import styles from './DevPanel.module.css';

const TABS: readonly TabId[] = ['map', 'cards', 'summon', 'shop', 'more'];

/**
 * Developer tools — dev builds only (ARCHITECTURE.md §10).
 *
 * Tree-shaken out of production by the `import.meta.env.DEV` guard at the call site,
 * so none of this ships to players.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [output, setOutput] = useState<{ ok: boolean; text: string } | null>(null);
  const screen = useScreenStore();
  const settings = useSettingsStore();

  if (!open) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Open dev panel"
      >
        DEV
      </button>
    );
  }

  const runValidation = () => {
    const result = validateContent(CONTENT_SOURCE);
    setOutput(
      result.ok
        ? { ok: true, text: 'Content valid — all schemas and references check out.' }
        : {
            ok: false,
            text: `${result.problems.length} problem(s):\n- ${result.problems.join('\n- ')}`,
          },
    );
  };

  const describeState = () => {
    setOutput({
      ok: true,
      text: JSON.stringify(
        {
          stack: screen.stack.map((e) => e.screen.kind),
          settings: settings.toSave(),
          energyConfig: ENERGY_CONFIG,
        },
        null,
        2,
      ),
    });
  };

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <span className={styles.title}>Dev panel</span>
        <Button
          variant="danger"
          icon="ui.close"
          iconOnly
          aria-label="Close dev panel"
          onClick={() => setOpen(false)}
        />
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Navigate</div>
        <div className={styles.row}>
          {TABS.map((tab) => (
            <Button key={tab} variant="info" onClick={() => screen.switchTab(tab)}>
              {tab}
            </Button>
          ))}
          <Button variant="header" onClick={() => screen.push({ kind: 'devKitchenSink' })}>
            Kitchen sink
          </Button>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Settings</div>
        <div className={styles.row}>
          <Button
            variant="neutral"
            onClick={() => settings.setBattleSpeed(settings.battleSpeed === 1 ? 2 : 1)}
          >
            Speed x{settings.battleSpeed}
          </Button>
          <Button
            variant="neutral"
            onClick={() => settings.setReducedMotion(!settings.reducedMotion)}
          >
            Motion: {settings.reducedMotion ? 'reduced' : 'full'}
          </Button>
          <Button variant="neutral" onClick={() => settings.setSfx(!settings.sfx)}>
            SFX: {settings.sfx ? 'on' : 'off'}
          </Button>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Diagnostics</div>
        <div className={styles.row}>
          <Button variant="positive" onClick={runValidation}>
            Validate content
          </Button>
          <Button variant="info" onClick={describeState}>
            Dump state
          </Button>
        </div>
        {output ? (
          <pre className={`${styles.output} ${output.ok ? styles.ok : styles.bad}`}>
            {output.text}
          </pre>
        ) : null}
      </div>

      <p className={styles.groupTitle}>
        Currency, energy and stage-jump controls arrive with the systems they drive (Phases 1 and
        3).
      </p>
    </div>
  );
}
