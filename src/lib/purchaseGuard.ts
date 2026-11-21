import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';
import {
  AvailabilityState,
  BoutiqueProduct,
  CartItem,
  ProductShade,
} from '@/types/boutique';

export interface RawCartLineInput {
  productId?: unknown;
  productHandle?: unknown;
  sku?: unknown;
  shadeId?: unknown;
  quantity?: unknown;
}

export interface BlockedCartLine {
  productId?: string;
  productHandle?: string;
  sku?: string;
  title?: string;
  availabilityState: AvailabilityState | 'UNKNOWN_PRODUCT';
  inciStatus?: string;
  reason: string;
}

export interface CartValidationResult {
  ok: boolean;
  verifiedItems: CartItem[];
  blockedItems: BlockedCartLine[];
}

export function isProductPurchasable(
  product: BoutiqueProduct | null | undefined,
  shade?: ProductShade | null
): boolean {
  if (!product) return false;
  if (product.availabilityState !== 'VERIFIED_IN_STOCK') return false;
  if (!product.manufacturerVerified || !product.inStock || !product.canPurchase) {
    return false;
  }
  if (shade && !shade.inStock) return false;
  return true;
}

function findAuthoritativeProduct(
  raw: RawCartLineInput
): BoutiqueProduct | undefined {
  const id = typeof raw.productId === 'string' ? raw.productId.trim().toLowerCase() : '';
  const handle =
    typeof raw.productHandle === 'string'
      ? raw.productHandle.trim().toLowerCase()
      : '';
  const sku = typeof raw.sku === 'string' ? raw.sku.trim().toLowerCase() : '';

  return PRETTYPIGGIE_PRODUCTS.find(
    (p) =>
      (id && p.id.toLowerCase() === id) ||
      (handle && p.handle.toLowerCase() === handle) ||
      (sku &&
        (p.sku.toLowerCase() === sku ||
          p.shades.some((s) => s.sku.toLowerCase() === sku)))
  );
}

/**
 * Authoritative client & server cart validation against PRETTYPIGGIE_PRODUCTS.
 * - Rejects all 54 UNVERIFIED_PURCHASE_LOCKED products
 * - Rejects all 4 VERIFIED_OUT_OF_STOCK products
 * - Rejects unknown/tampered product identifiers and invalid quantities
 * - Recomputes canonical price, title, SKU, and Shopify variant ID from the catalog
 */
export function validateCartForCheckout(
  rawItems: unknown
): CartValidationResult {
  if (!Array.isArray(rawItems)) {
    return {
      ok: false,
      verifiedItems: [],
      blockedItems: [
        {
          availabilityState: 'UNKNOWN_PRODUCT',
          reason: 'Cart payload must be an array of items.',
        },
      ],
    };
  }

  const verifiedItems: CartItem[] = [];
  const blockedItems: BlockedCartLine[] = [];

  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') {
      blockedItems.push({
        availabilityState: 'UNKNOWN_PRODUCT',
        reason: 'Malformed cart entry.',
      });
      continue;
    }

    const raw = entry as RawCartLineInput;
    const product = findAuthoritativeProduct(raw);

    if (!product) {
      blockedItems.push({
        productId: typeof raw.productId === 'string' ? raw.productId : undefined,
        productHandle:
          typeof raw.productHandle === 'string' ? raw.productHandle : undefined,
        sku: typeof raw.sku === 'string' ? raw.sku : undefined,
        availabilityState: 'UNKNOWN_PRODUCT',
        reason: 'Product does not exist in the authoritative Pretty Piggie catalog.',
      });
      continue;
    }

    if (product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED') {
      blockedItems.push({
        productId: product.id,
        productHandle: product.handle,
        sku: product.sku,
        title: product.title,
        availabilityState: 'UNVERIFIED_PURCHASE_LOCKED',
        inciStatus: product.inciStatus,
        reason:
          'Purchase locked: complete untruncated manufacturer INCI documentation is not verified on file.',
      });
      continue;
    }

    if (
      product.availabilityState === 'VERIFIED_OUT_OF_STOCK' ||
      !isProductPurchasable(product)
    ) {
      blockedItems.push({
        productId: product.id,
        productHandle: product.handle,
        sku: product.sku,
        title: product.title,
        availabilityState: 'VERIFIED_OUT_OF_STOCK',
        inciStatus: product.inciStatus,
        reason:
          'Purchase disabled: complete supplier-listing INCI transcription is captured (authoritative manufacturer certification pending), and this product is currently out of stock.',
      });
      continue;
    }

    const parsedQty = Number(raw.quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 99) {
      blockedItems.push({
        productId: product.id,
        productHandle: product.handle,
        sku: product.sku,
        title: product.title,
        availabilityState: product.availabilityState,
        inciStatus: product.inciStatus,
        reason: 'Quantity must be an integer between 1 and 99.',
      });
      continue;
    }

    const shadeId = typeof raw.shadeId === 'string' ? raw.shadeId : '';
    const skuStr = typeof raw.sku === 'string' ? raw.sku.toLowerCase() : '';
    const matchedShade =
      product.shades.find((s) => s.id === shadeId) ??
      (skuStr
        ? product.shades.find((s) => s.sku.toLowerCase() === skuStr)
        : undefined) ??
      product.shades[0];

    if (!matchedShade || !matchedShade.inStock) {
      blockedItems.push({
        productId: product.id,
        productHandle: product.handle,
        sku: product.sku,
        title: product.title,
        availabilityState: 'VERIFIED_OUT_OF_STOCK',
        inciStatus: product.inciStatus,
        reason: 'Selected shade is not currently purchasable.',
      });
      continue;
    }

    // Merge duplicate canonical lines
    const canonicalKey = `${product.id}::${matchedShade.id}`;
    const existing = verifiedItems.find((i) => i.key === canonicalKey);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + parsedQty);
    } else {
      verifiedItems.push({
        key: canonicalKey,
        productId: product.id,
        productHandle: product.handle,
        sku: matchedShade.sku || product.sku,
        title: product.title,
        category: product.category,
        modelType: product.modelType,
        shadeId: matchedShade.id,
        shadeName: matchedShade.name,
        shadeHex: matchedShade.hex,
        finish: matchedShade.finish,
        price: product.price,
        primaryImage: product.primaryImage,
        quantity: parsedQty,
        shopifyVariantId: matchedShade.shopifyVariantId,
      });
    }
  }

  return {
    ok: blockedItems.length === 0 && verifiedItems.length > 0,
    verifiedItems,
    blockedItems,
  };
}

/**
 * Sanitizes restored browser localStorage cart payloads by evicting any
 * UNVERIFIED_PURCHASE_LOCKED, VERIFIED_OUT_OF_STOCK, unknown, or legacy-corrupted entries.
 */
export function sanitizePersistedCart(rawItems: unknown): {
  items: CartItem[];
  evictedCount: number;
} {
  if (!Array.isArray(rawItems)) {
    return { items: [], evictedCount: 0 };
  }
  const result = validateCartForCheckout(rawItems);
  return {
    items: result.verifiedItems,
    evictedCount: result.blockedItems.length,
  };
}
