import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { ArrowRight, Sparkles, ShieldCheck, RotateCw, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface HeroSliderProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onExploreShop: () => void;
}

const SLIDE_DURATION = 6000;

export const HeroSlider: React.FC<HeroSliderProps> = ({ products, onSelectProduct, onExploreShop }) => {
  const heroItems = products.slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    if (heroItems.length === 0) return;
    let startTime: number;
    let animFrame: number;
    let pauseTimer: ReturnType<typeof setTimeout>;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const prog = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(prog);
      if (prog < 100) {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);
    pauseTimer = setTimeout(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % heroItems.length);
      setProgress(0);
    }, SLIDE_DURATION);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(pauseTimer);
    };
  }, [currentIndex, heroItems.length]);

  const goTo = (idx: number) => {
    setDirection(idx > currentIndex ? 'next' : 'prev');
    setCurrentIndex(idx);
    setProgress(0);
  };

  const goPrev = () => {
    const prev = (currentIndex - 1 + heroItems.length) % heroItems.length;
    setDirection('prev');
    setCurrentIndex(prev);
    setProgress(0);
  };

  const goNext = () => {
    const next = (currentIndex + 1) % heroItems.length;
    setDirection('next');
    setCurrentIndex(next);
    setProgress(0);
  };

  const currentProduct = heroItems[currentIndex] || products[0];
  if (!currentProduct) return null;

  const sectionRef = useRef<HTMLElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);

  // GSAP — Parallax on the product image as user scrolls
  useGSAP(() => {
    if (!heroImgRef.current) return;
    gsap.to(heroImgRef.current, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
      },
    });
  }, { scope: sectionRef, dependencies: [currentProduct.id] });

  const slideVariants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden py-6 sm:py-10 px-4 sm:px-8">
      {/* Ambient background blob — color shifts with product */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={currentProduct.id + '-blob'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#FF6B35]/15 blur-[140px] rounded-full"
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/08 blur-[120px] rounded-full" />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 hero-grid pointer-events-none opacity-60" />

      {/* MAIN HERO CARD */}
      <div className="max-w-7xl mx-auto relative">
        <div className="glass-panel rounded-[36px] sm:rounded-[48px] p-6 sm:p-10 lg:p-14 border border-white/25 dark:border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] sm:min-h-[560px] flex flex-col">

          {/* Floating decorative orb inside card */}
          <div className="absolute top-8 right-8 w-48 h-48 bg-[#FF6B35]/08 blur-[80px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentProduct.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1"
            >
              {/* LEFT CONTENT */}
              <div className="lg:col-span-6 xl:col-span-7 space-y-6">
                {/* Category label */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="geo-badge flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#FF6B35] animate-pulse" />
                    Featured Drop
                  </span>
                  <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(heroItems.length).padStart(2, '0')} — {currentProduct.categoryName}
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.06] tracking-tight text-balance"
                >
                  {currentProduct.title.split(' ').map((word, i) => {
                    const highlight = ['Spatial', 'Titanium', 'Cyber', 'Horizon', 'VR'].some(
                      (h) => word.toLowerCase().includes(h.toLowerCase())
                    );
                    return highlight ? (
                      <span key={i} className="text-gradient-primary">{word} </span>
                    ) : (
                      <span key={i}>{word} </span>
                    );
                  })}
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg line-clamp-3"
                >
                  {currentProduct.description}
                </motion.p>

                {/* Price & Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap items-center gap-5 pt-1"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                      ${currentProduct.price.toFixed(2)}
                    </span>
                    {currentProduct.compareAtPrice && (
                      <span className="text-sm text-slate-400 line-through font-medium">
                        ${currentProduct.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                    {currentProduct.discountPercentage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/25">
                        -{currentProduct.discountPercentage}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onSelectProduct(currentProduct)}
                      className="btn-primary py-3.5 px-7 text-sm flex items-center gap-2"
                    >
                      Quick Order <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={onExploreShop}
                      className="py-3.5 px-6 rounded-2xl glass-pill text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
                    >
                      Explore Catalog
                    </motion.button>
                  </div>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-5 pt-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Authenticity Verified
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <RotateCw className="w-4 h-4 text-[#FF6B35]" />
                    360° Interactive View
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 font-medium">
                    <Play className="w-4 h-4 text-blue-500" />
                    Video Ready
                  </div>
                </motion.div>
              </div>

              {/* RIGHT — FLOATING PRODUCT IMAGE */}
              <div className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center">
                {/* Ambient glow behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/15 to-transparent rounded-full blur-3xl scale-75" />

                <motion.div
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto"
                >
                  {/* Main image */}
                  <div className="aspect-square rounded-3xl overflow-hidden glass-panel p-4 border border-white/30 dark:border-white/10 shadow-2xl">
                    <img
                      ref={heroImgRef}
                      src={currentProduct.images[0]}
                      alt={currentProduct.title}
                      className="w-full h-full object-cover rounded-2xl"
                      loading="eager"
                    />
                  </div>

                  {/* Floating spec pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute bottom-6 left-4 right-4 p-3 rounded-2xl glass-panel-strong border border-white/25 dark:border-white/15 flex items-center justify-between text-xs font-semibold backdrop-blur-2xl"
                  >
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block font-bold tracking-wider">Category</span>
                      <span className="text-slate-900 dark:text-white">{currentProduct.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-[#FF6B35] block font-bold tracking-wider">Rating</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">★ {currentProduct.rating}</span>
                    </div>
                  </motion.div>

                  {/* Top-right badge */}
                  {currentProduct.isNew && (
                    <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black shadow-lg shadow-[#FF6B35]/40 tracking-wide">
                      NEW DROP
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* SLIDER CONTROLS */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200/40 dark:border-slate-800/60">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {heroItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-400 ${
                    currentIndex === i ? 'w-8 bg-[#FF6B35]' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {/* Progress & arrows */}
            <div className="flex items-center gap-3">
              {/* Progress bar */}
              <div className="hidden sm:block w-24 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#FF6B35] rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono-tag text-[10px] font-bold text-slate-400">
                0{currentIndex + 1} / 0{heroItems.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={goPrev}
                  className="p-1.5 rounded-xl glass-pill hover:text-[#FF6B35] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  className="p-1.5 rounded-xl glass-pill hover:text-[#FF6B35] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
