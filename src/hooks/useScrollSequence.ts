/**
 * useScrollSequence.ts
 *
 * Connects GSAP ScrollTrigger to the frame sequence.
 * Pins the hero section and maps scroll progress → frame index.
 * Works with Lenis smooth scroll via lenis.on('scroll', ScrollTrigger.update).
 */

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── TYPES ────────────────────────────────────────────────────────
export interface ScrollSequenceOptions {
  sectionRef:     RefObject<HTMLElement | null>;
  totalFrames:    number;
  isReady:        boolean;
  scrollDistance: number;   // px to pin the section (e.g. 4500)
  onFrame:        (index: number) => void;
  onProgress:     (progress: number) => void;
  onComplete?:    () => void;
}

// ─── HOOK ─────────────────────────────────────────────────────────
export function useScrollSequence({
  sectionRef,
  totalFrames,
  isReady,
  scrollDistance,
  onFrame,
  onProgress,
  onComplete,
}: ScrollSequenceOptions): void {
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!isReady || totalFrames === 0 || !sectionRef.current) return;

    const section = sectionRef.current;

    // Short delay to let Lenis + DOM settle
    const init = () => {
      // Kill any existing trigger
      stRef.current?.kill();

      const st = ScrollTrigger.create({
        trigger:      section,
        start:        'top top',
        end:          `+=${scrollDistance}`,
        pin:          true,
        pinSpacing:   true,
        anticipatePin: 1,
        scrub:        0.8,
        onUpdate: (self) => {
          const progress  = Math.min(1, Math.max(0, self.progress));
          const frameIdx  = Math.round(progress * (totalFrames - 1));

          onFrame(frameIdx);
          onProgress(progress);

          if (progress >= 0.99) {
            onComplete?.();
          }
        },
      });

      stRef.current = st;
    };

    // Small timeout so the DOM + Lenis are ready
    const timeout = setTimeout(init, 100);

    return () => {
      clearTimeout(timeout);
      stRef.current?.kill();
      stRef.current = null;
    };
  }, [isReady, totalFrames, scrollDistance]);
}
