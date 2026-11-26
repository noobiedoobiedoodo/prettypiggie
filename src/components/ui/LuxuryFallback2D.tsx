'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Box,
  Check,
  Lock,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  BOUTIQUE_ZONES,
  CATALOG_RECONCILIATION,
  sortProductsForMerchandising,
} from '@/data/boutiqueData';
import {
  BoutiqueProduct,
  BoutiqueZoneId,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';

interface LuxuryFallback2DProps {
  products: BoutiqueProduct[];
  activeZone: BoutiqueZoneId;
  bagSubtotal: number;
  onSelectZone: (zoneId: BoutiqueZoneId) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onQuickAddToBag: (product: BoutiqueProduct, shade: ProductShade) => void;
  onOpenBag: () => void;
  onSwitchTo3D: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
  supportsWebGL: boolean;
}

type AvailabilityFilter = 'all' | 'ready' | 'oos' | 'locked';
type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'shades';

const FREE_SHIPPING_THRESHOLD = 65;

const CATEGORY_FILTERS = [
  'All',
  'Eye Couture',
  'Blush & Glow',
  'Complexion',
  'Artistry Brushes',
  'Skincare & Body',
  'Lipstick',
  'Lip Gloss',
] as const;

function isLightHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
}

export function LuxuryFallback2D({
  products,
  activeZone,
  bagSubtotal,
  onSelectZone,
  onSelectProduct,
  onQuickAddToBag,
  onOpenBag,
  onSwitchTo3D,
  onOpenLegal,
  supportsWebGL,
}: LuxuryFallback2DProps) {
  const [cardShades, setCardShades] = useState<Record<string, ProductShade>>(
    {}
  );
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [quickToast, setQuickToast] = useState<{
    title: string;
    projectedSubtotal: number;
  } | null>(null);

  const currentZone =
    BOUTIQUE_ZONES.find((z) => z.id === activeZone) ?? BOUTIQUE_ZONES[0];

  const zoneScopedProducts = useMemo(
    () =>
      activeZone === 'rotunda'
        ? products
        : products.filter((p) => p.zoneId === activeZone),
    [products, activeZone]
  );

  const displayedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = zoneScopedProducts.filter((p) => {
      if (
        availabilityFilter === 'ready' &&
        p.availabilityState !== 'VERIFIED_IN_STOCK'
      ) {
        return false;
      }
      if (
        availabilityFilter === 'oos' &&
        p.availabilityState !== 'VERIFIED_OUT_OF_STOCK'
      ) {
        return false;
      }
      if (
        availabilityFilter === 'locked' &&
        p.availabilityState !== 'UNVERIFIED_PURCHASE_LOCKED'
      ) {
        return false;
      }
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shades.some((s) => s.name.toLowerCase().includes(q))
      );
    });

    if (sortMode === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortMode === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    if (sortMode === 'shades') {
      return [...filtered].sort((a, b) => b.shades.length - a.shades.length);
    }
    return sortProductsForMerchandising(filtered);
  }, [zoneScopedProducts, availabilityFilter, selectedCategory, searchQuery, sortMode]);

  const readyProducts = useMemo(
    () =>
      displayedProducts.filter(
        (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
      ),
    [displayedProducts]
  );
  const nonReadyProducts = useMemo(
    () =>
      displayedProducts.filter(
        (p) => p.availabilityState !== 'VERIFIED_IN_STOCK'
      ),
    [displayedProducts]
  );

  const shouldSplitVault =
    availabilityFilter === 'all' &&
    sortMode === 'featured' &&
    readyProducts.length > 0 &&
    nonReadyProducts.length > 0;

  const triggerQuickAdd = (product: BoutiqueProduct, shade: ProductShade) => {
    if (!product.canPurchase) return;
    onQuickAddToBag(product, shade);
    setJustAddedId(product.id);
    setQuickToast({
      title: product.title,
      projectedSubtotal: bagSubtotal + product.price,
    });
    setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr));
    }, 1500);
    setTimeout(() => {
      setQuickToast((curr) => (curr?.title === product.title ? null : curr));
    }, 3600);
  };

  const renderProductCard = (product: BoutiqueProduct) => {
    const activeShade = cardShades[product.id] ?? product.shades[0];
    const isAdded = justAddedId === product.id;
    const isLocked = product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED';
    const isOos = product.availabilityState === 'VERIFIED_OUT_OF_STOCK';

    const topLeftBadge = isLocked
      ? 'UNVERIFIED • Purchase Locked'
      : isOos
      ? 'Verified • Out of Stock'
      : product.shades.length > 1
      ? `${product.shades.length} Shades`
      : product.isBestseller
      ? 'Bestseller'
      : product.isNewArrival
      ? 'New Drop'
      : null;

    return (
      <div
        key={product.id}
        className="group flex flex-col justify-between rounded-2xl border border-piggie-100 bg-white p-3 shadow-sm transition duration-300 hover:border-piggie-200 hover:shadow-card-lift sm:rounded-3xl sm:p-4"
      >
        <div>
          {/* Gallery Pedestal Product Stage */}
          <div className="relative overflow-hidden rounded-xl border border-piggie-100/80 bg-gradient-to-b from-[#FFF9FB] via-white to-[#FCECF2] sm:rounded-2xl">
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              aria-label={`Inspect ${product.title} on 3D stage`}
              className="flex aspect-square w-full cursor-pointer items-center justify-center p-3 sm:h-52 sm:aspect-auto sm:p-4"
            >
              {product.primaryImage ? (
                <img
                  src={product.primaryImage}
                  alt={product.title}
                  loading="lazy"
                  className="h-[78%] w-[78%] object-contain drop-shadow-[0_12px_18px_rgba(74,24,41,0.12)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: activeShade.hex }}
                />
              )}
            </button>

            {/* Single Clean Top-Left Status Badge */}
            {topLeftBadge && (
              <span
                className={`pointer-events-none absolute left-2 top-2 max-w-[72%] truncate rounded-full px-2 py-0.5 text-[9px] font-bold sm:left-3 sm:top-3 sm:px-2.5 sm:text-[10px] ${
                  isLocked
                    ? 'bg-amber-100/95 text-amber-950 ring-1 ring-amber-300'
                    : isOos
                    ? 'bg-rose-600 text-white'
                    : 'bg-piggie-950/90 text-white'
                }`}
              >
                {topLeftBadge}
              </span>
            )}

            {/* Compact Top-Right 3D Stage Corner Trigger */}
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              aria-label={`Try ${product.title} in 3D`}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-piggie-200/90 bg-white/95 px-2 py-1 text-[10px] font-bold text-piggie-900 shadow-sm backdrop-blur-sm transition hover:bg-piggie-950 hover:text-white sm:right-3 sm:top-3"
            >
              <Box className="h-3 w-3" />
              <span>3D</span>
            </button>
          </div>

          {/* Editorial Metadata, Title & Tabular Price */}
          <div className="mt-2.5 sm:mt-3.5">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-piggie-600 sm:text-[10px]">
              {product.category}
            </span>
            <div className="mt-0.5 flex items-start justify-between gap-1.5">
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="line-clamp-2 text-left font-serif text-sm font-bold leading-snug text-piggie-950 transition hover:text-piggie-700 sm:text-base"
              >
                {product.title}
              </button>
              <span className="shrink-0 text-sm font-extrabold tabular-nums text-piggie-950 sm:text-base">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {/* Honest Luxury Metadata Row (Zero Fake Star Ratings!) */}
            <p className="mt-0.5 truncate text-[10px] font-medium text-piggie-700 sm:text-[11px]">
              {activeShade.finish} • {product.originLabel}
            </p>
          </div>

          {/* Tactile Shade Swatches (Multi-shade only) or Uniform Signature Formula Caption */}
          <div className="mt-2 min-h-[38px] sm:mt-2.5 sm:min-h-[44px]">
            {product.shades.length > 1 ? (
              <>
                <div className="truncate text-[10px] font-medium text-piggie-700 sm:text-[11px]">
                  <strong className="text-piggie-950">{activeShade.name}</strong>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                  {product.shades.slice(0, 5).map((shade) => {
                    const isSelected = shade.id === activeShade.id;
                    const darkCheck = isLightHex(shade.hex);
                    return (
                      <button
                        key={shade.id}
                        type="button"
                        onClick={() =>
                          setCardShades((prev) => ({
                            ...prev,
                            [product.id]: shade,
                          }))
                        }
                        title={shade.name}
                        aria-label={`Select shade ${shade.name}`}
                        aria-pressed={isSelected}
                        className={`flex h-5 w-5 items-center justify-center rounded-full transition sm:h-6 sm:w-6 ${
                          isSelected
                            ? 'scale-110 ring-2 ring-piggie-950 ring-offset-1'
                            : 'ring-1 ring-black/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: shade.hex }}
                      >
                        {isSelected && (
                          <Check
                            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                              darkCheck
                                ? 'text-piggie-950'
                                : 'text-white drop-shadow'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                  {product.shades.length > 5 && (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="rounded-full bg-piggie-100 px-1.5 py-0.5 text-[9px] font-bold text-piggie-800 hover:bg-piggie-200 sm:text-[10px]"
                    >
                      +{product.shades.length - 5}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="line-clamp-2 text-[10px] leading-snug text-piggie-600 sm:text-[11px]">
                {product.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Full-Width Thumb-Friendly Primary Conversion CTA */}
        <div className="mt-3">
          <button
            type="button"
            disabled={!product.canPurchase}
            onClick={() => triggerQuickAdd(product, activeShade)}
            className={`btn-luxury-sheen flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white shadow-sm transition active:scale-98 sm:min-h-[42px] sm:text-xs ${
              isLocked
                ? 'cursor-not-allowed bg-amber-800/80'
                : isOos || !product.canPurchase
                ? 'cursor-not-allowed bg-neutral-400'
                : isAdded
                ? 'bg-emerald-600'
                : 'bg-piggie-950 hover:bg-piggie-800'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="h-3 w-3 shrink-0" />
                <span className="truncate">UNVERIFIED — Locked</span>
              </>
            ) : isOos ? (
              <span>Verified • Out of Stock</span>
            ) : isAdded ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Added!</span>
              </>
            ) : (
              <span className="tabular-nums">
                Add to Bag • ${product.price.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="piggie-scrollbar h-full w-full overflow-y-auto bg-gradient-to-b from-piggie-100 via-piggie-50 to-white pb-24 pt-[66px] text-piggie-950 md:pt-20">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 md:px-8">
        {/* Compact Luxury Editorial Hero Banner (Keeps Buyable Products Above the Fold on Mobile & Desktop) */}
        <div className="relative overflow-hidden rounded-2xl border border-piggie-200 bg-piggie-950 text-white shadow-xl sm:rounded-3xl">
          {/* Atmospheric Background Image on Mobile */}
          <img
            src={currentZone.referenceImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 md:hidden"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-piggie-950 via-piggie-950/90 to-piggie-950/55 md:hidden" />

          <div className="relative grid grid-cols-1 md:grid-cols-12">
            <div className="flex flex-col justify-center px-4 py-4 sm:px-6 sm:py-5 md:col-span-8 md:px-8 md:py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-piggie-100 backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-rosegold" />
                  {currentZone.badge}
                </span>
                {supportsWebGL && (
                  <button
                    type="button"
                    onClick={onSwitchTo3D}
                    className="rounded-full border border-rosegold/70 bg-rosegold/20 px-2.5 py-0.5 text-[10px] font-bold text-rosegold-light transition hover:bg-rosegold/30"
                  >
                    Enter 3D Showroom →
                  </button>
                )}
              </div>

              <h1 className="mt-2 font-serif text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                {currentZone.name}
              </h1>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-rosegold-light sm:text-sm">
                {currentZone.subtitle} • Free U.S. Express Shipping on orders
                $65+
              </p>

              {/* Reconciled 3-State Transparency Pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-200 ring-1 ring-emerald-400/40">
                  {CATALOG_RECONCILIATION.verifiedInStock} Verified In Stock
                </span>
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-rose-200 ring-1 ring-rose-400/40">
                  {CATALOG_RECONCILIATION.verifiedOutOfStock} Verified Out of
                  Stock
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-amber-200 ring-1 ring-amber-400/40">
                  {CATALOG_RECONCILIATION.unverifiedPurchaseLocked} Unverified
                  Locked
                </span>
              </div>

              {/* Boutique Department Pills (Single Source of Truth in 2D Mode — No Duplicate Bottom Bar!) */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {BOUTIQUE_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      activeZone === zone.id
                        ? 'bg-white text-piggie-950 shadow'
                        : 'bg-white/15 text-piggie-100 hover:bg-white/25'
                    }`}
                  >
                    {zone.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Boutique Interior Accent Panel */}
            <div className="relative hidden md:col-span-4 md:block">
              <img
                src={currentZone.referenceImage}
                alt={currentZone.name}
                className="h-full max-h-[220px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-piggie-950 via-piggie-950/30 to-transparent" />
            </div>
          </div>
        </div>

        {/* Sticky Inline 2D Merchandising, Search, Availability & Category Control Bar */}
        <div className="sticky top-0 z-20 -mx-3 mt-3 border-b border-piggie-200/80 bg-piggie-50/95 px-3 py-2.5 backdrop-blur-xl sm:mx-0 sm:mt-4 sm:rounded-2xl sm:border sm:px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            {/* Availability Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setAvailabilityFilter('ready')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  availabilityFilter === 'ready'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Ready to Ship ({CATALOG_RECONCILIATION.verifiedInStock})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  availabilityFilter === 'all'
                    ? 'bg-piggie-950 text-white shadow-sm'
                    : 'bg-white text-piggie-800 ring-1 ring-piggie-200 hover:bg-piggie-100'
                }`}
              >
                All ({CATALOG_RECONCILIATION.totalProducts})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('oos')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  availabilityFilter === 'oos'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-white text-piggie-800 ring-1 ring-piggie-200 hover:bg-rose-50'
                }`}
              >
                Sold Out ({CATALOG_RECONCILIATION.verifiedOutOfStock})
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('locked')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  availabilityFilter === 'locked'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-white text-piggie-800 ring-1 ring-piggie-200 hover:bg-amber-50'
                }`}
              >
                Preview Vault ({CATALOG_RECONCILIATION.unverifiedPurchaseLocked})
              </button>
            </div>

            {/* Inline Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3 py-1.5 md:w-56 md:flex-none">
                <Search className="h-3.5 w-3.5 shrink-0 text-piggie-600" />
                <input
                  type="search"
                  aria-label="Filter 2D catalog products or shades"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search makeup, shades..."
                  className="w-full bg-transparent text-base text-piggie-950 placeholder:text-piggie-600/65 focus:outline-none sm:text-xs"
                />
              </div>

              <label className="relative flex shrink-0 items-center">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3 w-3 text-piggie-600" />
                <select
                  aria-label="Sort products"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-full border border-piggie-200 bg-white py-1.5 pl-7 pr-3 text-[11px] font-bold text-piggie-900 focus:border-piggie-600 focus:outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low–High</option>
                  <option value="price-desc">Price: High–Low</option>
                  <option value="shades">Most Shades</option>
                </select>
              </label>
            </div>
          </div>

          {/* Inline Category Pills */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition sm:text-[11px] ${
                  selectedCategory === cat
                    ? 'bg-piggie-800 text-white shadow-sm'
                    : 'bg-white text-piggie-700 ring-1 ring-piggie-200/80 hover:bg-piggie-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid (Merchandised Buyable-First + Clear Editorial Divider Before Preview Vault) */}
        {displayedProducts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-piggie-200 bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-lg font-bold text-piggie-950">
              No matching beauty items in this view
            </p>
            <p className="mt-1 text-xs text-piggie-700">
              Reset your filter or switch to All Departments to explore all 52
              ready-to-ship favorites.
            </p>
            <button
              type="button"
              onClick={() => {
                setAvailabilityFilter('ready');
                setSelectedCategory('All');
                setSearchQuery('');
                onSelectZone('rotunda');
              }}
              className="mt-4 rounded-full bg-piggie-950 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-piggie-800"
            >
              Show All 52 Ready-to-Ship Favorites
            </button>
          </div>
        ) : shouldSplitVault ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-3">
              {readyProducts.map(renderProductCard)}
            </div>

            {/* Editorial Section Divider Separating Buyable Collection From Preview Vault */}
            <div className="mt-10 flex flex-col items-start justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-amber-950 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-serif text-base font-bold text-amber-950">
                  3D Virtual Preview Vault &amp; Out-of-Stock Archive (
                  {nonReadyProducts.length})
                </h2>
                <p className="text-[11px] text-amber-900">
                  Explore shades on our 360° 3D stage. Unverified items remain
                  purchase-locked pending authoritative manufacturer INCI
                  documentation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('ready')}
                className="shrink-0 rounded-full bg-piggie-950 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-piggie-800"
              >
                Filter Ready to Ship Only ({CATALOG_RECONCILIATION.verifiedInStock})
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {nonReadyProducts.map(renderProductCard)}
            </div>
          </>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-3">
            {displayedProducts.map(renderProductCard)}
          </div>
        )}

        {/* Mandatory Legal, Regulatory & Accessibility Footer */}
        <footer className="mt-12 rounded-3xl border border-piggie-200/80 bg-white p-6 text-xs text-piggie-700 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <img
                src="/brand/prettypiggie-logo.png"
                alt="Pretty Piggie Makeup"
                className="h-10 w-10 rounded-full border border-piggie-200 bg-white object-contain p-0.5"
              />
              <div>
                <strong className="font-serif text-sm text-piggie-950">
                  Pretty Piggie Makeup Boutique
                </strong>
                <p className="text-[11px] text-piggie-600">
                  Ingredient Evidence Governance (
                  {CATALOG_RECONCILIATION.verifiedInStock} Complete Listing In
                  Stock • {CATALOG_RECONCILIATION.verifiedOutOfStock} Complete
                  Listing Out of Stock •{' '}
                  {CATALOG_RECONCILIATION.unverifiedPurchaseLocked} Unverified
                  Locked • Authoritative Manufacturer Docs Pending) • U.S.-Only
                  Launch Scope
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-semibold text-piggie-800">
              <button
                type="button"
                onClick={() => onOpenLegal('shipping')}
                className="hover:text-piggie-950 hover:underline"
              >
                Shipping &amp; 30-Day Returns
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('safety')}
                className="flex items-center gap-1 hover:text-piggie-950 hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-piggie-600" />
                FDA / MoCRA Cosmetic Safety
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-piggie-950 hover:underline"
              >
                Privacy Policy (CCPA/PIPEDA)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="hover:text-piggie-950 hover:underline"
              >
                Terms of Sale
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('accessibility')}
                className="hover:text-piggie-950 hover:underline"
              >
                Accessibility (WCAG 2.1 AA)
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Post-Quick-Add Free-Shipping Progress Toast */}
      {quickToast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-toast-pop fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-rosegold/60 bg-piggie-950/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">
              Added {quickToast.title}
            </p>
            <p className="text-[10px] text-rosegold-light tabular-nums">
              {quickToast.projectedSubtotal >= FREE_SHIPPING_THRESHOLD
                ? 'Free U.S. Express Shipping unlocked!'
                : `$${(FREE_SHIPPING_THRESHOLD - quickToast.projectedSubtotal).toFixed(2)} away from Free Express Shipping`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuickToast(null);
              onOpenBag();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold text-piggie-950 shadow transition hover:bg-piggie-100"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-piggie-700" />
            <span>View Bag →</span>
          </button>
        </div>
      )}
    </div>
  );
}
