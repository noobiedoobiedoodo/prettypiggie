'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Lock,
  Rotate3d,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { isProductPurchasable } from '@/lib/purchaseGuard';
import {
  BoutiqueProduct,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';

interface ProductPresentationSheetProps {
  product: BoutiqueProduct;
  selectedShade: ProductShade;
  bagCount: number;
  onSelectShade: (shade: ProductShade) => void;
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
  bagCount,
  onSelectShade,
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

  const handleAdd = () => {
    if (!isPurchasable) return;
    onAddToBag(product, selectedShade, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const activeMockupImage =
    showBoxMockup && product.boxImage ? product.boxImage : product.primaryImage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} presentation details`}
      className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between md:flex-row md:items-stretch md:justify-end"
    >
      {/* Top Floating Back Button & 360° Spin Indicator over the 3D Stage */}
      <div className="pointer-events-auto flex items-center justify-between px-4 pt-16 md:fixed md:left-6 md:top-20 md:w-auto md:gap-4 md:p-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full border border-white/60 bg-piggie-950/85 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-piggie-900 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-piggie-200" />
          <span>Back to Boutique</span>
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
        className={`pointer-events-auto flex flex-col justify-between rounded-t-3xl border-t border-white/80 bg-white/95 text-piggie-950 shadow-luxury-glass backdrop-blur-xl transition-all duration-300 md:m-5 md:mt-20 md:w-[460px] md:rounded-3xl md:border ${
          is2DMode
            ? 'mx-auto my-auto max-h-[88vh] w-full max-w-lg rounded-3xl border'
            : mobileSheetExpanded
            ? 'max-h-[84vh]'
            : 'max-h-[56vh] md:max-h-[calc(100vh-6.5rem)]'
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
                : 'Tap for Full Details & Mockup'}
            </span>
          </button>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 pt-2 pb-4 md:px-6 md:pt-5">
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

          {/* Distinct Banner When Product INCI Is Verified But Inventory Is Out of Stock */}
          {product.availabilityState === 'VERIFIED_OUT_OF_STOCK' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-snug text-rose-950">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <div>
                <strong className="block font-bold uppercase tracking-wider text-rose-900">
                  VERIFIED INCI — Temporarily Out of Stock
                </strong>
                <span className="mt-0.5 block text-rose-800">
                  Complete manufacturer INCI documentation is verified on file (
                  <code>VERIFIED_COMPLETE</code>), but this item is currently
                  out of stock and unavailable for checkout.
                </span>
              </div>
            </div>
          )}

          {/* First-Party Proxied Pretty Piggie Product & Box Photography Banner */}
          {activeMockupImage && (
            <div className="relative mb-3.5 flex items-center gap-3.5 rounded-2xl border border-piggie-100 bg-gradient-to-r from-piggie-50 via-white to-piggie-50 p-2.5 shadow-sm">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-piggie-100 bg-white">
                <img
                  src={activeMockupImage}
                  alt={product.title}
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300">
                      <Lock className="h-3 w-3" />
                      UNVERIFIED • Purchase Locked
                    </span>
                  ) : product.availabilityState === 'VERIFIED_OUT_OF_STOCK' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 ring-1 ring-rose-200">
                      <BadgeCheck className="h-3 w-3" />
                      Verified • Out of Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      <BadgeCheck className="h-3 w-3" />
                      Verified • In Stock
                    </span>
                  )}
                  <span className="rounded-full bg-piggie-100 px-2 py-0.5 text-[10px] font-semibold text-piggie-800">
                    {product.originLabel}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-piggie-700">
                  SKU: {selectedShade.sku || product.sku} • U.S. Shipping Only
                </p>
                {product.boxImage && (
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBoxMockup(false)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                        !showBoxMockup
                          ? 'bg-piggie-950 text-white'
                          : 'bg-piggie-100 text-piggie-700 hover:bg-piggie-200'
                      }`}
                    >
                      Product View
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBoxMockup(true)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                        showBoxMockup
                          ? 'bg-piggie-950 text-white'
                          : 'bg-piggie-100 text-piggie-700 hover:bg-piggie-200'
                      }`}
                    >
                      Packaging Box
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Badge & Rating */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-piggie-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-piggie-900 shadow-sm">
                <img
                  src="/brand/prettypiggie-logo.png"
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                Pretty Piggie
              </span>
              <span className="rounded-full bg-piggie-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-piggie-700">
                {product.category}
              </span>
              {product.badge && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    !product.manufacturerVerified
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-gradient-to-r from-piggie-600 to-piggie-500 text-white'
                  }`}
                >
                  {product.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-piggie-800">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-piggie-600">Boutique Pick</span>
            </div>
          </div>

          {/* Title, Subtitle & Price */}
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold leading-tight text-piggie-950 md:text-2xl">
                {product.title}
              </h2>
              <p className="mt-0.5 text-xs text-piggie-700">
                {product.subtitle}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-piggie-950">
                ${product.price.toFixed(2)}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-piggie-600">
                {product.manufacturerVerified
                  ? 'Verified INCI'
                  : 'Preview Only'}
              </div>
            </div>
          </div>

          {/* Shade & Variant Selector */}
          <div className="mt-3.5 rounded-2xl border border-piggie-100 bg-piggie-50/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-piggie-700">
                  Shade ({product.shades.length}):{' '}
                </span>
                <span className="font-bold text-piggie-950">
                  {selectedShade.name}
                </span>
              </div>
              <span className="rounded-full border border-piggie-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-piggie-700">
                {selectedShade.finish}
              </span>
            </div>

            {/* Thumb-Friendly Shade Swatches with Luminance-Aware Checkmark */}
            <div className="mt-2.5 flex max-h-28 flex-wrap items-center gap-2 overflow-y-auto p-1">
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
                    className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-transform ${
                      isSelected
                        ? 'scale-110 ring-2 ring-piggie-950 ring-offset-2'
                        : 'hover:scale-105 ring-1 ring-black/20'
                    }`}
                    style={{
                      backgroundColor: shade.hex,
                    }}
                  >
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 ${
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
                { id: 'reviews', label: 'Curator Note' },
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
                    Manufacturer INCI Record ({product.inciStatus} •{' '}
                    {product.originLabel})
                  </span>
                  <p className="mt-1 rounded-xl bg-piggie-50 p-3 font-mono text-[11px] leading-relaxed text-piggie-900">
                    {product.ingredients}
                  </p>
                </div>

                {/* Bilingual English & French FDA / MoCRA / Health Canada Safety Advisory */}
                <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/75 p-2.5 text-[11px] text-amber-950">
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
                        View Full FDA / MoCRA & Health Canada Safety Policy
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
                          Editorial Preview
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
              <span>Safety & Policies</span>
            </button>
          </div>
        </div>

        {/* Sticky One-Handed Thumb-Zone Conversion Footer */}
        <div className="border-t border-piggie-100 bg-white/95 px-5 py-3.5 pb-6 md:rounded-b-3xl md:pb-4">
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
              <span className="w-6 text-center text-xs font-bold text-piggie-950">
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
                  ? 'cursor-not-allowed bg-amber-800/80'
                  : !isPurchasable
                  ? 'cursor-not-allowed bg-neutral-400'
                  : addedFeedback
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 hover:from-piggie-900 hover:to-piggie-800'
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
                  <span>
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
                <span>Bag ({bagCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
