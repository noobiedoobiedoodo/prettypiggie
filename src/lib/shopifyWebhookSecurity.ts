import crypto from 'node:crypto';

export interface WebhookVerificationResult {
  valid: boolean;
  configured: boolean;
  reason?: string;
}

/**
 * Verifies Shopify webhook authenticity via constant-time HMAC-SHA256 comparison
 * against the raw, unparsed UTF-8 request body (Shopify Official Documentation).
 *
 * Fails closed whenever SHOPIFY_WEBHOOK_SECRET is unset or signature is missing/invalid.
 */
export function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null
): WebhookVerificationResult {
  const secret = (process.env.SHOPIFY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return {
      valid: false,
      configured: false,
      reason:
        'SHOPIFY_WEBHOOK_SECRET is not configured on the server (fail-closed).',
    };
  }

  if (!hmacHeader || !hmacHeader.trim()) {
    return {
      valid: false,
      configured: true,
      reason: 'Missing X-Shopify-Hmac-Sha256 header.',
    };
  }

  const computedDigest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  const receivedBuf = Buffer.from(hmacHeader.trim(), 'base64');
  const computedBuf = Buffer.from(computedDigest, 'base64');

  if (
    receivedBuf.length === 0 ||
    receivedBuf.length !== computedBuf.length
  ) {
    return {
      valid: false,
      configured: true,
      reason: 'Invalid HMAC signature length.',
    };
  }

  const matches = crypto.timingSafeEqual(receivedBuf, computedBuf);
  return matches
    ? { valid: true, configured: true }
    : {
        valid: false,
        configured: true,
        reason: 'HMAC signature mismatch.',
      };
}

export function hashEmailForLookup(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}
