import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { formatPKR } from '../../lib/currency';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RotateCw, Check } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewFullDetails?: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onViewFullDetails,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { showToast } = useNotification();

  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [is360Mode, setIs360Mode] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = product.frames360?.length ? product.frames360 : product.images;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    showToast(`Added ${quantity}x ${product.title} to cart`, undefined, 'success');
    onClose();
  };

  const handleNext360Frame = () => {
    setFrameIndex((prev) => (prev + 1) % frames.length);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 z-10 shadow-2xl border border-white/20 dark:border-white/10 my-auto overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-[#FF6B35] transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* LEFT: Gallery & 360 viewer */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
                <img
                  src={is360Mode ? frames[frameIndex] : selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />

                {/* 360 View Toggle Button */}
                <button
                  onClick={() => setIs360Mode(!is360Mode)}
                  className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-colors ${
                    is360Mode
                      ? 'bg-[#FF6B35] text-white shadow-lg'
                      : 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-white'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${is360Mode ? 'animate-spin' : ''}`} />
                  {is360Mode ? '360° Mode Active' : '360° View'}
                </button>

                {is360Mode && (
                  <button
                    onClick={handleNext360Frame}
                    className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-md hover:bg-[#FF6B35]"
                  >
                    Rotate Frame ({frameIndex + 1}/{frames.length})
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {!is360Mode && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImage === img
                          ? 'border-[#FF6B35] scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Specs & Options */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-[#FF6B35] uppercase tracking-wider">{product.brandName}</span>
                  <span>•</span>
                  <span>{product.categoryName}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {product.title}
                </h2>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400">({product.reviewCount} customer reviews)</span>
                  <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} left)
                  </span>
                </div>
              </div>

              {/* PRICE */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatPKR(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    {formatPKR(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {product.description}
              </p>

              {/* COLOR SELECTION */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Color: <span className="text-[#FF6B35] font-bold">{selectedColor}</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    {product.colors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(c.name)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          selectedColor === c.name
                            ? 'border-[#FF6B35] scale-110 shadow-md'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SIZE SELECTION */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Size: <span className="text-[#FF6B35] font-bold">{selectedSize}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedSize === s
                            ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                            : 'glass-pill text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUANTITY & ADD TO CART */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center rounded-2xl glass-pill border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm shadow-xl shadow-[#FF6B35]/25 hover:bg-[#E85A24] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Shopping Bag
                </motion.button>
              </div>

              {/* SHIPPING TRUST BADGES */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FF6B35]" /> Nationwide Delivery (PK)
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> 2-Year Aura Warranty
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
