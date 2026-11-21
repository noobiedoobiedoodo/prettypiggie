import { NextResponse } from 'next/server';
import {
  CATALOG_RECONCILIATION,
  PRETTYPIGGIE_PRODUCTS,
} from '@/data/boutiqueData';
import { AvailabilityState } from '@/types/boutique';

const VALID_AVAILABILITY_STATES = new Set<AvailabilityState>([
  'VERIFIED_IN_STOCK',
  'VERIFIED_OUT_OF_STOCK',
  'UNVERIFIED_PURCHASE_LOCKED',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const zone = searchParams.get('zone');
  const inStockOnly = searchParams.get('inStock') === 'true';
  const purchasableOnly = searchParams.get('purchasable') === 'true';
  const availabilityParam = searchParams.get(
    'availabilityState'
  ) as AvailabilityState | null;

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
  if (purchasableOnly) {
    filtered = filtered.filter(
      (p) => p.availabilityState === 'VERIFIED_IN_STOCK' && p.canPurchase
    );
  }
  if (availabilityParam && VALID_AVAILABILITY_STATES.has(availabilityParam)) {
    filtered = filtered.filter((p) => p.availabilityState === availabilityParam);
  }

  return NextResponse.json({
    brandName: 'Pretty Piggie Makeup',
    releaseCandidate: 'remediation/v1.0.0-rc2',
    catalogPolicy:
      'Pre-GA Controlled Remediation — Supplier-Listing INCI Transcriptions Distinguished From Authoritative Manufacturer-Certified Documentation; 54 Incomplete Items Locked',
    reconciliation: CATALOG_RECONCILIATION,
    evidenceClassification: {
      supplierListingCompleteTranscriptions:
        CATALOG_RECONCILIATION.supplierListingCompleteTranscriptions,
      manufacturerCertifiedDocumentsOnFile:
        CATALOG_RECONCILIATION.manufacturerCertifiedDocumentsOnFile,
      incompleteOrMissingListingsLocked:
        CATALOG_RECONCILIATION.unverifiedPurchaseLocked,
      distinctionNote:
        'Complete ingredient lists transcribed from supplier catalog listings (56 products: 52 in stock + 4 out of stock) are NOT manufacturer-certified evidence.',
    },
    count: filtered.length,
    products: filtered,
  });
}
