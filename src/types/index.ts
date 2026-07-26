export type Role = 'admin' | 'vendor' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  phone?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  itemCount: number;
  featured?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  color?: string;
  colorHex?: string;
  size?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  images: string[];
  frames360?: string[]; // array of images for 360 view
  videoUrl?: string;
  variants: ProductVariant[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  tags: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  isFlashSale?: boolean;
  discountPercentage?: number;
  specs?: Record<string, string>;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  product: Product;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
  quantity: number;
  price: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string; // Home, Work
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export type PaymentMethodType = 'stripe' | 'paypal' | 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'cod';

export interface PaymentDetails {
  method: PaymentMethodType;
  accountNumber?: string;
  transactionId?: string;
  cardLast4?: string;
  status: 'pending' | 'completed' | 'failed';
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: OrderStatus;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  likes: number;
  images?: string[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'stock';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface FlashSaleCampaign {
  id: string;
  title: string;
  subtitle: string;
  endTime: string;
  bannerImage: string;
  productIds: string[];
}
