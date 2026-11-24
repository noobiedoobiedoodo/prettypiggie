import { hashEmailForLookup } from '@/lib/shopifyWebhookSecurity';
import {
  OperationalExceptionAlert,
  OperationalExceptionType,
  OrderLifecycleState,
  TrackedOrderRecord,
} from '@/types/orderLifecycle';

/**
 * In-memory idempotent webhook ledger & order lifecycle state tracker.
 * NOTE FOR MULTI-INSTANCE PRODUCTION: Back this interface with durable storage
 * (Vercel KV / Postgres / Redis) before enabling live customer traffic so webhook
 * idempotency keys and order state persist across serverless cold starts.
 */
const processedWebhookIds = new Map<string, number>();
const trackedOrdersById = new Map<string, TrackedOrderRecord>();
const trackedOrderIdByNumber = new Map<string, string>();
const syncLog: Array<{
  topic: string;
  webhookId: string;
  receivedAt: string;
  note: string;
}> = [];

const IDEMPOTENCY_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

const STATE_ORDER_RANK: Record<OrderLifecycleState, number> = {
  PAYMENT_RECEIVED: 1,
  SHOPIFY_ORDER_CREATED: 2,
  SUPPLIER_SUBMISSION_PENDING: 3,
  SUPPLIER_PAYMENT_PENDING: 4,
  SUPPLIER_PAYMENT_FAILED: 4,
  SUPPLIER_PROCESSING: 5,
  PRODUCTION_IN_PROGRESS: 6,
  PREPARING_TO_SHIP: 7,
  SHIPPED: 8,
  TRACKING_AVAILABLE: 9,
  FULFILLMENT_EXCEPTION: 9,
  CANCELLED: 10,
  REFUND_PENDING: 11,
  REFUNDED: 12,
};

function pruneOldWebhookIds() {
  if (processedWebhookIds.size < 2000) return;
  const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
  processedWebhookIds.forEach((ts, key) => {
    if (ts < cutoff) processedWebhookIds.delete(key);
  });
}

export function hasProcessedWebhook(webhookId: string): boolean {
  return processedWebhookIds.has(webhookId);
}

export function markWebhookProcessed(webhookId: string) {
  pruneOldWebhookIds();
  processedWebhookIds.set(webhookId, Date.now());
}

export function recordCatalogSyncEvent(
  topic: string,
  webhookId: string,
  note: string
) {
  syncLog.push({
    topic,
    webhookId,
    receivedAt: new Date().toISOString(),
    note,
  });
  if (syncLog.length > 200) syncLog.shift();
}

export function getRecentSyncEvents() {
  return [...syncLog];
}

export function createOperationalException(
  order: TrackedOrderRecord,
  type: OperationalExceptionType,
  severity: 'HIGH' | 'CRITICAL',
  message: string
): OperationalExceptionAlert {
  const alert: OperationalExceptionAlert = {
    id: `exc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    orderId: order.shopifyOrderId,
    orderNumber: order.orderNumber,
    detectedAt: new Date().toISOString(),
    message,
    acknowledged: false,
  };
  order.exceptions.push(alert);
  return alert;
}

export interface UpsertOrderEventInput {
  shopifyOrderId: string;
  orderNumber: string;
  customerEmail?: string;
  currency?: string;
  totalPrice?: number;
  targetState: OrderLifecycleState;
  sourceTopic: string;
  webhookId: string;
  eventTimestampIso: string;
  note: string;
  tracking?: {
    carrier?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    shippedAt?: string | null;
  };
  exception?: {
    type: OperationalExceptionType;
    severity: 'HIGH' | 'CRITICAL';
    message: string;
  };
}

export function applyOrderLifecycleWebhookEvent(
  input: UpsertOrderEventInput
): {
  record: TrackedOrderRecord;
  outOfOrderIgnored: boolean;
} {
  const nowIso = new Date().toISOString();
  const normalizedNumber = input.orderNumber.replace(/^#/, '').trim();
  const existing = trackedOrdersById.get(input.shopifyOrderId);

  if (!existing) {
    const record: TrackedOrderRecord = {
      shopifyOrderId: input.shopifyOrderId,
      orderNumber: normalizedNumber,
      customerEmailHash: input.customerEmail
        ? hashEmailForLookup(input.customerEmail)
        : '',
      currency: input.currency || 'USD',
      totalPrice: Number(input.totalPrice || 0),
      currentState: input.targetState,
      tracking: {
        carrier: input.tracking?.carrier ?? null,
        trackingNumber: input.tracking?.trackingNumber ?? null,
        trackingUrl: input.tracking?.trackingUrl ?? null,
        shippedAt: input.tracking?.shippedAt ?? null,
      },
      lastEventTimestamp: input.eventTimestampIso,
      updatedAt: nowIso,
      transitions: [
        {
          state: input.targetState,
          occurredAt: input.eventTimestampIso,
          sourceTopic: input.sourceTopic,
          webhookId: input.webhookId,
          note: input.note,
        },
      ],
      exceptions: [],
    };

    if (input.exception) {
      createOperationalException(
        record,
        input.exception.type,
        input.exception.severity,
        input.exception.message
      );
    }

    trackedOrdersById.set(input.shopifyOrderId, record);
    if (normalizedNumber) {
      trackedOrderIdByNumber.set(normalizedNumber.toLowerCase(), input.shopifyOrderId);
    }
    return { record, outOfOrderIgnored: false };
  }

  // Out-of-order protection: ignore older timestamps unless event is an exception/cancel/refund
  const incomingMs = Date.parse(input.eventTimestampIso) || Date.now();
  const lastMs = Date.parse(existing.lastEventTimestamp) || 0;
  const isTerminalOrException =
    input.targetState === 'CANCELLED' ||
    input.targetState === 'REFUND_PENDING' ||
    input.targetState === 'REFUNDED' ||
    input.targetState === 'FULFILLMENT_EXCEPTION' ||
    input.targetState === 'SUPPLIER_PAYMENT_FAILED';

  if (
    !isTerminalOrException &&
    incomingMs < lastMs &&
    STATE_ORDER_RANK[input.targetState] < STATE_ORDER_RANK[existing.currentState]
  ) {
    return { record: existing, outOfOrderIgnored: true };
  }

  if (
    isTerminalOrException ||
    STATE_ORDER_RANK[input.targetState] >=
      STATE_ORDER_RANK[existing.currentState]
  ) {
    existing.currentState = input.targetState;
  }

  if (input.customerEmail && !existing.customerEmailHash) {
    existing.customerEmailHash = hashEmailForLookup(input.customerEmail);
  }
  if (input.tracking) {
    if (input.tracking.carrier) existing.tracking.carrier = input.tracking.carrier;
    if (input.tracking.trackingNumber) {
      existing.tracking.trackingNumber = input.tracking.trackingNumber;
    }
    if (input.tracking.trackingUrl) {
      existing.tracking.trackingUrl = input.tracking.trackingUrl;
    }
    if (input.tracking.shippedAt) {
      existing.tracking.shippedAt = input.tracking.shippedAt;
    }
  }

  existing.lastEventTimestamp = input.eventTimestampIso;
  existing.updatedAt = nowIso;
  existing.transitions.push({
    state: input.targetState,
    occurredAt: input.eventTimestampIso,
    sourceTopic: input.sourceTopic,
    webhookId: input.webhookId,
    note: input.note,
  });

  if (input.exception) {
    createOperationalException(
      existing,
      input.exception.type,
      input.exception.severity,
      input.exception.message
    );
  }

  return { record: existing, outOfOrderIgnored: false };
}

export function lookupCustomerOrderStatus(
  orderNumber: string,
  email: string
): {
  found: boolean;
  order?: {
    orderNumber: string;
    currentState: OrderLifecycleState;
    shippedConfirmed: boolean;
    tracking: TrackedOrderRecord['tracking'];
    updatedAt: string;
  };
} {
  const cleanNum = orderNumber.replace(/^#/, '').trim().toLowerCase();
  const orderId = trackedOrderIdByNumber.get(cleanNum);
  if (!orderId) return { found: false };

  const record = trackedOrdersById.get(orderId);
  if (!record || !record.customerEmailHash) return { found: false };

  const expectedHash = hashEmailForLookup(email);
  if (expectedHash !== record.customerEmailHash) {
    return { found: false };
  }

  const shippedConfirmed =
    record.currentState === 'SHIPPED' ||
    record.currentState === 'TRACKING_AVAILABLE';

  return {
    found: true,
    order: {
      orderNumber: record.orderNumber,
      currentState: record.currentState,
      shippedConfirmed,
      tracking: shippedConfirmed
        ? record.tracking
        : {
            carrier: null,
            trackingNumber: null,
            trackingUrl: null,
            shippedAt: null,
          },
      updatedAt: record.updatedAt,
    },
  };
}
