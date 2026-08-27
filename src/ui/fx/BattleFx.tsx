/**
 * The battle effects layer.
 *
 * One absolutely-positioned canvas over the DOM battlefield (TECH_STACK.md AD-1):
 * DOM handles the cards, text and layout it is good at; the canvas handles the
 * impacts and floating numbers it is good at. Particles are pooled and the loop
 * stops itself when nothing is on screen, so an idle battle costs nothing.
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { useReducedMotion } from './useReducedMotion';
import styles from './BattleFx.module.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  /** Sparks are streaks along their own velocity; embers stay round. */
  streak: boolean;
  gravity: number;
}

/** An expanding ring — the shape an impact makes that a cloud of dots cannot. */
interface Shockwave {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  width: number;
}

/** A shot crossing the board, so a ranged attack is something you can watch. */
interface Projectile {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  life: number;
  maxLife: number;
  color: string;
  /** Trailing positions, drawn as a fading tail. */
  trail: { x: number; y: number }[];
}

interface FloatingNumber {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

export interface BattleFxHandle {
  /** A burst at a screen point — impacts, deaths, deploys. */
  burst: (x: number, y: number, color: string, count?: number, force?: number) => void;
  /** Rising damage/heal number. */
  float: (x: number, y: number, text: string, color: string, big?: boolean) => void;
  /** An expanding ring: the weight of an impact, at a glance. */
  shockwave: (x: number, y: number, color: string, force?: number) => void;
  /** A shot travelling from one card to another; resolves when it lands. */
  shoot: (
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    ms: number,
  ) => Promise<void>;
  /** A directional spray, for a blade landing rather than a bomb going off. */
  spray: (x: number, y: number, angle: number, color: string, count?: number) => void;
}

export function BattleFx({ handleRef }: { handleRef: Ref<BattleFxHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /*
   * Read through a ref, not the closure: the handle is imperative and is called
   * from a playback loop that started several rounds ago, so it has to see the
   * preference as it is now rather than as it was when the fight opened. Every
   * call site is an effect or a timer, so a commit-time sync is always in front
   * of the next read.
   */
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  /* Shots that resolve on a timer instead of flying; cancelled on unmount. */
  const timers = useRef<Set<number>>(new Set());
  const particles = useRef<Particle[]>([]);
  const numbers = useRef<FloatingNumber[]>([]);
  const waves = useRef<Shockwave[]>([]);
  const shots = useRef<Projectile[]>([]);
  const landed = useRef<Map<Projectile, () => void>>(new Map());
  const raf = useRef<number | null>(null);

  function start() {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(tick);
  }

  function tick() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      raf.current = null;
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Rings first: they read as the ground under everything else.
    waves.current = waves.current.filter((w) => {
      w.life++;
      const t = w.life / w.maxLife;
      if (t >= 1) return false;
      // Fast out, then settle — an impact expands hard and stops.
      const eased = 1 - Math.pow(1 - t, 3);
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.width * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius * eased, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    shots.current = shots.current.filter((s) => {
      s.life++;
      const t = Math.min(1, s.life / s.maxLife);
      // A shallow arc, so a shot travels rather than slides.
      const arc = Math.sin(t * Math.PI) * 26;
      s.x = s.fromX + (s.toX - s.fromX) * t;
      s.y = s.fromY + (s.toY - s.fromY) * t - arc;
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 9) s.trail.shift();

      for (let i = 0; i < s.trail.length; i++) {
        const point = s.trail[i];
        ctx.globalAlpha = (i / s.trail.length) * 0.75;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2 + (i / s.trail.length) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (t >= 1) {
        landed.current.get(s)?.();
        landed.current.delete(s);
        return false;
      }
      return true;
    });

    particles.current = particles.current.filter((p) => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      const alpha = 1 - p.life / p.maxLife;
      if (alpha <= 0) return false;
      ctx.globalAlpha = alpha;
      if (p.streak) {
        // Drawn along its own heading, so fast sparks look fast.
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    });

    ctx.textAlign = 'center';
    numbers.current = numbers.current.filter((n) => {
      n.life++;
      n.y += n.vy;
      n.vy *= 0.97;
      const alpha = 1 - Math.max(0, (n.life - n.maxLife * 0.6) / (n.maxLife * 0.4));
      if (n.life >= n.maxLife) return false;
      // Overshoot and settle — a number that lands rather than appears. The
      // damage itself is information, so it is drawn either way; only the bounce
      // is dropped when motion is calmed.
      const pop =
        n.life < 10 && !reducedRef.current ? 1 + Math.sin((n.life / 10) * Math.PI) * 0.35 : 1;
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${n.size * pop}px Saira, system-ui, sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
      return true;
    });

    ctx.globalAlpha = 1;

    if (
      particles.current.length === 0 &&
      numbers.current.length === 0 &&
      waves.current.length === 0 &&
      shots.current.length === 0
    ) {
      raf.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  useImperativeHandle(handleRef, () => ({
    burst(x, y, color, count = 12, force = 1) {
      const canvas = canvasRef.current;
      if (!canvas || reducedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = (1.8 + Math.random() * 3.4) * force;
        // Roughly a third fly as sparks; the rest fall as embers. Mixing the two
        // is what stops a burst reading as a single puff of identical dots.
        const streak = i % 3 === 0;
        particles.current.push({
          x: x - rect.left,
          y: y - rect.top,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          life: 0,
          maxLife: 26 + Math.random() * 18,
          size: streak ? 1.6 + Math.random() * 1.8 : 2.2 + Math.random() * 3.4,
          color,
          streak,
          gravity: streak ? 0.1 : 0.2,
        });
      }
      start();
    },
    spray(x, y, angle, color, count = 10) {
      const canvas = canvasRef.current;
      if (!canvas || reducedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        // A cone along the blow, not a sphere: a strike throws debris forward.
        const spread = angle + (Math.random() - 0.5) * 1.1;
        const speed = 3 + Math.random() * 5;
        particles.current.push({
          x: x - rect.left,
          y: y - rect.top,
          vx: Math.cos(spread) * speed,
          vy: Math.sin(spread) * speed,
          life: 0,
          maxLife: 20 + Math.random() * 14,
          size: 1.6 + Math.random() * 2.4,
          color,
          streak: true,
          gravity: 0.14,
        });
      }
      start();
    },
    shockwave(x, y, color, force = 1) {
      const canvas = canvasRef.current;
      if (!canvas || reducedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      waves.current.push({
        x: x - rect.left,
        y: y - rect.top,
        life: 0,
        maxLife: 22,
        radius: 42 * force,
        color,
        width: 6 * force,
      });
      start();
    },
    shoot(from, to, color, ms) {
      const canvas = canvasRef.current;
      if (!canvas) return Promise.resolve();
      /*
       * Reduced motion loses the shot, not the beat. Playback awaits this to time
       * the impact, so resolving early would collapse a ranged attack into the
       * same instant as the damage and make the round unreadable — it waits out
       * the same flight time with nothing crossing the screen.
       */
      if (reducedRef.current) {
        return new Promise<void>((resolve) => {
          const id = window.setTimeout(() => {
            timers.current.delete(id);
            resolve();
          }, ms);
          timers.current.add(id);
        });
      }
      const rect = canvas.getBoundingClientRect();
      const shot: Projectile = {
        x: from.x - rect.left,
        y: from.y - rect.top,
        fromX: from.x - rect.left,
        fromY: from.y - rect.top,
        toX: to.x - rect.left,
        toY: to.y - rect.top,
        life: 0,
        // Frames, at the 60fps the loop assumes; the caller thinks in milliseconds.
        maxLife: Math.max(6, Math.round(ms / 16.7)),
        color,
        trail: [],
      };
      shots.current.push(shot);
      start();
      return new Promise<void>((resolve) => landed.current.set(shot, resolve));
    },
    float(x, y, text, color, big) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      numbers.current.push({
        x: x - rect.left,
        y: y - rect.top,
        // Heavy numbers hang longer and drift further: the ones worth reading are
        // the ones on screen the longest.
        vy: big ? -1.6 : -1.2,
        life: 0,
        maxLife: big ? 62 : 50,
        text,
        color,
        size: big ? 36 : 24,
      });
      start();
    },
  }));

  useEffect(() => {
    const pending = timers.current;
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
      for (const id of pending) clearTimeout(id);
      pending.clear();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
