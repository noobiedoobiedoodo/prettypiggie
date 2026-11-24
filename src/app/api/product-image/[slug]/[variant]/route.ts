import { NextResponse } from 'next/server';
import serverImageMapRaw from '@/lib/serverImageMap.json';

type ImageVariantRecord = {
  primary: string | null;
  box: string | null;
};

const IMAGE_MAP = serverImageMapRaw as Record<string, ImageVariantRecord>;
const ALLOWED_VARIANTS = new Set(['primary', 'box']);
const SAFE_SLUG_REGEX = /^[a-z0-9-]+$/;
const ALLOWED_UPSTREAM_HOSTS = new Set(['images.blankabrand.com']);
const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB DoS ceiling

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; variant: string }> }
) {
  const { slug, variant } = await context.params;

  if (!ALLOWED_VARIANTS.has(variant)) {
    return new NextResponse('Invalid Image Variant', { status: 400 });
  }

  // Strict slug validation + own-property check blocks __proto__ / constructor / path traversal
  if (
    !SAFE_SLUG_REGEX.test(slug) ||
    !Object.prototype.hasOwnProperty.call(IMAGE_MAP, slug)
  ) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const entry = IMAGE_MAP[slug];
  const upstreamUrl =
    variant === 'box' ? entry.box || entry.primary : entry.primary;

  if (!upstreamUrl) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Defense-in-depth SSRF guard on upstream URL host & protocol
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(upstreamUrl);
    if (
      parsedUrl.protocol !== 'https:' ||
      !ALLOWED_UPSTREAM_HOSTS.has(parsedUrl.hostname.toLowerCase())
    ) {
      return new NextResponse('Upstream Host Not Permitted', { status: 502 });
    }
  } catch {
    return new NextResponse('Invalid Upstream URL', { status: 502 });
  }

  try {
    const upstreamRes = await fetch(parsedUrl.toString(), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstreamRes.ok) {
      return new NextResponse('Upstream Image Unavailable', {
        status: upstreamRes.status,
      });
    }

    const rawContentType =
      upstreamRes.headers.get('content-type') || 'image/webp';
    if (!rawContentType.toLowerCase().startsWith('image/')) {
      return new NextResponse('Invalid Upstream Media Type', { status: 502 });
    }

    const declaredLength = Number(upstreamRes.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return new NextResponse('Upstream Image Too Large', { status: 502 });
    }

    const buffer = await upstreamRes.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return new NextResponse('Invalid Upstream Image Size', { status: 502 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': rawContentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse('Image Proxy Error', { status: 502 });
  }
}
