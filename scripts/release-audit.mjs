#!/usr/bin/env node
/**
 * PrettyPiggie.com — Authoritative Adversarial Release & Security Audit Gate
 *
 * Modes:
 *   1. Local Build Audit (default):
 *        node scripts/release-audit.mjs
 *      Verifies catalog/register reconciliation, compiled .next/static/ bundles,
 *      spawns `next start` on an isolated loopback port, and executes exhaustive
 *      functional + adversarial security + rate-limit tests.
 *
 *   2. Remote Staging Audit:
 *        node scripts/release-audit.mjs --url https://your-staging.vercel.app
 *      Runs the live HTTP, security header, checkout-lock, adversarial, and
 *      SEO/Shopify health probes against a deployed Vercel staging URL.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const urlFlagIdx = args.indexOf('--url');
const remoteUrl =
  urlFlagIdx !== -1 && args[urlFlagIdx + 1]
    ? args[urlFlagIdx + 1].replace(/\/+$/, '')
    : null;
const isRemoteMode = Boolean(remoteUrl);

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else files.push(full);
  }
  return files;
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Wait for server boot
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

function recordCheck(results, id, passed, detail) {
  results.push({ id, passed: Boolean(passed), detail });
}

const tsModuleCache = new Map();
function loadTsModule(relFilePath) {
  const absPath = path.resolve(rootDir, relFilePath);
  if (tsModuleCache.has(absPath)) return tsModuleCache.get(absPath);

  const source = fs.readFileSync(absPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    fileName: absPath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  });

  const mod = new Module(absPath);
  mod.filename = absPath;
  mod.paths = Module._nodeModulePaths(path.dirname(absPath));
  const customRequire = (specifier) => {
    if (specifier.startsWith('@/')) {
      const mapped = path.join('src', specifier.slice(2));
      if (fs.existsSync(path.join(rootDir, `${mapped}.ts`))) {
        return loadTsModule(`${mapped}.ts`);
      }
      if (fs.existsSync(path.join(rootDir, `${mapped}.json`))) {
        return JSON.parse(
          fs.readFileSync(path.join(rootDir, `${mapped}.json`), 'utf8')
        );
      }
    }
    if (specifier.startsWith('.')) {
      const candidateBase = path.resolve(path.dirname(absPath), specifier);
      if (fs.existsSync(`${candidateBase}.ts`)) {
        return loadTsModule(path.relative(rootDir, `${candidateBase}.ts`));
      }
      if (fs.existsSync(candidateBase) && candidateBase.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(candidateBase, 'utf8'));
      }
    }
    return mod.require(specifier);
  };

  const fn = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    transpiled.outputText
  );
  tsModuleCache.set(absPath, mod.exports);
  fn(mod.exports, customRequire, mod, absPath, path.dirname(absPath));
  tsModuleCache.set(absPath, mod.exports);
  return mod.exports;
}

async function runStaticAndBundleGates(checks) {
  // 1. Cross-File Catalog & Register Reconciliation (52 / 4 / 54 = 110)
  const catalog = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'src/data/blankaCatalog.json'), 'utf8')
  );
  const mfgJson = JSON.parse(
    fs.readFileSync(
      path.join(rootDir, 'src/data/manufacturerDocumentationRegister.json'),
      'utf8'
    )
  );
  const mfgMd = fs.readFileSync(
    path.join(rootDir, 'MANUFACTURER_DOCUMENTATION_REGISTER.md'),
    'utf8'
  );
  const imageMap = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'src/lib/serverImageMap.json'), 'utf8')
  );

  const inStock52 = catalog.filter(
    (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
  );
  const oos4 = catalog.filter(
    (p) => p.availabilityState === 'VERIFIED_OUT_OF_STOCK'
  );
  const locked54 = catalog.filter(
    (p) => p.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED'
  );
  const distinctPrices = new Set(catalog.map((p) => p.price)).size;

  recordCheck(
    checks,
    'RECONCILE_52_4_54_CATALOG',
    catalog.length === 110 &&
      inStock52.length === 52 &&
      oos4.length === 4 &&
      locked54.length === 54 &&
      catalog.every((p) =>
        p.availabilityState === 'VERIFIED_IN_STOCK'
          ? p.canPurchase === true
          : p.canPurchase === false
      ) &&
      distinctPrices >= 70,
    {
      total: catalog.length,
      verifiedInStock: inStock52.length,
      verifiedOutOfStock: oos4.length,
      unverifiedLocked: locked54.length,
      distinctPrices,
    }
  );

  const mdInStock = (
    mfgMd.match(/VERIFIED_IN_STOCK \(Purchase Eligible\)/g) || []
  ).length;
  const mdOos = (
    mfgMd.match(/VERIFIED_OUT_OF_STOCK \(Verified • Sold Out\)/g) || []
  ).length;
  const mdLocked = (
    mfgMd.match(/UNVERIFIED_PURCHASE_LOCKED \(Locked\)/g) || []
  ).length;

  recordCheck(
    checks,
    'RECONCILE_REGISTER_JSON_AND_MD',
    mfgJson.products.length === 110 &&
      mfgJson.reconciliation.verifiedInStock === 52 &&
      mfgJson.reconciliation.verifiedOutOfStock === 4 &&
      mfgJson.reconciliation.unverifiedPurchaseLocked === 54 &&
      mdInStock === 52 &&
      mdOos === 4 &&
      mdLocked === 54,
    { mdInStock, mdOos, mdLocked }
  );

  // Two-tier INCI evidence classification check
  const supplierTranscriptions = catalog.filter(
    (p) => p.ingredientEvidenceTier === 'SUPPLIER_LISTING_COMPLETE_TRANSCRIPTION'
  ).length;
  const certifiedDocs = catalog.filter(
    (p) => p.manufacturerCertifiedDocOnFile === true
  ).length;
  recordCheck(
    checks,
    'INCI_TWO_TIER_EVIDENCE_CLASSIFICATION',
    supplierTranscriptions === 56 && certifiedDocs === 0,
    {
      supplierListingCompleteTranscriptions: supplierTranscriptions,
      manufacturerCertifiedDocumentsOnFile: certifiedDocs,
    }
  );

  // Image map SSRF & First-Party Proxy Integrity Check
  const badProxyUrls = [];
  const badUpstreamHosts = [];
  for (const item of catalog) {
    if (
      item.primaryImage &&
      item.primaryImage !== `/api/product-image/${item.slug}/primary`
    ) {
      badProxyUrls.push(item.primaryImage);
    }
    if (item.boxImage && item.boxImage !== `/api/product-image/${item.slug}/box`) {
      badProxyUrls.push(item.boxImage);
    }
    const mapped = imageMap[item.slug];
    for (const u of [mapped?.primary, mapped?.box].filter(Boolean)) {
      try {
        const parsed = new URL(u);
        if (
          parsed.protocol !== 'https:' ||
          parsed.hostname.toLowerCase() !== 'images.blankabrand.com'
        ) {
          badUpstreamHosts.push(u);
        }
      } catch {
        badUpstreamHosts.push(u);
      }
    }
  }
  recordCheck(
    checks,
    'IMAGE_PROXY_SSRF_AND_FIRST_PARTY_INTEGRITY',
    badProxyUrls.length === 0 && badUpstreamHosts.length === 0,
    { badProxyUrls: badProxyUrls.length, badUpstreamHosts: badUpstreamHosts.length }
  );

  // 2. Compiled Client Static Bundle Forensics (.next/static/**/*.js)
  if (!isRemoteMode) {
    const staticFiles = walkDir(path.join(rootDir, '.next/static')).filter((f) =>
      f.endsWith('.js')
    );
    const forbiddenPatterns = [
      'wholesaleCost',
      'profitPerUnit',
      'marginPercent',
      'blankaUrl',
      '73904-BLNK-',
      'images.blankabrand.com',
      'SHOPIFY_ADMIN_ACCESS_TOKEN',
      'SHOPIFY_STOREFRONT_ACCESS_TOKEN',
      'SHOPIFY_WEBHOOK_SECRET',
      'GEMINI_API_KEY',
      'OPENAI_API_KEY',
      'safety@prettypiggie.com',
      'support@prettypiggie.com',
      'privacy@prettypiggie.com',
      '100% Cruelty-Free',
      'Complete Manufacturer INCI Specification On File',
      'gid://shopify/ProductVariant/PP-',
    ];
    const hits = {};
    for (const pat of forbiddenPatterns) hits[pat] = 0;

    for (const file of staticFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pat of forbiddenPatterns) {
        if (content.includes(pat)) hits[pat] += 1;
      }
    }
    const totalHits = Object.values(hits).reduce((a, b) => a + b, 0);
    recordCheck(
      checks,
      'CLIENT_BUNDLE_ZERO_LEAKS_SCAN',
      staticFiles.length > 0 && totalHits === 0,
      { scannedJsFiles: staticFiles.length, totalHits, hits }
    );
  }
}

async function runLiveHttpAndAdversarialGates(baseUrl, checks) {
  // 1. Home page & HTTP Security Headers + No X-Powered-By Fingerprinting
  const homeRes = await fetch(`${baseUrl}/`);
  const csp = homeRes.headers.get('content-security-policy') || '';
  const hsts = homeRes.headers.get('strict-transport-security') || '';
  const nosniff = homeRes.headers.get('x-content-type-options') || '';
  const xfo = homeRes.headers.get('x-frame-options') || '';
  const referrer = homeRes.headers.get('referrer-policy') || '';
  const perms = homeRes.headers.get('permissions-policy') || '';
  const poweredBy = homeRes.headers.get('x-powered-by');

  recordCheck(
    checks,
    'HTTP_SECURITY_HEADERS_AND_CSP',
    homeRes.status === 200 &&
      csp.includes("default-src 'self'") &&
      csp.includes("object-src 'none'") &&
      csp.includes("frame-ancestors 'self'") &&
      Boolean(hsts) &&
      nosniff === 'nosniff' &&
      xfo === 'SAMEORIGIN' &&
      referrer === 'strict-origin-when-cross-origin' &&
      Boolean(perms) &&
      poweredBy === null,
    {
      status: homeRes.status,
      hasCsp: Boolean(csp),
      hasHsts: Boolean(hsts),
      nosniff,
      xfo,
      referrer,
      poweredBy,
    }
  );

  // 2. Pre-GA SEO Guard (robots.txt & sitemap.xml)
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  const robotsText = await robotsRes.text();
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  const sitemapUrlCount = (sitemapText.match(/<loc>/g) || []).length;

  recordCheck(
    checks,
    'PRE_GA_ROBOTS_AND_ELIGIBLE_ONLY_SITEMAP',
    robotsRes.status === 200 &&
      robotsText.includes('Disallow: /') &&
      sitemapRes.status === 200 &&
      sitemapUrlCount === 54 && // / + /?mode=2d + 52 eligible products
      sitemapText.includes('product=luminizing-powder') &&
      !sitemapText.includes('product=lipstick') &&
      !sitemapText.includes('product=dual-tip-eye-definer-pen'),
    {
      robotsStatus: robotsRes.status,
      sitemapStatus: sitemapRes.status,
      sitemapUrlCount,
    }
  );

  // 3. Catalog API Reconciliation & Zero Supplier Leaks
  const prodRes = await fetch(`${baseUrl}/api/blanka/products`);
  const prodText = await prodRes.text();
  const prodJson = JSON.parse(prodText);
  const apiLeaks = (
    prodText.match(
      /blankabrand\.com|wholesaleCost|profitPerUnit|marginPercent|73904-BLNK-|gid:\/\/shopify\/ProductVariant\/PP-/g
    ) || []
  ).length;

  recordCheck(
    checks,
    'API_CATALOG_RECONCILIATION_AND_CONFIDENTIALITY',
    prodRes.status === 200 &&
      apiLeaks === 0 &&
      prodJson.reconciliation?.totalProducts === 110 &&
      prodJson.reconciliation?.verifiedInStock === 52 &&
      prodJson.reconciliation?.verifiedOutOfStock === 4 &&
      prodJson.reconciliation?.unverifiedPurchaseLocked === 54 &&
      prodJson.evidenceClassification?.supplierListingCompleteTranscriptions === 56 &&
      prodJson.evidenceClassification?.manufacturerCertifiedDocumentsOnFile === 0,
    {
      status: prodRes.status,
      apiLeaks,
      reconciliation: prodJson.reconciliation,
    }
  );

  // 4. Exhaustive Server-Side Purchase-Lock Proof (ALL 54 Locked + ALL 4 OOS)
  const lockedProducts = prodJson.products.filter(
    (p) => p.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED'
  );
  const oosProducts = prodJson.products.filter(
    (p) => p.availabilityState === 'VERIFIED_OUT_OF_STOCK'
  );

  let locked422 = 0;
  for (const prod of lockedProducts) {
    const r = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            productId: prod.id,
            productHandle: prod.handle,
            sku: prod.sku,
            quantity: 1,
            canPurchase: true,
            manufacturerVerified: true,
            inStock: true,
            price: 0.01,
          },
        ],
        shippingCountry: 'US',
      }),
    });
    const b = await r.json();
    if (r.status === 422 && b.code === 'PURCHASE_LOCK_ENFORCED') locked422 += 1;
  }

  let oos422 = 0;
  for (const prod of oosProducts) {
    const r = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            productId: prod.id,
            productHandle: prod.handle,
            sku: prod.sku,
            quantity: 1,
            inStock: true,
            canPurchase: true,
          },
        ],
        shippingCountry: 'US',
      }),
    });
    const b = await r.json();
    if (r.status === 422 && b.code === 'PURCHASE_LOCK_ENFORCED') oos422 += 1;
  }

  const mixedRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productHandle: 'luminizing-powder', quantity: 1 },
        { productHandle: 'lipstick', quantity: 1 },
      ],
      shippingCountry: 'US',
    }),
  });
  const mixedBody = await mixedRes.json();

  recordCheck(
    checks,
    'CHECKOUT_EXHAUSTIVE_54_LOCKED_AND_4_OOS_BLOCKED',
    locked422 === 54 &&
      oos422 === 4 &&
      mixedRes.status === 422 &&
      mixedBody.code === 'PURCHASE_LOCK_ENFORCED',
    {
      locked422,
      oos422,
      mixedSmugglingStatus: mixedRes.status,
    }
  );

  // 5. Adversarial Checkout Security Suite
  // 5a. Non-US shipping countries (CA, GB, MX) -> 403
  let nonUsRejected = 0;
  for (const country of ['CA', 'GB', 'MX']) {
    const r = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
        shippingCountry: country,
      }),
    });
    const b = await r.json();
    if (r.status === 403 && b.code === 'US_ONLY_SHIPPING_SCOPE') {
      nonUsRejected += 1;
    }
  }

  // 5b. Foreign Origin CSRF Forgery -> 403 ORIGIN_MISMATCH
  const csrfRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://evil-attacker.example',
    },
    body: JSON.stringify({
      items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
      shippingCountry: 'US',
    }),
  });
  const csrfBody = await csrfRes.json();

  // 5c. Wrong Content-Type -> 415 UNSUPPORTED_MEDIA_TYPE
  const wrongCtRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: '{"items":[]}',
  });

  // 5d. Oversized Payload (> 32 KB) -> 413 PAYLOAD_TOO_LARGE
  const hugeRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
      padding: 'A'.repeat(40 * 1024),
    }),
  });

  // 5e. Excessive Cart Lines (> 25) -> 400 CART_LIMIT_EXCEEDED
  const manyItemsRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: Array.from({ length: 26 }, () => ({
        productHandle: 'luminizing-powder',
        quantity: 1,
      })),
    }),
  });

  // 5f. Prototype Pollution Attempt -> Safely Rejected Without Mutating Object.prototype
  const protoRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"__proto__":{"canPurchase":true},"items":[{"productHandle":"lipstick","quantity":1}]}',
  });

  // 5g. CASL Consent Validation & Canonical Pricing + Cache-Control: no-store
  const consentNoEmailRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
      marketingOptIn: true,
    }),
  });
  const badEmailRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
      guestEmail: 'not-an-email',
    }),
  });
  const validRes = await fetch(`${baseUrl}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productHandle: 'luminizing-powder', quantity: 1, price: 0.01 }],
      guestEmail: 'audit-qa@example.com',
      marketingOptIn: true,
      shippingCountry: 'US',
    }),
  });
  const validBody = await validRes.json();
  const validNoStore = (validRes.headers.get('cache-control') || '').includes(
    'no-store'
  );

  // 5h. GET /api/checkout invalid cartId validation
  const badCartIdRes = await fetch(
    `${baseUrl}/api/checkout?cartId=javascript:alert(1)`
  );

  recordCheck(
    checks,
    'ADVERSARIAL_CHECKOUT_HARDENING_SUITE',
    nonUsRejected === 3 &&
      csrfRes.status === 403 &&
      csrfBody.code === 'ORIGIN_MISMATCH' &&
      wrongCtRes.status === 415 &&
      hugeRes.status === 413 &&
      manyItemsRes.status === 400 &&
      protoRes.status === 422 &&
      consentNoEmailRes.status === 400 &&
      badEmailRes.status === 400 &&
      validRes.status === 200 &&
      validNoStore &&
      validBody.marketingConsentRecorded === true &&
      Boolean(validBody.marketingConsentTimestampUtc) &&
      validBody.totals?.subtotal === 33.5 &&
      validBody.totals?.shippingCost === 7 &&
      validBody.totals?.total === 40.5 &&
      badCartIdRes.status === 400,
    {
      nonUsRejected,
      csrfStatus: csrfRes.status,
      wrongCtStatus: wrongCtRes.status,
      hugeStatus: hugeRes.status,
      manyItemsStatus: manyItemsRes.status,
      protoStatus: protoRes.status,
      consentNoEmailStatus: consentNoEmailRes.status,
      badEmailStatus: badEmailRes.status,
      validStatus: validRes.status,
      validNoStore,
      badCartIdStatus: badCartIdRes.status,
    }
  );

  // 6. Image Proxy Adversarial Testing (Prototype keys, path traversal, bad variant)
  const protoImg1 = await fetch(`${baseUrl}/api/product-image/constructor/primary`);
  const protoImg2 = await fetch(`${baseUrl}/api/product-image/__proto__/primary`);
  const protoImg3 = await fetch(`${baseUrl}/api/product-image/toString/primary`);
  const travImg = await fetch(
    `${baseUrl}/api/product-image/..%2F..%2Fpackage.json/primary`
  );
  const badVarImg = await fetch(
    `${baseUrl}/api/product-image/luminizing-powder/malicious`
  );

  recordCheck(
    checks,
    'IMAGE_PROXY_ADVERSARIAL_PROTO_AND_TRAVERSAL_BLOCKED',
    protoImg1.status === 404 &&
      protoImg2.status === 404 &&
      protoImg3.status === 404 &&
      travImg.status === 404 &&
      badVarImg.status === 400,
    {
      constructorStatus: protoImg1.status,
      protoStatus: protoImg2.status,
      toStringStatus: protoImg3.status,
      traversalStatus: travImg.status,
      badVariantStatus: badVarImg.status,
    }
  );

  // 7. Shopify Health Endpoint & No-Store Cache Control
  const healthRes = await fetch(`${baseUrl}/api/shopify/health`);
  const healthBody = await healthRes.json();
  const healthNoStore = (healthRes.headers.get('cache-control') || '').includes(
    'no-store'
  );
  recordCheck(
    checks,
    'SHOPIFY_HEALTH_ENDPOINT_AND_NO_STORE',
    healthRes.status === 200 &&
      healthNoStore &&
      healthBody.eligibleProductCount === 52 &&
      typeof healthBody.automaticOrderAndShipmentReady === 'boolean',
    {
      status: healthRes.status,
      healthNoStore,
      configured: healthBody.configured,
      automaticOrderAndShipmentReady: healthBody.automaticOrderAndShipmentReady,
    }
  );

  // 7b. Shopify Variant Mapping Register Integrity (52 Eligible Products, Zero Synthetic GIDs)
  const mappingJson = JSON.parse(
    fs.readFileSync(
      path.join(rootDir, 'src/data/shopifyVariantMappingRegister.json'),
      'utf8'
    )
  );
  const hasSyntheticVariantGid = mappingJson.mappings.some((m) =>
    String(m.shopifyVariantGid || '').startsWith('gid://shopify/ProductVariant/PP-')
  );
  recordCheck(
    checks,
    'SHOPIFY_MAPPING_REGISTER_52_PRODUCTS_NO_SYNTHETIC_GIDS',
    mappingJson.summary?.eligibleProductsCount === 52 &&
      mappingJson.summary?.syntheticGidsPermitted === false &&
      !hasSyntheticVariantGid,
    {
      eligibleProductsCount: mappingJson.summary?.eligibleProductsCount,
      eligibleShadeVariantsCount: mappingJson.summary?.eligibleShadeVariantsCount,
      hasSyntheticVariantGid,
    }
  );

  // 7c. Shopify Webhook Fail-Closed HMAC Guard & Order Status Lookup Hardening
  const forgedWebhookRes = await fetch(`${baseUrl}/api/webhooks/shopify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-topic': 'orders/paid',
      'x-shopify-webhook-id': 'audit-forged-1',
      'x-shopify-hmac-sha256': 'Zm9yZ2VkLXNpZ25hdHVyZQ==',
    },
    body: JSON.stringify({ id: 999999, order_number: 1001 }),
  });
  const webhookNoStore = (
    forgedWebhookRes.headers.get('cache-control') || ''
  ).includes('no-store');

  const badOrderLookupRes = await fetch(
    `${baseUrl}/api/orders/status?orderNumber=bad!&email=not-an-email`
  );
  const missingOrderLookupRes = await fetch(
    `${baseUrl}/api/orders/status?orderNumber=PP-999999&email=qa@example.com`
  );
  const orderStatusNoStore = (
    missingOrderLookupRes.headers.get('cache-control') || ''
  ).includes('no-store');

  recordCheck(
    checks,
    'SHOPIFY_WEBHOOK_FAIL_CLOSED_AND_ORDER_STATUS_HARDENED',
    (forgedWebhookRes.status === 401 || forgedWebhookRes.status === 503) &&
      webhookNoStore &&
      badOrderLookupRes.status === 400 &&
      missingOrderLookupRes.status === 404 &&
      orderStatusNoStore,
    {
      forgedWebhookStatus: forgedWebhookRes.status,
      webhookNoStore,
      badOrderLookupStatus: badOrderLookupRes.status,
      missingOrderLookupStatus: missingOrderLookupRes.status,
      orderStatusNoStore,
    }
  );

  // 7d. Pretty Piggie Makeover Studio — privacy gates, validation, CSRF & credential confidentiality
  const makeoverHealthRes = await fetch(`${baseUrl}/api/makeover/health`);
  const makeoverHealthText = await makeoverHealthRes.text();
  const makeoverHealth = JSON.parse(makeoverHealthText);
  const makeoverHealthNoStore = (
    makeoverHealthRes.headers.get('cache-control') || ''
  ).includes('no-store');
  const makeoverCredentialLeak =
    /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{20,}/.test(makeoverHealthText);

  const fakePng = Buffer.alloc(2048, 7);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(fakePng, 0);
  const buildMakeoverForm = (overrides = {}, photoBytes = fakePng) => {
    const form = new FormData();
    form.append('photo', new Blob([photoBytes], { type: 'image/png' }), 'p.png');
    form.append('personalityId', 'glam-piggie');
    form.append('consentAccepted', 'true');
    form.append('ageConfirmed', 'true');
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) form.delete(k);
      else form.set(k, v);
    }
    return form;
  };
  const postMakeover = (form, headers = {}) =>
    fetch(`${baseUrl}/api/makeover/transform`, {
      method: 'POST',
      headers,
      body: form,
    });

  const mkNoConsent = await postMakeover(buildMakeoverForm({ consentAccepted: null }));
  const mkNoConsentBody = await mkNoConsent.json();
  const mkNoAge = await postMakeover(buildMakeoverForm({ ageConfirmed: null }));
  const mkNoAgeBody = await mkNoAge.json();
  const mkBadStyle = await postMakeover(buildMakeoverForm({ personalityId: 'evil-piggie' }));
  const mkBadStyleBody = await mkBadStyle.json();
  const mkNotImage = await postMakeover(
    buildMakeoverForm({}, Buffer.alloc(2048, 65))
  );
  const mkNotImageBody = await mkNotImage.json();
  const mkJson = await fetch(`${baseUrl}/api/makeover/transform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const mkCsrf = await postMakeover(buildMakeoverForm(), {
    Origin: 'https://evil-attacker.example',
  });
  const mkValid = await postMakeover(buildMakeoverForm());
  const mkValidBody = await mkValid.json();
  const mkValidNoStore = (mkValid.headers.get('cache-control') || '').includes(
    'no-store'
  );

  recordCheck(
    checks,
    'MAKEOVER_STUDIO_PRIVACY_GATES_VALIDATION_AND_FAIL_CLOSED',
    makeoverHealthRes.status === 200 &&
      makeoverHealthNoStore &&
      makeoverHealth.serverCredentialsExposed === false &&
      makeoverHealth.personalitiesCount === 5 &&
      makeoverHealth.masterReferenceReady === true &&
      makeoverHealth.retentionPolicy === 'ZERO_RETENTION_EPHEMERAL' &&
      !makeoverCredentialLeak &&
      mkNoConsent.status === 400 &&
      mkNoConsentBody.code === 'CONSENT_REQUIRED' &&
      mkNoAge.status === 400 &&
      mkNoAgeBody.code === 'AGE_CONFIRMATION_REQUIRED' &&
      mkBadStyle.status === 400 &&
      mkBadStyleBody.code === 'INVALID_PERSONALITY' &&
      mkNotImage.status === 415 &&
      mkNotImageBody.code === 'UNSUPPORTED_IMAGE_TYPE' &&
      mkJson.status === 415 &&
      mkCsrf.status === 403 &&
      mkValidNoStore &&
      (makeoverHealth.configured
        ? true
        : mkValid.status === 503 &&
          mkValidBody.code === 'AI_PROVIDER_NOT_CONFIGURED' &&
          mkValidBody.privacyReceipt?.retained === false),
    {
      healthStatus: makeoverHealthRes.status,
      configured: makeoverHealth.configured,
      masterReferenceReady: makeoverHealth.masterReferenceReady,
      noConsentStatus: mkNoConsent.status,
      noAgeStatus: mkNoAge.status,
      badStyleStatus: mkBadStyle.status,
      notImageStatus: mkNotImage.status,
      jsonStatus: mkJson.status,
      csrfStatus: mkCsrf.status,
      validStatus: mkValid.status,
    }
  );

  // 8. Empirical Rate-Limit Enforcement Proof (Local Mode Only — avoids triggering Vercel WAF on remote)
  if (!isRemoteMode) {
    let rateLimited429 = false;
    let retryAfterHeader = null;
    for (let i = 0; i < 35; i += 1) {
      const r = await fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({
          items: [{ productHandle: 'luminizing-powder', quantity: 1 }],
        }),
      });
      if (r.status === 429) {
        rateLimited429 = true;
        retryAfterHeader = r.headers.get('retry-after');
        break;
      }
    }
    recordCheck(
      checks,
      'CHECKOUT_RATE_LIMIT_429_ENFORCED',
      rateLimited429 && Number(retryAfterHeader) >= 1,
      { rateLimited429, retryAfterHeader }
    );
  }

  // ==========================================================================
  // VIRAL CHARACTER ENGINE HARDENING GATES (CHECKS #17 - #25)
  // ==========================================================================

  // Check #17: /pretty-piggie & /makeover-studio Dual-Mode Coexistence
  const piggiePageRes = await fetch(`${baseUrl}/pretty-piggie`);
  const piggiePageHtml = await piggiePageRes.text();
  const makeoverPageRes = await fetch(`${baseUrl}/makeover-studio`);
  recordCheck(
    checks,
    'PRETTY_PIGGIE_ROUTE_AND_DUAL_MODE_COEXISTENCE',
    piggiePageRes.status === 200 &&
      piggiePageHtml.includes('Pretty Piggie') &&
      makeoverPageRes.status === 200,
    {
      piggieStatus: piggiePageRes.status,
      makeoverStatus: makeoverPageRes.status,
    }
  );

  // Check #18: Self-Hosted MediaPipe WASM/Model SHA-256 Hashes & Live HTTP MIME Types
  const assetManifest = JSON.parse(
    fs.readFileSync(
      path.join(rootDir, 'src/pretty-piggie/assetManifest.json'),
      'utf8'
    )
  );
  let hashMatches = 0;
  for (const asset of assetManifest.assets || []) {
    const absAsset = path.join(rootDir, asset.diskPath);
    if (fs.existsSync(absAsset)) {
      const buf = fs.readFileSync(absAsset);
      const digest = crypto.createHash('sha256').update(buf).digest('hex');
      if (digest === asset.sha256 && buf.length === asset.bytes) {
        hashMatches += 1;
      }
    }
  }
  const wasmHttpRes = await fetch(
    `${baseUrl}/pretty-piggie/wasm/vision_wasm_internal.wasm`
  );
  const wasmCt = (wasmHttpRes.headers.get('content-type') || '').toLowerCase();
  await wasmHttpRes.arrayBuffer();
  const modelHttpRes = await fetch(
    `${baseUrl}/pretty-piggie/models/face_landmarker.task`
  );
  const modelBytes = (await modelHttpRes.arrayBuffer()).byteLength;

  recordCheck(
    checks,
    'MEDIAPIPE_SELF_HOSTED_WASM_SHA256_AND_MIME',
    assetManifest.assets?.length === 3 &&
      hashMatches === 3 &&
      wasmHttpRes.status === 200 &&
      wasmCt.includes('application/wasm') &&
      modelHttpRes.status === 200 &&
      modelBytes === assetManifest.assets[2].bytes,
    {
      hashMatches,
      wasmStatus: wasmHttpRes.status,
      wasmContentType: wasmCt,
      modelStatus: modelHttpRes.status,
      modelBytes,
    }
  );

  // Check #19: Disjoint Camera Permissions-Policy Isolation (Zero Duplicate/Intersecting Header Conflict)
  const rootPerms = (homeRes.headers.get('permissions-policy') || '').trim();
  const piggiePerms = (
    piggiePageRes.headers.get('permissions-policy') || ''
  ).trim();
  const makeoverPerms = (
    makeoverPageRes.headers.get('permissions-policy') || ''
  ).trim();
  const checkoutGetRes = await fetch(`${baseUrl}/api/shopify/health`);
  const apiPerms = (
    checkoutGetRes.headers.get('permissions-policy') || ''
  ).trim();

  recordCheck(
    checks,
    'PERMISSIONS_POLICY_DISJOINT_CAMERA_HEADERS',
    rootPerms.includes('camera=()') &&
      !rootPerms.includes('camera=(self)') &&
      apiPerms.includes('camera=()') &&
      !apiPerms.includes('camera=(self)') &&
      piggiePerms.includes('camera=(self)') &&
      !piggiePerms.includes('camera=()') &&
      piggiePerms.includes('microphone=()') &&
      makeoverPerms.includes('camera=(self)') &&
      !makeoverPerms.includes('camera=()'),
    {
      rootPerms,
      piggiePerms,
      makeoverPerms,
    }
  );

  // Check #20: Deterministic Face-to-Piggie Mapper, Distinct Portraits & Outlier Clamping
  const landmarkMod = loadTsModule(
    'src/pretty-piggie/tracking/FaceLandmarkProcessor.ts'
  );
  const mapperMod = loadTsModule(
    'src/pretty-piggie/character/CharacterMapper.ts'
  );

  const makeSyntheticFace = (opts) => {
    const pts = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    pts[10] = { x: 0.5, y: 0.2 }; // forehead
    pts[152] = { x: 0.5, y: 0.8 }; // chin
    pts[234] = { x: 0.5 - opts.cheekHalfW, y: 0.5 }; // left cheek
    pts[454] = { x: 0.5 + opts.cheekHalfW, y: 0.5 }; // right cheek
    pts[50] = { x: 0.5 - opts.midCheekHalfW, y: 0.52 };
    pts[280] = { x: 0.5 + opts.midCheekHalfW, y: 0.52 };
    pts[172] = { x: 0.5 - opts.jawHalfW, y: 0.68 };
    pts[397] = { x: 0.5 + opts.jawHalfW, y: 0.68 };
    pts[33] = { x: 0.5 - opts.eyeOuterX, y: 0.43 };
    pts[133] = { x: 0.5 - opts.eyeInnerX, y: 0.44 };
    pts[159] = { x: 0.5 - (opts.eyeOuterX + opts.eyeInnerX) * 0.5, y: 0.43 - opts.eyeOpen };
    pts[145] = { x: 0.5 - (opts.eyeOuterX + opts.eyeInnerX) * 0.5, y: 0.43 + opts.eyeOpen };
    pts[362] = { x: 0.5 + opts.eyeInnerX, y: 0.44 };
    pts[263] = { x: 0.5 + opts.eyeOuterX, y: 0.43 };
    pts[386] = { x: 0.5 + (opts.eyeOuterX + opts.eyeInnerX) * 0.5, y: 0.43 - opts.eyeOpen };
    pts[374] = { x: 0.5 + (opts.eyeOuterX + opts.eyeInnerX) * 0.5, y: 0.43 + opts.eyeOpen };
    pts[105] = { x: 0.5 - opts.eyeOuterX * 0.75, y: 0.43 - opts.browClear };
    pts[70] = { x: 0.5 - opts.eyeInnerX, y: 0.44 - opts.browClear * 0.75 };
    pts[334] = { x: 0.5 + opts.eyeOuterX * 0.75, y: 0.43 - opts.browClear };
    pts[300] = { x: 0.5 + opts.eyeInnerX, y: 0.44 - opts.browClear * 0.75 };
    pts[6] = { x: 0.5, y: 0.44 };
    pts[4] = { x: 0.5, y: 0.54 };
    pts[98] = { x: 0.5 - opts.noseHalfW, y: 0.55 };
    pts[327] = { x: 0.5 + opts.noseHalfW, y: 0.55 };
    pts[61] = { x: 0.5 - 0.1, y: 0.64 - opts.smileLift };
    pts[291] = { x: 0.5 + 0.1, y: 0.64 - opts.smileLift };
    pts[13] = { x: 0.5, y: 0.64 };
    pts[14] = { x: 0.5, y: 0.66 };
    return pts;
  };

  const faceWideSmile = makeSyntheticFace({
    cheekHalfW: 0.28,
    midCheekHalfW: 0.22,
    jawHalfW: 0.24,
    eyeOuterX: 0.19,
    eyeInnerX: 0.085,
    eyeOpen: 0.026,
    browClear: 0.075,
    noseHalfW: 0.085,
    smileLift: 0.025,
  });
  const faceNarrowCalm = makeSyntheticFace({
    cheekHalfW: 0.21,
    midCheekHalfW: 0.13,
    jawHalfW: 0.14,
    eyeOuterX: 0.12,
    eyeInnerX: 0.05,
    eyeOpen: 0.012,
    browClear: 0.042,
    noseHalfW: 0.05,
    smileLift: -0.012,
  });
  const faceAdversarial = Array.from({ length: 478 }, (_, idx) => ({
    x: idx % 3 === 0 ? NaN : idx % 2 === 0 ? 9999 : -9999,
    y: idx % 5 === 0 ? Infinity : -500,
    z: -Infinity,
  }));

  const extA1 = landmarkMod.extractFacialFeatures({ allFaceLandmarks: [faceWideSmile] });
  const extA2 = landmarkMod.extractFacialFeatures({ allFaceLandmarks: [faceWideSmile] });
  const extB = landmarkMod.extractFacialFeatures({ allFaceLandmarks: [faceNarrowCalm] });
  const extAdv = landmarkMod.extractFacialFeatures({ allFaceLandmarks: [faceAdversarial] });

  const charA1 = mapperMod.transformFaceToPiggie(extA1, 'glam-piggie');
  const charA2 = mapperMod.transformFaceToPiggie(extA2, 'glam-piggie');
  const charB = mapperMod.transformFaceToPiggie(extB, 'glam-piggie');
  const charAdv = mapperMod.transformFaceToPiggie(extAdv, 'royal-piggie');

  const isDeterministic = JSON.stringify(charA1) === JSON.stringify(charA2);
  const areDistinct =
    charA1.proportions.eyeSpacing !== charB.proportions.eyeSpacing &&
    charA1.proportions.faceWidth > charB.proportions.faceWidth &&
    charA1.proportions.smileCurve > charB.proportions.smileCurve;
  const advProps = Object.entries(charAdv.proportions);
  const advAllClamped = advProps.every(([k, v]) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return false;
    if (k === 'smileCurve') return v >= 0 && v <= 1;
    if (k === 'headYaw') return v >= -0.35 && v <= 0.35;
    if (k === 'headPitch') return v >= -0.25 && v <= 0.25;
    return v >= -1 && v <= 1;
  });

  recordCheck(
    checks,
    'DETERMINISTIC_FACE_MAPPER_CLAMPING_AND_DISTINCTNESS',
    isDeterministic && areDistinct && advAllClamped,
    {
      isDeterministic,
      areDistinct,
      advAllClamped,
      faceAFaceWidth: charA1.proportions.faceWidth,
      faceBFaceWidth: charB.proportions.faceWidth,
    }
  );

  // Check #21: Explicit MediaPipe -> ARKit-52 Blendshape Mapping & Clamping
  const morphMod = loadTsModule('src/pretty-piggie/character/MorphController.ts');
  const mappedBlend = morphMod.mapMediaPipeToARKitBlendshapes([
    { categoryName: '_neutral', score: 0.99 },
    { categoryName: 'mouthSmileLeft', score: 0.84 },
    { categoryName: 'mouthSmileRight', score: 1.75 }, // clamps to 1
    { categoryName: 'eyeBlinkLeft', score: -0.5 }, // clamps to 0
    { categoryName: 'jawOpen', score: NaN }, // safely ignored -> 0
    { categoryName: 'nonExistentShape', score: 0.9 },
  ]);
  const arkitKeys = Object.keys(mappedBlend);
  const rigPose = morphMod.deriveRigExpressionPose(
    mappedBlend,
    charA1.proportions
  );

  recordCheck(
    checks,
    'ARKIT_52_BLENDSHAPE_EXPLICIT_MAPPING_INTEGRITY',
    morphMod.ARKIT_52_BLENDSHAPE_NAMES.length === 52 &&
      arkitKeys.length === 52 &&
      !('_neutral' in mappedBlend) &&
      mappedBlend.mouthSmileLeft === 0.84 &&
      mappedBlend.mouthSmileRight === 1 &&
      mappedBlend.eyeBlinkLeft === 0 &&
      mappedBlend.jawOpen === 0 &&
      Object.values(rigPose).every((v) => typeof v === 'number' && Number.isFinite(v)),
    {
      channelCount: arkitKeys.length,
      smileLeft: mappedBlend.mouthSmileLeft,
      smileRightClamped: mappedBlend.mouthSmileRight,
    }
  );

  // Check #22: Versioned CRC32-Checked Share Token Round-Trip & Tamper Rejection
  const paramsMod = loadTsModule(
    'src/pretty-piggie/character/CharacterParameters.ts'
  );
  const customConfig = {
    version: 1,
    proportions: {
      eyeSpacing: 0.34,
      eyeScale: -0.22,
      eyeTilt: 0.18,
      faceWidth: -0.15,
      faceLength: 0.25,
      cheekFullness: 0.42,
      jawWidth: -0.28,
      browHeight: 0.19,
      browArch: 0.31,
      snoutScale: -0.12,
      smileCurve: 0.78,
      headYaw: 0.12,
      headPitch: -0.08,
    },
    collectionId: 'fashion-piggie',
    skinToneId: 'rich-amber',
    hairstyleId: 'space-buns',
    hairColorId: 'cotton-candy',
    eyeColorId: 'emerald-mist',
    accessoryId: 'royal-crown',
    lipShadeIndex: 2,
  };
  const validToken = paramsMod.encodePiggieShareToken(customConfig);
  const decodedValid = paramsMod.decodePiggieShareToken(validToken);

  // Flip 1 character in payload to test CRC32 tamper detection
  const flipChar = validToken[10] === 'A' ? 'B' : 'A';
  const tamperedToken =
    validToken.slice(0, 10) + flipChar + validToken.slice(11);
  const decodedTampered = paramsMod.decodePiggieShareToken(tamperedToken);

  // Mutate version byte (byte[2] = 99) to test version rejection
  const rawTokenBuf = Buffer.from(
    validToken.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );
  rawTokenBuf[2] = 99;
  const wrongVerToken = rawTokenBuf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const decodedWrongVer = paramsMod.decodePiggieShareToken(wrongVerToken);
  const decodedTruncated = paramsMod.decodePiggieShareToken(
    validToken.slice(0, 12)
  );

  recordCheck(
    checks,
    'SHARE_TOKEN_VERSIONED_CRC32_INTEGRITY_AND_ROUNDTRIP',
    decodedValid.valid === true &&
      JSON.stringify(decodedValid.params) === JSON.stringify(customConfig) &&
      decodedTampered.valid === false &&
      decodedTampered.reason === 'CHECKSUM_MISMATCH' &&
      decodedWrongVer.valid === false &&
      decodedWrongVer.reason === 'UNSUPPORTED_VERSION' &&
      decodedTruncated.valid === false &&
      decodedTruncated.reason === 'MALFORMED_TOKEN',
    {
      tokenLength: validToken.length,
      roundTripExact:
        decodedValid.valid &&
        JSON.stringify(decodedValid.params) === JSON.stringify(customConfig),
      tamperReason: decodedTampered.valid ? null : decodedTampered.reason,
      wrongVersionReason: decodedWrongVer.valid ? null : decodedWrongVer.reason,
    }
  );

  // Check #23: Strict Closed-Schema Analytics & Layered Abuse Control
  const validEventPayload = {
    event: 'piggie_experience_opened',
    sessionId: 'pp_auditqa9921',
    timestampMs: Date.now(),
    deviceTier: 'high',
    isMobile: true,
    props: { collectionId: 'glam-piggie', renderer: 'webgl' },
  };
  const evOkRes = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validEventPayload),
  });
  const evSetCookie = evOkRes.headers.get('set-cookie') || '';
  const evNoStore = (evOkRes.headers.get('cache-control') || '').includes(
    'no-store'
  );

  const evUnknownRoot = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validEventPayload, extraField: 123 }),
  });
  const evFreeformProp = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validEventPayload,
      props: { userNote: 'freeform string' },
    }),
  });
  const evLandmarkInject = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validEventPayload,
      props: { landmarks: [0.42, 0.51] },
    }),
  });
  const evWrongCt = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: '{}',
  });
  const evOversize = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validEventPayload,
      pad: 'X'.repeat(3000),
    }),
  });
  const evCsrf = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://evil-attacker.example',
    },
    body: JSON.stringify(validEventPayload),
  });

  let eventsRateLimited429 = isRemoteMode; // Skip flood on remote WAF
  if (!isRemoteMode) {
    for (let i = 0; i < 65; i += 1) {
      const r = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.88',
        },
        body: JSON.stringify(validEventPayload),
      });
      if (r.status === 429) {
        eventsRateLimited429 = true;
        break;
      }
    }
  }

  recordCheck(
    checks,
    'STRICT_CLOSED_SCHEMA_ANALYTICS_AND_LAYERED_ABUSE_GUARD',
    evOkRes.status === 200 &&
      evNoStore &&
      evSetCookie.includes('HttpOnly') &&
      evUnknownRoot.status === 400 &&
      evFreeformProp.status === 400 &&
      evLandmarkInject.status === 400 &&
      evWrongCt.status === 415 &&
      evOversize.status === 413 &&
      evCsrf.status === 403 &&
      eventsRateLimited429,
    {
      validStatus: evOkRes.status,
      hasSignedHttpOnlyCookie: evSetCookie.includes('HttpOnly'),
      unknownRootStatus: evUnknownRoot.status,
      freeformPropStatus: evFreeformProp.status,
      landmarkInjectStatus: evLandmarkInject.status,
      wrongCtStatus: evWrongCt.status,
      oversizeStatus: evOversize.status,
      csrfStatus: evCsrf.status,
      eventsRateLimited429,
    }
  );

  // Check #24: Zero External AI or Third-Party CDN Calls in Local Character Engine
  const engineFiles = [
    ...walkDir(path.join(rootDir, 'src/pretty-piggie')),
    ...walkDir(path.join(rootDir, 'src/components/pretty-piggie')),
    path.join(rootDir, 'src/app/pretty-piggie/page.tsx'),
  ].filter((f) => fs.existsSync(f));

  const forbiddenEngineTokens = [
    'generativelanguage.googleapis.com',
    'api.openai.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'storage.googleapis.com',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    '/api/makeover/transform',
  ];
  let engineViolations = 0;
  for (const file of engineFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const tok of forbiddenEngineTokens) {
      if (text.includes(tok)) engineViolations += 1;
    }
  }
  recordCheck(
    checks,
    'ZERO_EXTERNAL_AI_OR_CDN_CALLS_IN_PIGGIE_ENGINE',
    engineFiles.length >= 12 && engineViolations === 0,
    { scannedEngineFiles: engineFiles.length, engineViolations }
  );

  // Check #25: 5 Makeup Collections, Accessories & Strictly VERIFIED_IN_STOCK Product Pairings
  const presetsMod = loadTsModule('src/pretty-piggie/makeup/MakeupPresets.ts');
  const catalogRaw = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'src/data/blankaCatalog.json'), 'utf8')
  );
  const bySlug = new Map(catalogRaw.map((c) => [c.slug, c]));
  const presetEntries = Object.values(presetsMod.MAKEUP_COLLECTION_PRESETS);
  let allPairingsVerifiedInStock = true;
  for (const p of presetEntries) {
    if (!Array.isArray(p.lipShades) || p.lipShades.length !== 4) {
      allPairingsVerifiedInStock = false;
    }
    for (const handle of p.eligibleProductHandles || []) {
      const item = bySlug.get(handle);
      if (
        !item ||
        item.availabilityState !== 'VERIFIED_IN_STOCK' ||
        item.canPurchase !== true
      ) {
        allPairingsVerifiedInStock = false;
      }
    }
  }

  recordCheck(
    checks,
    'MAKEUP_COLLECTIONS_ACCESSORIES_AND_ELIGIBLE_PAIRINGS',
    presetEntries.length === 5 &&
      paramsMod.PIGGIE_HAIRSTYLE_OPTIONS.length === 6 &&
      paramsMod.PIGGIE_ACCESSORY_OPTIONS.length === 6 &&
      paramsMod.PIGGIE_SKIN_TONES.length === 8 &&
      allPairingsVerifiedInStock,
    {
      collectionsCount: presetEntries.length,
      hairstylesCount: paramsMod.PIGGIE_HAIRSTYLE_OPTIONS.length,
      accessoriesCount: paramsMod.PIGGIE_ACCESSORY_OPTIONS.length,
      skinTonesCount: paramsMod.PIGGIE_SKIN_TONES.length,
      allPairingsVerifiedInStock,
    }
  );
}

async function main() {
  const checks = [];
  await runStaticAndBundleGates(checks);

  let serverProcess = null;
  let targetUrl = remoteUrl;

  try {
    if (!isRemoteMode) {
      const port = 3099;
      targetUrl = `http://127.0.0.1:${port}`;
      const nextBin = path.join(rootDir, 'node_modules/next/dist/bin/next');
      serverProcess = spawn(
        process.execPath,
        [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'],
        { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      await waitForServer(`${targetUrl}/api/blanka/products`);
    }

    await runLiveHttpAndAdversarialGates(targetUrl, checks);
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }

  const failedChecks = checks.filter((c) => !c.passed);
  const report = {
    auditSuite: 'PrettyPiggie.com Authoritative Adversarial Release Audit v2',
    mode: isRemoteMode ? 'remote-staging' : 'local-production-build',
    targetUrl,
    verifiedAt: new Date().toISOString(),
    buildId: fs.existsSync(path.join(rootDir, '.next/BUILD_ID'))
      ? fs.readFileSync(path.join(rootDir, '.next/BUILD_ID'), 'utf8').trim()
      : null,
    totalChecks: checks.length,
    passedChecks: checks.length - failedChecks.length,
    failedChecksCount: failedChecks.length,
    allChecksPassed: failedChecks.length === 0,
    checks,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.allChecksPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('RELEASE AUDIT FAILED WITH EXCEPTION:', err);
  process.exit(1);
});
