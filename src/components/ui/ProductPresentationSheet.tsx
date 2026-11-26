'use client';

import React, { useMemo, useState } from 'react';
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

  const isPurchasable = isProductPurchasable(product, selectedShade);

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
      className={`fixed inset-0 z-30 flex flex-col justify-between md:flex-row md:items-stretch md:justify-end ${
        is2DMode
          ? 'pointer-events-auto bg-piggie-950/50 p-3 backdrop-blur-sm md:p-0'
          : 'pointer-events-none'
      }`}
    >
      {/* Top Floating Back Button & 360° Spin Indicator over the 3D Stage */}
      <div
        className={`pointer-events-auto flex items-center justify-between px-4 pt-16 md:fixed md:left-6 md:top-20 md:w-auto md:gap-4 md:p-0 ${
          is2DMode ? 'px-1 pt-12 md:pt-0' : ''
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full border border-white/60 bg-piggie-950/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-piggie-900 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-piggie-200" />
          <span>{is2DMode ? 'Back to Catalogue' : 'Back to Boutique'}</span>
        </button>

        {!is2DMode && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-[11px] font-semibold text-piggie-900 shadow-sm backdrop-blur-md">
            <Rotate3d className="h-3.5 w-3.5 text-piggie-600" />
            <span>Drag to Spin 360°</span>
          </div>
        )}
      </div>

      {/* Mobile-First Bottom Sheet / Desktop Right Editorial Glass Drawer */}
      <div
        className={`animate-sheet-up pointer-events-auto flex flex-col justify-between rounded-t-3xl border-t border-white/80 bg-white/95 text-piggie-950 shadow-luxury-glass backdrop-blur-xl transition-all duration-300 md:m-5 md:mt-20 md:w-[460px] md:rounded-3xl md:border ${
          is2DMode
            ? 'mx-auto my-auto max-h-[86dvh] w-full max-w-lg rounded-3xl border'
            : mobileSheetExpanded
            ? 'max-h-[85dvh]'
            : 'max-h-[60dvh] md:max-h-[calc(100dvh-6.5rem)]'
        }`}
      >
        {/* Mobile Pull Handle to Expand / Collapse Sheet */}
        {!is2DMode && (
          <button
            type="button"
            onClick={() => setMobileSheetExpanded((prev) => !prev)}
            aria-label="Toggle product details height"
            className="flex w-full flex-col items-center pt-2.5 pb-1 md:hidden"
          >
            <span className="h-1.5 w-11 rounded-full bg-piggie-200" />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-piggie-600">
              {mobileSheetExpanded
                ? 'Tap to View 3D Stage'
                : 'Tap for Full Details & INCI'}
            </span>
          </button>
        )}

        {/* Scrollable Content Body */}
        <div className="piggie-scrollbar overflow-y-auto px-5 pt-2.5 pb-4 md:px-6 md:pt-5">
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

          {/* Compact Luxury Editorial Header (Thumbnail + Title + Price + Availability Above the Fold) */}
          <div className="flex items-start gap-3">
            {activeMockupImage && (
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-piggie-100 bg-gradient-to-b from-white to-piggie-50/70 p-1 shadow-sm">
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
                    className="inline-flex items-center gap-1 rounded-full border border-piggie-200 bg-piggie-50 px-2 py-0.5 text-[9px] font-bold text-piggie-800 transition hover:bg-piggie-100"
                  >
                    <Package className="h-2.5 w-2.5" />
                    <span>{showBoxMockup ? 'Product' : 'Box'}</span>
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

            <div className="shrink-0 text-right">
              <div className="font-serif text-xl font-bold tabular-nums text-piggie-950">
                ${product.price.toFixed(2)}
              </div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-piggie-600">
                {product.manufacturerCertifiedDocOnFile
                  ? 'Certified INCI'
                  : product.manufacturerVerified
                  ? 'Listing INCI'
                  : 'Preview Only'}
              </div>
            </div>
          </div>

          <p className="mt-2 select-text font-mono text-[10px] text-piggie-600">
            SKU: {selectedShade.sku || product.sku} • U.S. Domestic Shipping
            Only (50 States &amp; D.C.)
          </p>

          {/* Shade & Variant Selector (Smart 1-Shade Collapse vs. 36px Multi-Shade Swatch Bar) */}
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
              <div className="flex items-center justify-between text-xs">
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

              {/* Tactile 36px Shade Swatches with Luminance-Aware Checkmark */}
              <div className="piggie-scrollbar mt-2.5 flex max-h-28 flex-wrap items-center gap-2 overflow-y-auto p-1">
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
                      className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-transform ${
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
                    className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-white p-2 text-left shadow-sm transition hover:border-piggie-300 hover:shadow active:scale-98"
                  >
                    {alt.primaryImage ? (
                      <img
                        src={alt.primaryImage}
                        alt={alt.title}
                        className="h-10 w-10 shrink-0 rounded-lg bg-piggie-50/50 object-contain p-0.5"
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

          {/* Editorial Information Tabs */}
          <div
            role="tablist"
            aria-label="Product information tabs"
            className="mt-3.5 flex border-b border-piggie-100 text-xs font-semibold"
          >
            {(
              [
                { id: 'overview', label: 'Details & Benefits' },
                { id: 'ingredients', label: 'INCI & Safety (EN/FR)' },
                { id: 'reviews', label: 'Boutique Note' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-3 py-2 transition ${
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

        {/* Sticky One-Handed Thumb-Zone Conversion Footer */}
        <div className="border-t border-piggie-100 bg-white/95 px-5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-b-3xl md:pb-4">
          {/* Projected Free-Shipping Threshold Progress Line */}
          {isPurchasable && (
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck className="h-3.5 w-3.5 shrink-0 text-piggie-600" />
                {bagSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <strong className="text-emerald-700">
                    Free U.S. Express Shipping unlocked on your bag
                  </strong>
                ) : remainingAfterAdd === 0 ? (
                  <strong className="text-emerald-700">
                    Adding this unlocks Free U.S. Express Shipping!
                  </strong>
                ) : (
                  <span className="text-piggie-700">
                    <strong className="tabular-nums text-piggie-950">
                      ${remainingAfterAdd.toFixed(2)}
                    </strong>{' '}
                    away from Free U.S. Shipping after adding
                  </span>
                )}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-piggie-600">
                {Math.min(
                  100,
                  Math.round((projectedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
                )}
                %
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* Quantity Stepper */}
            <div className="flex items-center rounded-full border border-piggie-200 bg-piggie-50 px-1.5 py-1">
              <button
                type="button"
                disabled={!isPurchasable}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-piggie-800 hover:bg-white disabled:opacity-40"
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
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-piggie-800 hover:bg-white disabled:opacity-40"
              >
                +
              </button>
            </div>

            {/* Primary Add to Bag Button (Strictly Locked if !product.manufacturerVerified) */}
            <button
              type="button"
              disabled={!isPurchasable}
              onClick={handleAdd}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3.5 text-xs font-bold text-white shadow-lg transition sm:text-sm active:scale-98 ${
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
                  <span>UNVERIFIED — Purchase Locked</span>
                </>
              ) : product.availabilityState === 'VERIFIED_OUT_OF_STOCK' ||
                !isPurchasable ? (
                <span>Verified INCI • Out of Stock</span>
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

            {/* Thumb-Zone View Bag & Checkout Button (Appears whenever Bag has items) */}
            {bagCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBag?.();
                }}
                aria-label={`View bag and checkout (${bagCount} items)`}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-piggie-300 bg-piggie-100 px-3.5 text-xs font-extrabold text-piggie-950 shadow-sm transition hover:bg-piggie-200 active:scale-95"
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
