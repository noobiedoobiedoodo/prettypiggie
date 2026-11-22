import type { MetadataRoute } from 'next';

/**
 * Blocks search engine indexing by default on staging / pre-GA environments.
 * Set NEXT_PUBLIC_ALLOW_INDEXING=true ONLY after General Availability sign-off.
 */
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: 'https://prettypiggie.com/sitemap.xml',
  };
}
