import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { couponsService } from '../lib/supabase';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  totalItemsCount: number;
  isApplyingCoupon: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD || 75000);
const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE || 0.05);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('aura_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('aura_applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('aura_applied_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = useCallback((product: Product, quantity = 1, color?: string, size?: string) => {
    const selectedColor = color || product.colors?.[0]?.name || 'Default';
    const selectedSize = size || product.sizes?.[0] || 'Standard';
    const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === cartItemId);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          selectedColor,
          selectedSize,
          quantity,
          price: product.price,
        },
      ];
    });

    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => item.id === cartItemId ? { ...item, quantity } : item)
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const applyCoupon = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    setIsApplyingCoupon(true);
    try {
      const result = await couponsService.validate(code, subtotal);
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
      }
      return { success: result.valid, message: result.message };
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.min((subtotal * appliedCoupon.discountValue) / 100, subtotal);
    }
    return Math.min(appliedCoupon.discountValue, subtotal);
  }, [appliedCoupon, subtotal]);

  const shippingFee = useMemo(
    () => (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 1500),
    [subtotal]
  );

  const taxAmount = useMemo(
    () => Math.max(0, (subtotal - discountAmount) * TAX_RATE),
    [subtotal, discountAmount]
  );

  const totalAmount = useMemo(
    () => Math.max(0, subtotal - discountAmount + taxAmount + shippingFee),
    [subtotal, discountAmount, taxAmount, shippingFee]
  );

  const totalItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        taxAmount,
        shippingFee,
        totalAmount,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountNeededForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
        totalItemsCount,
        isApplyingCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
