import React, { useEffect, useRef } from 'react';

// =====================================================================
// FLUID BACKGROUND CONTEXT CANVAS
// Renders a high-performance 2D canvas fluid simulation with interactive
// mouse-responsive micro-particles and morphing glassmorphic color blobs.
// =====================================================================

export const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse coordinates
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
      alpha: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['rgba(255, 107, 53, 0.15)', 'rgba(251, 191, 36, 0.12)', 'rgba(244, 63, 94, 0.08)'];

    // Initialize particles
    const particleCount = Math.min(Math.floor((width * height) / 18000), 70);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        baseAlpha: Math.random() * 0.3 + 0.1,
        alpha: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Color blobs representing fluid currents
    interface Blob {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
    }

    const blobs: Blob[] = [
      {
        x: width * 0.25,
        y: height * 0.25,
        targetX: width * 0.25,
        targetY: height * 0.25,
        radius: Math.min(width, height) * 0.45,
        vx: 0.15,
        vy: 0.12,
        color: 'rgba(255, 107, 53, 0.08)',
      },
      {
        x: width * 0.75,
        y: height * 0.75,
        targetX: width * 0.75,
        targetY: height * 0.75,
        radius: Math.min(width, height) * 0.5,
        vx: -0.12,
        vy: -0.18,
        color: 'rgba(251, 191, 36, 0.05)',
      },
    ];

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const mouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const mouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseleave', mouseLeave);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      // Draw morphing fluid blobs
      blobs.forEach((blob) => {
        // Move blobs organically
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Boundaries bounce
        if (blob.x < -blob.radius || blob.x > width + blob.radius) blob.vx *= -1;
        if (blob.y < -blob.radius || blob.y > height + blob.radius) blob.vy *= -1;

        // Draw radial color gradient
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render micro-particles
      particles.forEach((p) => {
        // Organic float movement
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse gravity influence
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            p.x -= dx * force * 0.015;
            p.y -= dy * force * 0.015;
            p.alpha = Math.min(p.baseAlpha + force * 0.45, 0.7);
          } else {
            p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          }
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseleave', mouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[var(--bg-main)] opacity-70 transition-opacity duration-1000"
    />
  );
};
