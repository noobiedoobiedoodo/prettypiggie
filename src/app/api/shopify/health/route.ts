import { NextResponse } from 'next/server';
import {
  CATALOG_RECONCILIATION,
  PRETTYPIGGIE_PRODUCTS,
} from '@/data/boutiqueData';
import { checkApiRateLimit } from '@/lib/rateLimit';
import {
  getServerShopifyConfig,
  resolveLiveShopifyVariants,
} from '@/lib/shopifyVariantResolver';
import { CartItem } from '@/types/boutique';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request: Request) {
  const rate = checkApiRateLimit(request, 'shopify-health', 30);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many health check requests.', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  const shopify = getServerShopifyConfig();
  const eligibleProducts = PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
  );

  if (!shopify.configured) {
    return NextResponse.json(
      {
        configured: false,
        mode: 'shopify-preview',
        automaticOrderAndShipmentReady: false,
        reconciliation: CATALOG_RECONCILIATION,
        eligibleProductCount: eligibleProducts.length,
        mappedEligibleCount: 0,
        unmappedEligibleCount: eligibleProducts.length,
        priceDriftCount: 0,
        blockers: [
          'Live Shopify Storefront credentials (NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN & NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) are not set.',
          'Blanka Shopify App must push the 52 eligible SKUs into Shopify so numeric ProductVariant GIDs map automatically.',
          'Shopify Admin -> Shipping and delivery must restrict shipping exclusively to the United States.',
          'Blanka Auto-Fulfill / Auto-Pay must be enabled with a billing card on file for automatic post-payment shipment creation.',
        ],
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  const sampleItems: CartItem[] = eligibleProducts.map((product) => {
    const shade = product.shades[0];
    return {
      key: `${product.id}::${shade.id}`,
      productId: product.id,
      productHandle: product.handle,
      sku: shade.sku || product.sku,
      title: product.title,
      category: product.category,
      modelType: product.modelType,
      shadeId: shade.id,
      shadeName: shade.name,
      shadeHex: shade.hex,
      finish: shade.finish,
      price: product.price,
      primaryImage: product.primaryImage,
      quantity: 1,
      shopifyVariantId: '',
    };
  });

  try {
    const resolution = await resolveLiveShopifyVariants(sampleItems, shopify);
    return NextResponse.json(
      {
        configured: true,
        mode: 'shopify-live',
        automaticOrderAndShipmentReady:
          resolution.unmappedItems.length === 0 &&
          resolution.priceDriftItems.length === 0 &&
          resolution.resolvedLines.length > 0,
        reconciliation: CATALOG_RECONCILIATION,
        eligibleProductCount: eligibleProducts.length,
        mappedInStockCount: resolution.resolvedLines.length,
        outOfStockInShopifyCount: resolution.outOfStockItems.length,
        unmappedEligibleCount: resolution.unmappedItems.length,
        priceDriftCount: resolution.priceDriftItems.length,
        unmappedEligibleItems: resolution.unmappedItems,
        outOfStockInShopifyItems: resolution.outOfStockItems,
        priceDriftItems: resolution.priceDriftItems,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      {
        configured: true,
        mode: 'shopify-live-unreachable',
        automaticOrderAndShipmentReady: false,
        error: 'Unable to reach Shopify Storefront API within timeout.',
      },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}
