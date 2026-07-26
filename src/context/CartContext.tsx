import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { dbService } from '../lib/supabase';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('aura_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('aura_applied_coupon');
    return saved ? JSON.parse(saved) : null;
  });

  const FREE_SHIPPING_THRESHOLD = 200; // Free shipping on orders over $200

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

  const addToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    const selectedColor = color || (product.colors?.[0]?.name ?? 'Default');
    const selectedSize = size || (product.sizes?.[0] ?? 'Standard');
    const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === cartItemId);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
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
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupons = await dbService.getCoupons();
    const found = coupons.find((c) => c.code === cleanCode && c.isActive);

    if (!found) {
      return { success: false, message: 'Invalid or expired promotional code.' };
    }

    if (subtotal < found.minOrderAmount) {
      return {
        success: false,
        message: `Minimum order value of $${found.minOrderAmount} required for coupon ${cleanCode}.`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Promo code ${cleanCode} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 25;
  const taxAmount = Math.max(0, (subtotal - discountAmount) * 0.08); // 8% estimated tax
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + shippingFee);

  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
        amountNeededForFreeShipping,
        totalItemsCount,
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
