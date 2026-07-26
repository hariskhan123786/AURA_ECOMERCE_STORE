import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface NewArrivalsProps {
  products: Product[];
  onQuickView: (p: Product) => void;
  onExploreShop: () => void;
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({ products, onQuickView, onExploreShop }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const newProducts = products.filter((p) => p.isNew).slice(0, 8);

  if (newProducts.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({ left: dir === 'right' ? width * 0.75 : -width * 0.75, behavior: 'smooth' });
  };

  return (
    <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="geo-badge flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FF6B35]" /> [02] NEW ARRIVALS
            </span>
            <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-[#FF6B35]">
              JUST DROPPED
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Fresh Off the Runway
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            The latest additions to the AURA LUXE catalog — curated for the discerning collector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-2xl glass-pill hover:text-[#FF6B35] transition-colors border border-slate-200 dark:border-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-2xl glass-pill hover:text-[#FF6B35] transition-colors border border-slate-200 dark:border-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreShop}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-[#FF6B35] dark:hover:bg-[#FF6B35] dark:hover:text-white transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {newProducts.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="flex-none w-[260px] sm:w-[280px] snap-start"
          >
            {/* NEW badge overlay */}
            <div className="relative">
              <div className="absolute -top-2 -left-2 z-20 px-2.5 py-1 rounded-full bg-[#FF6B35] text-white text-[9px] font-black tracking-wider shadow-lg shadow-[#FF6B35]/35 animate-pulse-glow">
                ✦ NEW
              </div>
              <ProductCard product={product} onQuickView={onQuickView} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
