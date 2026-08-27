import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONTENT } from '@/content';
import { ELEMENT_AFFINITY_PERCENT, elementIconKey, type ElementId } from '@/content/schemas';
import { elementLabel } from '@/ui/text/labels';
import {
  BOARD_SLOTS,
  effectiveAttack,
  type BattleCard,
  type BattleEvent,
  type Intent,
} from '@/engine/battle';
import type { RewardBundle } from '@/engine/economy/rewards';
import { useBattleStore } from '@/state/battleStore';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { useEconomyStore } from '@/state/economyStore';
import { ENERGY_CONFIG } from '@/content';
import { useScreenStore } from '@/state/screenStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Button, IconChip, Modal, StarRow, useHoldTip } from '@/ui/design/primitives';
import { BattleCardFrame, EmptySlot } from '@/ui/components/CardFrame';
import { CardTip, InfoTip, SkillTip } from '@/ui/components/Tips';
import { RewardList } from '@/ui/components/RewardList';
import { BattleFx, type BattleFxHandle } from '@/ui/fx/BattleFx';
import { useScreenShake } from '@/ui/fx/useScreenShake';
import { useSfx } from '@/ui/audio/audioContext';
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

  const sfx = useSfx();
  const { ref: shakeRef, shake } = useScreenShake<HTMLDivElement>();
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

  /**
   * Fight it again without walking back to the map.
   *
   * Losing sent the player to the map to scroll for the stage they were just on
   * and open it again — three taps to do the thing they had already decided to do.
   *
   * It charges energy exactly as entering from the map does, because that is what
   * it replaces: a retry is a convenience, not a discount, and a free rematch would
   * quietly undo the pacing the energy system exists to set (Q14b).
   */
  const kind = useRunStore((s) => s.window).find((w) => w.number === stage)?.kind ?? 'battle';
  const energyCost = ENERGY_CONFIG.costs[kind] ?? 0;
  // Subscribed to the save, not to `canEnterStage` — the energy the store reports is
  // derived from it, and a selector that recomputes would re-render forever
  // (CLAUDE.md). This un-greys the button as energy regenerates under the sheet.
  const playerSave = usePlayerStore((s) => s.save);
  const canRetry = useMemo(() => {
    void playerSave;
    return useEconomyStore.getState().canEnterStage(kind);
  }, [playerSave, kind]);
  const retry = useCallback(() => {
    if (!useEconomyStore.getState().spendForStage(kind)) return;
    const setup = buildSetup(stage);
    if (!setup) return;
    battle.start(setup);
    setSelectedSkill(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, stage]);

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
            sfx('battle.skill');
            setEffectOn({ uid: event.actorUid, kind: 'lunge' });
            await wait(BEAT.skill);
            setEffectOn(null);
            break;
          }
          case 'damageDealt': {
            const at = centerOf(event.targetUid);
            // "Heavy" is relative to the target: a hit that takes a quarter of what
            // it has left lands differently from a scratch, and should sound and
            // shake like it.
            const target = state?.cards[event.targetUid];
            const heavy = target ? event.amount >= target.maxHp * 0.22 : false;
            sfx(event.amount > 0 ? (heavy ? 'battle.heavyHit' : 'battle.hit') : 'ui.error');
            if (heavy && event.amount > 0) shake(0.6);

            if (at) {
              fxRef.current?.burst(at.x, at.y, '#ff6a4a', heavy ? 18 : 10);
              if (event.amount > 0) {
                fxRef.current?.float(at.x, at.y, `-${event.amount}`, '#ff5347', heavy);
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
            sfx('battle.death');
            shake(0.5);
            if (at) fxRef.current?.burst(at.x, at.y, '#b9b4c2', 22);
            await wait(BEAT.death);
            break;
          }
          case 'cardDeployed': {
            const at = centerOf(event.uid);
            sfx('battle.deploy');
            if (at) fxRef.current?.burst(at.x, at.y, '#ffc21c', 10);
            await wait(BEAT.turn);
            break;
          }
          case 'battleEnded': {
            sfx(event.outcome === 'victory' ? 'battle.victory' : 'battle.defeat');
            if (event.outcome === 'victory') shake(0.35);
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
    [centerOf, speed, sfx, shake, state],
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
              <InspectableCard
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
    <div className={styles.screen} ref={shakeRef}>
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
          <Button
            variant={auto ? 'warning' : 'neutral'}
            data-coach="auto"
            onClick={() => battle.setAuto(!auto)}
          >
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

      <StageBanner stage={stage} />

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
          {(activeCard?.skills ?? []).map((skill, index) => (
            <SkillButton
              key={skill.skillId + index}
              skillId={skill.skillId}
              cooldownRemaining={skill.cooldownRemaining}
              usable={skill.cooldownRemaining === 0 && !animating && !auto}
              armed={selectedSkill === index}
              onPick={() => setSelectedSkill((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>

      {result ? (
        <ResultSheet
          victory={result.outcome === 'victory'}
          stars={result.stars}
          rewards={result.rewards}
          onClose={pop}
          retry={retry}
          energyCost={energyCost}
          canRetry={canRetry}
        />
      ) : null}
    </div>
  );
}

/**
 * The ground the fight is on, with what that means a press away.
 *
 * Same sentence the stage sheet used before the player spent the energy; the point
 * of repeating it here is that mid-fight is when it starts mattering.
 */
function ElementTag({ element }: { element: ElementId }) {
  const { bind, tip } = useHoldTip(
    <InfoTip
      icon={elementIconKey(element)}
      title={`${elementLabel(element)} ground`}
      body={`Cards that counter ${elementLabel(element)} attack ${ELEMENT_AFFINITY_PERCENT}% harder here. It applies to both sides.`}
    />,
  );
  return (
    <>
      <span className={styles.stageTag} role="note" {...bind}>
        <IconChip name={elementIconKey(element)} size={18} />
        {elementLabel(element)}
      </span>
      {tip}
    </>
  );
}

/**
 * A stage modifier, with what it does a press away.
 *
 * These change how the fight works and used to carry a `title` attribute, which on
 * a phone is a tooltip nobody can ever open. Holding the chip reads it.
 */
function ModifierTag({ modifierId }: { modifierId: string }) {
  const def = CONTENT.stageModifiers.get(modifierId);
  const { bind, tip } = useHoldTip(
    def ? <InfoTip icon={def.iconKey} title={def.name} body={def.description} /> : null,
  );
  if (!def) return null;
  return (
    <>
      <span
        className={styles.stageTag}
        role="note"
        aria-label={`${def.name}. ${def.description}`}
        {...bind}
      >
        <IconChip name={def.iconKey} size={18} background="var(--accent-danger)" />
        {def.name}
      </span>
      {tip}
    </>
  );
}

/**
 * One spell, with what it does a press away.
 *
 * A skill button is an icon and a cooldown number; nothing on screen said what it
 * would actually do, and finding out cost a trip out of the fight. Holding it reads
 * the authored description.
 */
function SkillButton({
  skillId,
  cooldownRemaining,
  usable,
  armed,
  onPick,
}: {
  skillId: string;
  cooldownRemaining: number;
  usable: boolean;
  armed: boolean;
  onPick: () => void;
}) {
  const def = CONTENT.skills.get(skillId);
  const { bind, tip } = useHoldTip(
    def ? <SkillTip skillId={skillId} cooldownRemaining={cooldownRemaining} /> : null,
  );
  if (!def) return null;
  return (
    <>
      <Button
        variant={armed ? 'warning' : 'info'}
        className={styles.skillButton}
        disabled={!usable}
        locked={!usable && cooldownRemaining > 0}
        lockHint={cooldownRemaining > 0 ? `${cooldownRemaining}` : undefined}
        icon={def.iconKey}
        onClick={onPick}
        // Spread rather than passed as a prop: these are ordinary DOM handlers and
        // Button forwards anything it does not consume.
        {...bind}
        aria-label={`${def.name}. ${def.description}${cooldownRemaining > 0 ? ` Ready in ${cooldownRemaining} rounds.` : ' Ready.'}`}
      />
      {tip}
    </>
  );
}

/**
 * A card on the board that answers questions about itself.
 *
 * Its own component because each card needs its own hold state, and a hook cannot
 * live inside the slot loop. The handlers go on the frame rather than the cell so
 * the whole card is the target, and `useHoldTip` swallows the click that follows a
 * hold — inspecting an enemy must never also swing at it.
 */
function InspectableCard({
  card,
  acting,
  targetable,
  onClick,
}: {
  card: BattleCard;
  acting: boolean;
  targetable: boolean;
  onClick?: () => void;
}) {
  const def = CONTENT.cards.get(card.defId);
  const active = card.statuses.map((s) => ({
    id: s.id,
    remaining: s.remaining,
    stacks: s.stacks,
  }));
  const { bind, tip } = useHoldTip(
    <CardTip
      name={card.name}
      rarity={def?.rarity ?? 'common'}
      attackType={card.attackType}
      attack={effectiveAttack(card)}
      hp={card.hp}
      maxHp={card.maxHp}
      speed={card.speed}
      level={card.level}
      statuses={active}
      compactSkills
      skills={card.skills.map((s) => ({
        skillId: s.skillId,
        cooldownRemaining: s.cooldownRemaining,
      }))}
    />,
  );

  return (
    <>
      <BattleCardFrame
        card={card}
        acting={acting}
        targetable={targetable}
        onClick={onClick}
        bind={bind}
      />
      {tip}
    </>
  );
}

/**
 * What this stage brought to the fight, kept on screen while it is being fought.
 *
 * The stage sheet already promised these before the player spent energy; this is
 * the reminder mid-fight of why the enemies are hitting the way they are.
 */
function StageBanner({ stage }: { stage: number }) {
  // Subscribe to the window, not to `stage()` — that helper builds a fresh object
  // for anything outside the window and would re-render forever (CLAUDE.md).
  const window_ = useRunStore((s) => s.window);
  const generated = useMemo(
    () => window_.find((s) => s.number === stage) ?? useRunStore.getState().stage(stage),
    [window_, stage],
  );
  const modifiers = useMemo(
    () =>
      generated.modifiers
        .map((id) => CONTENT.stageModifiers.get(id))
        .filter((def): def is NonNullable<typeof def> => def !== undefined),
    [generated],
  );

  if (modifiers.length === 0 && !generated.elementBias) return null;

  return (
    <div className={styles.stageBanner}>
      {generated.elementBias ? <ElementTag element={generated.elementBias} /> : null}
      {modifiers.map((def) => (
        <ModifierTag key={def.id} modifierId={def.id} />
      ))}
    </div>
  );
}

function ResultSheet({
  victory,
  stars,
  rewards,
  onClose,
  retry,
  energyCost,
  canRetry,
}: {
  victory: boolean;
  stars: 0 | 1 | 2 | 3;
  rewards: RewardBundle;
  onClose: () => void;
  /** Restarts the same fight in place. */
  retry: () => void;
  /** What another attempt costs, and whether it can be paid for right now. */
  energyCost: number;
  canRetry: boolean;
}) {
  return (
    <Modal title={victory ? 'Victory' : 'Defeat'} onClose={onClose}>
      <div className={styles.resultBody}>
        <h2 className={`${styles.resultTitle} ${victory ? styles.victory : styles.defeat}`}>
          {victory ? 'Victory!' : 'Defeated'}
        </h2>

        {victory ? <StarRow value={stars} max={3} size={30} /> : null}

        {victory ? (
          <RewardList rewards={rewards} />
        ) : (
          <p className="u-prose">
            Your cards were beaten back. Nothing was lost — level up, equip what you have found, or
            go straight back in.
          </p>
        )}

        {victory ? null : (
          <Button
            variant="warning"
            block
            disabled={!canRetry}
            onClick={retry}
            aria-label={
              canRetry
                ? `Try again for ${energyCost} energy`
                : `Not enough energy to try again — it costs ${energyCost}`
            }
          >
            <span className={styles.retryLabel}>
              Try again
              <span className={styles.retryCost}>
                <IconChip name="currency.energy" size={18} />
                {energyCost}
              </span>
            </span>
          </Button>
        )}

        <Button variant={victory ? 'positive' : 'neutral'} block onClick={onClose}>
          {victory ? 'Continue' : 'Back to map'}
        </Button>
      </div>
    </Modal>
  );
}
