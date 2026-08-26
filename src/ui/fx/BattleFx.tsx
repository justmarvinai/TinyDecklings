/**
 * The battle effects layer.
 *
 * One absolutely-positioned canvas over the DOM battlefield (TECH_STACK.md AD-1):
 * DOM handles the cards, text and layout it is good at; the canvas handles the
 * impacts and floating numbers it is good at. Particles are pooled and the loop
 * stops itself when nothing is on screen, so an idle battle costs nothing.
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
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
  burst: (x: number, y: number, color: string, count?: number) => void;
  /** Rising damage/heal number. */
  float: (x: number, y: number, text: string, color: string, big?: boolean) => void;
}

export function BattleFx({ handleRef }: { handleRef: Ref<BattleFxHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const numbers = useRef<FloatingNumber[]>([]);
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

    particles.current = particles.current.filter((p) => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;
      const alpha = 1 - p.life / p.maxLife;
      if (alpha <= 0) return false;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    ctx.textAlign = 'center';
    numbers.current = numbers.current.filter((n) => {
      n.life++;
      n.y += n.vy;
      n.vy *= 0.97;
      const alpha = 1 - Math.max(0, (n.life - n.maxLife * 0.6) / (n.maxLife * 0.4));
      if (n.life >= n.maxLife) return false;
      const pop = n.life < 6 ? 1 + (6 - n.life) * 0.06 : 1;
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

    if (particles.current.length === 0 && numbers.current.length === 0) {
      raf.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  useImperativeHandle(handleRef, () => ({
    burst(x, y, color, count = 12) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 1.6 + Math.random() * 2.6;
        particles.current.push({
          x: x - rect.left,
          y: y - rect.top,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 0,
          maxLife: 26 + Math.random() * 14,
          size: 2.5 + Math.random() * 3.5,
          color,
        });
      }
      start();
    },
    float(x, y, text, color, big) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      numbers.current.push({
        x: x - rect.left,
        y: y - rect.top,
        vy: -1.1,
        life: 0,
        maxLife: 46,
        text,
        color,
        size: big ? 30 : 22,
      });
      start();
    },
  }));

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
