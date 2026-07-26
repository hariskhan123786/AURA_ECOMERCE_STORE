import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { dbService } from '../../lib/supabase';
import { PaymentMethodType, Order } from '../../types';
import {
  CheckCircle,
  CreditCard,
  Truck,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Building,
  Smartphone,
  Wallet,
  DollarSign,
  Download
} from 'lucide-react';

interface MultiStepCheckoutProps {
  onOrderCompleted: (order: Order) => void;
  onCancel: () => void;
}

export const MultiStepCheckout: React.FC<MultiStepCheckoutProps> = ({
  onOrderCompleted,
  onCancel,
}) => {
  const { cart, subtotal, discountAmount, taxAmount, shippingFee, totalAmount, clearCart, appliedCoupon } = useCart();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // FORM STATES
  const [email, setEmail] = useState(user?.email || 'client@auraluxe.com');
  const [fullName, setFullName] = useState(user?.fullName || 'Alexander Vance');
  const [phone, setPhone] = useState('+1 (555) 839-2001');
  const [street, setStreet] = useState('742 Evergreen Terrace');
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [zipCode, setZipCode] = useState('10001');

  // PAYMENT GATEWAY SELECTION
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('03001234567');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      const orderNumber = `AURA-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder = await dbService.createOrder({
        orderNumber,
        userId: user?.id || 'usr-guest',
        userEmail: email,
        shippingAddress: {
          id: `addr-${Date.now()}`,
          userId: user?.id || 'usr-guest',
          label: 'Primary',
          fullName,
          phone,
          street,
          city,
          state,
          zipCode,
          country: 'United States',
          isDefault: true,
        },
        items: cart.map((c) => ({
          id: c.id,
          productId: c.productId,
          productTitle: c.product.title,
          productImage: c.product.images[0],
          color: c.selectedColor,
          size: c.selectedSize,
          quantity: c.quantity,
          unitPrice: c.price,
          totalPrice: c.price * c.quantity,
        })),
        subtotal,
        discountAmount,
        taxAmount,
        shippingFee,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        status: 'processing',
        couponCode: appliedCoupon?.code,
      });

      // CONFETTI CELEBRATION
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#ffffff', '#fbbf24'],
        });
      } catch (e) {
        // Fallback silently if confetti unsupported
      }

      setCompletedOrder(newOrder);
      clearCart();
      showToast('Order Placed Successfully!', `Order ID: ${newOrder.orderNumber}`, 'success');
      onOrderCompleted(newOrder);
    } catch (e) {
      showToast('Payment Processing Error', 'Please verify payment details', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Order Confirmed!</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Order Number: <span className="font-bold text-[#FF6B35]">{completedOrder.orderNumber}</span>
        </p>

        <div className="glass-panel p-6 rounded-3xl text-left space-y-3 text-xs border border-white/20">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Order Summary</h4>
          {completedOrder.items.map((it, i) => (
            <div key={i} className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
              <span>{it.quantity}x {it.productTitle}</span>
              <span className="font-bold">${it.totalPrice.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-black text-sm text-[#FF6B35]">
            <span>Total Paid ({completedOrder.paymentMethod.toUpperCase()})</span>
            <span>${completedOrder.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="py-3 px-8 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs"
        >
          Return to Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-2xl glass-panel text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel Checkout
        </button>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Checkout</h2>
      </div>

      {/* STEP STEPR PROGRESS BAR */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { num: 1, label: 'Contact' },
          { num: 2, label: 'Shipping' },
          { num: 3, label: 'Payment' },
          { num: 4, label: 'Review' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all ${
              step >= s.num
                ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                : 'glass-panel text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            {s.num}. {s.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT STEPS */}
        <div className="lg:col-span-7 space-y-6">
          {step === 1 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-white/20">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6B35]" /> Step 1: Customer Contact
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                Continue to Shipping <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF6B35]" /> Step 2: Shipping Address
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-900 dark:text-white">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-900 dark:text-white">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-900 dark:text-white">Zip Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-3 px-6 rounded-2xl glass-panel font-bold text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-white/20">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FF6B35]" /> Step 3: Payment Gateway Selection
              </h3>

              {/* GATEWAY SELECTOR PILLS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'stripe', name: 'Stripe / Card', icon: CreditCard },
                  { id: 'paypal', name: 'PayPal', icon: Wallet },
                  { id: 'jazzcash', name: 'JazzCash', icon: Smartphone },
                  { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone },
                  { id: 'bank_transfer', name: 'Bank Wire', icon: Building },
                  { id: 'cod', name: 'Cash on Delivery', icon: DollarSign },
                ].map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setPaymentMethod(g.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === g.id
                          ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-lg shadow-[#FF6B35]/25'
                          : 'glass-panel text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{g.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* PAYMENT INPUT SIMULATION */}
              {paymentMethod === 'stripe' && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 space-y-2 text-xs">
                  <label className="block font-semibold">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
                  />
                </div>
              )}

              {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 space-y-2 text-xs">
                  <label className="block font-semibold">Mobile Wallet Account Number</label>
                  <input
                    type="text"
                    value={mobileWalletNumber}
                    onChange={(e) => setMobileWalletNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="py-3 px-6 rounded-2xl glass-panel font-bold text-xs">
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-2xl bg-[#FF6B35] text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  Review Order <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-white/20">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF6B35]" /> Step 4: Final Review & Confirmation
              </h3>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p><b>Client:</b> {fullName} ({email})</p>
                <p><b>Shipping To:</b> {street}, {city}, {state} {zipCode}</p>
                <p><b>Payment Gateway:</b> {paymentMethod.toUpperCase()}</p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#FF6B35] text-white font-black text-sm shadow-xl shadow-[#FF6B35]/30 hover:bg-[#E85A24] transition-all"
              >
                {isSubmitting ? 'Processing Payment...' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT ORDER SUMMARY */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl h-fit border border-white/20 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Order Summary ({cart.length} Items)</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {cart.map((it) => (
              <div key={it.id} className="flex items-center gap-3 text-xs">
                <img src={it.product.images[0]} alt={it.product.title} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{it.product.title}</h5>
                  <p className="text-[10px] text-slate-400">Qty: {it.quantity}</p>
                </div>
                <span className="font-bold text-[#FF6B35]">${(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? <span className="text-emerald-500 font-bold">FREE</span> : `$${shippingFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Total</span>
              <span className="text-[#FF6B35]">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
