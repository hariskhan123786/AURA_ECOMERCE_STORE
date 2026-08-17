/**
 * useScrollSequence.ts
 *
 * Connects GSAP ScrollTrigger to the frame sequence.
 * Pins the hero section and maps scroll progress → frame index.
 */

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSequenceOptions {
  sectionRef:     RefObject<HTMLElement | null>;
  totalFrames:    number;
  isReady:        boolean;
  scrollDistance: number;
  onFrame:        (index: number) => void;
  onProgress:     (progress: number) => void;
  onComplete?:    () => void;
}

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

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isReady || totalFrames === 0 || !sectionRef.current) return;

    const section = sectionRef.current;

    const init = () => {
      stRef.current?.kill();

      const st = ScrollTrigger.create({
        trigger:      section,
        start:        'top top',
        end:          `+=${scrollDistance}`,
        pin:          true,
        pinSpacing:   true,
        anticipatePin: 1,
        scrub:        0.5,
        onUpdate: (self) => {
          const progress  = Math.min(1, Math.max(0, self.progress));
          const frameIdx  = Math.round(progress * (totalFrames - 1));

          onFrameRef.current(frameIdx);
          onProgressRef.current(progress);

          if (progress >= 0.99) {
            onCompleteRef.current?.();
          }
        },
      });

      stRef.current = st;
    };

    const timeout = setTimeout(init, 100);

    return () => {
      clearTimeout(timeout);
      stRef.current?.kill();
      stRef.current = null;
    };
  }, [isReady, totalFrames, scrollDistance]);
}
