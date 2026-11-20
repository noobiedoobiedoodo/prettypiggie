'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BOUTIQUE_ZONES,
  PRETTYPIGGIE_PRODUCTS,
  SHOWROOM_FLOOR_PRODUCTS,
} from '@/data/boutiqueData';
import {
  DEFAULT_MOBILE_CAPABILITY,
  detectDeviceCapability,
} from '@/lib/deviceCapability';
import {
  BoutiqueProduct,
  BoutiqueZoneId,
  CartItem,
  DeviceCapabilityProfile,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';
import { BoutiqueNavigationHUD } from './ui/BoutiqueNavigationHUD';
import { ProductPresentationSheet } from './ui/ProductPresentationSheet';
import { ShoppingBagDrawer } from './ui/ShoppingBagDrawer';
import { LuxuryFallback2D } from './ui/LuxuryFallback2D';
import { LegalComplianceModal } from './ui/LegalComplianceModal';

// Lazy-load 3D WebGL Canvas for instant mobile First Contentful Paint
const BoutiqueCanvas3D = dynamic(
  () =>
    import('./three/BoutiqueCanvas3D').then((mod) => mod.BoutiqueCanvas3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#F8D6E3] via-[#EEB3C9] to-[#D98CA9] text-piggie-950">
        <div className="flex flex-col items-center rounded-3xl border border-white/80 bg-white/90 px-9 py-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-rosegold bg-white p-2 shadow-rose-glow">
            <img
              src="/brand/prettypiggie-logo.png"
              alt="Pretty Piggie Makeup"
              className="h-full w-full object-contain animate-pulse motion-reduce:animate-none"
            />
          </div>
          <span className="mt-4 font-serif text-xl font-bold text-piggie-950">
            Entering Pretty Piggie Makeup
          </span>
          <span className="mt-1 text-xs font-medium text-piggie-700">
            Illuminating 3D Chandelier Rotunda & Makeup Wall...
          </span>
        </div>
      </div>
    ),
  }
);

const CART_STORAGE_KEY = 'prettypiggie_boutique_cart_v1';

export function PrettyPiggieBoutiqueApp() {
  const [products] = useState<BoutiqueProduct[]>(PRETTYPIGGIE_PRODUCTS);
  const [activeZone, setActiveZone] = useState<BoutiqueZoneId>('rotunda');
  const [selectedProduct, setSelectedProduct] =
    useState<BoutiqueProduct | null>(null);
  const [selectedShade, setSelectedShade] = useState<ProductShade | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const [capability, setCapability] = useState<DeviceCapabilityProfile>(
    DEFAULT_MOBILE_CAPABILITY
  );
  const [is2DMode, setIs2DMode] = useState<boolean>(false);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [activeLegalTab, setActiveLegalTab] =
    useState<LegalPolicyTab>('shipping');

  const isCartHydratedRef = useRef<boolean>(false);

  // Detect device capabilities, handle viewport changes, and support TikTok/IG Ad Deep-Linking (?product=, ?zone=, ?mode=)
  useEffect(() => {
    const profile = detectDeviceCapability();
    setCapability(profile);
    if (profile.recommendFallback2D) {
      setIs2DMode(true);
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === '2d') {
        setIs2DMode(true);
      } else if (modeParam === '3d' && profile.supportsWebGL) {
        setIs2DMode(false);
      }

      const zoneParam = params.get('zone') as BoutiqueZoneId | null;
      if (
        zoneParam &&
        BOUTIQUE_ZONES.some((z) => z.id === zoneParam)
      ) {
        setActiveZone(zoneParam);
      }

      const productParam = params.get('product');
      if (productParam) {
        const matched = PRETTYPIGGIE_PRODUCTS.find(
          (p) =>
            p.handle === productParam.toLowerCase() ||
            p.id === productParam.toLowerCase()
        );
        if (matched) {
          setSelectedProduct(matched);
          setSelectedShade(matched.shades[0]);
          setActiveZone(matched.zoneId);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }

    const handleResize = () => {
      const updated = detectDeviceCapability();
      setCapability(updated);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load and sanitize saved cart from localStorage (strips any legacy confidential fields)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Array<Record<string, unknown>>;
        if (Array.isArray(parsed)) {
          const sanitized: CartItem[] = [];
          for (const raw of parsed) {
            const matchedProduct = PRETTYPIGGIE_PRODUCTS.find(
              (p) => p.id === raw.productId || p.handle === raw.productHandle
            );
            // Evict any product that is out of stock OR lacks verified manufacturer INCI documentation
            if (
              !matchedProduct ||
              !matchedProduct.inStock ||
              !matchedProduct.manufacturerVerified ||
              !matchedProduct.canPurchase
            ) {
              continue;
            }
            const matchedShade =
              matchedProduct.shades.find((s) => s.id === raw.shadeId) ??
              matchedProduct.shades[0];
            sanitized.push({
              key: `${matchedProduct.id}::${matchedShade.id}`,
              productId: matchedProduct.id,
              productHandle: matchedProduct.handle,
              sku: matchedShade.sku || matchedProduct.sku,
              title: matchedProduct.title,
              category: matchedProduct.category,
              modelType: matchedProduct.modelType,
              shadeId: matchedShade.id,
              shadeName: matchedShade.name,
              shadeHex: matchedShade.hex,
              finish: matchedShade.finish,
              price: matchedProduct.price,
              primaryImage: matchedProduct.primaryImage,
              quantity: Math.max(1, Number(raw.quantity) || 1),
              shopifyVariantId: matchedShade.shopifyVariantId,
            });
          }
          setCartItems(sanitized);
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      isCartHydratedRef.current = true;
    }
  }, []);

  // Persist cart changes only after initial hydration
  useEffect(() => {
    if (!isCartHydratedRef.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage access errors
    }
  }, [cartItems]);

  const handleSelectZone = useCallback((zoneId: BoutiqueZoneId) => {
    setSelectedProduct(null);
    setSelectedShade(null);
    setActiveZone(zoneId);
  }, []);

  const handleSwipeZone = useCallback(
    (direction: 'prev' | 'next') => {
      const idx = BOUTIQUE_ZONES.findIndex((z) => z.id === activeZone);
      const nextIdx =
        direction === 'next'
          ? (idx + 1) % BOUTIQUE_ZONES.length
          : (idx - 1 + BOUTIQUE_ZONES.length) % BOUTIQUE_ZONES.length;
      setSelectedProduct(null);
      setSelectedShade(null);
      setActiveZone(BOUTIQUE_ZONES[nextIdx].id);
    },
    [activeZone]
  );

  const handleSelectProduct = useCallback((product: BoutiqueProduct) => {
    setSelectedProduct(product);
    setSelectedShade(product.shades[0]);
    setActiveZone(product.zoneId);
  }, []);

  const handleAddToBag = useCallback(
    (product: BoutiqueProduct, shade: ProductShade, quantity = 1) => {
      // Hard programmatic guard: Never allow unverified or out-of-stock products to be added to the bag
      if (
        !product.manufacturerVerified ||
        !product.canPurchase ||
        !product.inStock ||
        !shade.inStock
      ) {
        return;
      }
      const key = `${product.id}::${shade.id}`;
      setCartItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            productHandle: product.handle,
            sku: shade.sku || product.sku,
            title: product.title,
            category: product.category,
            modelType: product.modelType,
            shadeId: shade.id,
            shadeName: shade.name,
            shadeHex: shade.hex,
            finish: shade.finish,
            price: product.price,
            primaryImage: product.primaryImage,
            quantity,
            shopifyVariantId: shade.shopifyVariantId,
          },
        ];
      });
    },
    []
  );

  const handleUpdateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.key !== key));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleOpenLegal = useCallback((tab: LegalPolicyTab) => {
    setActiveLegalTab(tab);
    setIsLegalOpen(true);
  }, []);

  // Keyboard navigation accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLegalOpen) {
          setIsLegalOpen(false);
        } else if (isBagOpen) {
          setIsBagOpen(false);
        } else if (selectedProduct) {
          setSelectedProduct(null);
          setSelectedShade(null);
        }
      } else if (!selectedProduct && !isBagOpen && !isLegalOpen) {
        if (e.key === 'ArrowRight') {
          handleSwipeZone('next');
        } else if (e.key === 'ArrowLeft') {
          handleSwipeZone('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLegalOpen, isBagOpen, selectedProduct, handleSwipeZone]);

  const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-piggie-100 select-none">
      {/* Persistent Top Floating Header, Zone Placard & One-Handed Bottom Zone Dock */}
      <BoutiqueNavigationHUD
        products={products}
        showroomProducts={SHOWROOM_FLOOR_PRODUCTS}
        activeZone={activeZone}
        selectedProduct={selectedProduct}
        bagCount={totalBagCount}
        is2DMode={is2DMode}
        capability={capability}
        onSelectZone={handleSelectZone}
        onSwipeZone={handleSwipeZone}
        onSelectProduct={handleSelectProduct}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenLegal={handleOpenLegal}
        onToggle2DMode={() => setIs2DMode((prev) => !prev)}
      />

      {/* Primary Viewport: 3D Virtual Boutique OR Automatic/Toggleable 2D Luxury Fallback */}
      {is2DMode ? (
        <LuxuryFallback2D
          products={products}
          activeZone={activeZone}
          onSelectZone={handleSelectZone}
          onSelectProduct={handleSelectProduct}
          onQuickAddToBag={(product, shade) =>
            handleAddToBag(product, shade, 1)
          }
          onSwitchTo3D={() => setIs2DMode(false)}
          onOpenLegal={handleOpenLegal}
          supportsWebGL={capability.supportsWebGL}
        />
      ) : (
        <BoutiqueCanvas3D
          products={SHOWROOM_FLOOR_PRODUCTS}
          activeZone={activeZone}
          selectedProduct={selectedProduct}
          selectedShade={selectedShade}
          capability={capability}
          onSelectZone={handleSelectZone}
          onSelectProduct={handleSelectProduct}
          onSwipeZone={handleSwipeZone}
          onContextLost={() => setIs2DMode(true)}
        />
      )}

      {/* Product Presentation Sheet (Mobile Bottom Sheet / Desktop Editorial Glass Panel) */}
      {selectedProduct && selectedShade && (
        <ProductPresentationSheet
          product={selectedProduct}
          selectedShade={selectedShade}
          bagCount={totalBagCount}
          onSelectShade={setSelectedShade}
          onAddToBag={handleAddToBag}
          onOpenBag={() => setIsBagOpen(true)}
          onOpenLegal={handleOpenLegal}
          onClose={() => {
            setSelectedProduct(null);
            setSelectedShade(null);
          }}
          is2DMode={is2DMode}
        />
      )}

      {/* Persistent Shopping Bag & Shopify Checkout Drawer */}
      <ShoppingBagDrawer
        isOpen={isBagOpen}
        items={cartItems}
        onClose={() => setIsBagOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenLegal={handleOpenLegal}
      />

      {/* FDA / MoCRA Cosmetic Safety, FTC Shipping/Returns, CCPA/GDPR Privacy & WCAG Accessibility Modal */}
      <LegalComplianceModal
        isOpen={isLegalOpen}
        activeTab={activeLegalTab}
        onSelectTab={setActiveLegalTab}
        onClose={() => setIsLegalOpen(false)}
      />
    </main>
  );
}
