import React from 'react';
import { Instagram, ShoppingBag } from 'lucide-react';

export const InstagramGrid: React.FC<{ onExploreShop: () => void }> = ({ onExploreShop }) => {
  const posts = [
    { id: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', tag: '@AuraHorizon' },
    { id: 2, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600', tag: '@AuraTimepiece' },
    { id: 3, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', tag: '@AuraRunner' },
    { id: 4, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600', tag: '@AuraCouture' },
  ];

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B35] uppercase tracking-widest flex items-center gap-1.5">
            <Instagram className="w-4 h-4" /> #AURALUXE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Shop The Look On Social
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={onExploreShop}
            className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
          >
            <img src={post.image} alt="social" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
              <ShoppingBag className="w-6 h-6 text-[#FF6B35]" />
              <span className="text-xs font-bold">{post.tag}</span>
              <span className="text-[10px] px-3 py-1 rounded-full bg-[#FF6B35] font-bold">Shop Item</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
