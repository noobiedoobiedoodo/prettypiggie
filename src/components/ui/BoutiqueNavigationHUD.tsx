'use client';

import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Box,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  Search,
  ShieldCheck,
  ShoppingBag,
  X,
} from 'lucide-react';
import { BOUTIQUE_ZONES } from '@/data/boutiqueData';
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
  'Lipstick',
  'Lip Gloss',
  'Blush & Glow',
  'Complexion',
  'Eye Couture',
  'Artistry Brushes',
  'Skincare & Body',
] as const;

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

  const zoneHeroProducts =
    activeZone === 'rotunda'
      ? showroomProducts.slice(0, 5)
      : showroomProducts.filter((p) => p.zoneId === activeZone);

  const searchResults = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) {
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

  return (
    <>
      {/* ==================================================================
          1. PERSISTENT TOP FLOATING LUXURY HEADER
         ================================================================== */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3.5 pt-3 md:px-6 md:pt-4">
        {/* Brand Crest & Active Zone Breadcrumb */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectZone('rotunda')}
            className="flex items-center gap-2.5 rounded-full border border-white/85 bg-white/95 py-1.5 pl-2 pr-4 text-left shadow-lg backdrop-blur-md transition hover:bg-white active:scale-95"
          >
            <img
              src="/brand/prettypiggie-logo.png"
              alt="Pretty Piggie Makeup Logo"
              className="h-9 w-9 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm md:h-10 md:w-10"
            />
            <div>
              <span className="block font-serif text-sm font-bold tracking-tight text-piggie-950 md:text-base">
                Pretty Piggie
              </span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-piggie-700">
                Makeup Boutique
              </span>
            </div>
          </button>

          {/* Active Boutique Zone Pill on Desktop */}
          <div className="hidden items-center gap-1.5 rounded-full border border-white/60 bg-piggie-950/80 px-3 py-1.5 text-[11px] font-medium text-piggie-100 backdrop-blur-md lg:flex">
            <Compass className="h-3.5 w-3.5 text-rosegold" />
            <span>{currentZone.name}</span>
          </div>
        </div>

        {/* Right Controls: Full Collection, Policies, 3D/2D Mode Switch & Persistent Bag */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Full 110-Product Collection Directory Trigger */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            aria-label="Browse all 110 Pretty Piggie Makeup products"
            className="flex h-10 items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3.5 text-xs font-bold text-piggie-950 shadow-lg backdrop-blur-md transition hover:bg-white active:scale-95"
          >
            <Search className="h-4 w-4 text-piggie-600" />
            <span className="hidden sm:inline">
              Shop All ({products.length})
            </span>
          </button>

          {/* Customer Care, Safety & Legal Policies Trigger */}
          <button
            type="button"
            onClick={() => onOpenLegal('shipping')}
            aria-label="Shipping, returns, FDA MoCRA safety, privacy, and accessibility policies"
            className="hidden h-10 items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 text-xs font-semibold text-piggie-900 shadow-lg backdrop-blur-md transition hover:bg-white md:flex"
          >
            <ShieldCheck className="h-4 w-4 text-piggie-600" />
            <span>Care & Policies</span>
          </button>

          {/* 3D Showroom / 2D Full Catalog Mode Switch */}
          {capability.supportsWebGL && (
            <button
              type="button"
              onClick={onToggle2DMode}
              title="Switch between 3D Virtual Showroom and 2D Full 110-Product Boutique"
              className="flex h-10 items-center gap-1.5 rounded-full border border-white/70 bg-piggie-950/85 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-piggie-900 active:scale-95"
            >
              {is2DMode ? (
                <>
                  <Box className="h-3.5 w-3.5 text-rosegold" />
                  <span>3D Store</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-rosegold" />
                  <span className="hidden sm:inline">2D Catalog (110)</span>
                </>
              )}
            </button>
          )}

          {/* Persistent Shopping Bag Button (WCAG AA contrast badge bg-piggie-600) */}
          <button
            type="button"
            onClick={onOpenBag}
            aria-label={`Open shopping bag (${bagCount} items)`}
            className="relative flex h-10 items-center gap-2 rounded-full border border-rosegold/60 bg-gradient-to-r from-piggie-950 to-piggie-800 px-4 text-xs font-bold text-white shadow-lg transition hover:from-piggie-900 hover:to-piggie-700 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4 text-rosegold-light" />
            <span className="hidden sm:inline">Bag</span>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-piggie-600 px-1.5 text-[11px] font-extrabold text-white">
              {bagCount}
            </span>
          </button>
        </div>
      </header>

      {/* ==================================================================
          2. CONTEXTUAL ZONE PLACARD & QUICK-SELECT PRODUCT STRIP (3D Mode)
         ================================================================== */}
      {!selectedProduct && !is2DMode && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-20 flex flex-col items-start px-3.5 md:left-6 md:right-auto md:top-20 md:max-w-sm md:px-0">
          <div className="pointer-events-auto w-full rounded-2xl border border-piggie-200/90 bg-white/95 p-3.5 text-piggie-950 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-piggie-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-piggie-700">
                <img
                  src="/brand/prettypiggie-logo.png"
                  alt=""
                  className="h-3.5 w-3.5 rounded-full bg-white object-contain"
                />
                {currentZone.badge}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenLegal('shipping')}
                  className="text-[10px] font-semibold text-piggie-700 underline hover:text-piggie-950 md:hidden"
                >
                  Policies
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="text-[10px] font-bold text-piggie-700 underline hover:text-piggie-950"
                >
                  Shop All {products.length} Items →
                </button>
              </div>
            </div>

            <h1 className="mt-1 font-serif text-base font-bold leading-snug text-piggie-950 md:text-lg">
              {currentZone.name}
            </h1>
            <p className="mt-0.5 text-[11px] leading-relaxed text-piggie-800">
              {currentZone.description}
            </p>

            {/* Quick-Tap Product Pills in Current Zone */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {zoneHeroProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => onSelectProduct(prod)}
                  className="flex items-center gap-1.5 rounded-full border border-piggie-200 bg-piggie-50/70 px-2.5 py-1 text-[11px] font-semibold text-piggie-950 shadow-sm transition hover:border-piggie-500 hover:bg-white active:scale-95"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: prod.shades[0].hex }}
                  />
                  <span>{prod.title}</span>
                  <span className="font-bold text-piggie-700">
                    ${prod.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          3. ONE-HANDED THUMB-ZONE BOTTOM BOUTIQUE NAVIGATION DOCK
         ================================================================== */}
      {!selectedProduct && (
        <nav
          aria-label="Boutique Departments"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-3 pb-4 pt-2 md:pb-6"
        >
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full border border-white/80 bg-piggie-950/90 p-1.5 text-white shadow-2xl backdrop-blur-xl">
            {/* Prev Department Button */}
            <button
              type="button"
              onClick={() => onSwipeZone('prev')}
              aria-label="Previous boutique zone"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-piggie-100 transition hover:bg-white/20 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Scrollable One-Tap Zone Pills */}
            <div className="flex items-center gap-1 overflow-x-auto px-1 no-scrollbar">
              {BOUTIQUE_ZONES.map((zone) => {
                const isActive = activeZone === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-piggie-200 via-white to-rosegold-light text-piggie-950 shadow-md scale-102'
                        : 'text-piggie-100/85 hover:bg-white/10 hover:text-white'
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-piggie-100 transition hover:bg-white/20 active:scale-95"
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-piggie-950/65 p-3 pt-14 backdrop-blur-sm md:p-6 md:pt-16"
        >
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-piggie-100 bg-white text-piggie-950 shadow-2xl">
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
                        100% Cruelty-Free
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-piggie-700">
                      Tap any product to inspect it on the interactive 360° 3D
                      Presentation Stage and try shades.
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

              {/* Search Input (16px on mobile to prevent iOS Safari auto-zoom, no autoFocus keyboard popup) */}
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-piggie-200 bg-white px-3.5 py-2">
                  <Search className="h-4 w-4 text-piggie-600" />
                  <input
                    type="search"
                    aria-label="Search Pretty Piggie Makeup catalog"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lipsticks, glosses, foundations, palettes, brushes, or shades..."
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
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-piggie-950 text-white shadow-sm'
                        : 'bg-piggie-100/80 text-piggie-700 hover:bg-piggie-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable 110-Product List */}
            <div className="flex-1 divide-y divide-piggie-100/80 overflow-y-auto p-3 md:p-4">
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
                    Reset Search & Filters
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
                    <div className="flex items-center gap-3.5 min-w-0">
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
                          {prod.isVegan && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              Vegan
                            </span>
                          )}
                          {!prod.inStock && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Sold Out
                            </span>
                          )}
                          {prod.isShowroomFloorHero && (
                            <span className="rounded-full bg-piggie-950 px-2 py-0.5 text-[10px] font-semibold text-rosegold-light">
                              Featured in 3D Showroom
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

                    {/* Customer Retail Price & 3D Stage CTA */}
                    <div className="flex items-center justify-between gap-4 border-t border-piggie-100 pt-2 sm:border-0 sm:pt-0 sm:shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-extrabold text-piggie-950">
                          ${prod.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-medium text-piggie-600">
                          {prod.shades.length}{' '}
                          {prod.shades.length === 1 ? 'Formula' : 'Shades'}
                        </div>
                      </div>

                      <span className="rounded-full bg-piggie-950 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition group-hover:bg-piggie-800">
                        3D Try →
                      </span>
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
