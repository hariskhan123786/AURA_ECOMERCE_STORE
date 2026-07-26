import React, { useState, useMemo } from 'react';
import { Product, Category, Brand } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { useCart } from '../../context/CartContext';
import { SlidersHorizontal, Grid, List, RotateCcw, Search, Star, Check } from 'lucide-react';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  selectedCategoryId: string;
  onSelectCategory: (catId: string) => void;
  onQuickView: (p: Product) => void;
  searchQuery: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  brands,
  selectedCategoryId,
  onSelectCategory,
  onQuickView,
  searchQuery,
}) => {
  const { addToCart } = useCart();
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);

  // RESET FILTERS
  const handleResetFilters = () => {
    onSelectCategory('all');
    setMaxPrice(2000);
    setMinRating(0);
    setSelectedBrands([]);
    setInStockOnly(false);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((b) => b !== brandId) : [...prev, brandId]
    );
  };

  // FILTERED & SORTED PRODUCTS
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesCategory = p.categoryName.toLowerCase().includes(q);
          const matchesTag = p.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesCategory && !matchesTag) return false;
        }

        // Category filter
        if (selectedCategoryId && selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
          return false;
        }

        // Price filter
        if (p.price > maxPrice) return false;

        // Rating filter
        if (p.rating < minRating) return false;

        // Brand filter
        if (selectedBrands.length > 0 && p.brandId && !selectedBrands.includes(p.brandId)) {
          return false;
        }

        // In stock
        if (inStockOnly && p.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, searchQuery, selectedCategoryId, maxPrice, minRating, selectedBrands, inStockOnly, sortBy]);

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* SHOP BANNER HEADER */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-white/20 dark:border-white/10 bg-gradient-to-r from-slate-900 via-[#131520] to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B35] uppercase tracking-widest">
            AURA CATALOGUE 2026
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">Explore High-End Collection</h1>
          <p className="text-xs text-slate-400 mt-1">
            Showing {filteredProducts.length} curated luxury items with real-time stock sync.
          </p>
        </div>

        <button
          onClick={() => setIsFilterMobileOpen(!isFilterMobileOpen)}
          className="lg:hidden px-4 py-2.5 rounded-2xl bg-[#FF6B35] text-white text-xs font-bold flex items-center gap-2 shadow-md"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters ({filteredProducts.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT: ADVANCED FILTERS SIDEBAR */}
        <aside className={`lg:block ${isFilterMobileOpen ? 'block' : 'hidden'} space-y-6 glass-panel rounded-3xl p-6 border border-white/20 dark:border-white/10 h-fit sticky top-24`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" /> Filters
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* CATEGORY FILTER */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Categories
            </label>
            <div className="space-y-1">
              <button
                onClick={() => onSelectCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                  !selectedCategoryId || selectedCategoryId === 'all'
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Categories</span>
                <span>{products.length}</span>
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedCategoryId === c.id
                      ? 'bg-[#FF6B35] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span>{c.itemCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PRICE SLIDER */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-900 dark:text-white uppercase tracking-wider">Max Price</span>
              <span className="text-[#FF6B35]">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FF6B35] cursor-pointer"
            />
          </div>

          {/* BRAND FILTERS */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Brands
            </label>
            <div className="space-y-1.5">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.id)}
                    onChange={() => toggleBrand(b.id)}
                    className="accent-[#FF6B35] rounded"
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* RATING FILTER */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Minimum Rating
            </label>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                    minRating === r
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'glass-pill text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {r === 0 ? 'Any' : `${r}★`}
                </button>
              ))}
            </div>
          </div>

          {/* IN STOCK ONLY TOGGLE */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#FF6B35] rounded"
              />
              <span>In Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* RIGHT: PRODUCTS GRID & SORT BAR */}
        <main className="lg:col-span-3 space-y-6">
          {/* SORT & VIEW CONTROLS */}
          <div className="glass-panel rounded-2xl p-4 border border-white/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Showing <span className="text-[#FF6B35] font-black">{filteredProducts.length}</span> Products
            </span>

            <div className="flex items-center gap-4">
              {/* SORT DROPDOWN */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="featured">Featured Drops</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>

              {/* VIEW SWITCHER */}
              <div className="flex items-center rounded-xl glass-pill p-1 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-[#FF6B35] text-white' : 'text-slate-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-[#FF6B35] text-white' : 'text-slate-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCT LISTING */}
          {filteredProducts.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-white/10">
              <p className="text-sm font-semibold text-slate-500">No luxury items match your current filters.</p>
              <button
                onClick={handleResetFilters}
                className="py-2.5 px-6 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onQuickView(p)}
                  className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-6 cursor-pointer border border-white/20 dark:border-white/10 hover:border-[#FF6B35] transition-all"
                >
                  <img src={p.images[0]} alt={p.title} className="w-28 h-28 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold text-[#FF6B35] uppercase">{p.categoryName}</span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{p.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {p.rating} ({p.reviewCount} reviews)
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-xl font-black text-slate-900 dark:text-white">${p.price.toFixed(2)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, 1);
                      }}
                      className="py-2.5 px-5 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs shadow-md hover:bg-[#E85A24]"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
