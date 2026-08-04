/**
 * useFrameSequence.ts
 *
 * React hook that wraps FrameLoader + SequencePreloader.
 * Manages the lifecycle of the frame loading system and
 * provides the current frame bitmap for rendering.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FrameLoader, SequenceManifest } from '../lib/heroSequence/FrameLoader';
import { SequencePreloader } from '../lib/heroSequence/SequencePreloader';

// ─── TYPES ────────────────────────────────────────────────────────
export interface FrameSequenceState {
  manifest:     SequenceManifest | null;
  totalFrames:  number;
  loadProgress: number;    // 0–1
  isReady:      boolean;   // initial burst complete
  currentFrame: number;
  bitmap:       ImageBitmap | null;
  setFrame:     (index: number) => void;
}

// ─── HELPER ───────────────────────────────────────────────────────
function isMobile(): boolean {
  return window.innerWidth < 768 ||
    ('ontouchstart' in window && window.innerWidth < 1024);
}

// ─── HOOK ─────────────────────────────────────────────────────────
export function useFrameSequence(): FrameSequenceState {
  const [manifest, setManifest]         = useState<SequenceManifest | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady]           = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [bitmap, setBitmap]             = useState<ImageBitmap | null>(null);

  const loaderRef    = useRef<FrameLoader | null>(null);
  const preloaderRef = useRef<SequencePreloader | null>(null);
  const frameReqRef  = useRef<number | null>(null);

  // ─── INIT ─────────────────────────────────────────────────────
  useEffect(() => {
    const variant = isMobile() ? 'mobile' : 'desktop';
    const loader  = new FrameLoader(variant);
    const preloader = new SequencePreloader(loader);

    loaderRef.current    = loader;
    preloaderRef.current = preloader;

    preloader.init((loaded, total) => {
      setLoadProgress(loaded / total);
    }).then(async () => {
      const mf = await loader.loadManifest();
      setManifest(mf);
      setIsReady(true);

      // Render frame 0 immediately
      try {
        const bm = await loader.loadFrame(0);
        setBitmap(bm);
      } catch {/* noop */}
    }).catch(err => {
      console.error('[useFrameSequence] init error', err);
    });

    return () => {
      preloader.destroy();
      if (frameReqRef.current !== null) {
        cancelAnimationFrame(frameReqRef.current);
      }
    };
  }, []);

  // ─── SET FRAME ────────────────────────────────────────────────
  const setFrame = useCallback((index: number) => {
    const loader    = loaderRef.current;
    const preloader = preloaderRef.current;
    if (!loader || !preloader) return;

    const clamped = Math.max(0, Math.min(loader.totalFrames - 1, index));
    setCurrentFrame(clamped);

    // Update preloader window
    preloader.updateCursor(clamped);

    // Cancel pending frame request
    if (frameReqRef.current !== null) {
      cancelAnimationFrame(frameReqRef.current);
    }

    // Schedule bitmap update on next animation frame
    frameReqRef.current = requestAnimationFrame(() => {
      loader.loadFrame(clamped)
        .then(bm => setBitmap(bm))
        .catch(() => {});
    });
  }, []);

  return {
    manifest,
    totalFrames: loaderRef.current?.totalFrames ?? 0,
    loadProgress,
    isReady,
    currentFrame,
    bitmap,
    setFrame,
  };
}
