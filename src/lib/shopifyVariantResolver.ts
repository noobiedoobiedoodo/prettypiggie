import variantMapRaw from '@/lib/shopifyVariantMap.json';
import { CartItem } from '@/types/boutique';

const SHOPIFY_API_VERSION = '2024-10';
const UPSTREAM_TIMEOUT_MS = 8000;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const SAFE_HOSTNAME_REGEX = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;
const IPV4_LITERAL_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

export const NUMERIC_SHOPIFY_VARIANT_GID_REGEX =
  /^gid:\/\/shopify\/ProductVariant\/\d+$/;

const EXPLICIT_VARIANT_OVERRIDES = variantMapRaw as Record<string, string>;

export interface ServerShopifyConfig {
  domain: string;
  storefrontToken: string;
  configured: boolean;
}

function isSafeShopifyHostname(hostname: string): boolean {
  const lower = hostname.trim().toLowerCase();
  if (!lower || !SAFE_HOSTNAME_REGEX.test(lower)) return false;
  if (IPV4_LITERAL_REGEX.test(lower)) return false;
  if (
    lower === 'localhost' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.includes('your-store')
  ) {
    return false;
  }
  return true;
}

export function getServerShopifyConfig(): ServerShopifyConfig {
  const rawDomain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    '';
  const domain = rawDomain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  const storefrontToken = (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ''
  ).trim();

  const configured = Boolean(
    isSafeShopifyHostname(domain) &&
      storefrontToken.length >= 10 &&
      !storefrontToken.includes('your-storefront')
  );

  return { domain, storefrontToken, configured };
}

export function isNumericShopifyVariantGid(value: unknown): value is string {
  return (
    typeof value === 'string' && NUMERIC_SHOPIFY_VARIANT_GID_REGEX.test(value)
  );
}

/**
 * Validates that a Shopify checkoutUrl uses HTTPS and points only to the
 * configured Shopify domain or official Shopify/Shop Pay checkout domains.
 */
export function isSafeShopifyCheckoutUrl(
  checkoutUrl: unknown,
  configuredDomain: string
): checkoutUrl is string {
  if (typeof checkoutUrl !== 'string' || !checkoutUrl.trim()) return false;
  try {
    const parsed = new URL(checkoutUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    const expected = configuredDomain.toLowerCase();
    return (
      host === expected ||
      host.endsWith('.myshopify.com') ||
      host === 'checkout.shopify.com' ||
      host === 'shop.app' ||
      host.endsWith('.shop.app')
    );
  } catch {
    return false;
  }
}

export interface LiveShopifyVariantRecord {
  id: string;
  sku: string;
  title: string;
  productHandle: string;
  productTitle: string;
  availableForSale: boolean;
  priceAmount: number;
}

interface CachedShopifyIndex {
  domain: string;
  fetchedAt: number;
  bySku: Map<string, LiveShopifyVariantRecord>;
  byHandleAndTitle: Map<string, LiveShopifyVariantRecord>;
  byHandleDefault: Map<string, LiveShopifyVariantRecord>;
}

let cachedIndex: CachedShopifyIndex | null = null;

const PRODUCTS_VARIANTS_QUERY = `
  query FetchShopifyVariants($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        variants(first: 100) {
          nodes {
            id
            sku
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function stripPrettyPiggiePrefix(sku: string): string {
  return sku.trim().toUpperCase().replace(/^PP-/, '');
}

function getExplicitOverrideGid(sku: string): string | undefined {
  const candidates = [sku, sku.toUpperCase(), stripPrettyPiggiePrefix(sku)];
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(EXPLICIT_VARIANT_OVERRIDES, key)) {
      const val = EXPLICIT_VARIANT_OVERRIDES[key];
      if (isNumericShopifyVariantGid(val)) {
        return val;
      }
    }
  }
  return undefined;
}

export async function fetchShopifyLiveVariantIndex(
  config: ServerShopifyConfig,
  forceRefresh = false
): Promise<CachedShopifyIndex | null> {
  if (!config.configured) return null;

  if (
    !forceRefresh &&
    cachedIndex &&
    cachedIndex.domain === config.domain &&
    Date.now() - cachedIndex.fetchedAt < CATALOG_CACHE_TTL_MS
  ) {
    return cachedIndex;
  }

  const bySku = new Map<string, LiveShopifyVariantRecord>();
  const byHandleAndTitle = new Map<string, LiveShopifyVariantRecord>();
  const byHandleDefault = new Map<string, LiveShopifyVariantRecord>();

  const endpoint = `https://${config.domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  let cursor: string | null = null;
  let pages = 0;

  while (pages < 5) {
    pages += 1;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_VARIANTS_QUERY,
        variables: { cursor },
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      data?: {
        products?: {
          pageInfo?: { hasNextPage: boolean; endCursor: string | null };
          nodes?: Array<{
            handle: string;
            title: string;
            variants?: {
              nodes?: Array<{
                id: string;
                sku?: string | null;
                title?: string | null;
                availableForSale?: boolean;
                price?: { amount?: string };
              }>;
            };
          }>;
        };
      };
    };

    const products = json.data?.products?.nodes ?? [];
    for (const product of products) {
      const variants = product.variants?.nodes ?? [];
      for (const v of variants) {
        if (!isNumericShopifyVariantGid(v.id)) continue;
        const record: LiveShopifyVariantRecord = {
          id: v.id,
          sku: (v.sku || '').trim(),
          title: (v.title || 'Default Title').trim(),
          productHandle: product.handle,
          productTitle: product.title,
          availableForSale: Boolean(v.availableForSale),
          priceAmount: Number(v.price?.amount || 0),
        };

        if (record.sku) {
          bySku.set(normalizeKey(record.sku), record);
          bySku.set(normalizeKey(stripPrettyPiggiePrefix(record.sku)), record);
        }

        const handleKey = normalizeKey(product.handle);
        byHandleAndTitle.set(
          `${handleKey}::${normalizeKey(record.title)}`,
          record
        );
        if (
          variants.length === 1 ||
          normalizeKey(record.title) === 'default title'
        ) {
          byHandleDefault.set(handleKey, record);
        }
      }
    }

    const pageInfo = json.data?.products?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
      break;
    }
    cursor = pageInfo.endCursor;
  }

  cachedIndex = {
    domain: config.domain,
    fetchedAt: Date.now(),
    bySku,
    byHandleAndTitle,
    byHandleDefault,
  };

  return cachedIndex;
}

export interface ResolvedVariantLine {
  item: CartItem;
  merchandiseId: string;
  availableForSale: boolean;
  liveShopifyPrice?: number;
  resolutionSource: 'override-map' | 'shopify-sku' | 'shopify-handle-shade';
}

export interface PriceDriftItem {
  sku: string;
  handle: string;
  title: string;
  catalogPrice: number;
  liveShopifyPrice: number;
}

export interface VariantResolutionResult {
  ok: boolean;
  resolvedLines: ResolvedVariantLine[];
  unmappedItems: Array<{
    sku: string;
    handle: string;
    title: string;
    shadeName: string;
  }>;
  outOfStockItems: Array<{
    sku: string;
    handle: string;
    title: string;
    shadeName: string;
  }>;
  priceDriftItems: PriceDriftItem[];
}

/**
 * Resolves verified cart items to REAL numeric Shopify ProductVariant GIDs
 * (e.g. gid://shopify/ProductVariant/44123456789012), checks live availability,
 * and surfaces any catalog-vs-Shopify retail price drift.
 */
export async function resolveLiveShopifyVariants(
  items: CartItem[],
  config: ServerShopifyConfig
): Promise<VariantResolutionResult> {
  const index = await fetchShopifyLiveVariantIndex(config);

  const resolvedLines: ResolvedVariantLine[] = [];
  const unmappedItems: VariantResolutionResult['unmappedItems'] = [];
  const outOfStockItems: VariantResolutionResult['outOfStockItems'] = [];
  const priceDriftItems: PriceDriftItem[] = [];

  for (const item of items) {
    const skuKey = normalizeKey(item.sku);
    const strippedSkuKey = normalizeKey(stripPrettyPiggiePrefix(item.sku));
    const handleKey = normalizeKey(item.productHandle);
    const shadeKey = `${handleKey}::${normalizeKey(item.shadeName)}`;

    // 1. Check explicit override map (own-property guarded + numeric GID validated)
    const overrideGid = getExplicitOverrideGid(item.sku);
    if (overrideGid) {
      resolvedLines.push({
        item,
        merchandiseId: overrideGid,
        availableForSale: true,
        resolutionSource: 'override-map',
      });
      continue;
    }

    // 2. Match against live Shopify Storefront variant index
    const bySkuMatch =
      index?.bySku.get(skuKey) ?? index?.bySku.get(strippedSkuKey);
    const byHandleShadeMatch =
      index?.byHandleAndTitle.get(shadeKey) ??
      index?.byHandleDefault.get(handleKey);
    const matched = bySkuMatch ?? byHandleShadeMatch;

    if (!matched || !isNumericShopifyVariantGid(matched.id)) {
      unmappedItems.push({
        sku: item.sku,
        handle: item.productHandle,
        title: item.title,
        shadeName: item.shadeName,
      });
      continue;
    }

    if (
      matched.priceAmount > 0 &&
      Math.abs(matched.priceAmount - item.price) > 0.01
    ) {
      priceDriftItems.push({
        sku: item.sku,
        handle: item.productHandle,
        title: item.title,
        catalogPrice: item.price,
        liveShopifyPrice: matched.priceAmount,
      });
    }

    if (!matched.availableForSale) {
      outOfStockItems.push({
        sku: item.sku,
        handle: item.productHandle,
        title: item.title,
        shadeName: item.shadeName,
      });
      continue;
    }

    resolvedLines.push({
      item,
      merchandiseId: matched.id,
      availableForSale: matched.availableForSale,
      liveShopifyPrice: matched.priceAmount || undefined,
      resolutionSource: bySkuMatch ? 'shopify-sku' : 'shopify-handle-shade',
    });
  }

  return {
    ok: unmappedItems.length === 0 && outOfStockItems.length === 0,
    resolvedLines,
    unmappedItems,
    outOfStockItems,
    priceDriftItems,
  };
}

const CART_STATUS_QUERY = `
  query CheckCartStatus($id: ID!) {
    cart(id: $id) {
      id
      totalQuantity
    }
  }
`;

export async function checkShopifyCartCompleted(
  cartId: string,
  config: ServerShopifyConfig
): Promise<{ completed: boolean; checkedLive: boolean }> {
  if (!config.configured || !cartId.startsWith('gid://shopify/Cart/')) {
    return { completed: false, checkedLive: false };
  }

  try {
    const endpoint = `https://${config.domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontToken,
      },
      body: JSON.stringify({
        query: CART_STATUS_QUERY,
        variables: { id: cartId },
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      return { completed: false, checkedLive: false };
    }

    const json = (await res.json()) as {
      data?: { cart?: { id: string; totalQuantity: number } | null };
    };

    const completed = json.data?.cart === null;
    return { completed, checkedLive: true };
  } catch {
    return { completed: false, checkedLive: false };
  }
}
