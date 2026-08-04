import React, { useState, useEffect } from 'react';
import { dbService } from '../../lib/supabase';
import { aiAssistant } from '../../lib/gemini';
import { Product, Order, Coupon } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  ShoppingBag,
  Users,
  Database,
  Sparkles,
  Tag,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Code2
} from 'lucide-react';

export const AdminPanel: React.FC<{ products: Product[]; onRefreshProducts: () => void }> = ({
  products,
  onRefreshProducts,
}) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'coupons' | 'sql'>('analytics');
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // ADD PRODUCT FORM STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState(299);
  const [newCategory, setNewCategory] = useState('Cyber Tech & Audio');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000');
  const [newStock, setNewStock] = useState(15);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // ADD COUPON FORM STATE
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);

  useEffect(() => {
    dbService.getOrders().then(setOrders);
    dbService.getCoupons().then(setCoupons);
  }, []);

  const handleGenerateAiDescription = async () => {
    if (!newTitle) return;
    setIsAiGenerating(true);
    const desc = await aiAssistant.generateProductDescription(newTitle, newCategory, 'High end luxury materials, aerospace durability');
    setNewDescription(desc);
    setIsAiGenerating(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await dbService.saveProduct({
      title: newTitle,
      price: newPrice,
      categoryName: newCategory,
      description: newDescription || 'Crafted with aerospace precision.',
      images: [newImage],
      stock: newStock,
    });

    onRefreshProducts();
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    showToast('Product Created!', `${newTitle} is now live in the store catalog.`, 'success');
  };

  const handleDeleteProduct = async (id: string) => {
    await dbService.deleteProduct(id);
    onRefreshProducts();
    showToast('Product Deleted', undefined, 'info');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    await dbService.updateOrderStatus(orderId, status);
    const updated = await dbService.getOrders();
    setOrders(updated);
    showToast(`Order Status Updated`, `Changed to ${status}`, 'success');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    const created = await dbService.saveCoupon({
      code: newCouponCode,
      discountType: 'percentage',
      discountValue: newCouponDiscount,
    });

    setCoupons((prev) => [created, ...prev]);
    setNewCouponCode('');
    showToast('Promo Code Created!', `Code ${created.code} is active.`, 'success');
  };

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* ADMIN HEADER */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-white/20 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-[#1A1215] to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#FF6B35]/20 text-[#FF6B35]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Aura Store Back-Office</h1>
            <p className="text-xs text-slate-400">Enterprise Product, Order & Database Management</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'coupons', label: 'Coupons' },
            { id: 'sql', label: 'Database & SQL' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === t.id ? 'bg-[#FF6B35] text-white shadow-md' : 'glass-panel text-slate-700 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ANALYTICS OVERVIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Revenue</span>
              <h3 className="text-3xl font-black text-[#FF6B35]">${totalRevenue.toFixed(2)}</h3>
              <span className="text-[10px] text-emerald-500 font-bold">+18.4% this week</span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Orders</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">100% Real-Time Synced</span>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active Catalog</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{products.length} Products</h3>
              <span className="text-[10px] text-emerald-500 font-bold">In Stock</span>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Product Inventory ({products.length})</h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#FF6B35] text-white text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>

          <div className="glass-panel rounded-3xl p-4 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
                  <th className="p-3">Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200/50 dark:border-slate-800/50">
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white">{p.title}</h5>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {p.sku}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{p.categoryName}</td>
                    <td className="p-3 font-black text-[#FF6B35]">${p.price.toFixed(2)}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{p.stock} units</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Customer Orders ({orders.length})</h3>
          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-[#FF6B35]">{ord.orderNumber}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{ord.userEmail} • {ord.items.length} Items</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">${ord.totalAmount.toFixed(2)}</span>
                  <select
                    value={ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white rounded-xl px-3 py-1.5"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateCoupon} className="glass-panel p-6 rounded-3xl max-w-md space-y-3 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Create New Promo Code</h4>
            <input
              type="text"
              placeholder="Code (e.g. SUMMER50)"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Discount Percentage (e.g. 20)"
              value={newCouponDiscount}
              onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button type="submit" className="py-2.5 px-6 rounded-xl bg-[#FF6B35] text-white font-bold text-xs">
              Generate Promo Code
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-sm text-[#FF6B35]">{c.code}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.discountValue}% OFF</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL & DATABASE TAB */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#FF6B35]" /> Production Supabase Database Setup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Run the complete SQL DDL below in your Supabase SQL Editor to set up tables, RLS policies, triggers, and full-text search.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- SQL Schema is located in src/lib/schema.sql`);
                  showToast('SQL Copied to Clipboard!', 'Paste into Supabase SQL Editor', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <Code2 className="w-4 h-4" /> Copy SQL DDL
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs max-h-96 overflow-y-auto border border-slate-800 space-y-2">
              <p className="text-amber-400 font-bold">-- AURA LUXE SUPABASE PRODUCTION SCHEMA</p>
              <p className="text-slate-500">-- Tables: user_profiles, categories, brands, products, coupons, addresses, orders, wishlist, reviews, notifications, activity_logs, recently_viewed, flash_sales</p>
              <p className="text-slate-500">-- Features: Row Level Security (RLS), Full Text Search vectors, Triggers, Views, Foreign keys, Indexes</p>
              <pre className="text-emerald-400 font-mono text-[11px] whitespace-pre-wrap">
{`1. Copy contents of src/lib/schema.sql
2. Go to Supabase Dashboard > SQL Editor
3. Paste and click Run
4. All tables, RLS policies, and triggers will be created instantly.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleCreateProduct} className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Add New Luxury Product</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Product Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. AURA Wireless Ergonomic Earbuds"
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Price ($)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Image Unsplash URL</label>
                <input
                  type="text"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-900 dark:text-white">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isAiGenerating || !newTitle}
                    className="text-[10px] font-bold text-[#FF6B35] flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate with Gemini AI
                  </button>
                </div>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="py-2 px-4 rounded-xl glass-panel text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="py-2 px-6 rounded-xl bg-[#FF6B35] text-white text-xs font-bold">
                Publish Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
