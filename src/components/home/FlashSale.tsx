import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { Flame, Clock, ArrowRight, Zap } from 'lucide-react';

interface FlashSaleProps {
  products: Product[];
  onQuickView: (p: Product) => void;
  onExploreShop: () => void;
}

function useCountdown(endTime: Date) {
  const getRemaining = () => {
    const diff = Math.max(0, endTime.getTime() - Date.now());
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export const FlashSale: React.FC<FlashSaleProps> = ({ products, onQuickView, onExploreShop }) => {
  const flashProducts = products.filter((p) => p.isFlashSale || p.discountPercentage);
  const endTime = new Date(Date.now() + 14 * 3600000 + 32 * 60000 + 45000);
  const { hours, minutes, seconds } = useCountdown(endTime);

  if (flashProducts.length === 0) return null;

  const TimeBlock = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={val}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 text-white font-black text-2xl flex items-center justify-center backdrop-blur-md shadow-lg"
        >
          {String(val).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
      <span className="text-[9px] font-extrabold text-white/60 mt-1.5 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* FLASH SALE HEADER BANNER */}
      <div className="glass-panel rounded-3xl sm:rounded-[28px] overflow-hidden mb-8 relative border border-white/15">
        {/* Deep dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-[#170A04] to-slate-950" />

        {/* Glowing orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-[#FF6B35]/25 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-amber-500/15 blur-[60px] rounded-full pointer-events-none" />

        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-7">
          {/* Left */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#FF6B35]/35">
                <Flame className="w-3 h-3 animate-bounce" /> Flash Drop
              </span>
              <span className="font-mono-tag text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">
                Limited Time
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Midnight Cyber<br />
              <span className="text-gradient-primary">Sale Event</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xs">
              Exclusive price drops on flagship audio, footwear and luxury timepieces. Don't miss it.
            </p>

            <button
              onClick={onExploreShop}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E85A24] transition-colors shadow-md shadow-[#FF6B35]/30"
            >
              <Zap className="w-3.5 h-3.5" /> Shop All Deals <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="w-4 h-4 text-[#FF6B35]" />
              <span className="uppercase tracking-widest">Sale Ends In</span>
            </div>
            <div className="flex items-center gap-3">
              <TimeBlock val={hours} label="HRS" />
              <span className="text-white/50 font-black text-2xl mb-3">:</span>
              <TimeBlock val={minutes} label="MIN" />
              <span className="text-white/50 font-black text-2xl mb-3">:</span>
              <TimeBlock val={seconds} label="SEC" />
            </div>
          </div>
        </div>
      </div>

      {/* FLASH SALE PRODUCTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {flashProducts.slice(0, 3).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <ProductCard product={product} onQuickView={onQuickView} />
            {/* Stock urgency bar */}
            <div className="mt-2.5 px-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#FF6B35]" />
                  {Math.min(88, 100 - product.stock * 2)}% Claimed
                </span>
                <span className="text-[#FF6B35] font-extrabold">
                  Only {product.stock} Left!
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(88, 100 - product.stock * 2)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.15 + 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-amber-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
