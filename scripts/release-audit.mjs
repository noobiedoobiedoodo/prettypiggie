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

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
