import { useState } from 'react';
import { CONTENT, CONTENT_SOURCE, ENERGY_CONFIG, validateContent } from '@/content';
import { maxStarsForKind } from '@/content/schemas';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
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
  const player = usePlayerStore();
  const economy = useEconomyStore();
  const run = useRunStore();

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
          run: { seed: run.seed, currentStage: run.currentStage },
          energy: economy.energy(),
          collection: player.cards().length,
          gear: player.gear().length,
          gold: player.currency('gold'),
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
        <div className={styles.groupTitle}>Grant</div>
        <div className={styles.row}>
          <Button variant="warning" onClick={() => player.addCurrency('gold', 10_000)}>
            +10k gold
          </Button>
          <Button variant="warning" onClick={() => player.addCurrency('gems', 500)}>
            +500 gems
          </Button>
          <Button variant="info" onClick={() => player.grantStarterCollection()}>
            Starter cards
          </Button>
          <Button
            variant="info"
            onClick={() => {
              // Enough duplicates to actually exercise ascension.
              for (let i = 0; i < 4; i++) player.grantStarterCollection();
              player.addCurrency('tome', 50);
            }}
          >
            Fodder + tomes
          </Button>
          <Button
            variant="info"
            onClick={() => {
              // One item per slot so every gear surface can be exercised.
              const seen = new Set<string>();
              for (const def of CONTENT.gear.values()) {
                if (seen.has(def.slot)) continue;
                seen.add(def.slot);
                player.grantGear({ defId: def.id, substats: [] });
              }
            }}
          >
            Gear set
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              player.addCurrency('token_unit_t1', 30);
              player.addCurrency('token_unit_t2', 30);
              player.addCurrency('token_unit_t3', 30);
              player.addCurrency('token_hero', 30);
              player.addCurrency('fragment', 3000);
            }}
          >
            Summon tokens
          </Button>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Jump to stage</div>
        <div className={styles.row}>
          {[1, 3, 5, 6, 10, 15, 20, 25, 30, 33].map((stage) => (
            <Button
              key={stage}
              variant="neutral"
              onClick={() => {
                // Unlock everything up to here so the stage is actually enterable.
                for (let n = 1; n < stage; n++) player.recordStage(n, 1);
                run.advanceTo(stage);
                screen.switchTab('map');
              }}
            >
              {stage}
              {stage % 10 === 0 ? '★' : ''}
            </Button>
          ))}
        </div>
        <div className={styles.row}>
          <Button
            variant="warning"
            onClick={() => {
              // Full marks across the authored road, so region chests unlock —
              // and only what each node kind can actually award (Q17).
              for (let n = 1; n <= 30; n++) {
                player.recordStage(n, maxStarsForKind(run.stage(n).kind));
              }
              run.refreshWindow();
              screen.switchTab('map');
            }}
          >
            3★ every stage
          </Button>
          <Button
            variant="neutral"
            onClick={() => {
              const span = run.forkAt(run.currentStage) ?? run.forkAt(6);
              if (span) run.chooseBranch(span.start, run.branchFor(span.start) === 'a' ? 'b' : 'a');
            }}
          >
            Flip fork
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

      <div className={styles.group}>
        <div className={styles.groupTitle}>Energy</div>
        <div className={styles.row}>
          <Button variant="info" onClick={() => economy.grantEnergy(30)}>
            +30 energy
          </Button>
          <Button variant="neutral" onClick={() => economy.grantEnergy(-economy.energy().current)}>
            Drain energy
          </Button>
        </div>
      </div>
    </div>
  );
}
