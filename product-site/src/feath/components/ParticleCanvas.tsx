import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
}

export function ParticleCanvas({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const COUNT = 55;
  const MAX_DIST = 130;
  const MOUSE_DIST = 170;

  const init = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.8,
      opacity: Math.random() * 0.45 + 0.15,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(rect.width, rect.height);
    };
    resize();

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", resize);

    const pc = dark ? "61,184,112" : "30,124,74";
    const dc = dark ? "226,237,224" : "13,26,11";

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const ps = particles.current;
      const { x: mx, y: my } = mouseRef.current;

      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = mx - p.x;
        const dy = my - p.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST && d > 0) {
          p.vx += (dx / d) * 0.009;
          p.vy += (dy / d) * 0.009;
        }
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 1.1) {
          p.vx = (p.vx / spd) * 1.1;
          p.vy = (p.vy / spd) * 1.1;
        }
      }

      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${pc},${(1 - d / MAX_DIST) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(mx - ps[i].x, my - ps[i].y);
        if (md < MOUSE_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${pc},${(1 - md / MOUSE_DIST) * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(ps[i].x, ps[i].y, ps[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dc},${ps[i].opacity * 0.55})`;
        ctx.fill();
      }

      if (mx > 0 && mx < w) {
        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc},0.8)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${pc},0.25)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
    };
  }, [dark, init]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />;
}
