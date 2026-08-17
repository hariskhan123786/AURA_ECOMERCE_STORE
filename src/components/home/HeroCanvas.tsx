/**
 * HeroCanvas.tsx
 *
 * Apple-style scroll-controlled frame sequence hero.
 *
 * Layers (bottom → top):
 *   1. <canvas>       — fullscreen frame sequence renderer
 *   2. Three.js WebGL — floating ember particles
 *   3. Vignette       — cinematic gradient overlay
 *   4. Scroll hint    — animated chevron
 *   5. Content panel  — hero text + product card (scroll-linked)
 */

import React, {
  useEffect, useRef, useState, useMemo,
} from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles, ShieldCheck, Star, ChevronDown } from 'lucide-react';
import { Product } from '../../types';
import { CanvasRenderer } from '../../lib/heroSequence/CanvasRenderer';
import { useFrameSequence } from '../../hooks/useFrameSequence';
import { useScrollSequence } from '../../hooks/useScrollSequence';
import { HeroLoader } from './HeroLoader';

gsap.registerPlugin(ScrollTrigger);

// ─── CONSTANTS ────────────────────────────────────────────────────
const SCROLL_DISTANCE = 4500;

// ─── PROPS ────────────────────────────────────────────────────────
interface HeroCanvasProps {
  products:        Product[];
  onSelectProduct: (p: Product) => void;
  onExploreShop:   () => void;
}

// ─── THREE.JS PARTICLE SYSTEM ─────────────────────────────────────
function createParticleSystem(renderer: THREE.WebGLRenderer) {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 3;

  const COUNT = 120;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const speeds    = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    const t = Math.random();
    colors[i * 3]     = 1.0;
    colors[i * 3 + 1] = 0.35 + t * 0.35;
    colors[i * 3 + 2] = 0.05;
    speeds[i] = Math.random() * 0.006 + 0.002;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    vertexColors: true, size: 0.06, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  let frame = 0;

  function tick(scrollProgress: number) {
    frame++;
    const t = frame * 0.01;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += speeds[i];
      arr[i * 3]     += Math.sin(t + i * 0.5) * 0.001;
      if (arr[i * 3 + 1] > 3.5) {
        arr[i * 3 + 1] = -3.5;
        arr[i * 3]     = (Math.random() - 0.5) * 10;
      }
    }
    pos.needsUpdate = true;
    mat.opacity = 0.2 + scrollProgress * 0.45;
    renderer.render(scene, camera);
  }

  function destroy() {
    geo.dispose(); mat.dispose(); renderer.dispose();
  }

  return { tick, destroy };
}

// ─── HERO COPY MAP ────────────────────────────────────────────────
function getHeroCopy(products: Product[], idx: number) {
  const defaults = [
    {
      badge: 'Spatial Audio Drop',
      line1: 'Cinematic Sound,',
      line2: 'Redefined',
      sub:   'Industry-leading ANC with spatial audio. Crafted from genuine leather and titanium accents for the discerning audiophile.',
    },
    {
      badge: 'Smart Wearables',
      line1: 'Augmented Reality,',
      line2: 'Meets Style',
      sub:   'Lightweight AR eyewear with real-time overlays. Merging luxury couture with cutting-edge head-up display technology.',
    },
    {
      badge: 'Futuristic Footwear',
      line1: 'Cybernetic Strides,',
      line2: 'Aura Sneaker-X',
      sub:   'Self-lacing adaptive luxury footwear. Carbon-fibre soles meet temperature-regulating technical weave.',
    },
  ];
  if (products[idx]?.title) {
    // Use first fallback badge but real product title as line2
    return { ...defaults[idx % defaults.length], line2: products[idx].title };
  }
  return defaults[idx % defaults.length];
}

// ─── COMPONENT ────────────────────────────────────────────────────
export const HeroCanvas: React.FC<HeroCanvasProps> = ({
  products, onSelectProduct, onExploreShop,
}) => {
  // ── Refs
  const sectionRef       = useRef<HTMLElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const glRef            = useRef<HTMLCanvasElement>(null);
  const overlayRef       = useRef<HTMLDivElement>(null);
  const scrollHintRef    = useRef<HTMLDivElement>(null);
  const cardRef          = useRef<HTMLDivElement>(null);
  const copyRef          = useRef<HTMLDivElement>(null);
  const particleRef      = useRef<ReturnType<typeof createParticleSystem> | null>(null);
  const rafRef           = useRef<number | null>(null);
  const rendererRef      = useRef<CanvasRenderer | null>(null);
  const scrollPctRef     = useRef(0);
  const prevProductIdxRef = useRef(-1);

  // ── State
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [scrollPct, setScrollPct]       = useState(0);
  const [activeIdx, setActiveIdx]       = useState(0);
  const [imageIdx, setImageIdx]         = useState(0);

  // ── Frame sequence hook
  const { loadProgress, isReady, frameSource, totalFrames, setFrame, loader } = useFrameSequence();

  // ── Active product
  const totalShowcase = Math.min(3, products.length);
  const activeProduct = useMemo(() => {
    if (!products.length) return null;
    const i = Math.min(totalShowcase - 1, Math.floor(scrollPct * totalShowcase));
    return products[i] ?? products[0];
  }, [products, scrollPct, totalShowcase]);

  const copy = useMemo(() => {
    return getHeroCopy(products, activeIdx);
  }, [activeIdx, products]);

  // ── Canvas renderer — created once
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const r = new CanvasRenderer(canvasRef.current);
      rendererRef.current = r;
      return () => { r.destroy(); rendererRef.current = null; };
    } catch (e) {
      console.error('[HeroCanvas] CanvasRenderer init failed', e);
    }
  }, []);

  // ── Draw frame whenever frameSource updates
  useEffect(() => {
    if (frameSource && rendererRef.current) {
      rendererRef.current.draw(frameSource);
    }
  }, [frameSource]);

  // ── Three.js particles
  useEffect(() => {
    if (window.innerWidth < 768 || !glRef.current) return;
    const three = new THREE.WebGLRenderer({
      canvas: glRef.current, alpha: true, antialias: false,
    });
    three.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    three.setSize(window.innerWidth, window.innerHeight);
    three.setClearColor(0x000000, 0);
    const ps = createParticleSystem(three);
    particleRef.current = ps;
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      ps.tick(scrollPctRef.current);
    }
    loop();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ps.destroy();
      particleRef.current = null;
    };
  }, []);

  // ── Product index + image slideshow
  useEffect(() => {
    const newIdx = Math.min(totalShowcase - 1, Math.max(0, Math.floor(scrollPct * totalShowcase)));
    if (newIdx !== prevProductIdxRef.current) {
      prevProductIdxRef.current = newIdx;
      setActiveIdx(newIdx);
      setImageIdx(0);
    }
  }, [scrollPct, totalShowcase]);

  useEffect(() => {
    if (!activeProduct || activeProduct.images.length <= 1) return;
    const iv = setInterval(() => {
      setImageIdx(prev => (prev + 1) % activeProduct.images.length);
    }, 2500);
    return () => clearInterval(iv);
  }, [activeProduct]);

  // ── Scroll sequence — pin + scrub
  useScrollSequence({
    sectionRef,
    totalFrames,
    isReady,
    scrollDistance: SCROLL_DISTANCE,
    onFrame: (idx) => {
      setFrame(idx);
      if (loader && rendererRef.current) {
        loader.loadFrame(idx).then(source => {
          rendererRef.current?.draw(source);
        }).catch(() => {});
      }

      // Calculate threshold based on frame0183
      const startFrame = Math.round(totalFrames * (183 / 192));
      const endFrame = totalFrames - 1;
      let opa = 0;
      if (idx >= startFrame && endFrame > startFrame) {
        // Fast fade-in over the final remaining frames
        opa = Math.min(1, (idx - startFrame) / (endFrame - startFrame));
      }

      if (overlayRef.current) {
        gsap.set(overlayRef.current, { 
          opacity: opa,
          pointerEvents: opa > 0.1 ? 'auto' : 'none'
        });
      }

      // Copy: fade in only — no movement
      if (copyRef.current) {
        gsap.set(copyRef.current, { opacity: opa, x: 0, y: 0 });
      }

      // Card: fade in only — no movement
      if (cardRef.current) {
        gsap.set(cardRef.current, { opacity: opa, x: 0, y: 0 });
      }
    },
    onProgress: (p) => {
      scrollPctRef.current = p;
      setScrollPct(p);

      // Scroll hint fades out immediately
      if (scrollHintRef.current) {
        const hint = Math.max(0, 1 - p * 30);
        gsap.set(scrollHintRef.current, { opacity: hint });
      }
    },
  });

  // ── Resize
  useEffect(() => {
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <>
      {/* Loading Overlay */}
      {!loaderHidden && (
        <HeroLoader
          progress={loadProgress}
          isComplete={isReady}
          onDone={() => setLoaderHidden(true)}
        />
      )}

      {/* ── PINNED HERO SECTION ──────────────────────────────────── */}
      <section
        ref={sectionRef}
        style={{
          position:   'relative',
          width:      '100%',
          height:     '100vh',
          overflow:   'hidden',
          background: '#000',
        }}
      >
        {/* LAYER 1 — Frame canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block',
          }}
        />

        {/* LAYER 2 — Three.js particles */}
        <canvas
          ref={glRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* LAYER 3 — Cinematic vignette (restored) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 65%, rgba(0,0,0,0.65) 100%)',
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,107,53,0.06) 0%, transparent 60%)',
          ].join(', '),
        }} />

        {/* LAYER 4 — Scroll hint */}
        <div
          ref={scrollHintRef}
          style={{
            position: 'absolute', bottom: 40, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.5)', fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: '0.2em', textTransform: 'uppercase',
            pointerEvents: 'none', zIndex: 10,
          }}
        >
          <span>Scroll to explore</span>
          <ChevronDown size={18} style={{
            color: 'rgba(255,107,53,0.7)',
            animation: 'hc-bounce 1.8s ease-in-out infinite',
          }} />
        </div>

        {/* LAYER 5 — Text + Card overlay (last frames only, scroll-driven) */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute', inset: 0,
            opacity: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 clamp(20px, 5vw, 72px)',
            zIndex: 20,
            // Semi-transparent so the last video frame shows through
            background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 100%)',
          }}
        >
          <div className="hc-grid-container">
            {/* ── LEFT: Hero copy ──────────────────────────────── */}
            <div className="hc-copy-wrapper" style={{ pointerEvents: 'all' }}>
              {/* Badges */}
              <div className="hc-badge-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 100,
                  background: 'rgba(255,107,53,0.18)', border: '1px solid rgba(255,107,53,0.4)',
                  color: '#FF6B35', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: "'Space Mono', monospace",
                }}>
                  <Sparkles size={10} /> {copy.badge}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 13px', borderRadius: 100,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 9.5, fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: "'Space Mono', monospace",
                }}>
                  <ShieldCheck size={10} style={{ color: '#34d399' }} /> Authenticity Guaranteed
                </span>
              </div>

              {/* Headline */}
              <h1 className="hc-headline" style={{
                margin: '0 0 18px',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300, lineHeight: 1.05,
                fontSize: 'clamp(32px, 5.8vw, 78px)',
                color: '#fff', letterSpacing: '-0.01em',
              }}>
                <span style={{ fontStyle: 'italic', display: 'block' }}>{copy.line1}</span>
                <span style={{
                  display: 'inline-block',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(24px, 4.2vw, 56px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FFA270 55%, #FFD29E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginTop: 6,
                }}>
                  {copy.line2}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="hc-subtitle" style={{
                margin: '0 0 36px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(13px, 1.1vw, 15px)',
                color: 'rgba(255,255,255,0.62)',
                lineHeight: 1.78, maxWidth: 480,
              }}>
                {copy.sub}
              </p>

              {/* CTAs */}
              <div className="hc-cta-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => activeProduct && onSelectProduct(activeProduct)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 9,
                    padding: '14px 30px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #FF6B35 0%, #E8521E 100%)',
                    color: '#fff', fontSize: 12.5, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 28px rgba(255,107,53,0.38)',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 36px rgba(255,107,53,0.52)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(255,107,53,0.38)';
                  }}
                >
                  Shop Now <ArrowRight size={14} />
                </button>
                <button
                  onClick={onExploreShop}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 9,
                    padding: '14px 26px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
                    color: 'rgba(255,255,255,0.88)', fontSize: 12.5, fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,107,53,0.45)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  Explore Catalog
                </button>
              </div>

              {/* Progress dots */}
              {totalShowcase > 1 && (
                <div className="hc-dots-row" style={{ display: 'flex', gap: 7, marginTop: 34, alignItems: 'center' }}>
                  {Array.from({ length: totalShowcase }).map((_, i) => (
                    <div key={i} style={{
                      height: 5, borderRadius: 3,
                      width: i === activeIdx ? 22 : 7,
                      background: i === activeIdx ? '#FF6B35' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  ))}
                  <span style={{
                    marginLeft: 5, fontSize: 9.5,
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: "'Space Mono', monospace",
                    letterSpacing: '0.1em',
                  }}>
                    {String(activeIdx + 1).padStart(2, '0')} / {String(totalShowcase).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* ── RIGHT: Product card ──────────────────────────── */}
            {activeProduct && (
              <div
                onClick={() => onSelectProduct(activeProduct)}
                className="hc-responsive-card"
                style={{
                  cursor: 'pointer', flexShrink: 0,
                  borderRadius: 26, overflow: 'hidden',
                  background: 'rgba(10,10,16,0.82)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: '0 28px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                  pointerEvents: 'all',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 40px 90px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,107,53,0.25)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 28px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Image */}
                <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                  <img
                    key={`${activeProduct.id}-${imageIdx}`}
                    src={activeProduct.images[imageIdx] ?? activeProduct.images[0]}
                    alt={activeProduct.title}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      animation: 'hc-fade-in 0.45s ease forwards',
                      transition: 'transform 0.5s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                  />
                  {/* Image dots */}
                  {activeProduct.images.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: 10, left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex', gap: 5, pointerEvents: 'none',
                    }}>
                      {activeProduct.images.map((_, i) => (
                        <div key={i} style={{
                          height: 5, borderRadius: 3,
                          width: i === imageIdx ? 16 : 5,
                          background: i === imageIdx ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                          transition: 'all 0.3s ease',
                        }} />
                      ))}
                    </div>
                  )}
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,107,53,0.3)',
                    borderRadius: 7, padding: '4px 9px',
                    fontSize: 8.5, fontWeight: 700, color: '#FF6B35',
                    fontFamily: "'Space Mono', monospace", letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                  }}>
                    Featured
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '18px 20px 22px' }}>
                  <div style={{
                    fontSize: 8.5, color: '#FF6B35', letterSpacing: '0.18em',
                    textTransform: 'uppercase', fontWeight: 700, marginBottom: 6,
                    fontFamily: "'Space Mono', monospace",
                  }}>
                    {activeProduct.categoryName}
                  </div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 17, fontWeight: 400, color: '#fff',
                    lineHeight: 1.3, marginBottom: 14,
                  }}>
                    {activeProduct.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
                    }}>
                      ${activeProduct.price.toFixed(2)}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 7, padding: '4px 8px',
                      fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      <Star size={11} fill="#FFB347" color="#FFB347" />
                      <span style={{ fontWeight: 700, color: '#fff' }}>{activeProduct.rating}</span>
                    </span>
                  </div>
                </div>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #FF6B35, #FFA270 60%, transparent)' }} />
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes hc-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(7px); }
        }
        @keyframes hc-fade-in {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
        .hc-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: center;
          width: 100%;
          max-width: 1300px;
        }
        .hc-responsive-card {
          width: 280px;
          margin: 0 auto;
        }
        .hc-copy-wrapper {
          text-align: left;
        }
        @media (min-width: 900px) {
          .hc-grid-container {
            grid-template-columns: 1fr auto;
            gap: clamp(32px, 6vw, 90px);
          }
          .hc-responsive-card {
            width: 285px;
          }
        }
        @media (max-width: 900px) {
          .hc-copy-wrapper {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hc-badge-row {
            justify-content: center;
            margin-bottom: 16px !important;
          }
          .hc-headline {
            margin-bottom: 12px !important;
            line-height: 1.15 !important;
          }
          .hc-headline span:first-child {
            font-size: clamp(24px, 6vw, 42px) !important;
          }
          .hc-headline span:last-child {
            font-size: clamp(18px, 4.5vw, 32px) !important;
          }
          .hc-subtitle {
            margin-bottom: 24px !important;
            text-align: center;
            max-width: 400px;
            font-size: 13px !important;
          }
          .hc-cta-row {
            justify-content: center;
            gap: 8px !important;
          }
          .hc-cta-row button {
            padding: 10px 20px !important;
            font-size: 11px !important;
          }
          .hc-dots-row {
            justify-content: center;
            margin-top: 20px !important;
          }
          .hc-responsive-card {
            width: 240px;
            margin-top: 10px;
          }
          .hc-responsive-card img {
            height: 100%;
          }
        }
      `}</style>
    </>
  );
};

