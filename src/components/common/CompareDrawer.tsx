import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { X, ShoppingBag, Star, Layers, Trash2 } from 'lucide-react';

export const CompareDrawer: React.FC = () => {
  const { compareList, removeFromCompare, clearCompare, isCompareOpen, closeCompare } = useCompare();
  const { addToCart } = useCart();

  if (!isCompareOpen || compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-end justify-center p-2 sm:p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCompare}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        {/* Floating Compare Panel */}
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl glass-panel rounded-3xl p-5 sm:p-6 z-10 shadow-2xl border border-white/20 dark:border-white/10 pointer-events-auto overflow-x-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF6B35]" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Product Comparison ({compareList.length}/4)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearCompare}
                className="px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
              <button
                onClick={closeCompare}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-[#FF6B35]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SIDE BY SIDE GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 min-w-[600px]">
            {compareList.map((product) => (
              <div
                key={product.id}
                className="glass-panel p-3 rounded-2xl flex flex-col justify-between gap-3 relative border border-slate-200 dark:border-slate-800"
              >
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/60 text-white hover:bg-rose-500 transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#FF6B35]">{product.brandName}</span>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">{product.title}</h4>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{product.rating}</span>
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">${product.price.toFixed(2)}</p>
                </div>

                <button
                  onClick={() => addToCart(product, 1)}
                  className="w-full py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E85A24] transition-colors flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
