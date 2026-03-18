/**
 * normalizeSellerUrl
 *
 * Maps any notification / search action_url to a valid seller portal route.
 * The seller portal features:
 *   /seller/dashboard
 *   /seller/products
 *   /seller/orders
 *   /seller/returns
 *   /seller/analytics
 *   /seller/store
 *   /seller/payouts
 *   /seller/profile
 *   /seller/notifications
 */

const KNOWN_SELLER_PREFIXES = [
  '/seller/dashboard',
  '/seller/products',
  '/seller/orders',
  '/seller/returns',
  '/seller/analytics',
  '/seller/store',
  '/seller/payouts',
  '/seller/profile',
  '/seller/notifications',
];

export function normalizeSellerUrl(raw: string | null | undefined): string {
  if (!raw) return '/seller/dashboard';

  const url = raw.trim();

  // Already a valid seller route
  if (url.startsWith('/seller/')) {
    // Deep linking allowed for orders and products
    if (url.startsWith('/seller/orders/') || url.startsWith('/seller/products/')) {
      return url;
    }
    // Deep strip for everything else
    for (const prefix of KNOWN_SELLER_PREFIXES) {
      if (url.startsWith(prefix)) return prefix;
    }
    return '/seller/dashboard';
  }

  // Common maps
  if (url.startsWith('/orders'))     return '/seller/orders';
  if (url.startsWith('/products'))   return '/seller/products';
  if (url.startsWith('/returns'))    return '/seller/returns';
  if (url.startsWith('/analytics'))  return '/seller/analytics';
  if (url.startsWith('/messages'))   return '/seller/dashboard'; // Sellers don't have dedicated messages right now
  
  // Fallback
  return '/seller/dashboard';
}
