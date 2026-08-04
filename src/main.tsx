import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── LENIS SMOOTH SCROLL ──────────────────────────────────────────
const lenis = new Lenis({
  duration:    1.2,
  easing:      (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

// CRITICAL: Feed Lenis scroll position into ScrollTrigger.
// Without this, GSAP ScrollTrigger uses native scroll position
// while Lenis overrides the visual scroll — causing pin to break.
lenis.on('scroll', ScrollTrigger.update);

// Integrate with GSAP ticker so Lenis runs in sync with GSAP
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// Disable GSAP's default lagSmoothing — Lenis handles that
gsap.ticker.lagSmoothing(0);

// Expose globally so HeroCanvas can reference if needed
(window as unknown as Record<string, unknown>).__lenis = lenis;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
