/**
 * Authoritative 14-State Order Lifecycle Model (Master Directive Section 9).
 *
 * CRITICAL INVARIANT:
 * - Customer payment (Shopify) and supplier payment (Blanka) are distinct financial events.
 * - An order MUST NEVER transition to SHIPPED or TRACKING_AVAILABLE merely because
 *   Shopify captured customer payment or Blanka charged the merchant.
 * - Shipment status is reported ONLY after verified shipment/tracking confirmation.
 */
export type OrderLifecycleState =
  | 'PAYMENT_RECEIVED'
  | 'SHOPIFY_ORDER_CREATED'
  | 'SUPPLIER_SUBMISSION_PENDING'
  | 'SUPPLIER_PAYMENT_PENDING'
  | 'SUPPLIER_PAYMENT_FAILED'
  | 'SUPPLIER_PROCESSING'
  | 'PRODUCTION_IN_PROGRESS'
  | 'PREPARING_TO_SHIP'
  | 'SHIPPED'
  | 'TRACKING_AVAILABLE'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'FULFILLMENT_EXCEPTION';

export type OperationalExceptionType =
  | 'PAID_ORDER_NOT_RECEIVED_BY_BLANKA'
  | 'BLANKA_PAYMENT_FAILURE'
  | 'SUPPLIER_REJECTION'
  | 'PRODUCT_UNAVAILABLE'
  | 'PRODUCTION_DELAY'
  | 'SHIPMENT_FAILURE'
  | 'MISSING_TRACKING_SYNC';

export interface OrderTrackingInfo {
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
}

export interface OrderLifecycleTransition {
  state: OrderLifecycleState;
  occurredAt: string;
  sourceTopic: string;
  webhookId: string;
  note: string;
}

export interface OperationalExceptionAlert {
  id: string;
  type: OperationalExceptionType;
  severity: 'HIGH' | 'CRITICAL';
  orderId: string;
  orderNumber: string;
  detectedAt: string;
  message: string;
  acknowledged: boolean;
}

export interface TrackedOrderRecord {
  shopifyOrderId: string;
  orderNumber: string;
  customerEmailHash: string;
  currency: string;
  totalPrice: number;
  currentState: OrderLifecycleState;
  tracking: OrderTrackingInfo;
  lastEventTimestamp: string;
  updatedAt: string;
  transitions: OrderLifecycleTransition[];
  exceptions: OperationalExceptionAlert[];
}
