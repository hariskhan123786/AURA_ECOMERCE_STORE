import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Home sections
import { HeroCanvas } from './components/home/HeroCanvas';
import { FlashSale } from './components/home/FlashSale';
import { CategorySection } from './components/home/CategorySection';
import { TrendingProducts } from './components/home/TrendingProducts';
import { NewArrivals } from './components/home/NewArrivals';
import { BestSellers } from './components/home/BestSellers';
import { FeaturedBrands } from './components/home/FeaturedBrands';
import { ReviewsSection } from './components/home/ReviewsSection';
import { InstagramGrid } from './components/home/InstagramGrid';

// Pages
import { ShopPage } from './components/shop/ShopPage';
import { ProductDetailPage } from './components/product/ProductDetailPage';
import { MultiStepCheckout } from './components/checkout/MultiStepCheckout';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminPanel } from './components/admin/AdminPanel';

// Overlays & Modals
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/common/QuickViewModal';
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { SupabaseStatusModal } from './components/common/SupabaseStatusModal';
import { CompareDrawer } from './components/common/CompareDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { AdminLoginModal } from './components/common/AdminLoginModal';
import { FluidBackground } from './components/common/FluidBackground';
import { MagneticCursor, ScrollProgressBar } from './components/common/PremiumEffects';

// Data & Types
import { dbService } from './lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_BRANDS } from './data/mockData';
import { Product, Category, Brand } from './types';

// Motion
import { motion, AnimatePresence } from 'motion/react';

// ─────────────────────────────────────────────
// PAGE TRANSITION WRAPPER
// ─────────────────────────────────────────────
const PageTransition: React.FC<{ children: React.ReactNode; id: string }> = ({ children, id }) => (
  <motion.div
    key={id}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────
// SECTION DIVIDER
// ─────────────────────────────────────────────
const Divider: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-8">
    <div className="section-divider" />
  </div>
);

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
function MainApp() {
  const [activeView, setActiveView] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getProducts();
      setProducts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Smooth scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView, selectedProduct?.id]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setActiveView('product');
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setActiveView('shop');
  };

  // Skeleton grid for loading state
  const SkeletonGrid = () => (
    <div className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-3xl p-4">
            <div className="skeleton aspect-square rounded-2xl mb-3" />
            <div className="skeleton h-3 rounded-full mb-2 w-1/2" />
            <div className="skeleton h-4 rounded-full mb-2" />
            <div className="skeleton h-3 rounded-full w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans antialiased selection:bg-[#FF6B35] selection:text-white transition-colors duration-400">

      {/* SCROLL PROGRESS BAR */}
      <ScrollProgressBar />

      {/* MAGNETIC CURSOR — desktop only */}
      <MagneticCursor />

      {/* AMBIENT CANVAS BACKGROUND — physics particles + fluid blobs */}
      <FluidBackground />

      {/* NAVBAR */}
      <Navbar
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        products={products}
        onSelectCategory={handleSelectCategory}
        onSearchQueryChange={setSearchQuery}
        currentSearchQuery={searchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* MAIN CONTENT with page transitions */}
      <main className="min-h-[60vh]">
        <AnimatePresence mode="wait">

          {/* HOME PAGE */}
          {activeView === 'home' && (
            <PageTransition id="home">
              {isLoading ? (
                <SkeletonGrid />
              ) : (
                <>
                  <HeroCanvas
                    products={products}
                    onSelectProduct={handleSelectProduct}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <FlashSale
                    products={products}
                    onQuickView={setQuickViewProduct}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <CategorySection
                    categories={categories}
                    onSelectCategory={handleSelectCategory}
                  />
                  <Divider />
                  <NewArrivals
                    products={products}
                    onQuickView={setQuickViewProduct}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <TrendingProducts
                    products={products}
                    onQuickView={setQuickViewProduct}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <BestSellers
                    products={products}
                    onQuickView={setQuickViewProduct}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <FeaturedBrands
                    brands={brands}
                    onExploreShop={() => setActiveView('shop')}
                  />
                  <Divider />
                  <ReviewsSection />
                  <Divider />
                  <InstagramGrid onExploreShop={() => setActiveView('shop')} />
                </>
              )}
            </PageTransition>
          )}

          {/* SHOP PAGE */}
          {activeView === 'shop' && (
            <PageTransition id="shop">
              <ShopPage
                products={products}
                categories={categories}
                brands={brands}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onQuickView={setQuickViewProduct}
                searchQuery={searchQuery}
              />
            </PageTransition>
          )}

          {/* PRODUCT DETAIL */}
          {activeView === 'product' && selectedProduct && (
            <PageTransition id={`product-${selectedProduct.id}`}>
              <ProductDetailPage
                product={selectedProduct}
                onBack={() => setActiveView('shop')}
                onSelectProduct={handleSelectProduct}
                allProducts={products}
              />
            </PageTransition>
          )}

          {/* CHECKOUT */}
          {activeView === 'checkout' && (
            <PageTransition id="checkout">
              <MultiStepCheckout
                onOrderCompleted={() => setActiveView('home')}
                onCancel={() => setActiveView('shop')}
              />
            </PageTransition>
          )}

          {/* USER DASHBOARD (wishlist, orders, etc.) */}
          {activeView === 'dashboard' && (
            <PageTransition id="dashboard">
              <UserDashboard onQuickViewProduct={setQuickViewProduct} />
            </PageTransition>
          )}

          {/* ADMIN PANEL — requires admin login */}
          {activeView === 'admin' && (
            <PageTransition id="admin">
              <AdminPanel products={products} onRefreshProducts={loadProducts} />
            </PageTransition>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <Footer onSelectCategory={handleSelectCategory} />

      {/* ─── OVERLAY STACK ─── */}
      <CartDrawer onProceedToCheckout={() => setActiveView('checkout')} />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
      />

      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <CompareDrawer />

      {/* ADMIN LOGIN MODAL — global, triggered from navbar */}
      <AdminLoginModal />

      <ToastContainer />
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT WITH ALL PROVIDERS
// ─────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <NotificationProvider>
                <MainApp />
              </NotificationProvider>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
