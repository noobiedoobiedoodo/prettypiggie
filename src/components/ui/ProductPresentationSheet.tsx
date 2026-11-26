'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Lock,
  Package,
  Rotate3d,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { getReadyToShipAlternatives } from '@/data/boutiqueData';
import { isProductPurchasable } from '@/lib/purchaseGuard';
import {
  BoutiqueProduct,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';

const FREE_SHIPPING_THRESHOLD = 65;

interface ProductPresentationSheetProps {
  product: BoutiqueProduct;
  selectedShade: ProductShade;
  allProducts: BoutiqueProduct[];
  bagCount: number;
  bagSubtotal: number;
  onSelectShade: (shade: ProductShade) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onAddToBag: (
    product: BoutiqueProduct,
    shade: ProductShade,
    quantity: number
  ) => void;
  onOpenBag: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
  onClose: () => void;
  is2DMode?: boolean;
}

function isLightHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
}

export function ProductPresentationSheet({
  product,
  selectedShade,
  allProducts,
  bagCount,
  bagSubtotal,
  onSelectShade,
  onSelectProduct,
  onAddToBag,
  onOpenBag,
  onOpenLegal,
  onClose,
  is2DMode = false,
}: ProductPresentationSheetProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ingredients' | 'reviews'
  >('overview');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] =
    useState<boolean>(false);
  const [showBoxMockup, setShowBoxMockup] = useState<boolean>(false);
  const sheetSwipeStartYRef = useRef<number | null>(null);

  const isPurchasable = isProductPurchasable(product, selectedShade);

  const handleHandleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    sheetSwipeStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleHandleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    const startY = sheetSwipeStartYRef.current;
    sheetSwipeStartYRef.current = null;
    if (startY === null) return;
    const endY = e.changedTouches[0]?.clientY ?? startY;
    const deltaY = endY - startY;
    if (is2DMode) {
      if (deltaY > 70) onClose();
      return;
    }
    if (deltaY < -45) {
      setMobileSheetExpanded(true);
    } else if (deltaY > 55 && mobileSheetExpanded) {
      setMobileSheetExpanded(false);
    } else if (deltaY > 75 && !mobileSheetExpanded) {
      onClose();
    }
  };

  const readyToShipAlternatives = useMemo(
    () =>
      isPurchasable ? [] : getReadyToShipAlternatives(allProducts, product, 2),
    [allProducts, isPurchasable, product]
  );

  const handleAdd = () => {
    if (!isPurchasable) return;
    onAddToBag(product, selectedShade, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const activeMockupImage =
    showBoxMockup && product.boxImage ? product.boxImage : product.primaryImage;

  const projectedSubtotal =
    bagSubtotal + (isPurchasable ? product.price * quantity : 0);
  const remainingAfterAdd = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - projectedSubtotal
  );
  const hasIngredientText = Boolean(product.ingredients?.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} presentation details`}
      onClick={(e) => {
        if (is2DMode && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-30 flex flex-col md:flex-row md:items-stretch ${
        is2DMode
          ? 'pointer-events-auto justify-end bg-piggie-950/55 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6'
          : 'pointer-events-none justify-between md:justify-end'
      }`}
    >
      {/* Top Floating Back Button & 360° Spin Indicator over the 3D Stage (3D Mode Only — 2D Uses Clean Native Sheet Close) */}
      {!is2DMode && (
        <div className="pointer-events-auto flex items-center justify-between px-3 pt-[var(--header-offset)] md:fixed md:left-6 md:top-20 md:w-auto md:gap-4 md:p-0">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/60 bg-piggie-950/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-piggie-900 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-piggie-200" />
            <span>Back to Boutique</span>
          </button>

          <div className="flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/60 bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-piggie-900 shadow-sm backdrop-blur-md">
            <Rotate3d className="h-3.5 w-3.5 text-piggie-600" />
            <span>Drag to Spin 360°</span>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Sheet / Desktop Right Editorial Glass Drawer */}
      <div
        className={`animate-sheet-up pointer-events-auto flex flex-col justify-between overflow-hidden rounded-t-3xl border-t border-white/80 bg-white/95 text-piggie-950 shadow-luxury-glass backdrop-blur-xl transition-all duration-300 md:m-5 md:mt-20 md:w-[460px] md:rounded-3xl md:border ${
          is2DMode
            ? 'max-h-[92dvh] w-full md:m-0 md:max-h-[86dvh] md:max-w-lg'
            : mobileSheetExpanded
            ? 'max-h-[85dvh]'
            : 'max-h-[52dvh] md:max-h-[calc(100dvh-6.5rem)]'
        }`}
      >
        {/* Mobile Pull Handle (Tap or Swipe Up/Down to Expand/Dismiss) */}
        <button
          type="button"
          onTouchStart={handleHandleTouchStart}
          onTouchEnd={handleHandleTouchEnd}
          onClick={() => {
            if (is2DMode) onClose();
            else setMobileSheetExpanded((prev) => !prev);
          }}
          aria-label={
            is2DMode
              ? 'Swipe down or tap to close product details'
              : 'Toggle product details height'
          }
          className="flex min-h-[40px] w-full flex-col items-center justify-center pt-2 pb-1 md:hidden"
        >
          <span className="h-1.5 w-11 rounded-full bg-piggie-200" />
          {!is2DMode && (
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-piggie-600">
              {mobileSheetExpanded
                ? 'Swipe or Tap to View 3D Stage'
                : 'Swipe Up for Full Details & INCI'}
            </span>
          )}
        </button>

        {/* Scrollable Content Body */}
        <div className="piggie-scrollbar flex-1 overflow-y-auto px-4 pt-1 pb-4 md:px-6 md:pt-5">
          {/* Mandatory Regulatory Hold Banner When Manufacturer INCI Is Unverified */}
          {product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-snug text-amber-950">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <strong className="block font-bold uppercase tracking-wider text-amber-900">
                  UNVERIFIED — Purchase Locked Pending Manufacturer INCI Sheet
                </strong>
                <span className="mt-0.5 block text-amber-800">
                  Available for 3D virtual preview only. Commercial checkout is
                  locked until the complete, untruncated manufacturer INCI
                  declaration (<code>{product.inciStatus}</code>) is verified on
                  file and cleared through documented review.
                </span>
              </div>
            </div>
          )}

          {/* Distinct Banner When Complete Supplier-Listing INCI Is Captured But Inventory Is Out of Stock */}
          {product.availabilityState === 'VERIFIED_OUT_OF_STOCK' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-snug text-rose-950">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <div>
                <strong className="block font-bold uppercase tracking-wider text-rose-900">
                  COMPLETE SUPPLIER LISTING INCI — Temporarily Out of Stock
                </strong>
                <span className="mt-0.5 block text-rose-800">
                  A complete ingredient list was transcribed from the supplier
                  catalog listing (<code>VERIFIED_COMPLETE</code> listing
                  capture; authoritative manufacturer certification pending),
                  and this item is currently out of stock and unavailable for
                  checkout.
                </span>
              </div>
            </div>
          )}

          {/* Compact Luxury Editorial Header (Pure-White Porcelain Thumbnail + Title + Price + Clean 2D Close) */}
          <div className="flex items-start gap-3">
            {activeMockupImage && (
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-piggie-100 bg-white p-1 shadow-sm">
                  <img
                    src={activeMockupImage}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                {product.boxImage && (
                  <button
                    type="button"
                    onClick={() => setShowBoxMockup((prev) => !prev)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-piggie-200 bg-piggie-50 px-2.5 text-[11px] font-bold text-piggie-800 transition hover:bg-piggie-100 active:scale-95"
                  >
                    <Package className="h-3 w-3" />
                    <span>{showBoxMockup ? 'Item' : 'Box'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-piggie-600">
                  {product.category}
                </span>
                <span className="text-piggie-300">•</span>
                <span className="text-[10px] font-semibold text-piggie-700">
                  {product.originLabel}
                </span>
              </div>

              <h2 className="mt-0.5 font-serif text-lg font-bold leading-snug text-piggie-950 sm:text-xl">
                {product.title}
              </h2>

              <p className="mt-0.5 line-clamp-1 text-[11px] text-piggie-700">
                {product.subtitle}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300">
                    <Lock className="h-2.5 w-2.5" />
                    UNVERIFIED • Purchase Locked
                  </span>
                ) : product.availabilityState === 'VERIFIED_OUT_OF_STOCK' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 ring-1 ring-rose-200">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Verified • Out of Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Ready to Ship • U.S. Only
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              {is2DMode && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close product details"
                  className="-mr-1 -mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-piggie-50 text-piggie-800 transition hover:bg-piggie-100 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="text-right">
                <div className="font-serif text-xl font-bold tabular-nums text-piggie-950">
                  ${product.price.toFixed(2)}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-piggie-600">
                  {product.manufacturerCertifiedDocOnFile
                    ? 'Certified INCI'
                    : product.manufacturerVerified
                    ? 'Listing INCI'
                    : 'Preview Only'}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2 select-text font-mono text-[10px] text-piggie-600">
            SKU: {selectedShade.sku || product.sku} • U.S. Domestic Shipping
            Only (50 States &amp; D.C.)
          </p>

          {/* Shade & Variant Selector (Smart 1-Shade Collapse vs. 44px Apple HIG Horizontal Swatch Rail on Mobile) */}
          {product.shades.length <= 1 ? (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-piggie-100 bg-piggie-50/75 px-3.5 py-2.5 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/15"
                  style={{ backgroundColor: selectedShade.hex }}
                />
                <span className="truncate font-semibold text-piggie-950">
                  {selectedShade.name}
                </span>
              </div>
              <span className="shrink-0 rounded-full border border-piggie-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-piggie-700">
                {selectedShade.finish}
              </span>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-piggie-100 bg-piggie-50/80 p-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 truncate">
                  <span className="font-medium text-piggie-700">
                    Shade ({product.shades.length}):{' '}
                  </span>
                  <span className="font-bold text-piggie-950">
                    {selectedShade.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-piggie-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-piggie-700">
                  {selectedShade.finish}
                </span>
              </div>

              {/* Single-Row 44x44px Apple HIG Horizontal Swatch Rail on Mobile (Zero Nested Vertical Scroll Trap!) */}
              <div className="mt-2 flex flex-nowrap items-center gap-2.5 overflow-x-auto px-1 py-1.5 no-scrollbar md:piggie-scrollbar md:max-h-32 md:flex-wrap md:overflow-y-auto">
                {product.shades.map((shade) => {
                  const isSelected = shade.id === selectedShade.id;
                  const darkCheck = isLightHex(shade.hex);
                  return (
                    <button
                      key={shade.id}
                      type="button"
                      onClick={() => onSelectShade(shade)}
                      title={shade.name}
                      aria-label={`Select shade ${shade.name}`}
                      aria-pressed={isSelected}
                      className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform md:h-9 md:w-9 ${
                        isSelected
                          ? 'scale-105 ring-2 ring-piggie-950 ring-offset-2'
                          : 'ring-1 ring-black/20 hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: shade.hex,
                      }}
                    >
                      {isSelected && (
                        <Check
                          className={`h-4 w-4 ${
                            darkCheck
                              ? 'text-piggie-950'
                              : 'text-white drop-shadow'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {product.shades.length > 6 && (
                <p className="mt-1 text-[10px] font-semibold text-piggie-600 md:hidden">
                  Swipe to browse all {product.shades.length} shades →
                </p>
              )}
            </div>
          )}

          {/* Compliance-Safe Recovery Shelf on Locked / Out-of-Stock Products */}
          {!isPurchasable && readyToShipAlternatives.length > 0 && (
            <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  Ready-to-Ship Boutique Favorites
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  Verified In Stock
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {readyToShipAlternatives.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => onSelectProduct(alt)}
                    className="flex min-h-[56px] items-center gap-2 rounded-xl border border-emerald-200/70 bg-white p-2 text-left shadow-sm transition hover:border-piggie-300 hover:shadow active:scale-98"
                  >
                    {alt.primaryImage ? (
                      <img
                        src={alt.primaryImage}
                        alt={alt.title}
                        className="h-10 w-10 shrink-0 rounded-lg border border-piggie-100 bg-white object-contain p-0.5"
                      />
                    ) : (
                      <span
                        className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/15"
                        style={{
                          backgroundColor: alt.shades[0]?.hex ?? '#C2185B',
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-piggie-950">
                        {alt.title}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between text-[10px]">
                        <span className="font-bold tabular-nums text-piggie-800">
                          ${alt.price.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
                          Shop <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Information Tabs (44px Apple HIG Touch Height) */}
          <div
            role="tablist"
            aria-label="Product information tabs"
            className="mt-3 flex border-b border-piggie-100 text-xs font-semibold"
          >
            {(
              [
                { id: 'overview', label: 'Details' },
                { id: 'ingredients', label: 'INCI (EN/FR)' },
                { id: 'reviews', label: 'Boutique Note' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] flex-1 whitespace-nowrap border-b-2 px-2 py-2 text-center transition ${
                  activeTab === tab.id
                    ? 'border-piggie-600 text-piggie-950'
                    : 'border-transparent text-piggie-600 hover:text-piggie-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panel Content */}
          <div className="mt-3 text-xs leading-relaxed text-piggie-800">
            {activeTab === 'overview' && (
              <div className="space-y-2.5">
                <p>{product.description}</p>
                <ul className="grid grid-cols-1 gap-1.5 pt-1">
                  {product.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-piggie-100 text-piggie-700">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-piggie-50 p-2.5 text-[11px] text-piggie-800">
                  <strong className="text-piggie-950">How to Use: </strong>
                  {product.howToApply}
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-piggie-700">
                    {product.manufacturerCertifiedDocOnFile
                      ? 'Authoritative Manufacturer INCI Record'
                      : 'Supplier-Listing INCI Transcription'}{' '}
                    ({product.inciStatus} • {product.ingredientEvidenceTier} •{' '}
                    {product.originLabel})
                  </span>
                  <p className="mt-1 select-text rounded-xl bg-piggie-50 p-3 font-mono text-[11px] leading-relaxed text-piggie-900">
                    {hasIngredientText
                      ? product.ingredients
                      : 'Accessory or specialized format with no cosmetic INCI list in the supplier catalog text. Refer to physical packaging and the FDA / MoCRA & Health Canada Safety Policy below.'}
                  </p>
                </div>

                {/* Bilingual English & French FDA / MoCRA / Health Canada Safety Advisory */}
                <div className="select-text space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/75 p-2.5 text-[11px] text-amber-950">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <p>{product.safetyAdvisory}</p>
                      <p className="mt-1 border-t border-amber-200/80 pt-1 italic text-amber-900">
                        {product.safetyAdvisoryFr}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenLegal('safety')}
                        className="mt-1 inline-block font-bold text-piggie-700 underline hover:text-piggie-950"
                      >
                        View Full FDA / MoCRA &amp; Health Canada Safety Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-2.5">
                {product.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-piggie-100 bg-piggie-50/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-piggie-950">
                          {rev.author}
                        </span>
                        <span className="rounded-full bg-piggie-100 px-2 py-0.5 text-[9px] font-semibold text-piggie-800">
                          Editorial Note
                        </span>
                      </div>
                      <span className="text-[10px] text-piggie-600">
                        {rev.date}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-piggie-800">
                      “{rev.comment}”
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversion Trust & Policy Micro-Banner */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-piggie-100 bg-white px-3 py-2 text-[11px] text-piggie-700">
            <button
              type="button"
              onClick={() => onOpenLegal('shipping')}
              className="flex items-center gap-1.5 hover:text-piggie-950 hover:underline"
            >
              <Truck className="h-3.5 w-3.5 text-piggie-600" />
              <span>U.S. Shipping ($65+ Free) • 30-Day Returns</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('safety')}
              className="flex items-center gap-1.5 hover:text-piggie-950 hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-piggie-600" />
              <span>Safety &amp; Policies</span>
            </button>
          </div>
        </div>

        {/* Sticky One-Handed Thumb-Zone Conversion Footer (Zero 375px Wrapping!) */}
        <div className="border-t border-piggie-100 bg-white/95 px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] md:rounded-b-3xl md:px-5 md:pb-4">
          {/* Projected Free-Shipping Threshold Progress Line + Mobile Bag Shortcut */}
          {(isPurchasable || bagCount > 0) && (
            <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
              {isPurchasable ? (
                <span className="flex min-w-0 items-center gap-1.5 font-medium">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-piggie-600" />
                  {bagSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <strong className="truncate text-emerald-700">
                      Free U.S. Shipping unlocked
                    </strong>
                  ) : remainingAfterAdd === 0 ? (
                    <strong className="truncate text-emerald-700">
                      Unlocks Free U.S. Express Shipping!
                    </strong>
                  ) : (
                    <span className="truncate text-piggie-700">
                      <strong className="tabular-nums text-piggie-950">
                        ${remainingAfterAdd.toFixed(2)}
                      </strong>{' '}
                      away from Free Shipping after adding
                    </span>
                  )}
                </span>
              ) : (
                <span className="truncate text-piggie-600">
                  Your bag is ready for checkout
                </span>
              )}

              {bagCount > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBag?.();
                  }}
                  aria-label={`View bag and checkout (${bagCount} items)`}
                  className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-full border border-piggie-300 bg-piggie-100 px-2.5 text-[11px] font-extrabold text-piggie-950 transition active:scale-95 sm:hidden"
                >
                  <ShoppingBag className="h-3 w-3 text-piggie-700" />
                  <span className="tabular-nums">Bag ({bagCount}) →</span>
                </button>
              ) : (
                isPurchasable && (
                  <span className="shrink-0 font-bold tabular-nums text-piggie-600">
                    {Math.min(
                      100,
                      Math.round(
                        (projectedSubtotal / FREE_SHIPPING_THRESHOLD) * 100
                      )
                    )}
                    %
                  </span>
                )
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* Quantity Stepper (Apple HIG 44px Capsule, 36px Buttons) */}
            <div className="flex h-11 shrink-0 items-center rounded-full border border-piggie-200 bg-piggie-50 px-1">
              <button
                type="button"
                disabled={!isPurchasable}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-piggie-800 hover:bg-white active:scale-95 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center text-xs font-bold tabular-nums text-piggie-950">
                {quantity}
              </span>
              <button
                type="button"
                disabled={!isPurchasable}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-piggie-800 hover:bg-white active:scale-95 disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* Primary Add to Bag Button (Full 48px Height, Never Wraps on 375px!) */}
            <button
              type="button"
              disabled={!isPurchasable}
              onClick={handleAdd}
              className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-xs font-bold text-white shadow-lg transition sm:text-sm active:scale-98 ${
                !product.manufacturerVerified
                  ? 'cursor-not-allowed bg-amber-800/85'
                  : !isPurchasable
                  ? 'cursor-not-allowed bg-neutral-400'
                  : addedFeedback
                  ? 'bg-emerald-600'
                  : 'btn-luxury-sheen bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 hover:from-piggie-900 hover:to-piggie-800'
              }`}
            >
              {product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED' ? (
                <>
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">UNVERIFIED — Purchase Locked</span>
                </>
              ) : product.availabilityState === 'VERIFIED_OUT_OF_STOCK' ||
                !isPurchasable ? (
                <span className="truncate">Verified INCI • Out of Stock</span>
              ) : addedFeedback ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/60"
                    style={{ backgroundColor: selectedShade.hex }}
                  />
                  <span className="tabular-nums">
                    Add to Bag • ${(product.price * quantity).toFixed(2)}
                  </span>
                </>
              )}
            </button>

            {/* Desktop Side-by-Side View Bag Button */}
            {bagCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBag?.();
                }}
                aria-label={`View bag and checkout (${bagCount} items)`}
                className="hidden h-12 shrink-0 items-center gap-1.5 rounded-full border border-piggie-300 bg-piggie-100 px-3.5 text-xs font-extrabold text-piggie-950 shadow-sm transition hover:bg-piggie-200 active:scale-95 sm:flex"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-piggie-700" />
                <span className="tabular-nums">Bag ({bagCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
