import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { ShoppingBag, Star, ArrowRight, Trophy, Medal, Award } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface BestSellersProps {
  products: Product[];
  onQuickView: (p: Product) => void;
  onExploreShop: () => void;
}

const RANK_CONFIG = [
  { icon: Trophy, color: '#FFD700', label: '#1 Best Seller', bg: 'from-yellow-500/20 to-amber-500/05' },
  { icon: Medal, color: '#C0C0C0', label: '#2 Top Seller', bg: 'from-slate-400/20 to-slate-300/05' },
  { icon: Award, color: '#CD7F32', label: '#3 Popular', bg: 'from-orange-700/20 to-orange-600/05' },
];

export const BestSellers: React.FC<BestSellersProps> = ({ products, onQuickView, onExploreShop }) => {
  const { addToCart } = useCart();
  const { showToast } = useNotification();
  const sectionRef = useRef<HTMLElement>(null);

  const bestSellers = [...products]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 5);

  if (bestSellers.length === 0) return null;

  const [top, ...rest] = bestSellers;

  // GSAP — cinematic stagger reveal
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        toggleActions: 'play none none none',
      },
    });
    tl.from('.bestseller-hero', { opacity: 0, x: -40, duration: 0.8, ease: 'power3.out', immediateRender: false })
      .from('.bestseller-side-card', { opacity: 0, x: 40, stagger: 0.12, duration: 0.7, ease: 'power3.out', immediateRender: false }, '-=0.5');
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="geo-badge flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-[#FF6B35]" /> [06] BEST SELLERS
            </span>
            <span className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-[#FF6B35]">
              CUSTOMER FAVORITES
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Most Loved by Clients
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Ranked by verified purchase reviews from our global luxury community.
          </p>
        </div>
        <button
          onClick={onExploreShop}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-xs font-bold hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
        >
          Full Catalog <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FEATURED #1 BEST SELLER — large */}
        <div
          onClick={() => onQuickView(top)}
          className="bestseller-hero lg:col-span-5 glass-panel rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 cursor-pointer group relative bg-gradient-to-br from-yellow-500/20 to-amber-500/05 hover:border-yellow-400/40 transition-all product-card-hover"
        >
          {/* Rank badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/90 backdrop-blur-md shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-yellow-900" />
            <span className="text-[10px] font-black text-yellow-900 uppercase tracking-wider">#1 Best Seller</span>
          </div>

          <div className="aspect-[4/3] relative overflow-hidden">
            <img
              src={top.images[0]}
              alt={top.title}
              className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div className="p-6 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: Math.floor(top.rating || 0) }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                ({top.reviewCount} reviews)
              </span>
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#FF6B35] transition-colors">
              {top.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{top.description}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
              <span className="text-xl font-black text-[#FF6B35]">${top.price.toFixed(2)}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); addToCart(top, 1); showToast(`Added to cart`, top.title, 'success'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E85A24] transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
              </motion.button>
            </div>
          </div>
        </div>

        {/* RIGHT — Smaller ranked items */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {rest.slice(0, 4).map((product, i) => {
            const rank = RANK_CONFIG[i + 1] || RANK_CONFIG[2];
            const RankIcon = rank?.icon || Award;

            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="bestseller-side-card glass-panel rounded-2xl p-4 flex gap-4 items-center cursor-pointer group hover:border-[#FF6B35]/40 hover:shadow-lg transition-all"
              >
                {/* Rank badge */}
                <div className="shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: rank?.color + '20', color: rank?.color }}>
                  {i + 2}
                </div>

                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(Math.floor(product.rating || 4))].map((_, j) => (
                      <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-0.5">({product.reviewCount})</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#FF6B35] transition-colors">
                    {product.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{product.categoryName}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-base text-slate-900 dark:text-white">${product.price.toFixed(2)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(product, 1); showToast('Added to cart', product.title, 'success'); }}
                    className="mt-1.5 p-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#FF6B35] dark:hover:bg-[#FF6B35] dark:hover:text-white transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
