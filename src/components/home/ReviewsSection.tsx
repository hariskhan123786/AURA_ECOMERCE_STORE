import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle, Quote, ThumbsUp, ChevronDown } from 'lucide-react';
import { INITIAL_REVIEWS } from '../../data/mockData';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export const ReviewsSection: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const sectionRef = useRef<HTMLElement>(null);
  const reviews = INITIAL_REVIEWS;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const RATING_BREAKDOWN = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    pct: Math.round((reviews.filter((r) => r.rating === stars).length / reviews.length) * 100),
  }));

  // GSAP — stagger reveal review cards as they enter viewport
  useGSAP(() => {
    ScrollTrigger.batch('.review-card', {
      onEnter: (elements) => {
        gsap.from(elements, {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power3.out',
          immediateRender: false,
        });
      },
      start: 'top bottom',
      once: true,
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="geo-badge">[05] CLIENT REVIEWS</span>
            <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-[#FF6B35]">
              VERIFIED CONNOISSEURS
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            What Our Clients Say
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {reviews.length} verified reviews from authenticated purchasers.
          </p>
        </div>

        {/* Overall rating */}
        <div className="glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 flex items-center gap-5 min-w-[220px]">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-900 dark:text-white">{avgRating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 justify-center mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{reviews.length} reviews</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {RATING_BREAKDOWN.map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-4">{stars}</span>
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {reviews.slice(0, visibleCount).map((rev, i) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="review-card glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 flex flex-col justify-between gap-4 shadow-lg hover:shadow-xl hover:border-[#FF6B35]/30 transition-all group relative overflow-hidden"
            >
              {/* Background quote */}
              <Quote className="w-12 h-12 text-[#FF6B35]/08 absolute top-4 right-4 pointer-events-none group-hover:text-[#FF6B35]/15 transition-colors" />

              <div className="space-y-3 relative z-10">
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                    />
                  ))}
                </div>

                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  "{rev.title}"
                </h4>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.userAvatar}
                    alt={rev.userName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#FF6B35]/20"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      {rev.userName}
                      {rev.verifiedPurchase && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                    </h5>
                    <span className="text-[10px] text-slate-400">Verified Purchaser • {rev.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{rev.likes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More */}
      {visibleCount < reviews.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + 3)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
          >
            <ChevronDown className="w-4 h-4" />
            Load More Reviews ({reviews.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
};
