import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Category } from '../../types';
import { ArrowUpRight } from 'lucide-react';
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
      stagger: 0.12,
      duration: 0.85,
      ease: 'power4.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        toggleActions: 'play none none none',
      },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="geo-badge">[02] COLLECTIONS</span>
            <span className="font-mono-tag text-[10px] uppercase tracking-widest text-[#FF6B35]">
              STUDIO SYMMETRY GRID
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
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
              className={`bento-item group relative rounded-3xl overflow-hidden glass-panel cursor-pointer min-h-[260px] flex flex-col justify-end p-6 border border-white/20 dark:border-white/10 shadow-xl ${
                isLarge ? 'md:col-span-2' : 'md:col-span-1'
              }`}
            >
              {/* Background Image */}
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Content */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B35]">
                    {cat.itemCount} ITEMS
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#FF6B35] transition-colors">
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
