-- =====================================================================
-- AURA LUXE ECOMMERCE — PRODUCTION SUPABASE DATABASE SCHEMA v2
-- =====================================================================
-- Run this in Supabase SQL Editor > New Query
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'jazzcash', 'easypaisa', 'bank_transfer', 'cod');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. USER PROFILES (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Customer',
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'customer'::user_role,
  reward_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  item_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT DEFAULT '',
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  brand_name TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  frames_360 TEXT[] DEFAULT '{}',
  video_url TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  rating DECIMAL(3,2) DEFAULT 5.00,
  review_count INT DEFAULT 0,
  stock INT DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT TRUE,
  is_flash_sale BOOLEAN DEFAULT FALSE,
  discount_percentage INT DEFAULT 0,
  specs JSONB DEFAULT '{}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category_name, '') || ' ' ||
      coalesce(brand_name, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED
);

-- 7. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  expiry_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  usage_limit INT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending'::payment_status,
  status order_status DEFAULT 'pending'::order_status,
  coupon_code TEXT,
  notes TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 11. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  likes INT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REVIEW LIKES (prevent duplicate likes)
CREATE TABLE IF NOT EXISTS public.review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'promotion', 'system', 'stock', 'review')) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  entity_type TEXT, -- 'product', 'order', 'coupon', etc.
  entity_id TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 15. RECENTLY VIEWED (for analytics)
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 16. FLASH SALE CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  banner_image TEXT,
  end_time TIMESTAMPTZ NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Products search
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON public.products(is_flash_sale) WHERE is_flash_sale = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved) WHERE is_approved = TRUE;

-- Wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update product review count and rating on review insert/delete/update
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products SET
    rating = (SELECT COALESCE(AVG(rating::DECIMAL), 5.0) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = TRUE),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = TRUE),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reviews_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Increment coupon usage count on order with coupon
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE code = NEW.coupon_code AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER order_coupon_usage
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- Send notification on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Order Status Updated',
      'Your order ' || NEW.order_number || ' is now ' || NEW.status || '.',
      'order',
      '/dashboard/orders/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Admin analytics view
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS total_revenue,
  COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
  COUNT(DISTINCT o.user_id) AS unique_customers,
  COUNT(DISTINCT p.id) AS total_products,
  COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS orders_this_month,
  COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.total_amount END), 0) AS revenue_this_month,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
  COUNT(CASE WHEN p.stock < 5 THEN 1 END) AS low_stock_products
FROM public.orders o
CROSS JOIN public.products p;

-- Popular products view
CREATE OR REPLACE VIEW public.popular_products AS
SELECT
  p.*,
  COUNT(DISTINCT o.id) AS order_count,
  COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM public.products p
LEFT JOIN (
  SELECT id, jsonb_array_elements(items)->>'productId' AS product_id FROM public.orders WHERE status != 'cancelled'
) o ON o.product_id = p.id::text
LEFT JOIN (
  SELECT jsonb_array_elements(items) AS oi FROM public.orders WHERE status != 'cancelled'
) items ON (items.oi->>'productId') = p.id::text
LEFT JOIN LATERAL (SELECT (items.oi->>'quantity')::int AS quantity) oi ON true
GROUP BY p.id
ORDER BY total_sold DESC NULLS LAST;

-- =====================================================================
-- HELPER SQL FUNCTIONS
-- =====================================================================

-- Full text product search
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.products
  WHERE
    is_active = TRUE AND (
      search_vector @@ plainto_tsquery('english', search_query)
      OR title ILIKE '%' || search_query || '%'
    )
  ORDER BY
    ts_rank(search_vector, plainto_tsquery('english', search_query)) DESC,
    is_featured DESC,
    rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Get revenue by day for last N days
CREATE OR REPLACE FUNCTION get_revenue_by_day(days_back INT DEFAULT 30)
RETURNS TABLE(date DATE, revenue DECIMAL, order_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) AS date,
    COALESCE(SUM(total_amount), 0) AS revenue,
    COUNT(*) AS order_count
  FROM public.orders
  WHERE
    created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND status != 'cancelled'
  GROUP BY DATE(created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Brands" ON public.brands;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public Read Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public Read Flash Sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users read own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users manage recently viewed" ON public.recently_viewed;
DROP POLICY IF EXISTS "Users manage review likes" ON public.review_likes;
DROP POLICY IF EXISTS "Users create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin Full Control" ON public.categories;
DROP POLICY IF EXISTS "Admin Full Control Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Control Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Control Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin read activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admin insert activity logs" ON public.activity_logs;

-- PUBLIC READ (Catalog)
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Flash Sales" ON public.flash_sales FOR SELECT USING (is_active = true);

-- USER PROFILE
CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- WISHLIST
CREATE POLICY "Users read own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- ADDRESSES
CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "Users create orders" ON public.orders
  FOR INSERT WITH CHECK (true); -- Allow guest checkout

-- NOTIFICATIONS
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RECENTLY VIEWED
CREATE POLICY "Users manage recently viewed" ON public.recently_viewed
  FOR ALL USING (auth.uid() = user_id);

-- REVIEW LIKES
CREATE POLICY "Users manage review likes" ON public.review_likes
  FOR ALL USING (auth.uid() = user_id);

-- REVIEWS (authenticated users can create)
CREATE POLICY "Users create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- ADMIN POLICIES (check role in user_profiles)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admin Full Control" ON public.categories
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Brands" ON public.brands
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Products" ON public.products
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Orders" ON public.orders
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Coupons" ON public.coupons
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Users" ON public.user_profiles
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin read activity logs" ON public.activity_logs
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Full Control Reviews" ON public.reviews
  FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Control Flash Sales" ON public.flash_sales
  FOR ALL USING (is_admin());

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-media', 'product-media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public read product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;

CREATE POLICY "Public read product media" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Admin upload product media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-media' AND is_admin());
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
