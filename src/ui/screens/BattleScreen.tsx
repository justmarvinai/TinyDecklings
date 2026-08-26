import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CONTENT } from '@/content';
import { BOARD_SLOTS, type BattleCard, type BattleEvent, type Intent } from '@/engine/battle';
import type { RewardBundle } from '@/engine/economy/rewards';
import { useBattleStore } from '@/state/battleStore';
import { usePlayerStore } from '@/state/playerStore';
import { useScreenStore } from '@/state/screenStore';
import { useSettingsStore } from '@/state/settingsStore';
import { gearRarityColor } from '@/ui/design/rarity';
import { Button, IconChip, Modal, StarRow } from '@/ui/design/primitives';
import { GearSlotIcon } from '@/ui/icons/Icon';
import { BattleCardFrame, EmptySlot } from '@/ui/components/CardFrame';
import { BattleFx, type BattleFxHandle } from '@/ui/fx/BattleFx';
import { useBattleSetupFactory } from './useBattleSetup';
import styles from './BattleScreen.module.css';

/** How long the UI lingers per event class, before the speed multiplier. */
const BEAT = { attack: 340, damage: 120, death: 300, skill: 420, turn: 260 } as const;

export function BattleScreen({ stage }: { stage: number }) {
  const battle = useBattleStore();
  const state = useBattleStore((s) => s.state);
  const auto = useBattleStore((s) => s.auto);
  const speed = useSettingsStore((s) => s.battleSpeed);
  const pop = useScreenStore((s) => s.pop);

  const fxRef = useRef<BattleFxHandle>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [animating, setAnimating] = useState(false);
  const [effectOn, setEffectOn] = useState<{ uid: string; kind: 'lunge' | 'hit' } | null>(null);
  /** Index of the armed skill, or null when a tap means a basic attack. */
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const result = useBattleStore((s) => s.result);

  const buildSetup = useBattleSetupFactory();

  /**
   * Start the fight once, when the screen opens — or resume one the player was in
   * the middle of when the app was killed (task 1.17).
   *
   * Keyed on the stage alone: the roster is snapshotted inside `buildSetup`, so
   * banking victory rewards cannot retrigger this and restart the battle.
   */
  useEffect(() => {
    const setup = buildSetup(stage);
    if (!setup) return;

    const pending = usePlayerStore.getState().save?.run.pendingBattle;
    if (pending && pending.stage === stage && pending.intentLog.length > 0) {
      battle.resume(
        { ...setup, seed: pending.seed, attempt: pending.attempt },
        pending.intentLog as Intent[],
      );
    } else {
      battle.start(setup);
    }
    return () => battle.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const centerOf = useCallback((uid: string) => {
    const el = slotRefs.current[uid];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  /** Plays the engine's event log as animation, one beat at a time. */
  const playEvents = useCallback(
    async (events: BattleEvent[]) => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms / speed));

      for (const event of events) {
        switch (event.kind) {
          case 'attackDeclared': {
            setEffectOn({ uid: event.actorUid, kind: 'lunge' });
            await wait(BEAT.attack);
            setEffectOn(null);
            break;
          }
          case 'skillCast': {
            setEffectOn({ uid: event.actorUid, kind: 'lunge' });
            await wait(BEAT.skill);
            setEffectOn(null);
            break;
          }
          case 'damageDealt': {
            const at = centerOf(event.targetUid);
            if (at) {
              fxRef.current?.burst(at.x, at.y, '#ff6a4a', 10);
              if (event.amount > 0) {
                fxRef.current?.float(at.x, at.y, `-${event.amount}`, '#ff5347');
              } else if (event.absorbed > 0) {
                fxRef.current?.float(at.x, at.y, 'BLOCK', '#4fb4ff');
              }
            }
            setEffectOn({ uid: event.targetUid, kind: 'hit' });
            await wait(BEAT.damage);
            setEffectOn(null);
            break;
          }
          case 'healed': {
            const at = centerOf(event.targetUid);
            if (at && event.amount > 0)
              fxRef.current?.float(at.x, at.y, `+${event.amount}`, '#5fe01d');
            await wait(BEAT.damage);
            break;
          }
          case 'shieldGained': {
            const at = centerOf(event.targetUid);
            if (at) fxRef.current?.burst(at.x, at.y, '#4fb4ff', 8);
            break;
          }
          case 'cardDied': {
            const at = centerOf(event.uid);
            if (at) fxRef.current?.burst(at.x, at.y, '#b9b4c2', 22);
            await wait(BEAT.death);
            break;
          }
          case 'cardDeployed': {
            const at = centerOf(event.uid);
            if (at) fxRef.current?.burst(at.x, at.y, '#ffc21c', 10);
            await wait(BEAT.turn);
            break;
          }
          case 'turnStarted':
          case 'roundStarted':
            await wait(BEAT.turn);
            break;
          default:
            break;
        }
      }
    },
    [centerOf, speed],
  );

  /**
   * The pump: drain any queued events, animate them, then let the AI move.
   *
   * The lock is a ref rather than state on purpose — an effect that re-runs when
   * its own `animating` flag flips would cancel the very animation it started,
   * and the fight would sit there forever.
   */
  const busy = useRef(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!state || busy.current) return;

    const events = battle.consumeEvents();
    const wantsAi = state.outcome === 'ongoing' && (state.turn === 'enemy' || auto);

    if (events.length === 0) {
      if (state.outcome !== 'ongoing') {
        battle.finish();
        return;
      }
      if (!wantsAi) return;
    }

    busy.current = true;

    void (async () => {
      setAnimating(true);
      if (events.length > 0) {
        await playEvents(events);
      } else {
        await new Promise((r) => setTimeout(r, 240 / speed));
        battle.stepAi();
      }
      busy.current = false;
      setAnimating(false);
      setPulse((p) => p + 1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, auto, speed, pulse]);

  const active = state ? state.order[0] : undefined;
  const activeCard = active && state ? state.cards[active] : null;
  const legalTargets = useMemo(
    () =>
      activeCard && !animating && state?.turn === 'player' && !auto
        ? battle.targetsFor(activeCard.uid)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCard?.uid, animating, state?.turn, auto],
  );

  if (!state) {
    return <div className={styles.screen} />;
  }

  const bySlot = (side: 'player' | 'enemy') => {
    const slots: (BattleCard | null)[] = Array.from({ length: BOARD_SLOTS }, () => null);
    for (const card of Object.values(state.cards)) {
      if (card.side === side && card.alive && card.slot !== null) slots[card.slot] = card;
    }
    return slots;
  };

  const armedSkill = selectedSkill !== null ? activeCard?.skills[selectedSkill] : undefined;
  const armedSkillDef = armedSkill ? CONTENT.skills.get(armedSkill.skillId) : undefined;

  const onTarget = (uid: string) => {
    if (!legalTargets.includes(uid)) return;
    if (selectedSkill !== null && armedSkill?.cooldownRemaining === 0) {
      battle.submit({ kind: 'skill', skillIndex: selectedSkill, targetUid: uid });
    } else {
      battle.submit({ kind: 'attack', targetUid: uid });
    }
    setSelectedSkill(null);
  };

  const renderSide = (side: 'player' | 'enemy') => (
    <div className={styles.side}>
      <div className={`${styles.grid} ${side === 'player' ? styles.playerGrid : ''}`}>
        {bySlot(side).map((card, slot) => (
          <div
            key={`${side}-${slot}`}
            ref={(el) => {
              if (card) slotRefs.current[card.uid] = el;
            }}
            className={[
              styles.cell,
              card && effectOn?.uid === card.uid
                ? effectOn.kind === 'hit'
                  ? styles.hitShake
                  : side === 'player'
                    ? styles.lungeUp
                    : styles.lungeDown
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {card ? (
              <BattleCardFrame
                card={card}
                acting={card.uid === activeCard?.uid}
                targetable={legalTargets.includes(card.uid)}
                onClick={legalTargets.includes(card.uid) ? () => onTarget(card.uid) : undefined}
              />
            ) : (
              <EmptySlot />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.screen}>
      <BattleFx handleRef={fxRef} />

      <div className={styles.controls}>
        <div className={styles.counters}>
          <span className={styles.counter}>{state.queue.enemy.length}</span>
        </div>
        <div className={styles.buttons}>
          <Button
            variant="neutral"
            onClick={() => useSettingsStore.getState().setBattleSpeed(speed === 1 ? 2 : 1)}
          >
            x{speed}
          </Button>
          <Button variant={auto ? 'warning' : 'neutral'} onClick={() => battle.setAuto(!auto)}>
            Auto
          </Button>
          <Button
            variant="danger"
            iconOnly
            icon="ui.close"
            aria-label="Surrender"
            onClick={() => battle.submit({ kind: 'surrender' })}
          />
        </div>
      </div>

      {renderSide('enemy')}

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={`${styles.turnPill} ${state.turn === 'enemy' ? styles.enemyTurn : ''}`}>
          {state.outcome !== 'ongoing'
            ? 'Over'
            : state.turn === 'player'
              ? 'Your turn'
              : 'Enemy turn'}
        </span>
      </div>

      {renderSide('player')}

      <div className={styles.prompt}>
        {state.outcome !== 'ongoing'
          ? ''
          : animating
            ? ''
            : auto
              ? 'Auto battling…'
              : state.turn === 'player' && activeCard
                ? armedSkillDef
                  ? `Pick a target for ${armedSkillDef.name}`
                  : `${activeCard.name} — pick a target`
                : ''}
      </div>

      <div className={styles.actionBar}>
        <div className={styles.counters}>
          <span className={styles.counter}>{state.queue.player.length}</span>
        </div>
        <div className={styles.skillRow}>
          {(activeCard?.skills ?? []).map((skill, index) => {
            const skillDef = CONTENT.skills.get(skill.skillId);
            if (!skillDef) return null;
            const ready = skill.cooldownRemaining === 0 && !animating && !auto;
            const armed = selectedSkill === index;
            return (
              <Button
                key={skill.skillId + index}
                variant={armed ? 'warning' : 'info'}
                className={styles.skillButton}
                disabled={!ready}
                locked={!ready && skill.cooldownRemaining > 0}
                lockHint={skill.cooldownRemaining > 0 ? `${skill.cooldownRemaining}` : undefined}
                icon={skillDef.iconKey}
                onClick={() => setSelectedSkill((current) => (current === index ? null : index))}
                aria-label={`${skillDef.name}${skill.cooldownRemaining > 0 ? `, ready in ${skill.cooldownRemaining} rounds` : ', ready'}`}
              />
            );
          })}
        </div>
      </div>

      {result ? (
        <ResultSheet
          victory={result.outcome === 'victory'}
          stars={result.stars}
          rewards={result.rewards}
          onClose={pop}
        />
      ) : null}
    </div>
  );
}

function ResultSheet({
  victory,
  stars,
  rewards,
  onClose,
}: {
  victory: boolean;
  stars: 0 | 1 | 2 | 3;
  rewards: RewardBundle;
  onClose: () => void;
}) {
  return (
    <Modal title={victory ? 'Victory' : 'Defeat'} onClose={onClose}>
      <div className={styles.resultBody}>
        <h2 className={`${styles.resultTitle} ${victory ? styles.victory : styles.defeat}`}>
          {victory ? 'Victory!' : 'Defeated'}
        </h2>

        {victory ? <StarRow value={stars} max={3} size={30} /> : null}

        {victory ? (
          <div className={styles.rewardList}>
            {Object.entries(rewards.currencies).map(([currency, amount]) => (
              <div key={currency} className={styles.rewardRow}>
                <IconChip
                  name={
                    currency === 'gold'
                      ? 'currency.gold'
                      : currency === 'gems'
                        ? 'currency.gems'
                        : 'currency.token'
                  }
                  size={26}
                />
                <span>{currency.replace('_', ' ')}</span>
                <span className={styles.rewardValue}>+{amount}</span>
              </div>
            ))}
            {rewards.cardXp > 0 ? (
              <div className={styles.rewardRow}>
                <IconChip name="stat.power" size={26} />
                <span>Card XP</span>
                <span className={styles.rewardValue}>+{rewards.cardXp}</span>
              </div>
            ) : null}
            {rewards.gear.map((drop, i) => {
              const def = CONTENT.gear.get(drop.defId);
              if (!def) return null;
              return (
                <div key={i} className={styles.rewardRow}>
                  <span
                    className={styles.gearTile}
                    style={{ '--tile': gearRarityColor(def.rarity) } as CSSProperties}
                  >
                    <GearSlotIcon slot={def.slot} size={24} />
                  </span>
                  <span className={styles.gearRow}>{def.name}</span>
                  <StarRow value={def.stars} max={5} size={11} className={styles.rewardValue} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="u-prose">
            Your cards were beaten back. Nothing was lost — level up, equip what you have found, and
            try again.
          </p>
        )}

        <Button variant="positive" block onClick={onClose}>
          {victory ? 'Continue' : 'Back to map'}
        </Button>
      </div>
    </Modal>
  );
}
