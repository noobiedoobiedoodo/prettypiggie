import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';
import { BlockedCartLine, validateCartForCheckout } from '@/lib/purchaseGuard';
import { BoutiqueProduct, CartItem } from '@/types/boutique';

const RAW_SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_DOMAIN = RAW_SHOPIFY_DOMAIN.replace(/^https?:\/\//, '').replace(
  /\/.*$/,
  ''
);

export const PENDING_SHOPIFY_CART_STORAGE_KEY =
  'prettypiggie_pending_shopify_cart_id';

/**
 * Client-safe indicator only (Shopify Storefront tokens are read strictly server-side
 * in /api/checkout and never bundled into client JavaScript).
 */
export function isShopifyConfigured(): boolean {
  return Boolean(SHOPIFY_DOMAIN && !SHOPIFY_DOMAIN.includes('your-store'));
}

export class PurchaseLockError extends Error {
  code: string;
  blockedItems: BlockedCartLine[];

  constructor(
    message: string,
    code = 'PURCHASE_LOCK_ENFORCED',
    blockedItems: BlockedCartLine[] = []
  ) {
    super(message);
    this.name = 'PurchaseLockError';
    this.code = code;
    this.blockedItems = blockedItems;
  }
}

export interface CheckoutSessionResult {
  mode: 'shopify-live' | 'shopify-preview';
  isSimulatedPreview: boolean;
  checkoutUrl: string;
  cartId: string;
  orderReference: string;
  guestEmail?: string;
  marketingConsentRecorded?: boolean;
  notice?: string;
}

/**
 * Initiates checkout strictly through the server-side POST /api/checkout endpoint
 * after running authoritative local cart validation so locked/unverified/OOS products
 * can never bypass the purchase lock via stale carts or client-side manipulation.
 */
export async function initiateShopifyCheckout(
  items: CartItem[],
  guestEmail?: string,
  marketingOptIn = false
): Promise<CheckoutSessionResult> {
  const localValidation = validateCartForCheckout(items);
  if (!localValidation.ok) {
    throw new PurchaseLockError(
      localValidation.blockedItems.length > 0
        ? 'One or more items in your bag are locked pending manufacturer verification or are currently out of stock.'
        : 'Your shopping bag is empty.',
      localValidation.blockedItems.length > 0
        ? 'PURCHASE_LOCK_ENFORCED'
        : 'EMPTY_CART',
      localValidation.blockedItems
    );
  }

  const cleanEmail = guestEmail?.trim() || undefined;
  if (marketingOptIn && !cleanEmail) {
    throw new PurchaseLockError(
      'Please enter your email address above to record optional marketing consent.',
      'CONSENT_EMAIL_REQUIRED'
    );
  }

  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: localValidation.verifiedItems.map((i) => ({
        productId: i.productId,
        productHandle: i.productHandle,
        sku: i.sku,
        shadeId: i.shadeId,
        quantity: i.quantity,
      })),
      guestEmail: cleanEmail,
      marketingOptIn: Boolean(marketingOptIn),
      shippingCountry: 'US',
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    code?: string;
    blockedItems?: BlockedCartLine[];
    mode?: 'shopify-live' | 'shopify-preview';
    isSimulatedPreview?: boolean;
    checkoutUrl?: string;
    cartId?: string;
    orderReference?: string;
    guestEmail?: string;
    marketingConsentRecorded?: boolean;
    notice?: string;
  };

  if (!response.ok) {
    throw new PurchaseLockError(
      payload.error || 'Checkout request could not be completed.',
      payload.code || 'CHECKOUT_REJECTED',
      payload.blockedItems || []
    );
  }

  return {
    mode: payload.mode === 'shopify-live' ? 'shopify-live' : 'shopify-preview',
    isSimulatedPreview:
      payload.isSimulatedPreview ?? payload.mode !== 'shopify-live',
    checkoutUrl: payload.checkoutUrl || '#',
    cartId: payload.cartId || '',
    orderReference: payload.orderReference || 'PP-PREVIEW',
    guestEmail: payload.guestEmail,
    marketingConsentRecorded: Boolean(payload.marketingConsentRecorded),
    notice: payload.notice,
  };
}

export async function checkPendingCheckoutCompleted(
  cartId: string
): Promise<boolean> {
  if (!cartId || !cartId.startsWith('gid://shopify/Cart/')) return false;
  try {
    const res = await fetch(
      `/api/checkout?cartId=${encodeURIComponent(cartId)}`
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { completed?: boolean };
    return Boolean(data.completed);
  } catch {
    return false;
  }
}

export async function fetchBoutiqueCatalogue(): Promise<BoutiqueProduct[]> {
  return PRETTYPIGGIE_PRODUCTS;
}
