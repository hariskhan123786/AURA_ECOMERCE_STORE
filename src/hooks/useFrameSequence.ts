/**
 * useFrameSequence.ts
 *
 * React hook that manages FrameLoader + SequencePreloader lifecycle.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FrameLoader, SequenceManifest, FrameSource } from '../lib/heroSequence/FrameLoader';
import { SequencePreloader } from '../lib/heroSequence/SequencePreloader';

export interface FrameSequenceState {
  manifest:     SequenceManifest | null;
  totalFrames:  number;
  loadProgress: number;    // 0–1
  isReady:      boolean;   // initial burst complete
  currentFrame: number;
  frameSource:  FrameSource | null;
  setFrame:     (index: number) => void;
  loader:       FrameLoader | null;
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const uaCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const widthCheck = window.innerWidth < 768;
  return uaCheck || widthCheck;
}

export function useFrameSequence(): FrameSequenceState {
  const [manifest, setManifest]         = useState<SequenceManifest | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady]           = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameSource, setFrameSource]   = useState<FrameSource | null>(null);

  const loaderRef    = useRef<FrameLoader | null>(null);
  const preloaderRef = useRef<SequencePreloader | null>(null);
  const frameReqRef  = useRef<number | null>(null);
  const variantRef   = useRef<'mobile' | 'desktop'>(isMobile() ? 'mobile' : 'desktop');

  const initLoader = (variant: 'mobile' | 'desktop') => {
    preloaderRef.current?.destroy();
    if (frameReqRef.current !== null) cancelAnimationFrame(frameReqRef.current);

    setIsReady(false);
    setLoadProgress(0);

    const loader    = new FrameLoader(variant);
    const preloader = new SequencePreloader(loader);

    loaderRef.current    = loader;
    preloaderRef.current = preloader;

    preloader.init((loaded, total) => {
      setLoadProgress(Math.min(1, loaded / total));
    }).then(async () => {
      const mf = await loader.loadManifest();
      setManifest(mf);
      setIsReady(true);

      // Render frame 0 immediately
      try {
        const frame0 = await loader.loadFrame(0);
        setFrameSource(frame0);
      } catch (err) {
        console.warn('[useFrameSequence] frame 0 load error', err);
      }
    }).catch(err => {
      console.error('[useFrameSequence] init error', err);
      setIsReady(true);
    });
  };

  useEffect(() => {
    initLoader(variantRef.current);

    const onResize = () => {
      const newVariant: 'mobile' | 'desktop' = isMobile() ? 'mobile' : 'desktop';
      if (newVariant !== variantRef.current) {
        variantRef.current = newVariant;
        initLoader(newVariant);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      preloaderRef.current?.destroy();
      if (frameReqRef.current !== null) cancelAnimationFrame(frameReqRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const setFrame = useCallback((index: number) => {
    const loader    = loaderRef.current;
    const preloader = preloaderRef.current;
    if (!loader || !preloader) return;

    const clamped = Math.max(0, Math.min(loader.totalFrames - 1, index));
    setCurrentFrame(clamped);
    preloader.updateCursor(clamped);

    if (frameReqRef.current !== null) {
      cancelAnimationFrame(frameReqRef.current);
    }

    frameReqRef.current = requestAnimationFrame(() => {
      loader.loadFrame(clamped)
        .then(source => setFrameSource(source))
        .catch(() => {});
    });
  }, []);

  return {
    manifest,
    totalFrames: loaderRef.current?.totalFrames ?? 192,
    loadProgress,
    isReady,
    currentFrame,
    frameSource,
    setFrame,
    loader: loaderRef.current,
  };
}
