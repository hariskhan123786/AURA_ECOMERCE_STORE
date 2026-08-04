import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Brand } from '../../types';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface FeaturedBrandsProps {
  brands: Brand[];
  onExploreShop: () => void;
}

const BRAND_IMAGES: Record<string, string> = {
  'AURA Studio': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
  'Apple': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=400',
  'Nike Lab': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
  'Balenciaga': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400',
  'Bose': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400',
};

export const FeaturedBrands: React.FC<FeaturedBrandsProps> = ({ brands, onExploreShop }) => {
  // Duplicate for seamless marquee loop
  const doubled = [...brands, ...brands, ...brands];
  const sectionRef = useRef<HTMLElement>(null);

  // GSAP — header entrance
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        toggleActions: 'play none none none',
      },
    });
    tl.from('.brands-header', { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', immediateRender: false })
      .from('.brands-marquee', { opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, '-=0.3')
      .from('.brands-grid-card', { opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.55, ease: 'back.out(1.4)', immediateRender: false }, '-=0.3');
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="brands-header flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="geo-badge">[07] FEATURED BRANDS</span>
            <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-[#FF6B35]">
              PREMIUM PARTNERS
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Brands We Carry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Curated partnerships with the world's most iconic and innovative luxury houses.
          </p>
        </div>
        <button
          onClick={onExploreShop}
          className="magnetic-hover flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
        >
          Explore by Brand <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Marquee strip */}
      <div className="brands-marquee relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10 pointer-events-none" />

        <div className="marquee-wrapper overflow-hidden">
          <div className="marquee-track brands-marquee-scroll gap-5" style={{ display: 'flex' }}>
            {doubled.map((brand, i) => {
              const imgSrc = brand.logoUrl || BRAND_IMAGES[brand.name] || brand.logoUrl;
              return (
                <motion.div
                  key={`${brand.id}-${i}`}
                  whileHover={{ scale: 1.05, y: -4 }}
                  transition={{ duration: 0.25 }}
                  onClick={onExploreShop}
                  className="flex-none w-[180px] sm:w-[200px] glass-panel rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer border border-white/20 dark:border-white/10 hover:border-[#FF6B35]/40 hover:shadow-lg transition-all group"
                >
                  {/* Brand image/logo */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={imgSrc}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  <div className="text-center">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6B35] transition-colors">
                      {brand.name}
                    </h4>
                    {brand.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{brand.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-10 grid grid-cols-3 gap-6">
        {[
          { value: '50+', label: 'Partner Brands' },
          { value: '10K+', label: 'Products Curated' },
          { value: '4.9★', label: 'Average Brand Rating' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="brands-grid-card glass-panel rounded-2xl p-5 text-center border border-white/20 dark:border-white/10"
          >
            <p className="text-2xl sm:text-3xl font-black text-[#FF6B35]">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
