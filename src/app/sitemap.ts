import type { MetadataRoute } from 'next';
import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://prettypiggie.com';
  const eligibleProducts = PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/?mode=2d`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...eligibleProducts.map((product) => ({
      url: `${baseUrl}/?product=${encodeURIComponent(product.handle)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
