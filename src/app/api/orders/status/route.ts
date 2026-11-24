import { NextResponse } from 'next/server';
import { lookupCustomerOrderStatus } from '@/lib/orderLifecycleStore';
import { checkApiRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_ORDER_NUM_REGEX = /^#?[A-Za-z0-9-]{3,32}$/;
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request: Request) {
  const rate = checkApiRateLimit(request, 'order-status', 20);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many order status lookups.', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = (searchParams.get('orderNumber') || '').trim();
  const email = (searchParams.get('email') || '').trim();

  if (
    !SAFE_ORDER_NUM_REGEX.test(orderNumber) ||
    !email ||
    email.length > 254 ||
    !BASIC_EMAIL_REGEX.test(email)
  ) {
    return NextResponse.json(
      {
        error: 'Valid orderNumber and email query parameters are required.',
        code: 'INVALID_LOOKUP_PARAMETERS',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const result = lookupCustomerOrderStatus(orderNumber, email);
  if (!result.found || !result.order) {
    return NextResponse.json(
      {
        found: false,
        message:
          'No matching live order record found. Check your Shopify confirmation email or try again after payment completes.',
      },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      found: true,
      order: result.order,
    },
    { headers: NO_STORE_HEADERS }
  );
}
