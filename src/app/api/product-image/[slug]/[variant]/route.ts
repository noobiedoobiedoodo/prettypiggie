import { NextResponse } from 'next/server';
import serverImageMapRaw from '@/lib/serverImageMap.json';

type ImageVariantRecord = {
  primary: string | null;
  box: string | null;
};

const IMAGE_MAP = serverImageMapRaw as Record<string, ImageVariantRecord>;

export async function GET(
  _request: Request,
  context: { params: { slug: string; variant: string } }
) {
  const { slug, variant } = context.params;
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
    });

    if (!upstreamRes.ok) {
      return new NextResponse('Upstream Image Unavailable', {
        status: upstreamRes.status,
      });
    }

    const buffer = await upstreamRes.arrayBuffer();
    const contentType =
      upstreamRes.headers.get('content-type') || 'image/webp';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse('Image Proxy Error', { status: 502 });
  }
}
