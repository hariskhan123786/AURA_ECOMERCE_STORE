import React, { useState, useEffect } from 'react';
import { Product, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotification } from '../../context/NotificationContext';
import { dbService } from '../../lib/supabase';
import {
  Star,
  ShoppingBag,
  Heart,
  RotateCw,
  Truck,
  ShieldCheck,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  Share2,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (p: Product) => void;
  allProducts: Product[];
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
  allProducts,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useNotification();

  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews' | 'shipping'>('details');

  // REVIEWS STATE
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    dbService.getReviews(product.id).then(setReviews);
  }, [product.id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newComment.trim()) return;

    const created = await dbService.addReview({
      productId: product.id,
      userId: 'user-anon',
      userName: 'Luxury Collector',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      rating: newRating,
      title: newTitle,
      comment: newComment,
      verifiedPurchase: true,
    });

    setReviews((prev) => [created, ...prev]);
    setNewTitle('');
    setNewComment('');
    showToast('Review submitted!', 'Thank you for your feedback.', 'success');
  };

  const activeInWishlist = isInWishlist(product.id);
  const relatedProducts = allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 3);

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 rounded-2xl glass-panel text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF6B35] flex items-center gap-2 border border-slate-200 dark:border-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      {/* MAIN TOP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT GALLERY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden glass-panel border border-white/20 dark:border-white/10 shadow-2xl bg-slate-900">
            <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedImage === img ? 'border-[#FF6B35] scale-105' : 'border-transparent opacity-60'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SPECS & PURCHASE */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-black uppercase text-[#FF6B35] tracking-widest">{product.brandName}</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400" /> {product.rating}
              </div>
              <span className="text-xs text-slate-400">({reviews.length} Verified Reviews)</span>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                In Stock ({product.stock} left)
              </span>
            </div>
          </div>

          {/* PRICE */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-slate-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* COLOR SELECTOR */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Color: <span className="text-[#FF6B35]">{selectedColor}</span>
              </label>
              <div className="flex items-center gap-3">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === c.name ? 'border-[#FF6B35] scale-110 shadow-md' : 'border-transparent opacity-80'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SIZE SELECTOR */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Size: <span className="text-[#FF6B35]">{selectedSize}</span>
                </label>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#FF6B35] font-semibold underline"
                >
                  Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
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

          {/* ACTIONS */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center rounded-2xl glass-pill border border-slate-200 dark:border-slate-800 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                addToCart(product, quantity, selectedColor, selectedSize);
                showToast(`Added ${product.title} to cart`, undefined, 'success');
              }}
              className="flex-1 py-4 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm shadow-xl shadow-[#FF6B35]/25 hover:bg-[#E85A24] transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Shopping Bag
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-4 rounded-2xl border transition-colors ${
                activeInWishlist ? 'bg-[#FF6B35] text-white' : 'glass-pill text-slate-700 dark:text-slate-200'
              }`}
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* TABS SECTION */}
      <div className="mt-16 space-y-8">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          {(['details', 'specs', 'reviews', 'shipping'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors capitalize ${
                activeTab === t ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-slate-400'
              }`}
            >
              {t} {t === 'reviews' ? `(${reviews.length})` : ''}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'details' && (
          <div className="glass-panel p-6 rounded-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
            <p>{product.description}</p>
            <p>
              Designed and engineered at the AURA Studio labs with rigorous quality control and aerospace-grade materials.
            </p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="glass-panel p-6 rounded-3xl space-y-2">
            {product.specs ? (
              Object.entries(product.specs).map(([key, val], idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500">{key}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{val}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Standard luxury specifications applied.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* WRITE REVIEW FORM */}
            <form onSubmit={handleAddReview} className="glass-panel p-6 rounded-3xl space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Write a Review</h4>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setNewRating(star)}>
                    <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Review Headline"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white"
                required
              />
              <textarea
                placeholder="Share your experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white"
                required
              />
              <button type="submit" className="py-2.5 px-6 rounded-xl bg-[#FF6B35] text-white font-bold text-xs">
                Submit Review
              </button>
            </form>

            {/* REVIEWS LIST */}
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="glass-panel p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{r.userName}</span>
                    <span className="text-[10px] text-slate-400">{r.createdAt}</span>
                  </div>
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <h5 className="font-bold text-xs">{r.title}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
