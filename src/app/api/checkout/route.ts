import { NextResponse } from 'next/server';
import { CATALOG_RECONCILIATION } from '@/data/boutiqueData';
import { validateCartForCheckout } from '@/lib/purchaseGuard';
import { checkApiRateLimit } from '@/lib/rateLimit';
import {
  checkShopifyCartCompleted,
  getServerShopifyConfig,
  isSafeShopifyCheckoutUrl,
  resolveLiveShopifyVariants,
} from '@/lib/shopifyVariantResolver';

const FREE_SHIPPING_THRESHOLD = 65;
const STANDARD_US_SHIPPING_USD = 7;
const SHOPIFY_API_VERSION = '2026-10';
const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 32 * 1024; // 32 KB ceiling
const MAX_CART_LINES = 25;
const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_CART_ID_REGEX = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9?=&_/-]{6,220}$/;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function isSameOriginOrAllowed(request: Request): boolean {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return true; // Non-browser / server-to-server requests without Origin

  try {
    const originHost = new URL(originHeader).host.toLowerCase();
    const requestHost = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    if (requestHost && originHost === requestHost) return true;
    const originHostname = new URL(originHeader).hostname.toLowerCase();
    if (
      originHostname === 'prettypiggie.com' ||
      originHostname === 'www.prettypiggie.com' ||
      originHostname.endsWith('.vercel.app')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const rate = checkApiRateLimit(request, 'checkout-get', 60);
  if (!rate.allowed) {
    return jsonNoStore(
      { error: 'Too many cart status checks.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const cartId = (searchParams.get('cartId') || '').trim();
  const shopify = getServerShopifyConfig();

  if (!cartId) {
    return jsonNoStore(
      { error: 'Missing cartId parameter.', code: 'MISSING_CART_ID' },
      { status: 400 }
    );
  }

  if (!SAFE_CART_ID_REGEX.test(cartId)) {
    return jsonNoStore(
      { error: 'Invalid Shopify Cart ID format.', code: 'INVALID_CART_ID' },
      { status: 400 }
    );
  }

  const status = await checkShopifyCartCompleted(cartId, shopify);
  return jsonNoStore({
    cartId,
    completed: status.completed,
    checkedLive: status.checkedLive,
  });
}

export async function POST(request: Request) {
  // 0a. Per-IP rate limiting against checkout/cart creation abuse
  const rate = checkApiRateLimit(request, 'checkout-post', 30);
  if (!rate.allowed) {
    return jsonNoStore(
      {
        error: 'Too many checkout requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      }
    );
  }

  // 0b. Cross-Origin CSRF / Origin verification for browser POST requests
  if (!isSameOriginOrAllowed(request)) {
    return jsonNoStore(
      {
        error: 'Cross-origin checkout requests are not permitted.',
        code: 'ORIGIN_MISMATCH',
      },
      { status: 403 }
    );
  }

  // 0c. Enforce JSON Content-Type
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return jsonNoStore(
      {
        error: 'Content-Type must be application/json.',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      },
      { status: 415 }
    );
  }

  // 0d. Enforce raw body size ceiling (32 KB) to prevent memory/CPU DoS
  const declaredLen = Number(request.headers.get('content-length') || 0);
  if (declaredLen > MAX_BODY_BYTES) {
    return jsonNoStore(
      {
        error: 'Checkout payload exceeds maximum allowed size.',
        code: 'PAYLOAD_TOO_LARGE',
      },
      { status: 413 }
    );
  }

  let body: Record<string, unknown>;
  try {
    const rawText = await request.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_BODY_BYTES) {
      return jsonNoStore(
        {
          error: 'Checkout payload exceeds maximum allowed size.',
          code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      );
    }
    const parsed = JSON.parse(rawText) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonNoStore(
        {
          error: 'Checkout payload must be a JSON object.',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonNoStore(
      {
        error: 'Invalid JSON request payload.',
        code: 'INVALID_JSON',
      },
      { status: 400 }
    );
  }

  if (Array.isArray(body.items) && body.items.length > MAX_CART_LINES) {
    return jsonNoStore(
      {
        error: `A single checkout is limited to ${MAX_CART_LINES} distinct items.`,
        code: 'CART_LIMIT_EXCEEDED',
      },
      { status: 400 }
    );
  }

  // 1. Server-side U.S.-only launch scope check (Shopify Admin Shipping Zones remain mandatory for authoritative checkout enforcement)
  const shippingCountry =
    typeof body.shippingCountry === 'string' && body.shippingCountry.trim()
      ? body.shippingCountry.trim().toUpperCase()
      : 'US';

  if (shippingCountry !== 'US') {
    return jsonNoStore(
      {
        error:
          'PrettyPiggie.com initial launch shipping is restricted to the United States (50 States & D.C.). Canadian and international shipping are disabled.',
        code: 'US_ONLY_SHIPPING_SCOPE',
        requestedCountry: shippingCountry,
        allowedCountries: ['US'],
      },
      { status: 403 }
    );
  }

  // 2. Validate optional guest email & CASL express marketing consent
  const cleanEmail =
    typeof body.guestEmail === 'string' && body.guestEmail.trim()
      ? body.guestEmail.trim()
      : undefined;

  if (
    cleanEmail &&
    (cleanEmail.length > 254 || !BASIC_EMAIL_REGEX.test(cleanEmail))
  ) {
    return jsonNoStore(
      {
        error: 'Please enter a valid email address for order tracking updates.',
        code: 'INVALID_EMAIL',
      },
      { status: 400 }
    );
  }

  const marketingOptIn = body.marketingOptIn === true;
  if (marketingOptIn && !cleanEmail) {
    return jsonNoStore(
      {
        error:
          'Please enter your email address above to record optional marketing consent.',
        code: 'CONSENT_EMAIL_REQUIRED',
      },
      { status: 400 }
    );
  }
  const consentTimestampUtc = new Date().toISOString();

  // 3. Authoritative server-side purchase-lock & inventory validation against PRETTYPIGGIE_PRODUCTS
  const validation = validateCartForCheckout(body.items);

  if (validation.blockedItems.length > 0) {
    return jsonNoStore(
      {
        error:
          'Checkout blocked: one or more submitted products are UNVERIFIED (purchase-locked), out of stock, or invalid.',
        code: 'PURCHASE_LOCK_ENFORCED',
        blockedItems: validation.blockedItems,
        reconciliation: CATALOG_RECONCILIATION,
      },
      { status: 422 }
    );
  }

  if (validation.verifiedItems.length === 0) {
    return jsonNoStore(
      {
        error: 'Your shopping bag is empty.',
        code: 'EMPTY_CART',
      },
      { status: 400 }
    );
  }

  const verifiedItems = validation.verifiedItems;

  const subtotal = Number(
    verifiedItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0
      ? 0
      : STANDARD_US_SHIPPING_USD;
  const total = Number((subtotal + shippingCost).toFixed(2));
  const orderReference = `PP-${Math.floor(100000 + Math.random() * 900000)}`;

  // 4. Live Shopify Storefront API cartCreate (resolves REAL numeric Variant GIDs + live Shopify stock)
  const shopify = getServerShopifyConfig();
  if (shopify.configured) {
    try {
      const resolution = await resolveLiveShopifyVariants(
        verifiedItems,
        shopify
      );

      if (resolution.unmappedItems.length > 0) {
        return jsonNoStore(
          {
            error:
              'One or more eligible products are not yet synced to a live Shopify variant ID. Push products via the Blanka Shopify App and check /api/shopify/health.',
            code: 'SHOPIFY_VARIANT_UNMAPPED',
            unmappedItems: resolution.unmappedItems,
          },
          { status: 422 }
        );
      }

      if (resolution.outOfStockItems.length > 0) {
        return jsonNoStore(
          {
            error:
              'One or more items just sold out in live Shopify inventory. Please remove out-of-stock items to continue.',
            code: 'SHOPIFY_VARIANT_OUT_OF_STOCK',
            outOfStockItems: resolution.outOfStockItems,
          },
          { status: 409 }
        );
      }

      const lines = resolution.resolvedLines.map(({ item, merchandiseId }) => ({
        merchandiseId,
        quantity: item.quantity,
        attributes: [
          { key: 'Shade', value: item.shadeName },
          { key: 'Finish', value: item.finish },
          { key: 'SKU', value: item.sku },
          { key: 'Source', value: 'PrettyPiggie 3D Virtual Boutique' },
        ],
      }));

      const cartAttributes: Array<{ key: string; value: string }> = [
        {
          key: 'Storefront Experience',
          value: 'PrettyPiggie 3D Mobile-First Virtual Boutique',
        },
        {
          key: 'Shipping Market Scope',
          value: 'US_ONLY_INITIAL_LAUNCH',
        },
        {
          key: 'CASL_Express_Marketing_Consent',
          value: marketingOptIn ? 'OPT_IN' : 'OPT_OUT',
        },
      ];

      if (marketingOptIn && cleanEmail) {
        cartAttributes.push(
          { key: 'CASL_Consent_Timestamp_UTC', value: consentTimestampUtc },
          { key: 'CASL_Consent_Email', value: cleanEmail }
        );
      }

      const cartInput: Record<string, unknown> = {
        lines,
        buyerIdentity: {
          countryCode: 'US',
          ...(cleanEmail ? { email: cleanEmail } : {}),
        },
        attributes: cartAttributes,
      };

      const endpoint = `https://${shopify.domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
      const shopifyResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': shopify.storefrontToken,
        },
        body: JSON.stringify({
          query: CART_CREATE_MUTATION,
          variables: { input: cartInput },
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (shopifyResponse.ok) {
        const json = (await shopifyResponse.json()) as {
          data?: {
            cartCreate?: {
              cart?: { id: string; checkoutUrl: string };
              userErrors?: Array<{ field?: string[]; message: string }>;
            };
          };
        };

        const createdCart = json.data?.cartCreate?.cart;
        if (createdCart?.checkoutUrl) {
          if (
            !isSafeShopifyCheckoutUrl(createdCart.checkoutUrl, shopify.domain)
          ) {
            return jsonNoStore(
              {
                error:
                  'Upstream checkout URL failed host safety validation and was blocked.',
                code: 'INVALID_CHECKOUT_URL',
              },
              { status: 502 }
            );
          }

          return jsonNoStore({
            mode: 'shopify-live',
            isSimulatedPreview: false,
            checkoutUrl: createdCart.checkoutUrl,
            cartId: createdCart.id,
            orderReference,
            guestEmail: cleanEmail,
            marketingConsentRecorded: marketingOptIn,
            verifiedItems,
            totals: { subtotal, shippingCost, total, currency: 'USD' },
          });
        }

        if (json.data?.cartCreate?.userErrors?.length) {
          return jsonNoStore(
            {
              error: 'Shopify Storefront rejected checkout creation.',
              code: 'SHOPIFY_CART_USER_ERROR',
              userErrors: json.data.cartCreate.userErrors,
            },
            { status: 502 }
          );
        }
      }

      return jsonNoStore(
        {
          error: 'Shopify Storefront returned an unexpected upstream status.',
          code: 'SHOPIFY_UPSTREAM_STATUS',
          upstreamStatus: shopifyResponse.status,
        },
        { status: 502 }
      );
    } catch {
      return jsonNoStore(
        {
          error: 'Unable to reach live Shopify Storefront API within timeout.',
          code: 'SHOPIFY_UPSTREAM_TIMEOUT_OR_ERROR',
        },
        { status: 502 }
      );
    }
  }

  // 5. Sandbox Preview Mode (Explicitly marked simulated — NEVER represented as a live order or payment capture)
  return jsonNoStore({
    mode: 'shopify-preview',
    isSimulatedPreview: true,
    checkoutUrl: `#sandbox-preview-${orderReference}`,
    cartId: `sandbox-preview://cart/${orderReference}`,
    orderReference,
    guestEmail: cleanEmail,
    marketingConsentRecorded: marketingOptIn,
    marketingConsentTimestampUtc: marketingOptIn ? consentTimestampUtc : null,
    verifiedItems,
    totals: { subtotal, shippingCost, total, currency: 'USD' },
    notice:
      'SANDBOX PREVIEW ONLY: Live Shopify Storefront credentials are not configured. No real payment, order, or shipment was created.',
  });
}
