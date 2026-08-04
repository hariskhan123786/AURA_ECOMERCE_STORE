import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Product, Order, UserProfile, Coupon, Review, Category, Brand, Address, NotificationItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS, INITIAL_COUPONS, INITIAL_REVIEWS } from '../data/mockData';

// =====================================================================
// SUPABASE CLIENT
// =====================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// =====================================================================
// LOCAL STORAGE FALLBACK KEYS
// =====================================================================
const LS = {
  PRODUCTS: 'aura_products_db_v2',
  ORDERS: 'aura_orders_db_v2',
  CATEGORIES: 'aura_categories_db_v2',
  BRANDS: 'aura_brands_db_v2',
  COUPONS: 'aura_coupons_db_v2',
  REVIEWS: 'aura_reviews_db_v2',
  ADDRESSES: 'aura_addresses_db_v2',
  RECENTLY_VIEWED: 'aura_recently_viewed_v2',
  NOTIFICATIONS: 'aura_notifications_db_v2',
} as const;

// =====================================================================
// LOCAL STORAGE HELPERS
// =====================================================================
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('localStorage write failed for key:', key);
  }
}

// =====================================================================
// INIT LOCAL STORE (only if keys are empty)
// =====================================================================
function initLocalStore(): void {
  const keys = [
    [LS.PRODUCTS, INITIAL_PRODUCTS],
    [LS.CATEGORIES, INITIAL_CATEGORIES],
    [LS.BRANDS, INITIAL_BRANDS],
    [LS.COUPONS, INITIAL_COUPONS],
    [LS.REVIEWS, INITIAL_REVIEWS],
    [LS.ORDERS, []],
    [LS.ADDRESSES, []],
    [LS.RECENTLY_VIEWED, []],
    [LS.NOTIFICATIONS, []],
  ] as const;

  for (const [key, fallback] of keys) {
    if (!localStorage.getItem(key)) {
      lsSet(key, fallback);
    }
  }
}

initLocalStore();

// =====================================================================
// SNAKE_CASE → camelCase MAPPERS
// =====================================================================

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    description: String(row.description || ''),
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    costPrice: row.cost_price != null ? Number(row.cost_price) : undefined,
    categoryId: String(row.category_id || ''),
    categoryName: String(row.category_name || ''),
    brandId: row.brand_id ? String(row.brand_id) : undefined,
    brandName: row.brand_name ? String(row.brand_name) : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    frames360: Array.isArray(row.frames_360) ? (row.frames_360 as string[]) : [],
    videoUrl: row.video_url ? String(row.video_url) : undefined,
    variants: Array.isArray(row.variants) ? row.variants as Product['variants'] : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    colors: Array.isArray(row.colors) ? row.colors as Product['colors'] : [],
    rating: Number(row.rating || 5),
    reviewCount: Number(row.review_count || 0),
    stock: Number(row.stock || 0),
    sku: String(row.sku || ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending),
    isNew: Boolean(row.is_new),
    isFlashSale: Boolean(row.is_flash_sale),
    discountPercentage: Number(row.discount_percentage || 0),
    specs: (row.specs as Record<string, string>) || {},
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number || ''),
    userId: String(row.user_id || ''),
    userEmail: String(row.user_email || ''),
    shippingAddress: row.shipping_address as Address,
    items: Array.isArray(row.items) ? row.items as Order['items'] : [],
    subtotal: Number(row.subtotal || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    shippingFee: Number(row.shipping_fee || 0),
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'cod',
    paymentStatus: (row.payment_status as Order['paymentStatus']) || 'pending',
    status: (row.status as Order['status']) || 'pending',
    couponCode: row.coupon_code ? String(row.coupon_code) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    productId: String(row.product_id || ''),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || 'Anonymous'),
    userAvatar: row.user_avatar ? String(row.user_avatar) : undefined,
    rating: Number(row.rating || 5),
    title: String(row.title || ''),
    comment: String(row.comment || ''),
    verifiedPurchase: Boolean(row.verified_purchase),
    likes: Number(row.likes || 0),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    label: String(row.label || 'Home'),
    fullName: String(row.full_name || ''),
    phone: String(row.phone || ''),
    street: String(row.street || ''),
    city: String(row.city || ''),
    state: String(row.state || ''),
    zipCode: String(row.zip_code || ''),
    country: String(row.country || 'United States'),
    isDefault: Boolean(row.is_default),
  };
}

function mapNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    title: String(row.title || ''),
    message: String(row.message || ''),
    type: (row.type as NotificationItem['type']) || 'system',
    isRead: Boolean(row.is_read),
    link: row.link ? String(row.link) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

// =====================================================================
// PRODUCTS SERVICE
// =====================================================================
export const productsService = {
  async getAll(filters?: {
    categoryId?: string;
    brandId?: string;
    featured?: boolean;
    trending?: boolean;
    flashSale?: boolean;
    isNew?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
    limit?: number;
  }): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (filters?.categoryId && filters.categoryId !== 'all') {
          query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.brandId) query = query.eq('brand_id', filters.brandId);
        if (filters?.featured) query = query.eq('is_featured', true);
        if (filters?.trending) query = query.eq('is_trending', true);
        if (filters?.flashSale) query = query.eq('is_flash_sale', true);
        if (filters?.isNew) query = query.eq('is_new', true);
        if (filters?.minPrice != null) query = query.gte('price', filters.minPrice);
        if (filters?.maxPrice != null) query = query.lte('price', filters.maxPrice);
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category_name.ilike.%${filters.search}%`);
        }

        // Sorting
        switch (filters?.sortBy) {
          case 'price_asc': query = query.order('price', { ascending: true }); break;
          case 'price_desc': query = query.order('price', { ascending: false }); break;
          case 'rating': query = query.order('rating', { ascending: false }); break;
          case 'newest': query = query.order('created_at', { ascending: false }); break;
          default: query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
        }

        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((r) => mapProduct(r as Record<string, unknown>));
        }
      } catch (err) {
        console.warn('Supabase products fetch failed, using localStorage:', err);
      }
    }

    let products = lsGet<Product[]>(LS.PRODUCTS, INITIAL_PRODUCTS);

    // Apply local filters
    if (filters?.categoryId && filters.categoryId !== 'all') {
      products = products.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters?.featured) products = products.filter((p) => p.isFeatured);
    if (filters?.trending) products = products.filter((p) => p.isTrending);
    if (filters?.flashSale) products = products.filter((p) => p.isFlashSale);
    if (filters?.isNew) products = products.filter((p) => p.isNew);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters?.minPrice != null) products = products.filter((p) => p.price >= filters.minPrice!);
    if (filters?.maxPrice != null) products = products.filter((p) => p.price <= filters.maxPrice!);

    // Sorting
    switch (filters?.sortBy) {
      case 'price_asc': products.sort((a, b) => a.price - b.price); break;
      case 'price_desc': products.sort((a, b) => b.price - a.price); break;
      case 'rating': products.sort((a, b) => b.rating - a.rating); break;
      case 'newest': products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    if (filters?.limit) products = products.slice(0, filters.limit);
    return products;
  },

  async getById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (!error && data) return mapProduct(data as Record<string, unknown>);
      } catch { /* fallback */ }
    }
    const products = lsGet<Product[]>(LS.PRODUCTS, INITIAL_PRODUCTS);
    return products.find((p) => p.id === id) || null;
  },

  async save(product: Partial<Product>): Promise<Product> {
    const products = lsGet<Product[]>(LS.PRODUCTS, INITIAL_PRODUCTS);
    let saved: Product;

    if (product.id) {
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        saved = { ...products[idx], ...product };
        products[idx] = saved;
      } else {
        saved = product as Product;
      }
    } else {
      saved = {
        id: `prod-${Date.now()}`,
        title: product.title || 'New Product',
        slug: (product.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: product.description || '',
        price: Number(product.price) || 0,
        categoryId: product.categoryId || '',
        categoryName: product.categoryName || '',
        images: product.images || [],
        variants: product.variants || [],
        sizes: product.sizes || [],
        colors: product.colors || [],
        rating: 5.0,
        reviewCount: 0,
        stock: product.stock ?? 0,
        sku: product.sku || `SKU-${Date.now()}`,
        tags: product.tags || [],
        isNew: true,
        isFeatured: product.isFeatured || false,
        isTrending: product.isTrending || false,
        isFlashSale: product.isFlashSale || false,
        discountPercentage: product.discountPercentage || 0,
        specs: product.specs || {},
        createdAt: new Date().toISOString(),
      } as Product;
      products.unshift(saved);
    }

    lsSet(LS.PRODUCTS, products);

    if (isSupabaseConfigured()) {
      try {
        const dbRow = {
          id: saved.id,
          title: saved.title,
          slug: saved.slug,
          description: saved.description,
          price: saved.price,
          compare_at_price: saved.compareAtPrice,
          cost_price: saved.costPrice,
          category_id: saved.categoryId || null,
          category_name: saved.categoryName,
          brand_id: saved.brandId || null,
          brand_name: saved.brandName,
          images: saved.images,
          frames_360: saved.frames360 || [],
          video_url: saved.videoUrl || null,
          variants: saved.variants,
          sizes: saved.sizes,
          colors: saved.colors,
          stock: saved.stock,
          sku: saved.sku,
          tags: saved.tags,
          is_featured: saved.isFeatured || false,
          is_trending: saved.isTrending || false,
          is_new: saved.isNew || false,
          is_flash_sale: saved.isFlashSale || false,
          discount_percentage: saved.discountPercentage || 0,
          specs: saved.specs || {},
        };
        await supabase.from('products').upsert(dbRow);
      } catch (e) {
        console.error('Supabase product upsert error:', e);
      }
    }

    return saved;
  },

  async delete(id: string): Promise<boolean> {
    const products = lsGet<Product[]>(LS.PRODUCTS, INITIAL_PRODUCTS);
    lsSet(LS.PRODUCTS, products.filter((p) => p.id !== id));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete product error:', e);
      }
    }
    return true;
  },

  async updateStock(id: string, stock: number): Promise<void> {
    const products = lsGet<Product[]>(LS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      products[idx].stock = stock;
      lsSet(LS.PRODUCTS, products);
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').update({ stock }).eq('id', id);
      } catch { /* silent */ }
    }
  },
};

// =====================================================================
// ORDERS SERVICE
// =====================================================================
export const ordersService = {
  async getAll(userId?: string): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data, error } = await query;
        if (!error && data) return data.map((r) => mapOrder(r as Record<string, unknown>));
      } catch (e) {
        console.warn('Supabase orders fetch failed:', e);
      }
    }
    const orders = lsGet<Order[]>(LS.ORDERS, []);
    if (userId) return orders.filter((o) => o.userId === userId);
    return orders;
  },

  async getByEmail(email: string): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_email', email)
          .order('created_at', { ascending: false });
        if (!error && data) return data.map((r) => mapOrder(r as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    const orders = lsGet<Order[]>(LS.ORDERS, []);
    return orders.filter((o) => o.userEmail === email);
  },

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = lsGet<Order[]>(LS.ORDERS, []);
    orders.unshift(newOrder);
    lsSet(LS.ORDERS, orders);

    if (isSupabaseConfigured()) {
      try {
        const dbRow = {
          order_number: newOrder.orderNumber,
          user_id: newOrder.userId || null,
          user_email: newOrder.userEmail,
          shipping_address: newOrder.shippingAddress,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          discount_amount: newOrder.discountAmount,
          tax_amount: newOrder.taxAmount,
          shipping_fee: newOrder.shippingFee,
          total_amount: newOrder.totalAmount,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          status: newOrder.status,
          coupon_code: newOrder.couponCode || null,
          notes: newOrder.notes || null,
        };
        const { data, error } = await supabase.from('orders').insert(dbRow).select().single();
        if (!error && data) {
          return mapOrder(data as Record<string, unknown>);
        }
      } catch (e) {
        console.error('Supabase order creation error:', e);
      }
    }

    return newOrder;
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<boolean> {
    const orders = lsGet<Order[]>(LS.ORDERS, []);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].updatedAt = new Date().toISOString();
      lsSet(LS.ORDERS, orders);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (e) {
        console.error('Supabase update status error:', e);
      }
    }
    return true;
  },

  async getAnalytics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueByDay: { date: string; revenue: number; count: number }[];
    statusBreakdown: Record<string, number>;
    topProducts: { name: string; count: number }[];
  }> {
    const orders = await this.getAll();
    const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');

    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

    // Revenue by day (last 30 days)
    const byDay: Record<string, { revenue: number; count: number }> = {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    activeOrders
      .filter((o) => new Date(o.createdAt) >= thirtyDaysAgo)
      .forEach((o) => {
        const day = o.createdAt.split('T')[0];
        if (!byDay[day]) byDay[day] = { revenue: 0, count: 0 };
        byDay[day].revenue += o.totalAmount;
        byDay[day].count += 1;
      });

    const revenueByDay = Object.entries(byDay)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    orders.forEach((o) => {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    });

    // Top products
    const productCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { name: item.productTitle, count: 0 };
        }
        productCounts[item.productId].count += item.quantity;
      });
    });
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalRevenue, totalOrders, avgOrderValue, revenueByDay, statusBreakdown, topProducts };
  },
};

// =====================================================================
// REVIEWS SERVICE
// =====================================================================
export const reviewsService = {
  async getByProduct(productId: string): Promise<Review[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });
        if (!error && data) return data.map((r) => mapReview(r as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    const reviews = lsGet<Review[]>(LS.REVIEWS, INITIAL_REVIEWS);
    return reviews.filter((r) => r.productId === productId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getAll(): Promise<Review[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data.map((r) => mapReview(r as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    return lsGet<Review[]>(LS.REVIEWS, INITIAL_REVIEWS);
  },

  async add(review: Omit<Review, 'id' | 'createdAt' | 'likes'>): Promise<Review> {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const reviews = lsGet<Review[]>(LS.REVIEWS, INITIAL_REVIEWS);
    reviews.unshift(newReview);
    lsSet(LS.REVIEWS, reviews);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('reviews').insert({
          product_id: newReview.productId,
          user_id: newReview.userId || null,
          user_name: newReview.userName,
          user_avatar: newReview.userAvatar || null,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          verified_purchase: newReview.verifiedPurchase,
          images: newReview.images || [],
        });
      } catch (e) {
        console.error('Supabase add review error:', e);
      }
    }

    return newReview;
  },

  async likeReview(reviewId: string, userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('review_likes').insert({
          review_id: reviewId,
          user_id: userId,
        });
        if (!error) {
          await supabase.rpc('increment', { table_name: 'reviews', column_name: 'likes', row_id: reviewId });
        }
        return !error;
      } catch { /* fallback */ }
    }

    const reviews = lsGet<Review[]>(LS.REVIEWS, INITIAL_REVIEWS);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx !== -1) {
      reviews[idx].likes = (reviews[idx].likes || 0) + 1;
      lsSet(LS.REVIEWS, reviews);
    }
    return true;
  },

  async checkVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, items')
          .eq('user_id', userId)
          .in('status', ['delivered', 'shipped', 'processing']);

        if (data) {
          return data.some((order) => {
            const items = order.items as Order['items'];
            return Array.isArray(items) && items.some((item) => item.productId === productId);
          });
        }
      } catch { /* fallback */ }
    }

    const orders = lsGet<Order[]>(LS.ORDERS, []);
    return orders.some(
      (o) =>
        o.userId === userId &&
        o.items.some((item) => item.productId === productId) &&
        ['delivered', 'shipped', 'processing'].includes(o.status)
    );
  },
};

// =====================================================================
// COUPONS SERVICE
// =====================================================================
export const couponsService = {
  async getAll(): Promise<Coupon[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (!error && data) return data.map((r) => ({
          id: String(r.id),
          code: String(r.code),
          discountType: r.discount_type as Coupon['discountType'],
          discountValue: Number(r.discount_value),
          minOrderAmount: Number(r.min_order_amount || 0),
          expiryDate: String(r.expiry_date),
          isActive: Boolean(r.is_active),
          usageCount: Number(r.usage_count || 0),
        }));
      } catch { /* fallback */ }
    }
    return lsGet<Coupon[]>(LS.COUPONS, INITIAL_COUPONS);
  },

  async validate(code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; message: string }> {
    const coupons = await this.getAll();
    const clean = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === clean && c.isActive);

    if (!found) return { valid: false, message: 'Invalid or expired coupon code.' };
    if (new Date(found.expiryDate) < new Date()) return { valid: false, message: 'This coupon has expired.' };
    if (subtotal < found.minOrderAmount) {
      return { valid: false, message: `Minimum order of $${found.minOrderAmount.toFixed(2)} required.` };
    }
    return { valid: true, coupon: found, message: `${clean} applied! ${found.discountType === 'percentage' ? `${found.discountValue}% OFF` : `$${found.discountValue} OFF`}` };
  },

  async save(coupon: Partial<Coupon>): Promise<Coupon> {
    const coupons = lsGet<Coupon[]>(LS.COUPONS, INITIAL_COUPONS);
    let saved: Coupon;

    if (coupon.id) {
      const idx = coupons.findIndex((c) => c.id === coupon.id);
      saved = idx !== -1 ? { ...coupons[idx], ...coupon } as Coupon : coupon as Coupon;
      if (idx !== -1) coupons[idx] = saved;
    } else {
      saved = {
        id: `c-${Date.now()}`,
        code: (coupon.code || 'SPECIAL').toUpperCase(),
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || 10,
        minOrderAmount: coupon.minOrderAmount || 0,
        expiryDate: coupon.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: coupon.isActive !== undefined ? coupon.isActive : true,
        usageCount: 0,
      };
      coupons.unshift(saved);
    }

    lsSet(LS.COUPONS, coupons);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('coupons').upsert({
          id: saved.id,
          code: saved.code,
          discount_type: saved.discountType,
          discount_value: saved.discountValue,
          min_order_amount: saved.minOrderAmount,
          expiry_date: saved.expiryDate,
          is_active: saved.isActive,
        });
      } catch { /* silent */ }
    }

    return saved;
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const coupons = lsGet<Coupon[]>(LS.COUPONS, INITIAL_COUPONS);
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      coupons[idx].isActive = isActive;
      lsSet(LS.COUPONS, coupons);
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('coupons').update({ is_active: isActive }).eq('id', id);
      } catch { /* silent */ }
    }
  },

  async delete(id: string): Promise<void> {
    const coupons = lsGet<Coupon[]>(LS.COUPONS, INITIAL_COUPONS);
    lsSet(LS.COUPONS, coupons.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('coupons').delete().eq('id', id);
      } catch { /* silent */ }
    }
  },
};

// =====================================================================
// CATEGORIES SERVICE
// =====================================================================
export const categoriesService = {
  async getAll(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: String(r.id),
            name: String(r.name),
            slug: String(r.slug),
            description: r.description ? String(r.description) : undefined,
            imageUrl: String(r.image_url || ''),
            itemCount: Number(r.item_count || 0),
            featured: Boolean(r.featured),
          }));
        }
      } catch { /* fallback */ }
    }
    return lsGet<Category[]>(LS.CATEGORIES, INITIAL_CATEGORIES);
  },
};

// =====================================================================
// BRANDS SERVICE
// =====================================================================
export const brandsService = {
  async getAll(): Promise<Brand[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('brands').select('*');
        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: String(r.id),
            name: String(r.name),
            logoUrl: String(r.logo_url || ''),
            description: r.description ? String(r.description) : undefined,
          }));
        }
      } catch { /* fallback */ }
    }
    return lsGet<Brand[]>(LS.BRANDS, INITIAL_BRANDS);
  },
};

// =====================================================================
// ADDRESSES SERVICE
// =====================================================================
export const addressesService = {
  async getByUser(userId: string): Promise<Address[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });
        if (!error && data) return data.map((r) => mapAddress(r as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    const all = lsGet<Address[]>(LS.ADDRESSES, []);
    return all.filter((a) => a.userId === userId);
  },

  async save(address: Partial<Address>): Promise<Address> {
    const all = lsGet<Address[]>(LS.ADDRESSES, []);
    let saved: Address;

    if (address.id) {
      const idx = all.findIndex((a) => a.id === address.id);
      saved = idx !== -1 ? { ...all[idx], ...address } as Address : address as Address;
      if (idx !== -1) all[idx] = saved;
      else all.push(saved);
    } else {
      saved = {
        id: `addr-${Date.now()}`,
        userId: address.userId || '',
        label: address.label || 'Home',
        fullName: address.fullName || '',
        phone: address.phone || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'United States',
        isDefault: address.isDefault || false,
      };
      all.push(saved);
    }

    // If new default, clear others
    if (saved.isDefault) {
      for (const a of all) {
        if (a.id !== saved.id && a.userId === saved.userId) a.isDefault = false;
      }
    }

    lsSet(LS.ADDRESSES, all);

    if (isSupabaseConfigured()) {
      try {
        if (saved.isDefault) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', saved.userId);
        }
        await supabase.from('addresses').upsert({
          id: saved.id,
          user_id: saved.userId,
          label: saved.label,
          full_name: saved.fullName,
          phone: saved.phone,
          street: saved.street,
          city: saved.city,
          state: saved.state,
          zip_code: saved.zipCode,
          country: saved.country,
          is_default: saved.isDefault,
        });
      } catch { /* silent */ }
    }

    return saved;
  },

  async delete(addressId: string): Promise<void> {
    const all = lsGet<Address[]>(LS.ADDRESSES, []);
    lsSet(LS.ADDRESSES, all.filter((a) => a.id !== addressId));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('addresses').delete().eq('id', addressId);
      } catch { /* silent */ }
    }
  },
};

// =====================================================================
// USER PROFILE SERVICE
// =====================================================================
export const profileService = {
  async get(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          return {
            id: String(data.id),
            email: String(data.email),
            fullName: String(data.full_name || ''),
            avatarUrl: data.avatar_url ? String(data.avatar_url) : undefined,
            phone: data.phone ? String(data.phone) : undefined,
            role: (data.role as UserProfile['role']) || 'customer',
            createdAt: String(data.created_at || ''),
          };
        }
      } catch { /* fallback */ }
    }
    return null;
  },

  async update(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('user_profiles').update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
        return !error;
      } catch { return false; }
    }
    return true;
  },

  async getAllCustomers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'customer')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((r) => ({
            id: String(r.id),
            email: String(r.email),
            fullName: String(r.full_name || ''),
            avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
            phone: r.phone ? String(r.phone) : undefined,
            role: 'customer' as const,
            createdAt: String(r.created_at || ''),
          }));
        }
      } catch { /* fallback */ }
    }
    return [];
  },
};

// =====================================================================
// NOTIFICATIONS SERVICE
// =====================================================================
export const notificationsService = {
  async getByUser(userId: string): Promise<NotificationItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) return data.map((r) => mapNotification(r as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    const all = lsGet<NotificationItem[]>(LS.NOTIFICATIONS, []);
    return all.filter((n) => n.userId === userId);
  },

  async markRead(notificationId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      } catch { /* silent */ }
    }
    const all = lsGet<NotificationItem[]>(LS.NOTIFICATIONS, []);
    const idx = all.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      all[idx].isRead = true;
      lsSet(LS.NOTIFICATIONS, all);
    }
  },

  async markAllRead(userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      } catch { /* silent */ }
    }
    const all = lsGet<NotificationItem[]>(LS.NOTIFICATIONS, []);
    all.forEach((n) => { if (n.userId === userId) n.isRead = true; });
    lsSet(LS.NOTIFICATIONS, all);
  },

  subscribeToUserNotifications(
    userId: string,
    onNewNotification: (notification: NotificationItem) => void
  ): RealtimeChannel | null {
    if (!isSupabaseConfigured()) return null;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          onNewNotification(mapNotification(payload.new as Record<string, unknown>));
        }
      )
      .subscribe();
    return channel;
  },
};

// =====================================================================
// RECENTLY VIEWED SERVICE
// =====================================================================
export const recentlyViewedService = {
  add(productId: string, userId?: string): void {
    const key = userId ? `aura_rv_${userId}` : LS.RECENTLY_VIEWED;
    const ids = lsGet<string[]>(key, []);
    const filtered = ids.filter((id) => id !== productId);
    filtered.unshift(productId);
    lsSet(key, filtered.slice(0, 20));

    if (userId && isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('recently_viewed').upsert({
          user_id: userId,
          product_id: productId,
          viewed_at: new Date().toISOString(),
        })
      ).catch(() => {});
    }
  },

  get(userId?: string): string[] {
    const key = userId ? `aura_rv_${userId}` : LS.RECENTLY_VIEWED;
    return lsGet<string[]>(key, []);
  },
};

// =====================================================================
// ACTIVITY LOG SERVICE
// =====================================================================
export const activityLogService = {
  async log(entry: {
    userId?: string;
    userEmail?: string;
    action: string;
    details: string;
    entityType?: string;
    entityId?: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('activity_logs').insert({
          user_id: entry.userId || null,
          user_email: entry.userEmail || null,
          action: entry.action,
          details: entry.details,
          entity_type: entry.entityType || null,
          entity_id: entry.entityId || null,
        });
      } catch { /* silent */ }
    }
  },

  async getRecent(limit = 50): Promise<{ id: string; userEmail: string; action: string; details: string; timestamp: string }[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);
        if (data) {
          return data.map((r) => ({
            id: String(r.id),
            userEmail: String(r.user_email || 'System'),
            action: String(r.action),
            details: String(r.details),
            timestamp: String(r.timestamp),
          }));
        }
      } catch { /* fallback */ }
    }
    return [];
  },
};

// =====================================================================
// WISHLIST SERVICE (Supabase-backed)
// =====================================================================
export const wishlistService = {
  async getProductIds(userId: string): Promise<string[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', userId);
        if (!error && data) return data.map((r) => String(r.product_id));
      } catch { /* fallback */ }
    }
    return [];
  },

  async add(userId: string, productId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wishlist').upsert({ user_id: userId, product_id: productId });
      } catch { /* silent */ }
    }
  },

  async remove(userId: string, productId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wishlist').delete().eq('user_id', userId).eq('product_id', productId);
      } catch { /* silent */ }
    }
  },
};

// =====================================================================
// LEGACY COMPAT EXPORT (used by existing components)
// =====================================================================
export const dbService = {
  getProducts: () => productsService.getAll(),
  saveProduct: (p: Partial<Product>) => productsService.save(p),
  deleteProduct: (id: string) => productsService.delete(id),
  getOrders: (userId?: string) => ordersService.getAll(userId),
  createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => ordersService.create(data),
  updateOrderStatus: (id: string, status: Order['status']) => ordersService.updateStatus(id, status),
  getReviews: (productId?: string) => productId ? reviewsService.getByProduct(productId) : reviewsService.getAll(),
  addReview: (r: Omit<Review, 'id' | 'createdAt' | 'likes'>) => reviewsService.add(r),
  getCoupons: () => couponsService.getAll(),
  saveCoupon: (c: Partial<Coupon>) => couponsService.save(c),
};
