import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Native pseudo-3D particle field rendered on a 2D canvas.
 * Particles carry a z-depth that drives scale, opacity and parallax,
 * with continuous slow rotation and buoyant drift. No dependencies.
 * Colors derive from the institutional palette; reduced-motion aware.
 */

interface Particle {
  x: number; // -1..1 normalized
  y: number;
  z: number; // 0..1 depth (1 = near)
  radius: number;
  driftPhase: number;
  driftSpeed: number;
  buoyPhase: number;
  buoyAmp: number;
}

interface FloatingParticlesProps {
  className?: string;
  /** Particle count — scaled down on small screens */
  count?: number;
  /** CSS color for the particles */
  color?: string;
  /** Overall opacity of the layer */
  opacity?: number;
}

export function FloatingParticles({
  className,
  count = 70,
  color = "148, 163, 184", // slate-400, matches institutional palette
  opacity = 1,
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const seed = () => {
      const scale = Math.min(1, (width * height) / (1280 * 800));
      const n = Math.max(20, Math.round(count * scale));
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: 0.25 + Math.random() * 0.75,
        radius: 0.8 + Math.random() * 1.8,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.15 + Math.random() * 0.35,
        buoyPhase: Math.random() * Math.PI * 2,
        buoyAmp: 6 + Math.random() * 14,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
    };

    const rotationSpeed = 0.04; // rad/s — continuous, barely perceptible
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const spread = Math.min(width, height) * 0.48;
      const angle = reduceMotion ? 0 : t * rotationSpeed;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (const p of particles) {
        // Slow orbital rotation around center
        const rx = p.x * cosA - p.y * sinA;
        const ry = p.x * sinA + p.y * cosA;

        // Buoyant drift
        const buoyY = reduceMotion ? 0 : Math.sin(t * p.driftSpeed + p.buoyPhase) * p.buoyAmp;
        const buoyX = reduceMotion ? 0 : Math.cos(t * p.driftSpeed * 0.7 + p.driftPhase) * (p.buoyAmp * 0.5);

        // Pseudo-3D projection: nearer particles larger, brighter, more spread
        const px = cx + rx * spread * p.z + buoyX;
        const py = cy + ry * spread * p.z + buoyY;

        const size = p.radius * (0.5 + p.z);
        const alpha = 0.08 + p.z * 0.5;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame((now) => {
      last = now;
      draw(now);
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    />
  );
}
