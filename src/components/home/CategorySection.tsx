import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Category } from '../../types';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface CategorySectionProps {
  categories: Category[];
  onSelectCategory: (catId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.bento-item', {
      opacity: 0,
      y: 35,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30">
              <Sparkles className="w-3 h-3" /> Curated Vault
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              [02] Collections
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Browse By Category
          </h2>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, index) => {
          const isLarge = index === 0 || index === 3;
          return (
            <motion.div
              key={cat.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`bento-item group relative rounded-3xl overflow-hidden glass-panel cursor-pointer min-h-[280px] flex flex-col justify-end p-6 border border-white/20 dark:border-white/10 shadow-xl hover:border-[#FF6B35]/50 transition-all ${
                isLarge ? 'md:col-span-2' : 'md:col-span-1'
              }`}
            >
              {/* Background Image */}
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

              {/* Content */}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/60 backdrop-blur-md text-[#FF6B35] border border-[#FF6B35]/30">
                    {cat.itemCount} Curations
                  </span>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#FF6B35] transition-colors shadow-lg">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {cat.name}
                </h3>

                {cat.description && (
                  <p className="text-xs text-slate-300 line-clamp-1 opacity-90 font-medium">
                    {cat.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
