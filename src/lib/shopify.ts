import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';
import { BoutiqueProduct, CartItem } from '@/types/boutique';

const RAW_SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_DOMAIN = RAW_SHOPIFY_DOMAIN.replace(/^https?:\/\//, '').replace(
  /\/.*$/,
  ''
);
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
const SHOPIFY_API_VERSION = '2024-10';

export function isShopifyConfigured(): boolean {
  return Boolean(
    SHOPIFY_DOMAIN &&
      SHOPIFY_STOREFRONT_TOKEN &&
      !SHOPIFY_DOMAIN.includes('your-store') &&
      !SHOPIFY_STOREFRONT_TOKEN.includes('your-storefront')
  );
}

interface ShopifyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function shopifyStorefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  if (!isShopifyConfigured()) {
    return null;
  }

  try {
    const endpoint = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as ShopifyGraphQLResponse<T>;
    if (json.errors?.length) {
      console.warn('Shopify Storefront API warning:', json.errors);
    }
    return json.data ?? null;
  } catch (error) {
    console.warn('Shopify Storefront network fallback activated:', error);
    return null;
  }
}

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

export interface CheckoutSessionResult {
  mode: 'shopify-live' | 'shopify-preview';
  checkoutUrl: string;
  cartId: string;
  orderReference: string;
  guestEmail?: string;
}

export async function initiateShopifyCheckout(
  items: CartItem[],
  guestEmail?: string
): Promise<CheckoutSessionResult> {
  const orderReference = `PP-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanEmail = guestEmail?.trim() || undefined;

  if (isShopifyConfigured()) {
    const lines = items.map((item) => ({
      merchandiseId: item.shopifyVariantId,
      quantity: item.quantity,
      attributes: [
        { key: 'Shade', value: item.shadeName },
        { key: 'Finish', value: item.finish },
        { key: 'Source', value: 'PrettyPiggie 3D Virtual Boutique' },
      ],
    }));

    interface CartCreateData {
      cartCreate?: {
        cart?: {
          id: string;
          checkoutUrl: string;
        };
        userErrors?: Array<{ field?: string[]; message: string }>;
      };
    }

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
          key: 'Shipping Market Control',
          value: 'US_ONLY_INITIAL_LAUNCH (CA Disabled Pending Gate)',
        },
      ],
    };

    const data = await shopifyStorefrontFetch<CartCreateData>(
      CART_CREATE_MUTATION,
      {
        input: cartInput,
      }
    );

    if (data?.cartCreate?.userErrors?.length) {
      console.warn('Shopify cartCreate userErrors:', data.cartCreate.userErrors);
    }

    if (data?.cartCreate?.cart?.checkoutUrl) {
      return {
        mode: 'shopify-live',
        checkoutUrl: data.cartCreate.cart.checkoutUrl,
        cartId: data.cartCreate.cart.id,
        orderReference,
        guestEmail: cleanEmail,
      };
    }
  }

  return {
    mode: 'shopify-preview',
    checkoutUrl: `#checkout-${orderReference}`,
    cartId: `gid://shopify/Cart/${orderReference}`,
    orderReference,
    guestEmail: cleanEmail,
  };
}

export async function fetchBoutiqueCatalogue(): Promise<BoutiqueProduct[]> {
  return PRETTYPIGGIE_PRODUCTS;
}
