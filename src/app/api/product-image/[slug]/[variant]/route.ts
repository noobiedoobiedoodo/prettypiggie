import { NextResponse } from 'next/server';
import serverImageMapRaw from '@/lib/serverImageMap.json';

type ImageVariantRecord = {
  primary: string | null;
  box: string | null;
};

const IMAGE_MAP = serverImageMapRaw as Record<string, ImageVariantRecord>;
const ALLOWED_VARIANTS = new Set(['primary', 'box']);
const UPSTREAM_TIMEOUT_MS = 8000;

export async function GET(
  _request: Request,
  context: { params: { slug: string; variant: string } }
) {
  const { slug, variant } = context.params;

  if (!ALLOWED_VARIANTS.has(variant)) {
    return new NextResponse('Invalid Image Variant', { status: 400 });
  }

  const entry = IMAGE_MAP[slug];
  if (!entry) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const upstreamUrl =
    variant === 'box' ? entry.box || entry.primary : entry.primary;

  if (!upstreamUrl) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
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

    const buffer = await upstreamRes.arrayBuffer();

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
