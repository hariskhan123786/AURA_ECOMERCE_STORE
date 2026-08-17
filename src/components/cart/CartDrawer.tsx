import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';
import { formatPKR } from '../../lib/currency';
import { X, Trash2, ShoppingBag, ArrowRight, Truck, Tag, Check } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    closeCart,
    subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    freeShippingThreshold,
    amountNeededForFreeShipping,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = await applyCoupon(couponInput);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) setCouponInput('');
  };

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCart}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md h-full glass-panel z-10 shadow-2xl border-l border-white/20 dark:border-white/10 flex flex-col justify-between p-6 overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#FF6B35]" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Your Shopping Bag</h3>
              <span className="text-xs font-bold text-slate-400">({cart.length} Items)</span>
            </div>
            <button
              onClick={closeCart}
              aria-label="Close cart"
              className="p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:text-[#FF6B35] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FREE SHIPPING PROGRESS BAR */}
          <div className="py-3 px-4 my-3 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-xs">
            {amountNeededForFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#FF6B35]" /> Add <span className="text-[#FF6B35]">{formatPKR(amountNeededForFreeShipping)}</span> more for Free Express Delivery!
                </p>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B35] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((freeShippingThreshold - amountNeededForFreeShipping) / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="font-bold text-emerald-500 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> You've Unlocked Free Nationwide Express Shipping!
              </p>
            )}
          </div>

          {/* ITEMS LIST */}
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Your shopping bag is currently empty.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-3.5 rounded-2xl flex gap-3 border border-slate-200 dark:border-slate-800 relative"
                >
                  <img src={item.product.images[0]} alt={item.product.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{item.product.title}</h4>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Color: {item.selectedColor} • Size: {item.selectedSize}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold text-sm text-[#FF6B35]">{formatPKR(item.price)}</span>
                      <div className="flex items-center rounded-xl glass-pill border border-slate-200 dark:border-slate-800 px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="text-xs font-bold px-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="text-xs font-bold px-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    className="text-slate-400 hover:text-rose-500 p-1 self-start transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* FOOTER SUMMARY & CHECKOUT */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {/* COUPON INPUT */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. AURA20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#FF6B35]"
                />
                <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:bg-[#FF6B35] transition-colors">
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <span>Code <b>{appliedCoupon.code}</b> Applied</span>
                  <button onClick={removeCoupon} className="text-rose-500 font-bold text-[10px] underline">
                    Remove
                  </button>
                </div>
              )}

              {couponMsg && (
                <p className={`text-[11px] font-semibold ${couponMsg.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {couponMsg.text}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPKR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping (Pakistan)</span>
                  <span>{shippingFee === 0 ? <span className="text-emerald-500 font-bold">FREE</span> : formatPKR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total</span>
                  <span className="text-[#FF6B35] font-extrabold">{formatPKR(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  closeCart();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm shadow-xl shadow-[#FF6B35]/25 hover:bg-[#E85A24] transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
