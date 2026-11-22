import { NextResponse } from 'next/server';
import { CATALOG_RECONCILIATION } from '@/data/boutiqueData';
import { validateCartForCheckout } from '@/lib/purchaseGuard';
import { checkCheckoutRateLimit } from '@/lib/rateLimit';
import {
  checkShopifyCartCompleted,
  getServerShopifyConfig,
  resolveLiveShopifyVariants,
} from '@/lib/shopifyVariantResolver';

const FREE_SHIPPING_THRESHOLD = 65;
const STANDARD_US_SHIPPING_USD = 7;
const SHOPIFY_API_VERSION = '2024-10';
const UPSTREAM_TIMEOUT_MS = 8000;
const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get('cartId') || '';
  const shopify = getServerShopifyConfig();

  if (!cartId) {
    return NextResponse.json(
      { error: 'Missing cartId parameter.', code: 'MISSING_CART_ID' },
      { status: 400 }
    );
  }

  const status = await checkShopifyCartCompleted(cartId, shopify);
  return NextResponse.json({
    cartId,
    completed: status.completed,
    checkedLive: status.checkedLive,
  });
}

export async function POST(request: Request) {
  // 0. Per-IP rate limiting against checkout/cart creation abuse
  const rate = checkCheckoutRateLimit(request);
  if (!rate.allowed) {
    return NextResponse.json(
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid JSON request payload.',
        code: 'INVALID_JSON',
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
    return NextResponse.json(
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

  if (cleanEmail && !BASIC_EMAIL_REGEX.test(cleanEmail)) {
    return NextResponse.json(
      {
        error: 'Please enter a valid email address for order tracking updates.',
        code: 'INVALID_EMAIL',
      },
      { status: 400 }
    );
  }

  const marketingOptIn = body.marketingOptIn === true;
  if (marketingOptIn && !cleanEmail) {
    return NextResponse.json(
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
    return NextResponse.json(
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
    return NextResponse.json(
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
        return NextResponse.json(
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
        return NextResponse.json(
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
          return NextResponse.json({
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
          return NextResponse.json(
            {
              error: 'Shopify Storefront rejected checkout creation.',
              code: 'SHOPIFY_CART_USER_ERROR',
              userErrors: json.data.cartCreate.userErrors,
            },
            { status: 502 }
          );
        }
      }

      return NextResponse.json(
        {
          error: 'Shopify Storefront returned an unexpected upstream status.',
          code: 'SHOPIFY_UPSTREAM_STATUS',
          upstreamStatus: shopifyResponse.status,
        },
        { status: 502 }
      );
    } catch {
      return NextResponse.json(
        {
          error: 'Unable to reach live Shopify Storefront API within timeout.',
          code: 'SHOPIFY_UPSTREAM_TIMEOUT_OR_ERROR',
        },
        { status: 502 }
      );
    }
  }

  // 5. Sandbox Preview Mode (Explicitly marked simulated — NEVER represented as a live order or payment capture)
  return NextResponse.json({
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
