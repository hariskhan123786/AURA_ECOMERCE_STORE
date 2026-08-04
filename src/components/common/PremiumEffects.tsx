import React, { useEffect, useRef, useState } from 'react';

/**
 * PREMIUM MAGNETIC CURSOR
 * A floating custom cursor dot with magnetic attraction toward interactive elements.
 * Inspired by Framer Motion design skills & motion-principles skill.
 * Only renders on desktop (hidden on touch devices).
 */
export const MagneticCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const pos = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });
  const animFrame = useRef<number>(0);

  useEffect(() => {
    // Only on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onDown = () => setIsClicking(true);
    const onUp = () => setIsClicking(false);

    const onEnter = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button, a, [role="button"], input, select, textarea, label, .cursor-pointer')) {
        setIsHovering(true);
      }
    };

    const onLeave = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('button, a, [role="button"], input, select, textarea, label, .cursor-pointer')) {
        setIsHovering(false);
      }
    };

    // Lerp loop for ring lag effect
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
    const render = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ringPos.current.x = lerp(ringPos.current.x, pos.current.x, 0.12);
        ringPos.current.y = lerp(ringPos.current.y, pos.current.y, 0.12);
        ringRef.current.style.transform = `translate(${ringPos.current.x - 18}px, ${ringPos.current.y - 18}px)`;
      }
      animFrame.current = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    animFrame.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <>
      {/* Inner dot — snaps instantly */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden lg:block"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full transition-all duration-150"
          style={{
            width: isClicking ? '6px' : '8px',
            height: isClicking ? '6px' : '8px',
            background: isHovering ? '#FF6B35' : '#0F172A',
            marginTop: isClicking ? '1px' : '0',
            marginLeft: isClicking ? '1px' : '0',
          }}
        />
      </div>

      {/* Outer ring — lags behind with lerp */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] hidden lg:block"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full border-2 transition-all duration-200"
          style={{
            width: isHovering ? '48px' : isClicking ? '28px' : '36px',
            height: isHovering ? '48px' : isClicking ? '28px' : '36px',
            borderColor: isHovering ? '#FF6B35' : 'rgba(15,23,42,0.35)',
            opacity: isClicking ? 0.5 : 0.65,
            marginTop: isHovering ? '-6px' : '0',
            marginLeft: isHovering ? '-6px' : '0',
          }}
        />
      </div>
    </>
  );
};

/**
 * SCROLL PROGRESS INDICATOR
 * Thin #FF6B35 progress bar at top of screen that tracks scroll depth.
 */
export const ScrollProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9997] h-[2.5px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[#FF6B35] via-amber-400 to-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.6)] transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
