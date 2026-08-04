/**
 * HeroLoader.tsx
 *
 * Cinematic fullscreen loading overlay shown while the initial
 * burst of frames is being preloaded.
 */

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HeroLoaderProps {
  progress: number;    // 0–1
  isComplete: boolean;
  onDone?: () => void;
}

export const HeroLoader: React.FC<HeroLoaderProps> = ({ progress, isComplete, onDone }) => {
  const overlayRef    = useRef<HTMLDivElement>(null);
  const barFillRef    = useRef<HTMLDivElement>(null);
  const percentRef    = useRef<HTMLSpanElement>(null);
  const dismissed     = useRef(false);

  // Animate progress bar fill
  useEffect(() => {
    if (barFillRef.current) {
      gsap.to(barFillRef.current, {
        width: `${Math.round(progress * 100)}%`,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
    if (percentRef.current) {
      percentRef.current.textContent = `${Math.round(progress * 100)}%`;
    }
  }, [progress]);

  // Fade out when ready
  useEffect(() => {
    if (isComplete && !dismissed.current && overlayRef.current) {
      dismissed.current = true;
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power2.inOut',
        onComplete: onDone,
      });
    }
  }, [isComplete, onDone]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
        pointerEvents: isComplete ? 'none' : 'all',
      }}
    >
      {/* Brand mark */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#FF6B35',
          marginBottom: 12,
          fontWeight: 700,
        }}>
          Aura Luxe
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Premium Experience
        </div>
        <div style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          marginTop: 8,
          letterSpacing: '0.05em',
        }}>
          Loading cinematic experience
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 200, position: 'relative' }}>
        {/* Track */}
        <div style={{
          width: '100%',
          height: 2,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          {/* Fill */}
          <div
            ref={barFillRef}
            style={{
              width: '0%',
              height: '100%',
              background: 'linear-gradient(90deg, #FF6B35, #FF9A5C)',
              borderRadius: 2,
              boxShadow: '0 0 12px rgba(255, 107, 53, 0.6)',
            }}
          />
        </div>

        {/* Percentage */}
        <div style={{
          marginTop: 14,
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span ref={percentRef}>0%</span>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        fontSize: 10,
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
      }}>
        Scroll to begin
      </div>
    </div>
  );
};
