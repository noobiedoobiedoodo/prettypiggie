'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Layers,
  Search,
  ShieldCheck,
  ShoppingBag,
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
  DeviceCapabilityProfile,
  LegalPolicyTab,
} from '@/types/boutique';

interface BoutiqueNavigationHUDProps {
  products: BoutiqueProduct[];
  showroomProducts: BoutiqueProduct[];
  activeZone: BoutiqueZoneId;
  selectedProduct: BoutiqueProduct | null;
  bagCount: number;
  is2DMode: boolean;
  capability: DeviceCapabilityProfile;
  onSelectZone: (zoneId: BoutiqueZoneId) => void;
  onSwipeZone: (direction: 'prev' | 'next') => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onOpenBag: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
  onToggle2DMode: () => void;
}

const CATEGORIES = [
  'All',
  'Verified In Stock',
  'Verified Out of Stock',
  'Unverified Locked',
  'Eye Couture',
  'Blush & Glow',
  'Complexion',
  'Artistry Brushes',
  'Skincare & Body',
  'Lipstick',
  'Lip Gloss',
] as const;

const ROTUNDA_SPOTLIGHT_HANDLES = [
  'single-pan-eyeshadow',
  'bronzer',
  'luminizing-powder',
  'stipple-blend-foundation-brush',
];

export function BoutiqueNavigationHUD({
  products,
  showroomProducts = products,
  activeZone,
  selectedProduct,
  bagCount,
  is2DMode,
  capability,
  onSelectZone,
  onSwipeZone,
  onSelectProduct,
  onOpenBag,
  onOpenLegal,
  onToggle2DMode,
}: BoutiqueNavigationHUDProps) {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPlacardCollapsed, setIsPlacardCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!isCatalogOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCatalogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCatalogOpen]);

  const currentZone =
    BOUTIQUE_ZONES.find((z) => z.id === activeZone) ?? BOUTIQUE_ZONES[0];

  // Strictly cap to 4 buyable prestige heroes so mobile 3D viewport stays open and unobstructed
  const zoneHeroProducts = useMemo(() => {
    if (activeZone === 'rotunda') {
      const picked = ROTUNDA_SPOTLIGHT_HANDLES.map((h) =>
        showroomProducts.find((p) => p.handle === h && p.canPurchase)
      ).filter((p): p is BoutiqueProduct => Boolean(p));
      if (picked.length >= 4) return picked.slice(0, 4);
      const fallback = showroomProducts.filter(
        (p) => p.canPurchase && !picked.some((x) => x.id === p.id)
      );
      return [...picked, ...fallback].slice(0, 4);
    }

    const zoneFloor = showroomProducts.filter(
      (p) => p.zoneId === activeZone && p.canPurchase
    );
    const zoneRunners = sortProductsForMerchandising(
      products.filter(
        (p) =>
          p.zoneId === activeZone &&
          p.canPurchase &&
          !p.isShowroomFloorHero
      )
    );
    return [...zoneFloor, ...zoneRunners].slice(0, 4);
  }, [activeZone, showroomProducts, products]);

  const searchResults = useMemo(() => {
    const filtered = products.filter((p) => {
      if (
        selectedCategory === 'Verified In Stock' &&
        p.availabilityState !== 'VERIFIED_IN_STOCK'
      ) {
        return false;
      } else if (
        selectedCategory === 'Verified Out of Stock' &&
        p.availabilityState !== 'VERIFIED_OUT_OF_STOCK'
      ) {
        return false;
      } else if (
        selectedCategory === 'Unverified Locked' &&
        p.availabilityState !== 'UNVERIFIED_PURCHASE_LOCKED'
      ) {
        return false;
      } else if (
        selectedCategory !== 'All' &&
        selectedCategory !== 'Verified In Stock' &&
        selectedCategory !== 'Verified Out of Stock' &&
        selectedCategory !== 'Unverified Locked' &&
        p.category !== selectedCategory
      ) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.shades.some((s) => s.name.toLowerCase().includes(q))
      );
    });
    return sortProductsForMerchandising(filtered);
  }, [products, selectedCategory, searchQuery]);

  const formatCategoryPillLabel = (cat: string) => {
    if (cat === 'All') return `All (${CATALOG_RECONCILIATION.totalProducts})`;
    if (cat === 'Verified In Stock')
      return `Ready to Ship (${CATALOG_RECONCILIATION.verifiedInStock})`;
    if (cat === 'Verified Out of Stock')
      return `Out of Stock (${CATALOG_RECONCILIATION.verifiedOutOfStock})`;
    if (cat === 'Unverified Locked')
      return `Preview Locked (${CATALOG_RECONCILIATION.unverifiedPurchaseLocked})`;
    return cat;
  };

  return (
    <>
      {/* ==================================================================
          1. PERSISTENT TOP FLOATING LUXURY HEADER
         ================================================================== */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-4">
        {/* Brand Crest & Active Zone Breadcrumb */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectZone('rotunda')}
            className="flex items-center gap-2 rounded-full border border-white/85 bg-white/95 py-1 pl-1.5 pr-3 text-left shadow-pill-float backdrop-blur-md transition hover:bg-white active:scale-95 md:gap-2.5 md:py-1.5 md:pl-2 md:pr-4"
          >
            <img
              src="/brand/prettypiggie-logo.png"
              alt="Pretty Piggie Makeup Logo"
              className="h-8 w-8 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm md:h-10 md:w-10"
            />
            <div>
              <span className="block font-serif text-sm font-bold tracking-tight text-piggie-950 md:text-base">
                Pretty Piggie
              </span>
              <span className="hidden text-[9px] font-extrabold uppercase tracking-widest text-piggie-700 sm:block">
                Makeup Boutique
              </span>
            </div>
          </button>

          {/* Active Boutique Zone Pill on Desktop */}
          <div className="hidden items-center gap-1.5 rounded-full border border-white/60 bg-piggie-950/85 px-3 py-1.5 text-[11px] font-medium text-piggie-100 backdrop-blur-md lg:flex">
            <Compass className="h-3.5 w-3.5 text-rosegold" />
            <span>{currentZone.name}</span>
          </div>
        </div>

        {/* Right Controls: Full Collection, Policies, 3D/2D Mode Switch & Persistent Bag */}
        <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2">
          {/* Full 110-Product Collection Directory Trigger */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            aria-label="Browse all 110 Pretty Piggie Makeup products"
            className="flex h-10 items-center gap-1.5 rounded-full border border-white/85 bg-white/95 px-3 text-xs font-bold text-piggie-950 shadow-pill-float backdrop-blur-md transition hover:bg-white active:scale-95 md:px-3.5"
          >
            <Search className="h-4 w-4 text-piggie-600" />
            <span className="sm:hidden">Shop</span>
            <span className="hidden sm:inline">
              Shop All ({products.length})
            </span>
          </button>

          {/* Customer Care, Safety & Legal Policies Trigger */}
          <button
            type="button"
            onClick={() => onOpenLegal('shipping')}
            aria-label="Shipping, returns, FDA MoCRA safety, privacy, and accessibility policies"
            className="hidden h-10 items-center gap-1.5 rounded-full border border-white/85 bg-white/95 px-3 text-xs font-semibold text-piggie-900 shadow-pill-float backdrop-blur-md transition hover:bg-white md:flex"
          >
            <ShieldCheck className="h-4 w-4 text-piggie-600" />
            <span>Care &amp; Policies</span>
          </button>

          {/* 3D Showroom / 2D Full Catalog Mode Switch (Always labeled on mobile!) */}
          {capability.supportsWebGL && (
            <button
              type="button"
              onClick={onToggle2DMode}
              title="Switch between 3D Virtual Showroom and 2D Full 110-Product Boutique"
              className="flex h-10 items-center gap-1.5 rounded-full border border-white/70 bg-piggie-950/90 px-3 text-xs font-semibold text-white shadow-pill-float backdrop-blur-md transition hover:bg-piggie-900 active:scale-95 md:px-3.5"
            >
              {is2DMode ? (
                <>
                  <Box className="h-3.5 w-3.5 text-rosegold" />
                  <span>3D Store</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-rosegold" />
                  <span className="sm:hidden">2D</span>
                  <span className="hidden sm:inline">2D Catalog</span>
                </>
              )}
            </button>
          )}

          {/* Persistent Shopping Bag Button */}
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open shopping bag (${bagCount} items)`}
            className="relative flex h-10 items-center gap-1.5 rounded-full border border-rosegold/70 bg-gradient-to-r from-piggie-950 to-piggie-800 px-3.5 text-xs font-bold text-white shadow-pill-float transition hover:from-piggie-900 hover:to-piggie-700 active:scale-95 md:gap-2 md:px-4"
          >
            <ShoppingBag className="h-4 w-4 text-rosegold-light" />
            <span className="hidden sm:inline">Bag</span>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-piggie-600 px-1.5 text-[11px] font-extrabold tabular-nums text-white">
              {bagCount}
            </span>
          </button>
        </div>
      </header>

      {/* ==================================================================
          2. COMPACT COLLAPSIBLE ZONE PLACARD & SINGLE-ROW BUYABLE STRIP (3D Mode)
         ================================================================== */}
      {!selectedProduct && !is2DMode && (
        <div className="pointer-events-none fixed inset-x-0 top-[62px] z-20 flex flex-col items-start px-3 md:left-6 md:right-auto md:top-20 md:max-w-sm md:px-0">
          <div className="pointer-events-auto w-full rounded-2xl border border-piggie-200/90 bg-white/92 px-3 py-2.5 text-piggie-950 shadow-xl backdrop-blur-xl md:p-3.5">
            {/* Compact Top Title Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-piggie-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-piggie-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {currentZone.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenLegal('shipping')}
                    className="shrink-0 text-[10px] font-semibold text-piggie-700 underline hover:text-piggie-950 md:hidden"
                  >
                    Policies
                  </button>
                </div>
                <h1 className="mt-0.5 truncate font-serif text-sm font-bold leading-snug text-piggie-950 md:text-lg">
                  {currentZone.name}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="whitespace-nowrap rounded-full bg-piggie-50 px-2.5 py-1 text-[10px] font-bold text-piggie-800 ring-1 ring-piggie-200 transition hover:bg-piggie-100"
                >
                  Shop Ready ({CATALOG_RECONCILIATION.verifiedInStock})
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlacardCollapsed((prev) => !prev)}
                  aria-label={
                    isPlacardCollapsed
                      ? 'Expand boutique guide'
                      : 'Minimize boutique guide to view 3D room'
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-piggie-100 text-piggie-800 hover:bg-piggie-200 md:hidden"
                >
                  {isPlacardCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Body (Always visible on desktop, 1-tap toggle on mobile) */}
            {!isPlacardCollapsed && (
              <>
                <p className="mt-0.5 truncate text-[11px] font-medium text-piggie-700 md:hidden">
                  {currentZone.subtitle}
                </p>
                <p className="mt-1 hidden text-[11px] leading-relaxed text-piggie-800 md:block">
                  {currentZone.description}
                </p>

                {/* Single-Row Horizontally Scrollable Verified Buyable Hero Pills */}
                <div className="relative mt-2">
                  <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 pr-4 no-scrollbar md:flex-wrap md:pr-0">
                    {zoneHeroProducts.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => onSelectProduct(prod)}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-piggie-200 bg-piggie-50/90 px-2.5 py-1.5 text-[11px] font-semibold text-piggie-950 shadow-sm transition hover:border-piggie-500 hover:bg-white active:scale-95"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15"
                          style={{ backgroundColor: prod.shades[0].hex }}
                        />
                        <span className="max-w-[140px] truncate">
                          {prod.title}
                        </span>
                        <span className="font-bold tabular-nums text-piggie-700">
                          ${prod.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================
          3. ONE-HANDED THUMB-ZONE BOTTOM BOUTIQUE NAVIGATION DOCK (3D Mode Only — 2D Has Native Sticky Filters)
         ================================================================== */}
      {!selectedProduct && !is2DMode && (
        <nav
          aria-label="Boutique Departments"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:pb-6"
        >
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full border border-white/75 bg-piggie-950/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
            {/* Prev Department Button */}
            <button
              type="button"
              onClick={() => onSwipeZone('prev')}
              aria-label="Previous boutique zone"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Scrollable One-Tap Zone Pills (Guaranteed High-Contrast Active & Inactive States) */}
            <div className="flex items-center gap-1 overflow-x-auto px-1 no-scrollbar">
              {BOUTIQUE_ZONES.map((zone) => {
                const isActive = activeZone === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onSelectZone(zone.id)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'scale-102 bg-white text-piggie-950 shadow-md ring-1 ring-rosegold/70'
                        : 'bg-transparent text-white/90 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {zone.shortName}
                  </button>
                );
              })}
            </div>

            {/* Next Department Button */}
            <button
              type="button"
              onClick={() => onSwipeZone('next')}
              aria-label="Next boutique zone"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}

      {/* ==================================================================
          4. FULL 110-PRODUCT BOUTIQUE COLLECTION & SHADE FINDER MODAL
         ================================================================== */}
      {isCatalogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalog-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCatalogOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-piggie-950/65 p-3 pt-14 backdrop-blur-sm md:p-6 md:pt-16"
        >
          <div className="animate-sheet-up flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-piggie-100 bg-white text-piggie-950 shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-piggie-100 bg-gradient-to-r from-piggie-50 via-white to-piggie-50 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/prettypiggie-logo.png"
                    alt="Pretty Piggie Makeup"
                    className="h-11 w-11 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="catalog-modal-title"
                        className="font-serif text-lg font-bold text-piggie-950 md:text-xl"
                      >
                        Pretty Piggie Makeup Collection ({products.length})
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-piggie-100 px-2.5 py-0.5 text-[10px] font-bold text-piggie-800">
                        <BadgeCheck className="h-3.5 w-3.5 text-piggie-600" />
                        {CATALOG_RECONCILIATION.verifiedInStock} Verified In
                        Stock • {CATALOG_RECONCILIATION.verifiedOutOfStock}{' '}
                        Verified Out of Stock •{' '}
                        {CATALOG_RECONCILIATION.unverifiedPurchaseLocked}{' '}
                        Unverified Locked
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-piggie-700">
                      Ready-to-ship favorites are featured first. Tap any item
                      to inspect shades on the 360° 3D stage.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  aria-label="Close product catalog"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-piggie-100 text-piggie-800 hover:bg-piggie-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Input (16px on mobile to prevent iOS Safari auto-zoom) */}
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-piggie-200 bg-white px-3.5 py-2">
                  <Search className="h-4 w-4 text-piggie-600" />
                  <input
                    type="search"
                    aria-label="Search Pretty Piggie Makeup catalog"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search eyeshadows, bronzers, brushes, serums, or shade names..."
                    className="w-full bg-transparent text-base text-piggie-950 placeholder:text-piggie-600/70 focus:outline-none sm:text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      className="text-xs font-bold text-piggie-600 hover:text-piggie-950"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-piggie-950 text-white shadow-sm'
                        : cat === 'Verified In Stock'
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100'
                        : 'bg-piggie-100/80 text-piggie-700 hover:bg-piggie-200'
                    }`}
                  >
                    {formatCategoryPillLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable 110-Product List (Merchandised Buyable-First) */}
            <div className="piggie-scrollbar flex-1 divide-y divide-piggie-100/80 overflow-y-auto p-3 md:p-4">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="font-serif text-lg font-bold text-piggie-950">
                    No matching products or shades found
                  </p>
                  <p className="mt-1 text-xs text-piggie-600">
                    Try searching a different shade name or reset your active
                    category filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 rounded-full bg-piggie-950 px-5 py-2 text-xs font-bold text-white shadow hover:bg-piggie-800"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              ) : (
                searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      setIsCatalogOpen(false);
                      onSelectProduct(prod);
                    }}
                    className="group flex w-full cursor-pointer flex-col justify-between gap-3 rounded-2xl p-3 text-left transition hover:bg-piggie-50/90 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      {/* Branded Product Thumbnail */}
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-piggie-200 bg-white">
                        {prod.primaryImage ? (
                          <img
                            src={prod.primaryImage}
                            alt={prod.title}
                            className="h-full w-full object-contain p-1 transition group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ backgroundColor: prod.shades[0].hex }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-piggie-950 group-hover:text-piggie-700">
                            {prod.title}
                          </span>
                          <span className="rounded-full bg-piggie-100 px-2 py-0.5 text-[10px] font-semibold text-piggie-700">
                            {prod.category}
                          </span>
                          {prod.availabilityState === 'VERIFIED_IN_STOCK' ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                              Verified • In Stock
                            </span>
                          ) : prod.availabilityState ===
                            'VERIFIED_OUT_OF_STOCK' ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 ring-1 ring-rose-200">
                              Verified • Out of Stock
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300">
                              UNVERIFIED • Purchase Locked
                            </span>
                          )}
                          {prod.isShowroomFloorHero && (
                            <span className="rounded-full bg-piggie-950 px-2 py-0.5 text-[10px] font-semibold text-rosegold-light">
                              3D Showroom Hero
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 line-clamp-1 text-xs text-piggie-700">
                          {prod.subtitle}
                        </p>

                        {/* Mini Shade Swatch Dots */}
                        {prod.shades.length > 1 && (
                          <div className="mt-1 flex items-center gap-1">
                            {prod.shades.slice(0, 8).map((s) => (
                              <span
                                key={s.id}
                                className="h-3 w-3 rounded-full ring-1 ring-black/15"
                                style={{ backgroundColor: s.hex }}
                                title={s.name}
                              />
                            ))}
                            {prod.shades.length > 8 && (
                              <span className="text-[10px] font-semibold text-piggie-600">
                                +{prod.shades.length - 8} shades
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Retail Price & Differentiated CTA */}
                    <div className="flex items-center justify-between gap-4 border-t border-piggie-100 pt-2 sm:shrink-0 sm:border-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-extrabold tabular-nums text-piggie-950">
                          ${prod.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-medium text-piggie-600">
                          {prod.shades.length}{' '}
                          {prod.shades.length === 1 ? 'Formula' : 'Shades'}
                        </div>
                      </div>

                      {prod.availabilityState === 'VERIFIED_IN_STOCK' ? (
                        <span className="rounded-full bg-piggie-950 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition group-hover:bg-piggie-800">
                          Shop &amp; 3D →
                        </span>
                      ) : prod.availabilityState === 'VERIFIED_OUT_OF_STOCK' ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-800">
                          Sold Out
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-900">
                          3D Preview
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
