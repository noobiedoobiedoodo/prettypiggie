import { NextResponse } from 'next/server';
import { MAKEOVER_PERSONALITIES } from '@/lib/makeoverStyles';
import { getMakeoverProviderStatus } from '@/lib/makeoverServer';
import { checkApiRateLimit } from '@/lib/rateLimit';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request: Request) {
  const rate = checkApiRateLimit(request, 'makeover-health', 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many status requests.', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  const status = getMakeoverProviderStatus();
  return NextResponse.json(
    {
      ...status,
      personalitiesCount: MAKEOVER_PERSONALITIES.length,
      serverCredentialsExposed: false,
      checkedAtUtc: new Date().toISOString(),
    },
    { headers: NO_STORE_HEADERS }
  );
}
