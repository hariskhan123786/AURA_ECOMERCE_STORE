import { createClient } from '@supabase/supabase-js';
import { Product, Order, UserProfile, Coupon, Review, Category, Brand } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS, INITIAL_COUPONS, INITIAL_REVIEWS } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co');
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// LOCAL STORAGE PERSISTENCE KEYS
const STORAGE_KEYS = {
  PRODUCTS: 'aura_products_db_v1',
  ORDERS: 'aura_orders_db_v1',
  USERS: 'aura_users_db_v1',
  CATEGORIES: 'aura_categories_db_v1',
  BRANDS: 'aura_brands_db_v1',
  COUPONS: 'aura_coupons_db_v1',
  REVIEWS: 'aura_reviews_db_v1',
};

// Helper to initialize local db
const initLocalStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BRANDS)) {
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(INITIAL_BRANDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
};

initLocalStore();

// DATA API WRAPPERS (SUPABASE + LOCALSTORAGE FALLBACK)
export const dbService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) return data as Product[];
      } catch (err) {
        console.warn('Supabase products fetch failed, using fallback:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const products = await this.getProducts();
    let updatedProduct: Product;

    if (product.id) {
      // Update
      const index = products.findIndex((p) => p.id === product.id);
      if (index !== -1) {
        updatedProduct = { ...products[index], ...product, updatedAt: new Date().toISOString() } as Product;
        products[index] = updatedProduct;
      } else {
        updatedProduct = product as Product;
      }
    } else {
      // Create new
      updatedProduct = {
        id: `prod-${Date.now()}`,
        title: product.title || 'New Luxury Item',
        slug: (product.title || 'item').toLowerCase().replace(/\s+/g, '-'),
        description: product.description || '',
        price: Number(product.price) || 99,
        categoryId: product.categoryId || 'cat-1',
        categoryName: product.categoryName || 'Cyber Tech & Audio',
        images: product.images?.length ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000'],
        variants: product.variants || [],
        sizes: product.sizes || ['One Size'],
        colors: product.colors || [{ name: 'Default', hex: '#FF6B35' }],
        rating: 5.0,
        reviewCount: 0,
        stock: product.stock !== undefined ? product.stock : 10,
        sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
        tags: product.tags || ['New'],
        isNew: true,
        createdAt: new Date().toISOString(),
      } as Product;
      products.unshift(updatedProduct);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').upsert(updatedProduct);
      } catch (e) {
        console.error('Supabase save product error:', e);
      }
    }

    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete product error:', e);
      }
    }
    return true;
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('orders').select('*');
        if (!error && data) return data as Order[];
      } catch (e) {
        console.warn('Supabase orders fetch error:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const orders = await this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').insert(newOrder);
      } catch (e) {
        console.error('Supabase order creation error:', e);
      }
    }

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    const orders = await this.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch (e) {
        console.error('Supabase update status error:', e);
      }
    }
    return true;
  },

  // REVIEWS
  async getReviews(productId?: string): Promise<Review[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = raw ? JSON.parse(raw) : INITIAL_REVIEWS;
    if (productId) {
      return reviews.filter((r) => r.productId === productId);
    }
    return reviews;
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt' | 'likes'>): Promise<Review> {
    const reviews = await this.getReviews();
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    reviews.unshift(newRev);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return newRev;
  },

  // COUPONS
  async getCoupons(): Promise<Coupon[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.COUPONS);
    return raw ? JSON.parse(raw) : INITIAL_COUPONS;
  },

  async saveCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    const coupons = await this.getCoupons();
    let updated: Coupon;
    if (coupon.id) {
      const idx = coupons.findIndex((c) => c.id === coupon.id);
      if (idx !== -1) {
        updated = { ...coupons[idx], ...coupon } as Coupon;
        coupons[idx] = updated;
      } else {
        updated = coupon as Coupon;
      }
    } else {
      updated = {
        id: `c-${Date.now()}`,
        code: (coupon.code || 'SPECIAL').toUpperCase(),
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || 15,
        minOrderAmount: coupon.minOrderAmount || 0,
        expiryDate: coupon.expiryDate || '2026-12-31',
        isActive: true,
        usageCount: 0,
      };
      coupons.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
    return updated;
  },
};
