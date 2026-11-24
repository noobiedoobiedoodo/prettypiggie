#!/usr/bin/env node
/**
 * PrettyPiggie.com — Shopify Product & Variant Mapping Register & Live Sync CLI
 * (Master Directive Sections 4 & 5)
 *
 * - Reads authoritative 52 VERIFIED_IN_STOCK eligible products from src/data/blankaCatalog.json
 * - When SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_ACCESS_TOKEN are set:
 *     Queries live Shopify Storefront API (2026-10) to resolve real numeric
 *     gid://shopify/Product/<id> and gid://shopify/ProductVariant/<id> GIDs,
 *     rejects missing or ambiguous mappings (fail-closed), detects price and
 *     inventory drift, and writes verified numeric mappings to src/lib/shopifyVariantMap.json.
 * - When live credentials are not yet set:
 *     Generates the structured 52-product mapping register transparently marked
 *     PENDING_LIVE_SHOPIFY_SYNC without ever fabricating a GID from a SKU string.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SHOPIFY_API_VERSION = '2026-10';
const NUMERIC_PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d+$/;
const NUMERIC_VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

const catalog = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'src/data/blankaCatalog.json'), 'utf8')
);
const eligibleProducts = catalog.filter(
  (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
);

const rawDomain = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  ''
)
  .trim()
  .replace(/^https?:\/\//i, '')
  .replace(/\/.*$/, '');
const token = (
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  ''
).trim();

const liveConfigured = Boolean(
  rawDomain &&
    token &&
    !rawDomain.includes('your-store') &&
    !token.includes('your-storefront')
);

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function stripPrefix(sku) {
  return String(sku || '').trim().toUpperCase().replace(/^PP-/, '');
}

const PRODUCTS_QUERY = `
  query SyncShopifyCatalog($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        variants(first: 100) {
          nodes {
            id
            sku
            title
            availableForSale
            price { amount currencyCode }
          }
        }
      }
    }
  }
`;

async function fetchLiveShopifyVariants() {
  if (!liveConfigured) return null;
  const endpoint = `https://${rawDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const bySku = new Map();
  const byHandleTitle = new Map();
  const byHandleSingle = new Map();
  const ambiguousSkus = new Set();

  let cursor = null;
  for (let page = 0; page < 5; page += 1) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { cursor } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`Shopify Storefront API HTTP ${res.status}`);
    }
    const json = await res.json();
    const nodes = json.data?.products?.nodes ?? [];
    for (const prod of nodes) {
      if (!NUMERIC_PRODUCT_GID.test(prod.id)) continue;
      const variants = prod.variants?.nodes ?? [];
      for (const v of variants) {
        if (!NUMERIC_VARIANT_GID.test(v.id)) continue;
        const rec = {
          productGid: prod.id,
          variantGid: v.id,
          productHandle: prod.handle,
          productTitle: prod.title,
          sku: (v.sku || '').trim(),
          variantTitle: (v.title || 'Default Title').trim(),
          availableForSale: Boolean(v.availableForSale),
          livePrice: Number(v.price?.amount || 0),
        };
        if (rec.sku) {
          for (const k of [norm(rec.sku), norm(stripPrefix(rec.sku))]) {
            if (bySku.has(k) && bySku.get(k).variantGid !== rec.variantGid) {
              ambiguousSkus.add(k);
            } else {
              bySku.set(k, rec);
            }
          }
        }
        byHandleTitle.set(`${norm(prod.handle)}::${norm(rec.variantTitle)}`, rec);
        if (variants.length === 1 || norm(rec.variantTitle) === 'default title') {
          byHandleSingle.set(norm(prod.handle), rec);
        }
      }
    }
    const pageInfo = json.data?.products?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    cursor = pageInfo.endCursor;
  }

  return { bySku, byHandleTitle, byHandleSingle, ambiguousSkus };
}

async function main() {
  const syncedAt = new Date().toISOString();
  const liveIndex = await fetchLiveShopifyVariants();

  const rows = [];
  const verifiedOverrideMap = {};
  let mappedCount = 0;
  let unmappedCount = 0;
  let ambiguousCount = 0;
  let priceDriftCount = 0;

  for (const product of eligibleProducts) {
    for (const shade of product.shades) {
      const ppSku = shade.sku || product.sku;
      let shopifyProductGid = 'PENDING_LIVE_SHOPIFY_SYNC';
      let shopifyVariantGid = 'PENDING_LIVE_SHOPIFY_SYNC';
      let liveAvailability = 'PENDING_LIVE_SHOPIFY_SYNC';
      let mappingStatus = 'PENDING_LIVE_SHOPIFY_SYNC';
      let verificationDate = 'PENDING';
      let liveShopifyPrice = null;

      if (liveIndex) {
        const skuKey = norm(ppSku);
        const strippedKey = norm(stripPrefix(ppSku));
        if (
          liveIndex.ambiguousSkus.has(skuKey) ||
          liveIndex.ambiguousSkus.has(strippedKey)
        ) {
          mappingStatus = 'REJECTED_AMBIGUOUS_SKU';
          ambiguousCount += 1;
        } else {
          const match =
            liveIndex.bySku.get(skuKey) ||
            liveIndex.bySku.get(strippedKey) ||
            liveIndex.byHandleTitle.get(
              `${norm(product.handle)}::${norm(shade.name)}`
            ) ||
            liveIndex.byHandleSingle.get(norm(product.handle));

          if (
            match &&
            NUMERIC_PRODUCT_GID.test(match.productGid) &&
            NUMERIC_VARIANT_GID.test(match.variantGid)
          ) {
            shopifyProductGid = match.productGid;
            shopifyVariantGid = match.variantGid;
            liveAvailability = match.availableForSale
              ? 'IN_STOCK_SHOPIFY'
              : 'OUT_OF_STOCK_SHOPIFY';
            liveShopifyPrice = match.livePrice;
            verificationDate = syncedAt.slice(0, 10);

            if (
              match.livePrice > 0 &&
              Math.abs(match.livePrice - product.price) > 0.01
            ) {
              mappingStatus = 'PRICE_DRIFT_DETECTED';
              priceDriftCount += 1;
            } else {
              mappingStatus = 'VERIFIED_NUMERIC_GID';
              verifiedOverrideMap[ppSku] = match.variantGid;
              mappedCount += 1;
            }
          } else {
            mappingStatus = 'UNMAPPED_FAIL_CLOSED';
            unmappedCount += 1;
          }
        }
      } else {
        unmappedCount += 1;
      }

      rows.push({
        prettyPiggieSku: ppSku,
        productHandle: product.handle,
        shopifyProductGid,
        shopifyVariantGid,
        productTitle: product.title,
        shadeVariant: shade.name,
        retailPriceUsd: product.price,
        liveShopifyPriceUsd: liveShopifyPrice,
        inventoryAvailability: liveAvailability,
        mappingStatus,
        mappingVerificationDate: verificationDate,
      });
    }
  }

  const registerJson = {
    schemaVersion: '1.0.0-rc2',
    generatedAt: syncedAt,
    shopifyApiVersion: SHOPIFY_API_VERSION,
    liveStoreConnected: liveConfigured,
    summary: {
      eligibleProductsCount: eligibleProducts.length,
      eligibleShadeVariantsCount: rows.length,
      mappedVerifiedVariantsCount: mappedCount,
      unmappedFailClosedCount: unmappedCount,
      ambiguousRejectedCount: ambiguousCount,
      priceDriftDetectedCount: priceDriftCount,
      syntheticGidsPermitted: false,
    },
    mappings: rows,
  };

  fs.writeFileSync(
    path.join(rootDir, 'src/data/shopifyVariantMappingRegister.json'),
    JSON.stringify(registerJson, null, 2),
    'utf8'
  );

  if (liveConfigured) {
    fs.writeFileSync(
      path.join(rootDir, 'src/lib/shopifyVariantMap.json'),
      JSON.stringify(verifiedOverrideMap, null, 2),
      'utf8'
    );
  }

  let md = `# PrettyPiggie.com — Shopify Product & Variant Mapping Register (52 Eligible Products)\n\n`;
  md += `**Shopify Storefront API Version:** \`${SHOPIFY_API_VERSION}\`  \n`;
  md += `**Live Shopify Store Connected:** \`${liveConfigured ? `YES (${rawDomain})` : 'NO — PENDING LIVE CREDENTIALS'}\`  \n`;
  md += `**Fail-Closed Rule:** Synthetic SKU-derived GIDs are strictly prohibited. Any variant without a verified numeric \`gid://shopify/ProductVariant/<numeric>\` ID is rejected by \`POST /api/checkout\` (\`HTTP 422 SHOPIFY_VARIANT_UNMAPPED\`).\n\n`;
  md += `- **Eligible Products (\`VERIFIED_IN_STOCK\`):** \`${eligibleProducts.length}\`\n`;
  md += `- **Total Eligible Shade Variants:** \`${rows.length}\`\n`;
  md += `- **Verified Numeric Shopify Variant Mappings:** \`${mappedCount}\`\n`;
  md += `- **Pending / Unmapped (Fail-Closed):** \`${unmappedCount}\`\n`;
  md += `- **Ambiguous Rejected:** \`${ambiguousCount}\`\n`;
  md += `- **Price Drift Detected:** \`${priceDriftCount}\`\n\n`;
  md += `## Complete Variant Mapping Register\n\n`;
  md += `| # | PrettyPiggie SKU | Product Handle | Shopify Product GID | Shopify Variant GID | Product Title | Shade / Variant | Retail Price | Inventory Availability | Mapping Status | Mapping Verification Date |\n`;
  md += `|---|---|---|---|---|---|---|---:|---|---|---|\n`;
  rows.forEach((r, idx) => {
    md += `| ${idx + 1} | \`${r.prettyPiggieSku}\` | \`${r.productHandle}\` | \`${r.shopifyProductGid}\` | \`${r.shopifyVariantGid}\` | **${r.productTitle}** | ${r.shadeVariant} | \\$${r.retailPriceUsd.toFixed(2)} | \`${r.inventoryAvailability}\` | \`${r.mappingStatus}\` | \`${r.mappingVerificationDate}\` |\n`;
  });

  fs.writeFileSync(
    path.join(rootDir, 'SHOPIFY_VARIANT_MAPPING_REGISTER.md'),
    md,
    'utf8'
  );

  console.log('SHOPIFY VARIANT MAPPING REGISTER GENERATED:', registerJson.summary);
}

main().catch((err) => {
  console.error('SHOPIFY SYNC ERROR:', err);
  process.exit(1);
});
