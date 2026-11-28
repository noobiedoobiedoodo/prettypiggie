import { NextResponse } from 'next/server';
import { checkLayeredAbuseLimit } from '@/lib/rateLimit';
import { validatePiggieAnalyticsPayload } from '@/pretty-piggie/analytics/PiggieEvents';

const MAX_EVENT_BODY_BYTES = 2048; // Strict 2 KB hard cap

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function isSameOriginOrAllowed(request: Request): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite === 'cross-site') {
    return false;
  }

  const originHeader = request.headers.get('origin');
  if (!originHeader) return true;

  try {
    const originHost = new URL(originHeader).host.toLowerCase();
    const requestHost = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    if (requestHost && originHost === requestHost) return true;
    const originHostname = new URL(originHeader).hostname.toLowerCase();
    return (
      originHostname === 'prettypiggie.com' ||
      originHostname === 'www.prettypiggie.com' ||
      originHostname.endsWith('.vercel.app')
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // 1. Cross-Origin CSRF & Sec-Fetch-Site guard
  if (!isSameOriginOrAllowed(request)) {
    return jsonNoStore(
      {
        error: 'Cross-origin analytics submissions are not permitted.',
        code: 'ORIGIN_MISMATCH',
      },
      { status: 403 }
    );
  }

  // 2. Layered serverless abuse control (Distributed KV when configured + stateless HMAC cookie + isolate bucket)
  const abuse = await checkLayeredAbuseLimit(
    request,
    'piggie-events',
    60,
    60_000
  );
  if (!abuse.allowed) {
    return jsonNoStore(
      {
        error: 'Event rate limit exceeded.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(abuse.retryAfterSeconds),
          ...(abuse.setCookieHeader
            ? { 'Set-Cookie': abuse.setCookieHeader }
            : {}),
        },
      }
    );
  }

  // 3. Enforce application/json Content-Type
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return jsonNoStore(
      {
        error: 'Content-Type must be application/json.',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      },
      { status: 415 }
    );
  }

  // 4. Enforce strict 2 KB body cap
  const declaredLen = Number(request.headers.get('content-length') || 0);
  if (declaredLen > MAX_EVENT_BODY_BYTES) {
    return jsonNoStore(
      {
        error: 'Analytics event payload exceeds 2 KB limit.',
        code: 'PAYLOAD_TOO_LARGE',
      },
      { status: 413 }
    );
  }

  let parsed: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_EVENT_BODY_BYTES) {
      return jsonNoStore(
        {
          error: 'Analytics event payload exceeds 2 KB limit.',
          code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      );
    }
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return jsonNoStore(
      { error: 'Invalid JSON body.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  // 5. Strict closed-world schema validation (Mandatory Correction #11 — zero PII/landmarks possible)
  const validation = validatePiggieAnalyticsPayload(parsed);
  if (!validation.valid) {
    return jsonNoStore(
      {
        error: `Analytics schema rejected field '${validation.field}'.`,
        code: validation.code,
        field: validation.field,
      },
      { status: 400 }
    );
  }

  // Structured first-party log (ready for Vercel Log Drains / future KV sink)
  console.info(
    JSON.stringify({
      channel: 'PIGGIE_ANALYTICS',
      receivedAtUtc: new Date().toISOString(),
      ...validation.sanitized,
    })
  );

  return jsonNoStore(
    { accepted: true, event: validation.sanitized.event },
    {
      status: 200,
      headers: abuse.setCookieHeader
        ? { 'Set-Cookie': abuse.setCookieHeader }
        : undefined,
    }
  );
}
