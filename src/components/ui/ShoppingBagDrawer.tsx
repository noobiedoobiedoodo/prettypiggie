'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { getBagCrossSells } from '@/data/boutiqueData';
import { isProductPurchasable } from '@/lib/purchaseGuard';
import {
  BoutiqueProduct,
  CartItem,
  LegalPolicyTab,
  ProductShade,
} from '@/types/boutique';
import {
  CheckoutSessionResult,
  PENDING_SHOPIFY_CART_STORAGE_KEY,
  PurchaseLockError,
  initiateShopifyCheckout,
  isShopifyConfigured,
} from '@/lib/shopify';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  allProducts: BoutiqueProduct[];
  onClose: () => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemoveItem: (key: string) => void;
  onQuickAddToBag: (product: BoutiqueProduct, shade: ProductShade) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onClearCart: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
}

const FREE_SHIPPING_THRESHOLD = 65;
const EMPTY_BAG_CURATED_HANDLES = [
  'luminizing-powder',
  'bronzer',
  'classic-blender',
];

export function ShoppingBagDrawer({
  isOpen,
  items,
  allProducts,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onQuickAddToBag,
  onSelectProduct,
  onClearCart,
  onOpenLegal,
}: ShoppingBagDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedSession, setCompletedSession] =
    useState<CheckoutSessionResult | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [caslMarketingOptIn, setCaslMarketingOptIn] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 7;
  const total = subtotal + shippingCost;

  const crossSellProducts = useMemo(
    () =>
      items.length > 0
        ? getBagCrossSells(allProducts, items, amountToFreeShipping, 3)
        : [],
    [allProducts, amountToFreeShipping, items]
  );

  const emptyBagIcons = useMemo(() => {
    const byHandle = new Map(allProducts.map((p) => [p.handle, p]));
    const picked: BoutiqueProduct[] = [];
    for (const handle of EMPTY_BAG_CURATED_HANDLES) {
      const candidate = byHandle.get(handle);
      if (
        candidate &&
        candidate.shades[0] &&
        isProductPurchasable(candidate, candidate.shades[0])
      ) {
        picked.push(candidate);
      }
    }
    return picked;
  }, [allProducts]);

  if (!isOpen) return null;

  const handleCloseDrawer = () => {
    setCompletedSession(null);
    onClose();
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const session = await initiateShopifyCheckout(
        items,
        guestEmail,
        caslMarketingOptIn
      );
      setIsCheckingOut(false);

      if (session.mode === 'shopify-live' && !session.isSimulatedPreview) {
        let isSafeHttpsRedirect = false;
        try {
          const parsedRedirect = new URL(session.checkoutUrl);
          isSafeHttpsRedirect = parsedRedirect.protocol === 'https:';
        } catch {
          isSafeHttpsRedirect = false;
        }
        if (!isSafeHttpsRedirect) {
          setCheckoutError(
            'Checkout redirect failed security validation. Please contact support.'
          );
          return;
        }
        try {
          window.sessionStorage.setItem(
            PENDING_SHOPIFY_CART_STORAGE_KEY,
            session.cartId
          );
        } catch {
          // Ignore sessionStorage restrictions
        }
        window.location.href = session.checkoutUrl;
        return;
      }

      setCompletedSession(session);
    } catch (err) {
      setIsCheckingOut(false);
      if (err instanceof PurchaseLockError) {
        setCheckoutError(err.message);
      } else {
        setCheckoutError(
          'Unable to initialize checkout right now. Please try again.'
        );
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bag-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseDrawer();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-piggie-950/55 backdrop-blur-sm"
    >
      <div className="animate-drawer-in relative flex h-full w-full max-w-md flex-col justify-between bg-white text-piggie-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-piggie-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/prettypiggie-logo.png"
              alt="Pretty Piggie Makeup"
              className="h-10 w-10 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm"
            />
            <div>
              <h2
                id="bag-drawer-title"
                className="font-serif text-lg font-bold text-piggie-950"
              >
                Pretty Piggie Makeup Bag
              </h2>
              <p className="text-[11px] text-piggie-600">
                <span className="tabular-nums">{totalQuantity}</span>{' '}
                {totalQuantity === 1 ? 'luxury item' : 'luxury items'} • Guest
                Checkout Ready
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close shopping bag"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-piggie-50 text-piggie-700 transition hover:bg-piggie-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="border-b border-piggie-100 bg-piggie-50/80 px-5 py-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-piggie-800">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-piggie-600" />
              {amountToFreeShipping === 0 && subtotal > 0 ? (
                <strong className="text-emerald-700">
                  You unlocked Free Express Boutique Shipping!
                </strong>
              ) : (
                <span>
                  Add{' '}
                  <strong className="tabular-nums">
                    ${amountToFreeShipping.toFixed(2)}
                  </strong>{' '}
                  more for <strong>Free Express Shipping</strong>
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold tabular-nums text-piggie-700">
              {Math.round(shippingProgress)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-piggie-200/70">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                amountToFreeShipping === 0 && subtotal > 0
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-piggie-500 to-rosegold-medium'
              }`}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-piggie-700">
            U.S. Domestic Shipping Scope Only (50 States &amp; D.C.) • Canadian
            &amp; International Shipping Disabled
          </p>
        </div>

        {/* Server-Side Purchase Lock or Checkout Rejection Banner */}
        {checkoutError && (
          <div
            role="alert"
            className="mx-5 mt-3 rounded-2xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-900"
          >
            <strong className="block font-bold">Checkout Blocked:</strong>
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Completed Order Preview Receipt or Cart Line Items */}
        {completedSession ? (
          <div className="piggie-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-rosegold bg-white p-2 shadow-md">
              <img
                src="/brand/prettypiggie-logo.png"
                alt="Pretty Piggie Makeup"
                className="h-full w-full object-contain"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white shadow">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-piggie-100 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-piggie-800">
                Shopify Hosted Checkout
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 ring-1 ring-amber-300">
                Simulated Sandbox Preview • Not a Live Order
              </span>
            </div>

            <h3 className="mt-2 font-serif text-2xl font-bold text-piggie-950">
              Sandbox Checkout Preview Only
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-piggie-700">
              Preview Reference{' '}
              <strong className="text-piggie-950">
                #{completedSession.orderReference}
              </strong>{' '}
              passed server-side INCI purchase-lock validation.{' '}
              <strong className="text-amber-900">
                No real payment, order, or shipment was created
              </strong>{' '}
              because live Shopify Storefront credentials are not yet connected.
              {completedSession.guestEmail && (
                <span className="mt-1 block">
                  Preview email field:{' '}
                  <strong className="text-piggie-950">
                    {completedSession.guestEmail}
                  </strong>
                </span>
              )}
            </p>

            <div className="mt-5 w-full rounded-2xl border border-piggie-100 bg-piggie-50/70 p-4 text-left text-xs">
              <div className="flex justify-between border-b border-piggie-100 pb-2 font-semibold text-piggie-900">
                <span>Sandbox Preview ID</span>
                <span className="select-text font-mono text-[10px] text-piggie-700">
                  {completedSession.cartId}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-piggie-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15"
                        style={{ backgroundColor: item.shadeHex }}
                      />
                      <span>
                        {item.quantity}× {item.title} ({item.shadeName})
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-piggie-200 pt-2 text-sm font-bold text-piggie-950">
                <span>Order Total</span>
                <span className="tabular-nums">${total.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCompletedSession(null);
                onClearCart();
                onClose();
              }}
              className="mt-6 w-full rounded-full bg-piggie-950 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-piggie-900"
            >
              Continue Exploring Virtual Boutique
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="piggie-scrollbar flex flex-1 flex-col justify-between overflow-y-auto px-5 py-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-piggie-50 text-piggie-600 ring-1 ring-piggie-100">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-serif text-xl font-bold text-piggie-950">
                Your Boutique Bag is Empty
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-piggie-600">
                Start with a ready-to-ship Pretty Piggie favorite below or
                explore the 3D showroom to try shades.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-full bg-piggie-950 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-piggie-900 active:scale-95"
              >
                Explore the 3D Showroom
              </button>
            </div>

            {/* Curated Ready-to-Ship Starter Icons (Strictly VERIFIED_IN_STOCK) */}
            {emptyBagIcons.length > 0 && (
              <div className="mt-6 border-t border-piggie-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-piggie-700">
                    Ready-to-Ship Boutique Icons
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    Verified In Stock
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {emptyBagIcons.map((iconProd) => {
                    const defaultShade = iconProd.shades[0];
                    if (!defaultShade) return null;
                    return (
                      <div
                        key={iconProd.id}
                        className="flex items-center gap-3 rounded-2xl border border-piggie-100 bg-piggie-50/45 p-2.5 transition hover:border-piggie-200"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectProduct(iconProd)}
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-piggie-100 bg-white p-1"
                        >
                          {iconProd.primaryImage ? (
                            <img
                              src={iconProd.primaryImage}
                              alt={iconProd.title}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span
                              className="block h-full w-full rounded-lg"
                              style={{ backgroundColor: defaultShade.hex }}
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectProduct(iconProd)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-xs font-bold text-piggie-950">
                            {iconProd.title}
                          </p>
                          <p className="text-[11px] text-piggie-600">
                            {iconProd.category} •{' '}
                            <strong className="tabular-nums text-piggie-900">
                              ${iconProd.price.toFixed(2)}
                            </strong>
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onQuickAddToBag(iconProd, defaultShade)
                          }
                          className="flex shrink-0 items-center gap-1 rounded-full bg-piggie-950 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-piggie-800 active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="piggie-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {items.map((item) => {
              const matchedProduct = allProducts.find(
                (p) => p.id === item.productId
              );
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-piggie-100 bg-piggie-50/50 p-3.5 transition hover:border-piggie-200"
                >
                  {/* Branded Product Thumbnail or Shade Swatch Orb */}
                  {item.primaryImage ? (
                    <button
                      type="button"
                      onClick={() =>
                        matchedProduct && onSelectProduct(matchedProduct)
                      }
                      aria-label={`Inspect ${item.title}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-piggie-200 bg-white p-1 shadow-sm"
                    >
                      <img
                        src={item.primaryImage}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />
                      <span
                        className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: item.shadeHex }}
                      />
                    </button>
                  ) : (
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white shadow-md"
                      style={{ backgroundColor: item.shadeHex }}
                    />
                  )}

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        matchedProduct && onSelectProduct(matchedProduct)
                      }
                      className="block max-w-full truncate text-left text-xs font-bold text-piggie-950 hover:underline"
                    >
                      {item.title}
                    </button>
                    <p className="mt-0.5 text-[11px] font-medium text-piggie-700">
                      {item.shadeName} • {item.finish}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-piggie-200 bg-white px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.key, item.quantity - 1)
                          }
                          aria-label={`Decrease quantity of ${item.title}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-piggie-800 hover:bg-piggie-50"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-bold tabular-nums text-piggie-950">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.key, item.quantity + 1)
                          }
                          aria-label={`Increase quantity of ${item.title}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-piggie-800 hover:bg-piggie-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Remove ${item.title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-piggie-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Subtotal */}
                  <div className="text-right text-sm font-bold tabular-nums text-piggie-950">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}

            {/* Dynamic VERIFIED_IN_STOCK-Only AOV Cross-Sell Strip */}
            {crossSellProducts.length > 0 && (
              <div className="rounded-2xl border border-piggie-100 bg-gradient-to-b from-piggie-50/70 to-white p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-piggie-800">
                    <Sparkles className="h-3 w-3 text-piggie-600" />
                    {amountToFreeShipping > 0
                      ? 'Add 1 Essential to Unlock Free Shipping'
                      : 'Complete Your Routine'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    Ready to Ship
                  </span>
                </div>

                <div className="piggie-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto pb-1">
                  {crossSellProducts.map((rec) => {
                    const defaultShade = rec.shades[0];
                    if (
                      !defaultShade ||
                      !isProductPurchasable(rec, defaultShade)
                    ) {
                      return null;
                    }
                    const unlocksFreeShipping =
                      amountToFreeShipping > 0 &&
                      rec.price >= amountToFreeShipping;
                    return (
                      <div
                        key={rec.id}
                        className="flex w-40 shrink-0 flex-col justify-between rounded-xl border border-piggie-100 bg-white p-2.5 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectProduct(rec)}
                          className="text-left"
                        >
                          <div className="relative flex h-16 items-center justify-center rounded-lg bg-piggie-50/60 p-1">
                            {rec.primaryImage ? (
                              <img
                                src={rec.primaryImage}
                                alt={rec.title}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span
                                className="h-8 w-8 rounded-full ring-1 ring-black/15"
                                style={{ backgroundColor: defaultShade.hex }}
                              />
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-1 text-[11px] font-bold text-piggie-950">
                            {rec.title}
                          </p>
                        </button>

                        {unlocksFreeShipping && (
                          <span className="mt-1 inline-block w-fit rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                            Unlocks Free Shipping
                          </span>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="text-xs font-bold tabular-nums text-piggie-950">
                            ${rec.price.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuickAddToBag(rec, defaultShade)}
                            aria-label={`Add ${rec.title} to bag`}
                            className="inline-flex items-center gap-0.5 rounded-full bg-piggie-950 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-piggie-800 active:scale-95"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Guest Order Notification Email (With CCPA/GDPR Disclosure & Label Linkage) */}
            <div className="mt-2 rounded-2xl border border-piggie-100 bg-white p-3.5">
              <label
                htmlFor="guest-checkout-email"
                className="block text-[11px] font-semibold text-piggie-800"
              >
                Optional Guest Tracking Email (No Account Required)
              </label>
              <input
                id="guest-checkout-email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@example.com (for tracking updates)"
                className="mt-1.5 w-full rounded-xl border border-piggie-200 bg-piggie-50/40 px-3 py-2 text-base text-piggie-950 placeholder:text-piggie-600/60 focus:border-piggie-600 focus:outline-none sm:text-xs"
              />
              <p className="mt-1.5 text-[10px] leading-snug text-piggie-600">
                Transactional only: used solely for order receipt and carrier
                tracking under our{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="font-bold text-piggie-800 underline hover:text-piggie-950"
                >
                  Privacy Policy (CCPA / PIPEDA / GDPR)
                </button>
                .
              </p>
              <label className="mt-2 flex cursor-pointer items-start gap-2 border-t border-piggie-100 pt-2 text-[10px] leading-snug text-piggie-700">
                <input
                  type="checkbox"
                  checked={caslMarketingOptIn}
                  onChange={(e) => setCaslMarketingOptIn(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-piggie-300 text-piggie-800 focus:ring-piggie-600"
                />
                <span>
                  Optional (CASL / CAN-SPAM Express Consent): Send me occasional
                  Pretty Piggie Makeup collection updates. You may unsubscribe at
                  any time.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Sticky Conversion Checkout Footer */}
        {!completedSession && items.length > 0 && (
          <div className="border-t border-piggie-100 bg-white px-5 pt-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-piggie-700">
                <span>Subtotal</span>
                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-piggie-700">
                <span>Boutique Express Shipping</span>
                <span className="tabular-nums">
                  {shippingCost === 0 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-piggie-100 pt-1.5 text-sm font-bold text-piggie-950">
                <span>Estimated Total</span>
                <span className="tabular-nums">${total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Primary Shopify Hosted Checkout CTA (Native Apple Pay, Shop Pay & Cards Presented Inside Shopify Checkout) */}
            <button
              type="button"
              disabled={isCheckingOut}
              onClick={handleCheckout}
              className="btn-luxury-sheen mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-piggie-900 hover:to-piggie-800 active:scale-98 disabled:opacity-60"
            >
              <Lock className="h-3.5 w-3.5 text-rosegold-light" />
              <span className="tabular-nums">
                {isCheckingOut
                  ? 'Connecting to Shopify Checkout...'
                  : `Proceed to Shopify Checkout • $${total.toFixed(2)}`}
              </span>
            </button>

            <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-piggie-700">
              <span className="rounded-md border border-piggie-200 bg-piggie-50 px-2 py-0.5">
                Apple Pay
              </span>
              <span className="rounded-md border border-piggie-200 bg-piggie-50 px-2 py-0.5">
                Shop Pay
              </span>
              <span className="rounded-md border border-piggie-200 bg-piggie-50 px-2 py-0.5">
                Cards
              </span>
            </div>

            <p className="mt-1.5 text-center text-[10px] font-medium text-piggie-700">
              Apple Pay, Shop Pay &amp; major cards available inside Shopify
              Hosted Checkout • Final shipping &amp; tax calculated at checkout
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center text-[10px] text-piggie-600">
              <span>
                {isShopifyConfigured()
                  ? 'Secured by Shopify Storefront API'
                  : 'Encrypted Checkout via Shopify'}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('shipping')}
                className="font-semibold underline hover:text-piggie-950"
              >
                30-Day Returns
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="font-semibold underline hover:text-piggie-950"
              >
                Terms
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="font-semibold underline hover:text-piggie-950"
              >
                Privacy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
