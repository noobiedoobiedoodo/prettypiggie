import { NextResponse } from 'next/server';
import {
  applyOrderLifecycleWebhookEvent,
  hasProcessedWebhook,
  markWebhookProcessed,
  recordCatalogSyncEvent,
} from '@/lib/orderLifecycleStore';
import { invalidateShopifyVariantCache } from '@/lib/shopifyVariantResolver';
import { verifyShopifyWebhookHmac } from '@/lib/shopifyWebhookSecurity';

export const dynamic = 'force-dynamic';

const MAX_WEBHOOK_BYTES = 256 * 1024; // 256 KB ceiling
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

/**
 * Verified Shopify Webhook Receiver (Master Directive Sections 5 & 9).
 *
 * Supported topics:
 * - orders/paid
 * - orders/cancelled
 * - refunds/create
 * - fulfillments/create
 * - fulfillments/update
 * - products/update
 * - inventory_levels/update
 */
export async function POST(request: Request) {
  const declaredLen = Number(request.headers.get('content-length') || 0);
  if (declaredLen > MAX_WEBHOOK_BYTES) {
    return jsonNoStore(
      { error: 'Webhook payload too large.', code: 'PAYLOAD_TOO_LARGE' },
      413
    );
  }

  // 1. Capture RAW unparsed body BEFORE JSON.parse (mandatory for Shopify HMAC verification)
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
    return jsonNoStore(
      { error: 'Webhook payload too large.', code: 'PAYLOAD_TOO_LARGE' },
      413
    );
  }

  // 2. Fail-closed constant-time HMAC-SHA256 verification
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const verification = verifyShopifyWebhookHmac(rawBody, hmacHeader);

  if (!verification.configured) {
    return jsonNoStore(
      {
        error:
          'Shopify webhook receiver is disabled until SHOPIFY_WEBHOOK_SECRET is configured.',
        code: 'WEBHOOK_SECRET_UNCONFIGURED',
      },
      503
    );
  }

  if (!verification.valid) {
    return jsonNoStore(
      {
        error: verification.reason || 'Unauthorized webhook signature.',
        code: 'INVALID_WEBHOOK_SIGNATURE',
      },
      401
    );
  }

  const topic = (request.headers.get('x-shopify-topic') || '').trim().toLowerCase();
  const webhookId = (request.headers.get('x-shopify-webhook-id') || '').trim();
  const triggeredAt =
    request.headers.get('x-shopify-triggered-at') || new Date().toISOString();

  if (!topic || !webhookId) {
    return jsonNoStore(
      {
        error: 'Missing required Shopify webhook headers (topic or webhook-id).',
        code: 'MISSING_WEBHOOK_HEADERS',
      },
      400
    );
  }

  // 3. Idempotent deduplication via X-Shopify-Webhook-Id
  if (hasProcessedWebhook(webhookId)) {
    return jsonNoStore({
      received: true,
      duplicate: true,
      webhookId,
      topic,
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonNoStore(
      { error: 'Malformed webhook JSON.', code: 'INVALID_JSON' },
      400
    );
  }

  // 4. Process supported topics without ever assuming customer payment == shipped
  if (topic === 'products/update' || topic === 'inventory_levels/update') {
    invalidateShopifyVariantCache();
    recordCatalogSyncEvent(
      topic,
      webhookId,
      'Invalidated server Shopify variant & inventory cache for fresh synchronization.'
    );
    markWebhookProcessed(webhookId);
    return jsonNoStore({
      received: true,
      duplicate: false,
      topic,
      cacheInvalidated: true,
    });
  }

  if (topic === 'orders/paid') {
    const orderId = String(payload.id || '');
    const orderNumber = String(payload.order_number || payload.name || orderId);
    const customerEmail =
      typeof payload.email === 'string' ? payload.email : undefined;

    // Customer payment captured -> order moves to SUPPLIER_SUBMISSION_PENDING (NEVER SHIPPED!)
    const { record, outOfOrderIgnored } = applyOrderLifecycleWebhookEvent({
      shopifyOrderId: orderId,
      orderNumber,
      customerEmail,
      currency: String(payload.currency || 'USD'),
      totalPrice: Number(payload.total_price || 0),
      targetState: 'SUPPLIER_SUBMISSION_PENDING',
      sourceTopic: topic,
      webhookId,
      eventTimestampIso: triggeredAt,
      note: 'Shopify customer payment captured; awaiting confirmed Blanka supplier receipt and separate supplier payment.',
    });

    markWebhookProcessed(webhookId);
    return jsonNoStore({
      received: true,
      duplicate: false,
      topic,
      outOfOrderIgnored,
      orderState: record.currentState,
    });
  }

  if (topic === 'fulfillments/create' || topic === 'fulfillments/update') {
    const orderId = String(payload.order_id || '');
    const orderNumber = String(payload.name || orderId);
    const shipmentStatus = String(payload.shipment_status || '').toLowerCase();
    const status = String(payload.status || '').toLowerCase();
    const trackingNumber =
      typeof payload.tracking_number === 'string' && payload.tracking_number.trim()
        ? payload.tracking_number.trim()
        : null;
    const trackingCompany =
      typeof payload.tracking_company === 'string' &&
      payload.tracking_company.trim()
        ? payload.tracking_company.trim()
        : null;
    const trackingUrl =
      typeof payload.tracking_url === 'string' && payload.tracking_url.trim()
        ? payload.tracking_url.trim()
        : null;

    const isFailure =
      status === 'failure' ||
      status === 'error' ||
      shipmentStatus === 'failure';
    const isCancelled = status === 'cancelled';

    const targetState = isFailure
      ? 'FULFILLMENT_EXCEPTION'
      : isCancelled
      ? 'CANCELLED'
      : trackingNumber
      ? 'TRACKING_AVAILABLE'
      : status === 'success'
      ? 'SHIPPED'
      : 'SUPPLIER_PROCESSING';

    const { record, outOfOrderIgnored } = applyOrderLifecycleWebhookEvent({
      shopifyOrderId: orderId,
      orderNumber,
      targetState,
      sourceTopic: topic,
      webhookId,
      eventTimestampIso: triggeredAt,
      note: isFailure
        ? 'Shopify fulfillment webhook reported failure/error — operator investigation required.'
        : trackingNumber
        ? `Carrier tracking synchronized (${trackingCompany || 'Carrier'}: ${trackingNumber}).`
        : `Fulfillment status updated to ${targetState}.`,
      tracking: {
        carrier: trackingCompany,
        trackingNumber,
        trackingUrl,
        shippedAt:
          targetState === 'SHIPPED' || targetState === 'TRACKING_AVAILABLE'
            ? triggeredAt
            : null,
      },
      exception: isFailure
        ? {
            type: 'SHIPMENT_FAILURE',
            severity: 'CRITICAL',
            message: `Fulfillment failure reported for Shopify order ${orderId}.`,
          }
        : status === 'success' && !trackingNumber
        ? {
            type: 'MISSING_TRACKING_SYNC',
            severity: 'HIGH',
            message: `Fulfillment marked success for order ${orderId} without a tracking number.`,
          }
        : undefined,
    });

    markWebhookProcessed(webhookId);
    return jsonNoStore({
      received: true,
      duplicate: false,
      topic,
      outOfOrderIgnored,
      orderState: record.currentState,
    });
  }

  if (topic === 'orders/cancelled') {
    const orderId = String(payload.id || '');
    const orderNumber = String(payload.order_number || payload.name || orderId);
    const { record } = applyOrderLifecycleWebhookEvent({
      shopifyOrderId: orderId,
      orderNumber,
      targetState: 'CANCELLED',
      sourceTopic: topic,
      webhookId,
      eventTimestampIso: triggeredAt,
      note: `Order cancelled in Shopify (reason: ${String(payload.cancel_reason || 'unspecified')}).`,
    });
    markWebhookProcessed(webhookId);
    return jsonNoStore({
      received: true,
      duplicate: false,
      topic,
      orderState: record.currentState,
    });
  }

  if (topic === 'refunds/create') {
    const orderId = String(payload.order_id || '');
    const { record } = applyOrderLifecycleWebhookEvent({
      shopifyOrderId: orderId,
      orderNumber: orderId,
      targetState: 'REFUNDED',
      sourceTopic: topic,
      webhookId,
      eventTimestampIso: triggeredAt,
      note: 'Refund event recorded from Shopify Admin.',
    });
    markWebhookProcessed(webhookId);
    return jsonNoStore({
      received: true,
      duplicate: false,
      topic,
      orderState: record.currentState,
    });
  }

  markWebhookProcessed(webhookId);
  return jsonNoStore({
    received: true,
    duplicate: false,
    topic,
    ignored: true,
  });
}
