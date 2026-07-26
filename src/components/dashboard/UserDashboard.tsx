import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotification } from '../../context/NotificationContext';
import { dbService } from '../../lib/supabase';
import { Order, Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Bell,
  Shield,
  Edit2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye
} from 'lucide-react';

export const UserDashboard: React.FC<{ onQuickViewProduct: (p: Product) => void }> = ({
  onQuickViewProduct,
}) => {
  const { user, updateProfile } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'addresses' | 'notifications'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  useEffect(() => {
    dbService.getOrders().then((all) => {
      const userOrders = all.filter((o) => o.userEmail === user?.email || o.userId === user?.id);
      setOrders(userOrders.length ? userOrders : all.slice(0, 2));
    });
  }, [user?.email, user?.id]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, phone, avatarUrl });
    showToast('Profile updated successfully!', undefined, 'success');
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Delivered</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 font-bold text-[10px] uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> In Transit</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[10px] uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Processing</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 font-bold text-[10px] uppercase">Pending</span>;
    }
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* USER PROFILE BANNER */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-white/20 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-[#12141F] to-slate-900 text-white">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 border-2 border-[#FF6B35] flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <User className="w-8 h-8 text-[#FF6B35]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user?.fullName || 'Valued Client'}</h1>
            <p className="text-xs text-slate-400">{user?.email || 'Guest User'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#FF6B35]/20 text-[#FF6B35] text-[10px] font-black uppercase">
              {user?.role === 'admin' ? '⚡ Admin' : 'Guest'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'wishlist', label: 'Wishlist', icon: Heart },
            { id: 'profile', label: 'Settings', icon: User },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-[#FF6B35] text-white shadow-lg'
                    : 'glass-panel text-slate-700 dark:text-slate-300 border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Order History</h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No orders placed yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#FF6B35]">{ord.orderNumber}</span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Placed on {new Date(ord.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{ord.items.length} Items • Payment: {ord.paymentMethod.toUpperCase()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-900 dark:text-white">${ord.totalAmount.toFixed(2)}</span>
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3.5 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Saved Wishlist ({wishlist.length})</h3>
          {wishlist.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Your wishlist is empty.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={onQuickViewProduct} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-3xl max-w-xl space-y-4 border border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Profile Settings</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1 text-slate-900 dark:text-white">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-900 dark:text-white">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-900 dark:text-white">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button type="submit" className="py-3 px-6 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs">
            Save Profile Changes
          </button>
        </form>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Order Details ({selectedOrder.orderNumber})</h4>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              {selectedOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <span>{it.quantity}x {it.productTitle}</span>
                  <span className="font-bold">${it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-[#FF6B35] text-right">Total: ${selectedOrder.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
