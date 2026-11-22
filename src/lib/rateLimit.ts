interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const PUBLIC_MAX_REQUESTS = 30;
const LOOPBACK_MAX_REQUESTS = 240;

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
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

export function checkCheckoutRateLimit(request: Request): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const ip = getClientIp(request);
  const now = Date.now();
  const limit = isLoopback(ip) ? LOOPBACK_MAX_REQUESTS : PUBLIC_MAX_REQUESTS;

  // Periodic pruning to prevent unbounded memory growth
  if (buckets.size > 1000) {
    buckets.forEach((val, key) => {
      if (val.resetAt <= now) buckets.delete(key);
    });
  }

  const existing = buckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
