'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpDown,
  Box,
  Check,
  Lock,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
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
  bagCount: number;
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

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low–High' },
  { id: 'price-desc', label: 'Price: High–Low' },
  { id: 'shades', label: 'Most Shades' },
];

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
  bagCount,
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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [recentAddedTitle, setRecentAddedTitle] = useState<string | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileFilterOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobileFilterOpen]);

  const activeFilterCount =
    (availabilityFilter !== 'all' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (sortMode !== 'featured' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

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
    setRecentAddedTitle(product.title);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr));
    }, 1500);
    setTimeout(() => {
      setRecentAddedTitle((curr) => (curr === product.title ? null : curr));
    }, 2600);
  };

  const openMobileSearch = () => {
    setIsMobileFilterOpen(true);
    setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 120);
  };

  const renderProductCard = (product: BoutiqueProduct) => {
    const activeShade = cardShades[product.id] ?? product.shades[0];
    const isAdded = justAddedId === product.id;
    const isLocked = product.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED';
    const isOos = product.availabilityState === 'VERIFIED_OUT_OF_STOCK';

    const topLeftBadge = isLocked
      ? 'Preview Locked'
      : isOos
      ? 'Sold Out'
      : product.isBestseller
      ? 'Bestseller'
      : product.isNewArrival
      ? 'New Drop'
      : null;

    return (
      <div
        key={product.id}
        className="group flex flex-col justify-between rounded-2xl border border-piggie-100/90 bg-white p-2.5 shadow-sm transition duration-300 hover:border-piggie-200 hover:shadow-card-lift sm:rounded-3xl sm:p-4"
      >
        <div>
          {/* Pure-Porcelain Studio Packshot Pedestal (Zero White-Square Cutouts) */}
          <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-inset ring-piggie-100/75 sm:rounded-2xl">
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              aria-label={`Inspect ${product.title} on 3D stage`}
              className="flex aspect-square w-full cursor-pointer items-center justify-center p-2 sm:h-52 sm:aspect-auto sm:p-3"
            >
              {product.primaryImage ? (
                <img
                  src={product.primaryImage}
                  alt={product.title}
                  loading="lazy"
                  className="h-[88%] w-[88%] object-contain transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-full border-4 border-piggie-50 shadow-sm"
                  style={{ backgroundColor: activeShade.hex }}
                />
              )}
            </button>

            {/* Single Clean Top-Left Status Badge */}
            {topLeftBadge && (
              <span
                className={`pointer-events-none absolute left-2 top-2 max-w-[82%] truncate rounded-full px-2 py-0.5 text-[10px] font-bold sm:left-3 sm:top-3 sm:px-2.5 ${
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

            {/* Bottom-Right 3D Stage Corner Trigger (Zero Collision With Top-Left Badges) */}
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              aria-label={`Try ${product.title} in 3D`}
              className="absolute bottom-2 right-2 inline-flex min-h-[28px] items-center gap-1 rounded-full border border-piggie-200/90 bg-white/95 px-2 py-1 text-[10px] font-bold text-piggie-900 shadow-sm backdrop-blur-sm transition hover:bg-piggie-950 hover:text-white active:scale-95 sm:bottom-2.5 sm:right-2.5"
            >
              <Box className="h-3 w-3" />
              <span>3D</span>
            </button>
          </div>

          {/* Editorial Metadata, Title & Tabular Price */}
          <div className="mt-2.5 border-t border-piggie-100/60 pt-2 sm:mt-3 sm:pt-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-piggie-600">
              {product.category}
            </span>

            {/* Full-Width Mobile Title -> Side-by-Side Title + Price on Desktop */}
            <div className="mt-0.5 sm:flex sm:items-start sm:justify-between sm:gap-2">
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="line-clamp-2 min-h-[2.35rem] w-full text-left font-serif text-[13.5px] font-bold leading-snug text-piggie-950 transition hover:text-piggie-700 sm:min-h-0 sm:w-auto sm:text-base"
              >
                {product.title}
              </button>
              <span className="hidden shrink-0 text-base font-extrabold tabular-nums text-piggie-950 sm:inline">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {/* Mobile Price + Finish Row / Desktop Finish + Origin Line */}
            <div className="mt-1 flex items-baseline justify-between gap-1.5 sm:mt-0.5">
              <span className="text-sm font-extrabold tabular-nums text-piggie-950 sm:hidden">
                ${product.price.toFixed(2)}
              </span>
              <span className="truncate text-[11px] font-medium text-piggie-700">
                {activeShade.finish}
                <span className="hidden sm:inline"> • {product.originLabel}</span>
              </span>
            </div>
          </div>

          {/* Thumb-Friendly Single-Row Horizontal Swatch Strip (28px Orbs) */}
          <div className="mt-2 min-h-[48px] sm:mt-2.5">
            {product.shades.length > 1 ? (
              <>
                <div className="flex items-center justify-between gap-1 text-[11px] text-piggie-700">
                  <strong className="truncate text-piggie-950">
                    {activeShade.name}
                  </strong>
                  <span className="shrink-0 text-[10px] font-semibold text-piggie-600">
                    {product.shades.length} shades
                  </span>
                </div>
                <div className="mt-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-0.5 py-1 no-scrollbar">
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
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                          isSelected
                            ? 'scale-105 ring-2 ring-piggie-950 ring-offset-1'
                            : 'ring-1 ring-black/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: shade.hex }}
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
                  {product.shades.length > 5 && (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      aria-label={`View all ${product.shades.length} shades`}
                      className="flex h-7 shrink-0 items-center justify-center rounded-full bg-piggie-100 px-2 text-[10px] font-bold text-piggie-800 hover:bg-piggie-200"
                    >
                      +{product.shades.length - 5}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="line-clamp-2 text-[11px] leading-snug text-piggie-600">
                {product.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Full Apple HIG 44px Thumb-Friendly Primary Conversion CTA */}
        <div className="mt-2.5 sm:mt-3">
          <button
            type="button"
            disabled={!product.canPurchase}
            onClick={() => triggerQuickAdd(product, activeShade)}
            className={`btn-luxury-sheen flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-sm transition active:scale-98 ${
              isLocked
                ? 'cursor-not-allowed bg-amber-800/85'
                : isOos || !product.canPurchase
                ? 'cursor-not-allowed bg-neutral-400'
                : isAdded
                ? 'bg-emerald-600'
                : 'bg-piggie-950 hover:bg-piggie-800'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">UNVERIFIED — Locked</span>
              </>
            ) : isOos ? (
              <span className="truncate">Verified • Out of Stock</span>
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4 shrink-0" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Add to Bag</span>
                <span className="hidden tabular-nums sm:inline">
                  Add to Bag • ${product.price.toFixed(2)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const amountToFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - bagSubtotal
  );
  const freeShippingProgress = Math.min(
    100,
    (bagSubtotal / FREE_SHIPPING_THRESHOLD) * 100
  );

  return (
    <div
      className={`piggie-scrollbar h-full w-full overflow-y-auto overscroll-contain bg-gradient-to-b from-piggie-100 via-piggie-50 to-white pt-[var(--header-offset)] text-piggie-950 md:pt-20 ${
        bagCount > 0 ? 'pb-32 md:pb-24' : 'pb-16'
      }`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-6 md:px-8">
        {/* Compact Luxury Editorial Hero Banner (Ultra-Slim on Mobile so 2 Full Buyable Cards Appear Above Fold on 375x667!) */}
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-piggie-200 bg-piggie-950 text-white shadow-xl sm:mt-0 sm:rounded-3xl">
          {/* Atmospheric Background Image on Mobile */}
          <img
            src={currentZone.referenceImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 md:hidden"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-piggie-950 via-piggie-950/95 to-piggie-950/60 md:hidden" />

          <div className="relative grid grid-cols-1 md:grid-cols-12">
            <div className="flex flex-col justify-center px-3.5 py-3 sm:px-6 sm:py-5 md:col-span-8 md:px-8 md:py-6">
              {/* Desktop Badge Row */}
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
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
                <Link
                  href="/pretty-piggie"
                  className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-piggie-950 shadow-sm transition hover:bg-piggie-100"
                >
                  🐷 Create My Piggie →
                </Link>
              </div>

              {/* Mobile Compact Title + 3D Pill on One Line */}
              <div className="flex items-center justify-between gap-2 sm:mt-2">
                <h1 className="truncate font-serif text-lg font-bold leading-tight sm:text-2xl md:text-3xl">
                  {currentZone.name}
                </h1>
                {supportsWebGL && (
                  <button
                    type="button"
                    onClick={onSwitchTo3D}
                    className="inline-flex min-h-[32px] shrink-0 items-center rounded-full border border-rosegold/70 bg-rosegold/20 px-2.5 text-[11px] font-bold text-rosegold-light transition active:scale-95 sm:hidden"
                  >
                    Enter 3D →
                  </button>
                )}
              </div>

              {/* Mobile Single-Line Free Shipping + Exact 52 / 4 / 54 Summary */}
              <p className="mt-1 truncate text-[11px] font-medium text-rosegold-light sm:hidden">
                Free U.S. Shipping $65+ • {CATALOG_RECONCILIATION.verifiedInStock}{' '}
                Ready • {CATALOG_RECONCILIATION.verifiedOutOfStock} Sold Out •{' '}
                {CATALOG_RECONCILIATION.unverifiedPurchaseLocked} Locked
              </p>

              {/* Desktop Subtitle & Reconciled 3-State Transparency Pills */}
              <p className="mt-0.5 hidden line-clamp-2 text-sm font-medium text-rosegold-light sm:block">
                {currentZone.subtitle} • Free U.S. Express Shipping on orders
                $65+
              </p>
              <div className="mt-2.5 hidden flex-wrap items-center gap-1.5 text-[10px] font-bold sm:flex">
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

              {/* Boutique Department Pills */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar sm:mt-3">
                {BOUTIQUE_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    className={`min-h-[34px] shrink-0 rounded-full px-3 text-[11px] font-bold transition ${
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

        {/* ==================================================================
            MOBILE SINGLE-ROW 48px STICKY BAR (Pins Flush to Header Bottom via Scroll Container Padding Box!)
           ================================================================== */}
        <div className="sticky top-0 z-20 -mx-3 mt-2.5 flex h-12 items-center gap-1.5 border-b border-piggie-200/80 bg-piggie-50/95 px-3 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Open filter and sort drawer"
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-sm transition active:scale-95 ${
              activeFilterCount > 0
                ? 'border-piggie-950 bg-piggie-950 text-white'
                : 'border-piggie-300 bg-white text-piggie-950'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-piggie-500 px-1 text-[10px] font-extrabold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openMobileSearch}
            aria-label="Search products and shades"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-piggie-200 bg-white text-piggie-800 shadow-sm transition active:scale-95"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() =>
                setAvailabilityFilter((prev) =>
                  prev === 'ready' ? 'all' : 'ready'
                )
              }
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition ${
                availabilityFilter === 'ready'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Ready ({CATALOG_RECONCILIATION.verifiedInStock})
            </button>
            <button
              type="button"
              onClick={() => {
                setAvailabilityFilter('all');
                setSelectedCategory('All');
              }}
              className={`h-9 shrink-0 rounded-full px-3 text-[11px] font-bold transition ${
                availabilityFilter === 'all' && selectedCategory === 'All'
                  ? 'bg-piggie-950 text-white shadow-sm'
                  : 'bg-white text-piggie-800 ring-1 ring-piggie-200'
              }`}
            >
              All ({CATALOG_RECONCILIATION.totalProducts})
            </button>
            {CATEGORY_FILTERS.slice(1).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategory((prev) => (prev === cat ? 'All' : cat))
                }
                className={`h-9 shrink-0 rounded-full px-3 text-[11px] font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-piggie-800 text-white shadow-sm'
                    : 'bg-white text-piggie-700 ring-1 ring-piggie-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================================
            DESKTOP STICKY INLINE MERCHANDISING BAR
           ================================================================== */}
        <div className="sticky top-0 z-20 mt-4 hidden rounded-2xl border border-piggie-200/80 bg-piggie-50/95 px-4 py-2.5 backdrop-blur-xl md:block">
          <div className="flex items-center justify-between gap-2">
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
              <div className="flex w-56 items-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-piggie-600" />
                <input
                  type="search"
                  aria-label="Filter 2D catalog products or shades"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search makeup, shades..."
                  className="w-full bg-transparent text-xs text-piggie-950 placeholder:text-piggie-600/65 focus:outline-none"
                />
              </div>

              <label className="relative flex shrink-0 items-center">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3 w-3 text-piggie-600" />
                <select
                  aria-label="Sort products"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-full border border-piggie-200 bg-white py-1.5 pl-7 pr-3 text-xs font-bold text-piggie-900 focus:border-piggie-600 focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
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
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
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
              className="mt-4 min-h-[44px] rounded-full bg-piggie-950 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-piggie-800"
            >
              Show All 52 Ready-to-Ship Favorites
            </button>
          </div>
        ) : shouldSplitVault ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-5 lg:grid-cols-3">
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
                className="min-h-[40px] shrink-0 rounded-full bg-piggie-950 px-3.5 py-2 text-[11px] font-bold text-white hover:bg-piggie-800"
              >
                Filter Ready to Ship Only ({CATALOG_RECONCILIATION.verifiedInStock})
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
              {nonReadyProducts.map(renderProductCard)}
            </div>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-5 lg:grid-cols-3">
            {displayedProducts.map(renderProductCard)}
          </div>
        )}

        {/* Mandatory Legal, Regulatory & Accessibility Footer */}
        <footer className="mt-12 rounded-3xl border border-piggie-200/80 bg-white p-5 text-xs text-piggie-700 shadow-sm sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <img
                src="/brand/prettypiggie-logo.png"
                alt="Pretty Piggie Makeup"
                className="h-10 w-10 shrink-0 rounded-full border border-piggie-200 bg-white object-contain p-0.5"
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
              <Link
                href="/pretty-piggie"
                className="py-1 font-bold text-piggie-700 hover:text-piggie-950 hover:underline"
              >
                🐷 Create My Pretty Piggie (Instant 3D)
              </Link>
              <span>•</span>
              <Link
                href="/makeover-studio"
                className="py-1 font-bold text-piggie-700 hover:text-piggie-950 hover:underline"
              >
                💗 AI Cartoon Studio
              </Link>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('shipping')}
                className="py-1 hover:text-piggie-950 hover:underline"
              >
                Shipping &amp; 30-Day Returns
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('safety')}
                className="flex items-center gap-1 py-1 hover:text-piggie-950 hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-piggie-600" />
                FDA / MoCRA Cosmetic Safety
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="py-1 hover:text-piggie-950 hover:underline"
              >
                Privacy Policy (CCPA/PIPEDA)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="py-1 hover:text-piggie-950 hover:underline"
              >
                Terms of Sale
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('accessibility')}
                className="py-1 hover:text-piggie-950 hover:underline"
              >
                Accessibility (WCAG 2.1 AA)
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ==================================================================
          NATIVE MOBILE FILTER & SORT BOTTOM SHEET (Eliminates Sticky Bloat & iOS <select> Zoom)
         ================================================================== */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileFilterOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-end bg-piggie-950/60 backdrop-blur-sm md:hidden"
        >
          <div className="animate-sheet-up flex max-h-[86dvh] w-full flex-col rounded-t-3xl bg-white text-piggie-950 shadow-2xl">
            {/* Drag Handle & Sheet Header */}
            <div className="flex flex-col items-center pt-2.5">
              <span className="h-1.5 w-11 rounded-full bg-piggie-200" />
            </div>
            <div className="flex items-center justify-between border-b border-piggie-100 px-5 py-3">
              <h2
                id="mobile-filter-title"
                className="font-serif text-lg font-bold text-piggie-950"
              >
                Filter &amp; Sort
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filter and sort drawer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-piggie-50 text-piggie-800 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Filter Controls */}
            <div className="piggie-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Search (16px = zero iOS auto-zoom) */}
              <div>
                <label
                  htmlFor="mobile-2d-search"
                  className="text-[11px] font-bold uppercase tracking-wider text-piggie-700"
                >
                  Search Products &amp; Shades
                </label>
                <div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-2xl border border-piggie-200 bg-piggie-50/40 px-3.5">
                  <Search className="h-4 w-4 shrink-0 text-piggie-600" />
                  <input
                    ref={mobileSearchInputRef}
                    id="mobile-2d-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bronzer, eyeshadow, shade..."
                    className="w-full bg-transparent text-base text-piggie-950 placeholder:text-piggie-600/65 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 text-xs font-bold text-piggie-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Availability Status (Full Reconciled 52 / 110 / 4 / 54 Counts) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                  Availability Status
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: 'ready',
                        label: `Ready to Ship (${CATALOG_RECONCILIATION.verifiedInStock})`,
                        activeClass: 'bg-emerald-700 text-white border-emerald-700',
                      },
                      {
                        id: 'all',
                        label: `All (${CATALOG_RECONCILIATION.totalProducts})`,
                        activeClass: 'bg-piggie-950 text-white border-piggie-950',
                      },
                      {
                        id: 'oos',
                        label: `Sold Out (${CATALOG_RECONCILIATION.verifiedOutOfStock})`,
                        activeClass: 'bg-rose-700 text-white border-rose-700',
                      },
                      {
                        id: 'locked',
                        label: `Preview Vault (${CATALOG_RECONCILIATION.unverifiedPurchaseLocked})`,
                        activeClass: 'bg-amber-800 text-white border-amber-800',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(opt.id)}
                      className={`flex min-h-[44px] items-center justify-center rounded-2xl border px-3 text-xs font-bold transition ${
                        availabilityFilter === opt.id
                          ? `${opt.activeClass} shadow-sm`
                          : 'border-piggie-200 bg-white text-piggie-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tactile Sort Radio Pills (Zero iOS <select> Auto-Zoom) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                  Sort By
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortMode(opt.id)}
                      className={`flex min-h-[44px] items-center justify-center rounded-2xl border px-3 text-xs font-bold transition ${
                        sortMode === opt.id
                          ? 'border-piggie-950 bg-piggie-950 text-white shadow-sm'
                          : 'border-piggie-200 bg-white text-piggie-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                  Category
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORY_FILTERS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[40px] rounded-full border px-3.5 text-xs font-bold transition ${
                        selectedCategory === cat
                          ? 'border-piggie-800 bg-piggie-800 text-white shadow-sm'
                          : 'border-piggie-200 bg-white text-piggie-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Apply Bar */}
            <div className="flex items-center gap-2.5 border-t border-piggie-100 bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setAvailabilityFilter('all');
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setSortMode('featured');
                }}
                className="min-h-[48px] rounded-full border border-piggie-300 px-4 text-xs font-bold text-piggie-900 active:scale-95"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn-luxury-sheen flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-piggie-950 px-5 text-sm font-bold text-white shadow-lg active:scale-98"
              >
                Show {displayedProducts.length}{' '}
                {displayedProducts.length === 1 ? 'Product' : 'Products'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          PERSISTENT THUMB-ZONE FLOATING BAG CHECKOUT DOCK (Visible Whenever Bag > 0!)
         ================================================================== */}
      {bagCount > 0 && (
        <div
          role="region"
          aria-label="Shopping bag quick checkout bar"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:left-auto md:right-6 md:w-[390px] md:pb-5"
        >
          <div className="animate-toast-pop pointer-events-auto rounded-2xl border border-rosegold/60 bg-piggie-950/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-xl">
            {/* Live $65 Free Shipping Micro-Progress Bar */}
            <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  amountToFreeShipping === 0
                    ? 'bg-emerald-400'
                    : 'bg-gradient-to-r from-piggie-400 to-rosegold'
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold tabular-nums">
                  {recentAddedTitle
                    ? `✓ Added ${recentAddedTitle}`
                    : `${bagCount} ${
                        bagCount === 1 ? 'item' : 'items'
                      } in Bag • $${bagSubtotal.toFixed(2)}`}
                </p>
                <p className="truncate text-[11px] tabular-nums">
                  {amountToFreeShipping === 0 ? (
                    <span className="font-semibold text-emerald-300">
                      Free U.S. Express Shipping unlocked!
                    </span>
                  ) : (
                    <span className="text-rosegold-light">
                      ${amountToFreeShipping.toFixed(2)} away from Free U.S.
                      Shipping
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenBag}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-extrabold text-piggie-950 shadow transition hover:bg-piggie-100 active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-piggie-700" />
                <span>Checkout</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
