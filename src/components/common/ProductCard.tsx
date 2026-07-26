import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useNotification } from '../../context/NotificationContext';
import { Heart, ShoppingBag, Eye, Star, Layers, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare } = useCompare();
  const { showToast } = useNotification();
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const activeInWishlist = isInWishlist(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    showToast(`Added ${product.title} to cart`, undefined, 'success');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
    showToast(
      activeInWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
      product.title,
      activeInWishlist ? 'info' : 'success'
    );
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCompare(product);
    showToast('Added to Compare', product.title, 'info');
  };

  const secondImage = product.images[1] || product.images[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onQuickView && onQuickView(product)}
      className={`group relative glass-panel rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-[#FF6B35]/35 hover:-translate-y-1.5 ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      {/* IMAGE AREA */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900/80 mb-3">
        {/* Skeleton loader */}
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}

        {/* Product image with hover-flip */}
        <img
          src={isHovered && secondImage !== product.images[0] ? secondImage : product.images[0]}
          alt={product.title}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isHovered ? 'scale-[1.08]' : 'scale-100'
          } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.discountPercentage && product.discountPercentage > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/35">
              -{product.discountPercentage}% OFF
            </span>
          ) : null}
          {product.isNew && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 backdrop-blur-md">
              NEW
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-white flex items-center gap-1 backdrop-blur-md">
              <AlertTriangle className="w-2.5 h-2.5" /> Only {product.stock} left
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleToggleWishlist}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${
              activeInWishlist
                ? 'bg-[#FF6B35] text-white shadow-[#FF6B35]/30'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-[#FF6B35] hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeInWishlist ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleCompare}
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-[#FF6B35] flex items-center justify-center transition-all shadow-md backdrop-blur-md"
          >
            <Layers className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Quick View hover button */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView && onQuickView(product); }}
            className="w-full py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white font-semibold text-xs tracking-wide shadow-xl backdrop-blur-xl hover:bg-[#FF6B35] hover:text-white dark:hover:bg-[#FF6B35] dark:hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        </div>
      </div>

      {/* PRODUCT META */}
      <div className="flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span className="truncate">{product.categoryName}</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold shrink-0 ml-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-[#FF6B35] transition-colors leading-snug">
            {product.title}
          </h3>
        </div>

        {/* Color swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 my-0.5">
            {product.colors.slice(0, 5).map((c, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-slate-400 font-medium">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-xl transition-colors shadow-md ${
              isOutOfStock
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-[#FF6B35] dark:hover:bg-[#FF6B35] dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
