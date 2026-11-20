'use client';

import React, { useState } from 'react';
import { Check, Eye, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { BOUTIQUE_ZONES } from '@/data/boutiqueData';
import {
  BoutiqueProduct,
  BoutiqueZoneId,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';

interface LuxuryFallback2DProps {
  products: BoutiqueProduct[];
  activeZone: BoutiqueZoneId;
  onSelectZone: (zoneId: BoutiqueZoneId) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onQuickAddToBag: (product: BoutiqueProduct, shade: ProductShade) => void;
  onSwitchTo3D: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
  supportsWebGL: boolean;
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

export function LuxuryFallback2D({
  products,
  activeZone,
  onSelectZone,
  onSelectProduct,
  onQuickAddToBag,
  onSwitchTo3D,
  onOpenLegal,
  supportsWebGL,
}: LuxuryFallback2DProps) {
  const [cardShades, setCardShades] = useState<Record<string, ProductShade>>(
    {}
  );
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const currentZone =
    BOUTIQUE_ZONES.find((z) => z.id === activeZone) ?? BOUTIQUE_ZONES[0];

  const filteredProducts =
    activeZone === 'rotunda'
      ? products
      : products.filter((p) => p.zoneId === activeZone);

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-piggie-100 via-piggie-50 to-white pt-20 pb-32 text-piggie-950">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Hero Architectural Showroom Banner with Actual Reference Imagery */}
        <div className="relative overflow-hidden rounded-3xl border border-piggie-200 bg-piggie-950 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="flex flex-col justify-center p-6 md:col-span-7 md:p-10">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-piggie-950 shadow">
                  <img
                    src="/brand/prettypiggie-logo.png"
                    alt="Pretty Piggie Makeup"
                    className="h-6 w-6 object-contain"
                  />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">
                    Pretty Piggie Makeup
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-piggie-100 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-rosegold" />
                  {currentZone.badge} • 2D Luxury Boutique
                </span>
                {supportsWebGL && (
                  <button
                    type="button"
                    onClick={onSwitchTo3D}
                    className="rounded-full border border-rosegold/70 bg-rosegold/20 px-3 py-1 text-[11px] font-bold text-rosegold-light transition hover:bg-rosegold/30"
                  >
                    Enter Interactive 3D Showroom →
                  </button>
                )}
              </div>

              <h1 className="mt-3 font-serif text-2xl font-bold leading-tight md:text-4xl">
                {currentZone.name} ({filteredProducts.length} Items)
              </h1>
              <p className="mt-1 text-xs font-medium text-rosegold-light md:text-sm">
                {currentZone.subtitle}
              </p>
              <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-piggie-100/90 md:text-sm">
                {currentZone.description}
              </p>

              {/* Department Quick-Filter Pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {BOUTIQUE_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      activeZone === zone.id
                        ? 'bg-white text-piggie-950 shadow'
                        : 'bg-white/10 text-piggie-100 hover:bg-white/20'
                    }`}
                  >
                    {zone.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Boutique Interior Preview */}
            <div className="relative min-h-[220px] md:col-span-5">
              <img
                src={currentZone.referenceImage}
                alt={currentZone.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-piggie-950 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>
          </div>
        </div>

        {/* Product Grid with Branded Photography & Live Shade Swatches */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const activeShade = cardShades[product.id] ?? product.shades[0];
            const isAdded = justAddedId === product.id;

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-3xl border border-piggie-100 bg-white p-5 shadow-sm transition hover:shadow-xl"
              >
                <div>
                  {/* Real Branded Pretty Piggie Makeup Image Card (Semantic Button) */}
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="group relative flex h-56 w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-piggie-100 bg-gradient-to-br from-piggie-50 via-white to-piggie-100/60 p-4 text-left"
                  >
                    <div className="relative z-10 flex w-full items-center justify-between">
                      <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-piggie-700 shadow-sm">
                        {product.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          !product.manufacturerVerified
                            ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-300'
                            : !product.inStock
                            ? 'bg-rose-600 text-white'
                            : 'bg-piggie-950 text-white'
                        }`}
                      >
                        {!product.manufacturerVerified
                          ? 'UNVERIFIED • Hold'
                          : !product.inStock
                          ? 'Sold Out'
                          : product.badge || 'Verified INCI'}
                      </span>
                    </div>

                    {/* Branded Product Render */}
                    <div className="my-auto flex w-full items-center justify-center overflow-hidden py-1">
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.title}
                          className="h-36 w-36 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className="h-20 w-20 rounded-full border-4 border-white shadow-lg"
                          style={{ backgroundColor: activeShade.hex }}
                        />
                      )}
                    </div>

                    <div className="relative z-10 flex w-full items-center justify-between text-[11px] font-semibold text-piggie-800">
                      <span>
                        {product.isVegan ? 'Vegan • ' : ''}
                        {activeShade.finish}
                      </span>
                      <span className="inline-flex items-center gap-1 text-piggie-700 group-hover:underline">
                        <Eye className="h-3.5 w-3.5" />
                        3D Stage
                      </span>
                    </div>
                  </button>

                  {/* Title & Price */}
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-left font-serif text-lg font-bold text-piggie-950 hover:text-piggie-700"
                      >
                        {product.title}
                      </button>
                      <p className="line-clamp-1 text-xs text-piggie-600">
                        {product.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-piggie-950">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Rating & Origin row */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-piggie-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating.toFixed(1)}</span>
                    <span className="text-piggie-600">
                      • {product.originLabel}
                    </span>
                  </div>

                  {/* Shade Swatch Selector */}
                  <div className="mt-3">
                    <div className="text-[11px] font-medium text-piggie-700">
                      Shade ({product.shades.length}):{' '}
                      <strong className="text-piggie-950">
                        {activeShade.name}
                      </strong>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {product.shades.slice(0, 10).map((shade) => {
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
                            className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                              isSelected
                                ? 'scale-110 ring-2 ring-piggie-950 ring-offset-1'
                                : 'ring-1 ring-black/20 hover:scale-105'
                            }`}
                            style={{ backgroundColor: shade.hex }}
                          >
                            {isSelected && (
                              <Check
                                className={`h-3 w-3 ${
                                  darkCheck
                                    ? 'text-piggie-950'
                                    : 'text-white drop-shadow'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                      {product.shades.length > 10 && (
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="rounded-full bg-piggie-100 px-2 py-0.5 text-[10px] font-bold text-piggie-800"
                        >
                          +{product.shades.length - 10} more
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!product.canPurchase}
                    onClick={() => {
                      if (!product.canPurchase) return;
                      onQuickAddToBag(product, activeShade);
                      setJustAddedId(product.id);
                      setTimeout(() => setJustAddedId(null), 1500);
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white shadow transition ${
                      !product.manufacturerVerified
                        ? 'cursor-not-allowed bg-amber-800/80'
                        : !product.canPurchase
                        ? 'cursor-not-allowed bg-neutral-400'
                        : isAdded
                        ? 'bg-emerald-600'
                        : 'bg-piggie-950 hover:bg-piggie-800'
                    }`}
                  >
                    {!product.manufacturerVerified ? (
                      <span>UNVERIFIED — Hold</span>
                    ) : !product.inStock ? (
                      <span>Sold Out</span>
                    ) : isAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <span>Add to Bag • ${product.price.toFixed(2)}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="rounded-full border border-piggie-200 px-3.5 py-2.5 text-xs font-semibold text-piggie-800 hover:bg-piggie-50"
                  >
                    3D Try
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
                  100% Cruelty-Free • Full INCI Ingredient Transparency • 30-Day
                  Shade Guarantee
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-semibold text-piggie-800">
              <button
                type="button"
                onClick={() => onOpenLegal('shipping')}
                className="hover:text-piggie-950 hover:underline"
              >
                Shipping & 30-Day Returns
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
                Privacy Policy (CCPA/GDPR)
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
    </div>
  );
}
