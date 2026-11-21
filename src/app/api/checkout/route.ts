import { NextResponse } from 'next/server';
import { CATALOG_RECONCILIATION } from '@/data/boutiqueData';
import { validateCartForCheckout } from '@/lib/purchaseGuard';

const FREE_SHIPPING_THRESHOLD = 65;
const STANDARD_US_SHIPPING_USD = 7;
const SHOPIFY_API_VERSION = '2024-10';

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

function getServerShopifyConfig() {
  const rawDomain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    '';
  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const storefrontToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    '';

  const configured = Boolean(
    domain &&
      storefrontToken &&
      !domain.includes('your-store') &&
      !storefrontToken.includes('your-storefront')
  );

  return { domain, storefrontToken, configured };
}

export async function POST(request: Request) {
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

  // 1. Server-side U.S.-only launch scope check (Note: Shopify Admin Shipping Zones remain mandatory for authoritative checkout enforcement)
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

  // 2. Authoritative server-side purchase-lock & inventory validation against PRETTYPIGGIE_PRODUCTS
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
  const cleanEmail =
    typeof body.guestEmail === 'string' && body.guestEmail.trim()
      ? body.guestEmail.trim()
      : undefined;

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

  // 3. Live Shopify Storefront API cartCreate (ONLY when live credentials are supplied)
  const shopify = getServerShopifyConfig();
  if (shopify.configured) {
    try {
      const lines = verifiedItems.map((item) => ({
        merchandiseId: item.shopifyVariantId,
        quantity: item.quantity,
        attributes: [
          { key: 'Shade', value: item.shadeName },
          { key: 'Finish', value: item.finish },
          { key: 'SKU', value: item.sku },
          { key: 'Source', value: 'PrettyPiggie 3D Virtual Boutique' },
        ],
      }));

      const cartInput: Record<string, unknown> = {
        lines,
        buyerIdentity: {
          countryCode: 'US',
          ...(cleanEmail ? { email: cleanEmail } : {}),
        },
        attributes: [
          {
            key: 'Storefront Experience',
            value: 'PrettyPiggie 3D Mobile-First Virtual Boutique',
          },
          {
            key: 'Shipping Market Scope',
            value: 'US_ONLY_INITIAL_LAUNCH',
          },
        ],
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
    } catch {
      return NextResponse.json(
        {
          error: 'Unable to reach live Shopify Storefront API.',
          code: 'SHOPIFY_UPSTREAM_ERROR',
        },
        { status: 502 }
      );
    }
  }

  // 4. Sandbox Preview Mode (Explicitly marked simulated — NEVER represented as a live order or payment capture)
  return NextResponse.json({
    mode: 'shopify-preview',
    isSimulatedPreview: true,
    checkoutUrl: `#sandbox-preview-${orderReference}`,
    cartId: `sandbox-preview://cart/${orderReference}`,
    orderReference,
    guestEmail: cleanEmail,
    verifiedItems,
    totals: { subtotal, shippingCost, total, currency: 'USD' },
    notice:
      'SANDBOX PREVIEW ONLY: Live Shopify Storefront credentials are not configured. No real payment, order, or shipment was created.',
  });
}
