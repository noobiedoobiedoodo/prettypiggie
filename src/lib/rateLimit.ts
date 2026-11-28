import crypto from 'node:crypto';

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const LOOPBACK_MAX_REQUESTS = 240;

const buckets = new Map<string, Bucket>();

// Ephemeral per-boot HMAC secret when no explicit signing secret is configured
const FALLBACK_BOOT_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return (
    process.env.RATE_LIMIT_SIGNING_SECRET?.trim() ||
    process.env.SHOPIFY_WEBHOOK_SECRET?.trim() ||
    FALLBACK_BOOT_SECRET
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}

function isLoopback(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

/**
 * Synchronous per-isolate sliding-window bucket (fast first line of defense).
 */
export function checkApiRateLimit(
  request: Request,
  scope = 'checkout-post',
  publicMaxRequests = 30,
  windowMs = WINDOW_MS
): {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
} {
  const ip = getClientIp(request);
  const key = `${scope}::${ip}`;
  const now = Date.now();
  const limit = isLoopback(ip) ? LOOPBACK_MAX_REQUESTS : publicMaxRequests;

  if (buckets.size > 1000) {
    buckets.forEach((val, bucketKey) => {
      if (val.resetAt <= now) buckets.delete(bucketKey);
    });
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, limit - 1),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
      remaining: 0,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, limit - existing.count),
  };
}

/**
 * Layered Serverless Abuse Control (Mandatory Correction #9):
 * 1. Uses Distributed Vercel KV / Upstash Redis REST pipeline (`INCR` + `PEXPIRE`)
 *    across all serverless isolates whenever `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL` is set.
 * 2. Layers an HMAC-SHA256 signed stateless quota cookie (`pp_rl_<scope>`) so clients
 *    carrying cookies across cold-started serverless instances still enforce window quotas.
 * 3. Always enforces the synchronous isolate token bucket as an immediate floor.
 */
export async function checkLayeredAbuseLimit(
  request: Request,
  scope: string,
  publicMaxRequests: number,
  windowMs = WINDOW_MS
): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  mode: 'distributed-kv' | 'stateless-cookie+isolate';
  setCookieHeader?: string;
}> {
  const ip = getClientIp(request);
  const limit = isLoopback(ip) ? LOOPBACK_MAX_REQUESTS : publicMaxRequests;
  const now = Date.now();

  // 1. Distributed KV / Upstash Redis REST adapter (when configured)
  const kvUrl = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');
  const kvToken = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).trim();

  if (kvUrl && kvToken && !isLoopback(ip)) {
    try {
      const windowSlot = Math.floor(now / windowMs);
      const redisKey = `pp:rl:${scope}:${ip}:${windowSlot}`;
      const res = await fetch(`${kvUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['PEXPIRE', redisKey, windowMs],
        ]),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = (await res.json()) as Array<{ result?: number }>;
        const count = Number(data?.[0]?.result ?? 1);
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(((windowSlot + 1) * windowMs - now) / 1000)
        );
        return {
          allowed: count <= limit,
          retryAfterSeconds: count <= limit ? 0 : retryAfterSeconds,
          remaining: Math.max(0, limit - count),
          mode: 'distributed-kv',
        };
      }
    } catch {
      // Fall through cleanly to stateless cookie + isolate bucket if KV times out
    }
  }

  // 2. Stateless HMAC-signed sliding window cookie check + update
  const cookieName = `pp_rl_${scope.replace(/[^a-z0-9]/gi, '_')}`;
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  let cookieCount = 0;
  let cookieResetAt = now + windowMs;

  if (match?.[1]) {
    const parts = decodeURIComponent(match[1]).split('.');
    if (parts.length === 3) {
      const [cStr, rStr, sig] = parts;
      const expected = crypto
        .createHmac('sha256', getSigningSecret())
        .update(`${scope}:${cStr}:${rStr}`)
        .digest('base64url')
        .slice(0, 22);
      const parsedCount = Number(cStr);
      const parsedReset = Number(rStr);
      if (
        sig === expected &&
        Number.isFinite(parsedCount) &&
        Number.isFinite(parsedReset) &&
        parsedReset > now
      ) {
        cookieCount = parsedCount;
        cookieResetAt = parsedReset;
      }
    }
  }

  const nextCookieCount = cookieCount + 1;
  const isolateResult = checkApiRateLimit(
    request,
    scope,
    publicMaxRequests,
    windowMs
  );

  const effectiveAllowed = isolateResult.allowed && nextCookieCount <= limit;
  const retryAfterSeconds = effectiveAllowed
    ? 0
    : Math.max(
        isolateResult.retryAfterSeconds,
        Math.max(1, Math.ceil((cookieResetAt - now) / 1000))
      );

  const newSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${scope}:${nextCookieCount}:${cookieResetAt}`)
    .digest('base64url')
    .slice(0, 22);
  const maxAgeSec = Math.max(1, Math.ceil((cookieResetAt - now) / 1000));
  const setCookieHeader = `${cookieName}=${encodeURIComponent(
    `${nextCookieCount}.${cookieResetAt}.${newSig}`
  )}; Path=/api; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Strict`;

  return {
    allowed: effectiveAllowed,
    retryAfterSeconds,
    remaining: Math.min(isolateResult.remaining, Math.max(0, limit - nextCookieCount)),
    mode: 'stateless-cookie+isolate',
    setCookieHeader,
  };
}

export function checkCheckoutRateLimit(request: Request) {
  return checkApiRateLimit(request, 'checkout-post', 30);
}
