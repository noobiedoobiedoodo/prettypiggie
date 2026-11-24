# PrettyPiggie.com — Blanka & Shopify Integration, Documentation & End-to-End Acceptance Runbook

> [!IMPORTANT]
> **Documentation & Implementation Governance Rule (Directive Section 7):**  
> A vendor documentation link does **not** prove a feature is enabled or operational in our account. Every capability below explicitly separates **(1) Officially Documented**, **(2) Confirmed Directly by Blanka Support**, **(3) Implemented in PrettyPiggie**, and **(4) Verified via Real Paid Order**.

---

## 1. Official Documentation & Capability Verification Matrix (Sections 2 & 3)

| Capability / Workflow Stage | 1. Officially Documented (Blanka / Shopify) | 2. Confirmed by Blanka Support (`hello@blankabrand.com`) | 3. Implemented in PrettyPiggie | 4. Verified Through Real Paid Order |
|---|---|---|---|---|
| **Shopify Storefront API (`2026-10`) Cart & Hosted Checkout** | Supported (`cartCreate` -> `checkoutUrl`, quarterly release `2026-10` supported 12+ months) | N/A (Shopify) | **YES** ([route.ts](file:///c:/Users/ssabe/Downloads/prettypiggie/src/app/api/checkout/route.ts), [shopifyVariantResolver.ts](file:///c:/Users/ssabe/Downloads/prettypiggie/src/lib/shopifyVariantResolver.ts)) | **PENDING** |
| **52 Eligible Products Published via Blanka Shopify App & Mapped to Numeric Variant GIDs** | Documented (`faq.blankabrand.com` Shopify collection: install, publish, variants) | **PENDING** | **YES (Fail-Closed Resolver + `npm run shopify:sync`)** ([SHOPIFY_VARIANT_MAPPING_REGISTER.md](file:///c:/Users/ssabe/Downloads/prettypiggie/SHOPIFY_VARIANT_MAPPING_REGISTER.md)) | **PENDING** |
| **U.S.-Only Shipping Zones (Canada & ROW Disabled in Shopify Admin)** | Documented (`help.shopify.com` Shipping Profiles & Rates) | N/A (Shopify Admin) | **Storefront + API Guard Ready (`HTTP 403`)**; Admin zone setup external | **PENDING (Must Test CA Address Change in Hosted Checkout)** |
| **Automatic Shopify Order Transmission to Blanka** | Documented: connected Shopify orders transmit automatically to Blanka | **PENDING WRITTEN CONFIRMATION** | **Webhook Tracking Ready** (`orders/paid` -> `SUPPLIER_SUBMISSION_PENDING`) | **PENDING** |
| **Automatic Supplier Payment (Blanka Charges Merchant Card)** | Documented: Auto Payments can be toggled on in Blanka settings to charge saved credit/Visa debit card automatically | **PENDING WRITTEN CONFIRMATION** *(Must confirm pay-as-you-go vs warehouse inventory & unattended submission)* | **Lifecycle State Modeled** (`SUPPLIER_PAYMENT_PENDING` / `SUPPLIER_PAYMENT_FAILED`) | **PENDING** |
| **Unattended Production & Shipment (No Manual Dashboard Fulfillment Selection)** | Partially documented; **automatic payment is NOT guaranteed to equal fully unattended production/fulfillment for every account/SKU** | **PENDING WRITTEN CONFIRMATION** *(Critical First Priority)* | **No Undocumented Blanka API Invented** | **PENDING** |
| **Tracking Sync to Shopify & Customer Shipping Notification** | Documented: Blanka pushes tracking back to Shopify and marks orders Fulfilled; Shopify emails customer when *Customer Shipping Notifications* is enabled | **PENDING WRITTEN CONFIRMATION** | **YES** (`POST /api/webhooks/shopify` handles `fulfillments/create` & `fulfillments/update`; `GET /api/orders/status` exposes tracking ONLY after confirmed shipment) | **PENDING** |
| **Live Inventory & Price Synchronization** | Documented: Shopify `products/update` & `inventory_levels/update` webhooks + Storefront API | N/A (Shopify) | **YES** (HMAC-verified webhooks invalidate server variant cache + `npm run shopify:sync` detects price drift) | **PENDING** |

---

## 2. First Priority Action — Ready-to-Send Email to Blanka Support (Section 3)

**To:** `hello@blankabrand.com`  
**Subject:** `Fully Automated Shopify Order Fulfillment — PrettyPiggie.com`

```text
Hello Blanka Support,

I'm preparing to launch PrettyPiggie.com, a custom headless Shopify storefront using your Shopify integration.
I need to confirm the complete order automation workflow before enabling live orders.

Our intended workflow is:
1. A customer purchases a Blanka product through Shopify Hosted Checkout.
2. Shopify captures the customer's payment and creates the order.
3. The order is automatically transmitted to our connected Blanka account.
4. Blanka automatically charges our saved payment method for the supplier and fulfillment costs.
5. Blanka accepts and processes the order without requiring us to manually open the dashboard and select a fulfillment method.
6. Blanka manufactures and ships the product directly to the customer.
7. Tracking information automatically synchronizes back to Shopify.
8. Shopify sends the customer the appropriate shipping notification.

Please confirm:
- Does your Shopify integration support this complete unattended workflow?
- Does enabling automatic order payments automatically submit orders for fulfillment?
- Is a separate automatic fulfillment setting or merchant approval required?
- Does the workflow support pay-as-you-go production?
- Is pre-purchased warehouse inventory required for unattended processing?
- Are product variants and SKUs automatically matched?
- Does tracking automatically synchronize to Shopify?
- What happens when automatic payment fails?
- What happens when a product is unavailable or an order is flagged for review?
- Is there an API or webhook integration available for custom headless Shopify storefronts?
- Is this workflow fully supported with Shopify Storefront API and Shopify Hosted Checkout?

Please provide the current setup instructions and identify any account restrictions or additional configuration requirements.
We want to ensure the complete purchase-to-delivery workflow is genuinely automated before enabling live customer orders.

Thank you.
```

---

## 3. Configuration Runbook (Once Blanka Confirms & Shopify Store Is Ready)

1. **Publish Eligible Products Only:** Using the official **Blanka Shopify App**, publish ONLY the **52 `VERIFIED_IN_STOCK`** products listed in [SHOPIFY_VARIANT_MAPPING_REGISTER.md](file:///c:/Users/ssabe/Downloads/prettypiggie/SHOPIFY_VARIANT_MAPPING_REGISTER.md) (do **not** publish the 54 locked products).
2. **Verify Shipping & Taxes (Section 7):**
   - Compare Blanka's actual U.S. shipping charges (single-item, multi-item, below/above \$65, product restrictions, fulfillment locations) against the planned \$7 flat / Free \$65+ rule before publishing.
   - In **Shopify Admin → Settings → Shipping and delivery**, configure **United States ONLY** (disable Canada and Rest of World).
   - Enable **Customer Shipping Notifications** in **Shopify Admin → Settings → Notifications**.
3. **Configure Server-Only Environment Variables (Vercel Staging & `.env.local`):**
   - `SHOPIFY_STORE_DOMAIN=<your-store>.myshopify.com`
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN=<storefront-token>` *(server-only — never `NEXT_PUBLIC_`)*
   - `SHOPIFY_WEBHOOK_SECRET=<shopify-webhook-signing-secret>` *(server-only)*
   - `NEXT_PUBLIC_ALLOW_INDEXING=false` *(keep `false` until GA)*
4. **Register Shopify Webhooks (Shopify Admin → Settings → Notifications → Webhooks):**
   - Endpoint: `https://<staging-or-prod-domain>/api/webhooks/shopify` (API Version `2026-10`, JSON format)
   - Topics: `orders/paid`, `orders/cancelled`, `refunds/create`, `fulfillments/create`, `fulfillments/update`, `products/update`, `inventory_levels/update`.
   - *Production Infrastructure Note:* Back [orderLifecycleStore.ts](file:///c:/Users/ssabe/Downloads/prettypiggie/src/lib/orderLifecycleStore.ts) with durable storage (Vercel Postgres / KV) before opening public General Availability so webhook idempotency keys and order states persist across serverless instances.
5. **Sync & Verify 52/52 Numeric Shopify Variant GIDs:**
   - Run `npm run shopify:sync` to populate real numeric Product & Variant GIDs in [SHOPIFY_VARIANT_MAPPING_REGISTER.md](file:///c:/Users/ssabe/Downloads/prettypiggie/SHOPIFY_VARIANT_MAPPING_REGISTER.md) & `src/lib/shopifyVariantMap.json`.
   - Call `GET /api/shopify/health` and confirm `unmappedEligibleCount: 0` and `priceDriftCount: 0`.
   - Run remote staging audit: `node scripts/release-audit.mjs --url https://<your-staging-url>`.

---

## 4. Section 13 — Decisive End-to-End Fulfillment & Failure Test Ledger

### A. Real Paid Order Progression Ledger (All 11 Stages Required)

| # | Stage | Required Evidence | Recorded Evidence | Status |
|---|---|---|---|---|
| 1 | PrettyPiggie purchase | Product, variant, qty & checkout URL | `PENDING` | **NOT VERIFIED** |
| 2 | Shopify payment | Payment capture & transaction ID | `PENDING` | **NOT VERIFIED** |
| 3 | Shopify order | Order number & Shopify Admin record | `PENDING` | **NOT VERIFIED** |
| 4 | Blanka receipt | Matching order visible in Blanka dashboard | `PENDING` | **NOT VERIFIED** |
| 5 | Supplier payment | Successful Blanka merchant charge record | `PENDING` | **NOT VERIFIED** |
| 6 | Supplier acceptance | Confirmed processing status (unattended?) | `PENDING` | **NOT VERIFIED** |
| 7 | Production | Actual production/fulfillment status | `PENDING` | **NOT VERIFIED** |
| 8 | Shipment | Genuine shipment confirmation | `PENDING` | **NOT VERIFIED** |
| 9 | Tracking | Carrier & real tracking number | `PENDING` | **NOT VERIFIED** |
| 10 | Shopify synchronization | Tracking visible in Shopify Admin + `GET /api/orders/status` | `PENDING` | **NOT VERIFIED** |
| 11 | Customer notification | Actual shipping notification email received | `PENDING` | **NOT VERIFIED** |

### B. Separate Failure-Condition Verification Matrix

| Failure Condition | Local Engineering Test | Live Staging / Production Test |
|---|---|---|
| **Invalid / unmapped variant** | **PASS** (`HTTP 422 SHOPIFY_VARIANT_UNMAPPED` / `PURCHASE_LOCK_ENFORCED`) | **PENDING** |
| **Unavailable / OOS product** | **PASS** (`4/4` OOS `HTTP 422` + live `HTTP 409 SHOPIFY_VARIANT_OUT_OF_STOCK`) | **PENDING** |
| **Duplicate webhook (`X-Shopify-Webhook-Id`)** | **PASS** (Verified `duplicate: true` on isolated live HMAC test) | **PENDING** |
| **Forged webhook HMAC signature** | **PASS** (Verified `HTTP 401` with secret / `HTTP 503` fail-closed without secret) | **PENDING** |
| **Cancelled order & refund** | **PASS** (`orders/cancelled` & `refunds/create` handlers verified) | **PENDING LIVE ORDER CANCEL + REFUND** |
| **Supplier payment failure** | **State & alert modeled** (`SUPPLIER_PAYMENT_FAILED` / `BLANKA_PAYMENT_FAILURE`) | **PENDING LIVE BLANKA TEST** |
| **Missing tracking synchronization** | **Alert modeled** (`MISSING_TRACKING_SYNC` triggered on success w/o tracking) | **PENDING LIVE TEST** |
