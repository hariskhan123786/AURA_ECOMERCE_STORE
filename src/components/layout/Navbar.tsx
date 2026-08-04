import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth, useSecretAdminTrigger } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../types';
import {
  Search,
  ShoppingBag,
  Heart,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  LogOut,
  Shield,
  X,
  Menu,
  ArrowRight,
  Zap,
  Watch,
  Shirt,
  Layers,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  onOpenAiAssistant: () => void;
  products: Product[];
  onSelectCategory: (catId: string) => void;
  onSearchQueryChange: (q: string) => void;
  currentSearchQuery: string;
  activeView: string;
  setActiveView: (view: string) => void;
}

const MEGA_MENU_CATEGORIES = [
  { id: 'cat-1', label: 'Cyber Tech & Audio', icon: Cpu, desc: '18 items' },
  { id: 'cat-2', label: 'Luxury Timepieces', icon: Watch, desc: '12 items' },
  { id: 'cat-3', label: 'Haute Apparel', icon: Shirt, desc: '24 items' },
  { id: 'cat-4', label: 'Performance Footwear', icon: ShoppingBag, desc: '16 items' },
  { id: 'cat-5', label: 'Leather Goods', icon: Layers, desc: '15 items' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAiAssistant,
  products,
  onSelectCategory,
  onSearchQueryChange,
  currentSearchQuery,
  activeView,
  setActiveView,
}) => {
  const { admin, isAdminAuthenticated, adminLogout, openAdminLogin } = useAdminAuth();
  const { openCart, totalItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── SECRET ADMIN TRIGGER ─────────────────────────────────────────
  // Admin login can only be opened via:
  //   1. Keyboard: Ctrl+Shift+A (Cmd+Shift+A on Mac)
  //   2. URL hash: /#admin-access
  //   3. 5 rapid clicks on the invisible dot near the logo
  const { handleSecretClick } = useSecretAdminTrigger(
    useCallback(() => openAdminLogin(), [openAdminLogin])
  );

  // Scroll-aware navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredSearchResults = currentSearchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            p.categoryName.toLowerCase().includes(currentSearchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const navLinkClass = (view: string) =>
    `transition-colors font-bold text-[11px] tracking-wider uppercase py-1 border-b-2 ${
      activeView === view
        ? 'text-[#FF6B35] border-[#FF6B35]'
        : 'text-slate-700 dark:text-slate-300 border-transparent hover:text-[#FF6B35]'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-[#FF6B35] to-slate-900 text-white text-[10px] font-bold py-1.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-3 overflow-hidden">
        <motion.span
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <Zap className="w-3 h-3" />
          SPECIAL DROP: USE CODE <span className="underline decoration-white underline-offset-2 ml-0.5">AURA20</span> FOR 20% OFF
        </motion.span>
        <span className="hidden sm:inline text-white/50">•</span>
        <span className="hidden sm:inline">FREE WORLDWIDE EXPRESS SHIPPING OVER $200</span>
      </div>

      {/* MAIN NAVBAR */}
      <nav
        className={`glass-panel border-b px-4 sm:px-8 flex items-center justify-between gap-4 transition-all duration-400 ${
          isScrolled
            ? 'py-2.5 border-white/20 shadow-xl'
            : 'py-4 border-transparent'
        }`}
      >
        {/* LOGO */}
        <div className="flex items-center gap-7">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-9 h-9 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF6B35]/35"
              >
                A
              </motion.div>
              {/* Secret invisible trigger — 5 rapid clicks opens admin login */}
              <button
                onClick={(e) => { e.stopPropagation(); handleSecretClick(); }}
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full opacity-0 cursor-default"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <div>
              <span className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                AURA <span className="text-[#FF6B35]">LUXE</span>
              </span>
              <span className="block text-[8.5px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase -mt-0.5">
                HAUTE COUTURE & TECH
              </span>
            </div>
          </motion.button>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center gap-7">
            <button onClick={() => setActiveView('home')} className={navLinkClass('home')}>
              Home
            </button>

            {/* MEGA MENU */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button
                onClick={() => setActiveView('shop')}
                className={`${navLinkClass('shop')} flex items-center gap-1`}
              >
                Catalog
                <motion.span animate={{ rotate: isMegaMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3 h-3 mt-0.5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {isMegaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 w-[500px] mt-3 glass-panel-strong rounded-3xl p-5 shadow-2xl border border-white/25 dark:border-white/10 z-50"
                  >
                    <p className="text-[9px] font-extrabold text-[#FF6B35] uppercase tracking-widest mb-3 px-1">
                      Browse Categories
                    </p>
                    <div className="grid grid-cols-1 gap-1 mb-4">
                      {MEGA_MENU_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { onSelectCategory(cat.id); setActiveView('shop'); setIsMegaMenuOpen(false); }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#FF6B35]/08 group transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center group-hover:bg-[#FF6B35]/15 transition-colors shrink-0">
                            <cat.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-[#FF6B35] transition-colors" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#FF6B35] transition-colors block">
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-slate-400">{cat.desc}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                      <button
                        onClick={() => { setActiveView('shop'); setIsMegaMenuOpen(false); }}
                        className="w-full py-2.5 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#E85A24] transition-colors flex items-center justify-center gap-1.5"
                      >
                        View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* SEARCH */}
        <div className="flex-1 max-w-sm hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              value={currentSearchQuery}
              onChange={(e) => { onSearchQueryChange(e.target.value); if (activeView !== 'shop') setActiveView('shop'); }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search luxury tech, sneakers, timepieces..."
              className={`w-full bg-slate-100 dark:bg-slate-900/80 border rounded-full py-2.5 pl-10 pr-9 text-[11px] font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${
                isSearchFocused
                  ? 'border-[#FF6B35] ring-3 ring-[#FF6B35]/15'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            <Search className={`w-3.5 h-3.5 absolute left-3.5 top-3 transition-colors ${isSearchFocused ? 'text-[#FF6B35]' : 'text-slate-400'}`} />
            {currentSearchQuery && (
              <button onClick={() => onSearchQueryChange('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results */}
          <AnimatePresence>
            {isSearchFocused && currentSearchQuery.trim() && filteredSearchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-full left-0 right-0 mt-2 glass-panel-strong rounded-2xl p-2 shadow-2xl border border-white/25 dark:border-white/10 z-50 space-y-0.5"
              >
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-1 pb-0.5">Results</p>
                {filteredSearchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onSearchQueryChange(''); setIsSearchFocused(false); setActiveView('shop'); }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 w-full text-left transition-colors"
                  >
                    <img src={p.images[0]} alt={p.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[11px] font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</h5>
                      <p className="text-[10px] font-bold text-[#FF6B35]">${p.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">
          {/* AI Stylist */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenAiAssistant}
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-amber-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/25 hover:shadow-[#FF6B35]/40 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Stylist</span>
          </motion.button>


          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl glass-pill hover:text-[#FF6B35] transition-colors"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={theme}
                initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, rotate: 180, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Wishlist */}
          <button
            onClick={() => setActiveView('dashboard')}
            className="relative p-2.5 rounded-2xl glass-pill hover:text-[#FF6B35] transition-colors hidden sm:flex"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[9px] font-black flex items-center justify-center"
              >
                {wishlist.length}
              </motion.span>
            )}
          </button>

          {/* Cart */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openCart}
            className="relative p-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-[#FF6B35] dark:hover:bg-[#FF6B35] dark:hover:text-white transition-colors shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <AnimatePresence>
              {totalItemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#FF6B35] text-white text-[9px] font-black border-2 border-white dark:border-slate-900 leading-none min-w-[18px] text-center"
                >
                  {totalItemsCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>



          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2.5 rounded-2xl glass-pill"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[9998] flex justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xs h-full glass-panel-strong border-l border-white/15 flex flex-col p-6 space-y-6 shadow-2xl overflow-y-auto"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center font-black text-white text-base">A</div>
                  <span className="font-extrabold text-slate-900 dark:text-white">AURA LUXE</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl glass-pill text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => { onSearchQueryChange(e.target.value); if (activeView !== 'shop') setActiveView('shop'); setIsMobileMenuOpen(false); }}
                  placeholder="Search products..."
                  className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              {/* Nav links */}
              <nav className="space-y-1">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'shop', label: 'Shop' },
                ].map((link) => (
                  <button
                    key={link.id}
                    onClick={() => { setActiveView(link.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                      activeView === link.id
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}


              </nav>

              {/* Categories */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">Categories</p>
                <div className="space-y-1">
                  {MEGA_MENU_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { onSelectCategory(cat.id); setActiveView('shop'); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#FF6B35] hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2.5"
                    >
                      <cat.icon className="w-4 h-4 shrink-0" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom actions */}
              <div className="mt-auto space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex-1 py-2.5 rounded-2xl glass-pill font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={() => { openCart(); setIsMobileMenuOpen(false); }}
                    className="relative flex-1 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Cart {totalItemsCount > 0 && `(${totalItemsCount})`}
                  </button>
                </div>

                {!isAdminAuthenticated ? (
                  <button
                    onClick={() => { openAdminLogin(); setIsMobileMenuOpen(false); }}
                    className="w-full py-2.5 rounded-2xl border border-[#FF6B35]/40 text-[#FF6B35] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#FF6B35]/08 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin Login
                  </button>
                ) : (
                  <button
                    onClick={() => { adminLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full py-2.5 rounded-2xl border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500/08 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out Admin
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
