import { NextResponse } from 'next/server';
import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const zone = searchParams.get('zone');
  const inStockOnly = searchParams.get('inStock') === 'true';

  let filtered = PRETTYPIGGIE_PRODUCTS;

  if (category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (zone && zone !== 'rotunda') {
    filtered = filtered.filter((p) => p.zoneId === zone);
  }
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }

  return NextResponse.json({
    brandName: 'Pretty Piggie Makeup',
    complianceStandard: 'FDA / MoCRA & FTC Compliant Public Catalog',
    count: filtered.length,
    products: filtered,
  });
}
