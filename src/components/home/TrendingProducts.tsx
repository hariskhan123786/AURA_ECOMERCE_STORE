import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface TrendingProductsProps {
  products: Product[];
  onQuickView: (p: Product) => void;
  onExploreShop: () => void;
}

const TABS = [
  { id: 'all', label: 'All Showcase' },
  { id: 'cat-1', label: 'Cyber Tech' },
  { id: 'cat-2', label: 'Timepieces' },
  { id: 'cat-3', label: 'Apparel' },
  { id: 'cat-4', label: 'Footwear' },
];

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ products, onQuickView, onExploreShop }) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => p.categoryId === activeTab);

  // Batch-reveal cards as they enter viewport
  useGSAP(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.batch('.trend-card', {
        onEnter: (elements) => {
          gsap.from(elements, {
            opacity: 0,
            y: 28,
            stagger: 0.09,
            duration: 0.75,
            ease: 'power3.out',
            immediateRender: false,
          });
        },
        start: 'top bottom',
        once: true,
      });
    }, gridRef);
    return () => ctx.revert();
  }, { scope: gridRef, dependencies: [activeTab] });



  return (
    <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header + tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="geo-badge flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FF6B35]" /> [04] TRENDING
            </span>
            <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-[#FF6B35]">
              HIGH DEMAND CATALOG
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trending & New Arrivals
          </h2>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 relative ${
                activeTab === tab.id
                  ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/25'
                  : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-[#FF6B35] border border-transparent hover:border-[#FF6B35]/30'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl bg-[#FF6B35] -z-10"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={gridRef}
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filteredProducts.slice(0, 8).map((product) => (
            <div key={product.id} className="trend-card">
              <ProductCard product={product} onQuickView={onQuickView} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No products in this category yet.</p>
        </div>
      )}

      <div className="mt-10 text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExploreShop}
          className="py-3.5 px-8 rounded-2xl glass-panel font-bold text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-flex items-center gap-2 shadow-sm"
        >
          View Complete Catalog ({products.length} Items) <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </section>
  );
};
