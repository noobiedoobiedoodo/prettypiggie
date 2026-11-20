'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { CartItem, LegalPolicyTab } from '@/types/boutique';
import {
  CheckoutSessionResult,
  initiateShopifyCheckout,
  isShopifyConfigured,
} from '@/lib/shopify';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onOpenLegal: (tab: LegalPolicyTab) => void;
}

const FREE_SHIPPING_THRESHOLD = 65;

export function ShoppingBagDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenLegal,
}: ShoppingBagDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<
    'shopify' | 'apple-pay' | 'shop-pay'
  >('shopify');
  const [completedSession, setCompletedSession] =
    useState<CheckoutSessionResult | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [caslMarketingOptIn, setCaslMarketingOptIn] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 7;
  const total = subtotal + shippingCost;

  const handleCheckout = async (
    method: 'shopify' | 'apple-pay' | 'shop-pay'
  ) => {
    if (items.length === 0) return;
    setCheckoutMethod(method);
    setIsCheckingOut(true);

    const session = await initiateShopifyCheckout(items, guestEmail);
    setIsCheckingOut(false);

    if (session.mode === 'shopify-live') {
      window.location.href = session.checkoutUrl;
      return;
    }

    setCompletedSession(session);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bag-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-piggie-950/55 backdrop-blur-sm"
    >
      <div className="relative flex h-full w-full max-w-md flex-col justify-between bg-white text-piggie-950 shadow-2xl">
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
                {items.reduce((acc, item) => acc + item.quantity, 0)} luxury
                items • Guest Checkout Ready
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCompletedSession(null);
              onClose();
            }}
            aria-label="Close shopping bag"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-piggie-50 text-piggie-700 hover:bg-piggie-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="border-b border-piggie-100 bg-piggie-50/80 px-5 py-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-piggie-800">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-piggie-600" />
              {amountToFreeShipping === 0 ? (
                <strong className="text-emerald-700">
                  You unlocked Free Express Boutique Shipping!
                </strong>
              ) : (
                <span>
                  Add <strong>${amountToFreeShipping.toFixed(2)}</strong> more
                  for <strong>Free Express Shipping</strong>
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-piggie-700">
              {Math.round(shippingProgress)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-piggie-200/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-piggie-500 to-rosegold-medium transition-all duration-500"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-piggie-700">
            U.S. Domestic Shipping Only (50 States & D.C.) • Canadian Shipping
            Disabled Pending Regulatory Gate
          </p>
        </div>

        {/* Completed Order Preview Receipt or Cart Line Items */}
        {completedSession ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-rosegold bg-white p-2 shadow-md">
              <img
                src="/brand/prettypiggie-logo.png"
                alt="Pretty Piggie Makeup"
                className="h-full w-full object-contain"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-piggie-100 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-piggie-800">
                {checkoutMethod === 'apple-pay'
                  ? 'Apple Pay Express'
                  : checkoutMethod === 'shop-pay'
                  ? 'Shop Pay One-Tap'
                  : 'Shopify Guest Checkout'}
              </span>
              {completedSession.mode === 'shopify-preview' && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Sandbox Preview • No Live Charge
                </span>
              )}
            </div>

            <h3 className="mt-2 font-serif text-2xl font-bold text-piggie-950">
              Merci! Order Preview Confirmed
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-piggie-700">
              Your Pretty Piggie Makeup Virtual Boutique order{' '}
              <strong className="text-piggie-950">
                #{completedSession.orderReference}
              </strong>{' '}
              is ready for Shopify fulfillment.
              {completedSession.guestEmail && (
                <span className="mt-1 block">
                  Confirmation email:{' '}
                  <strong className="text-piggie-950">
                    {completedSession.guestEmail}
                  </strong>
                </span>
              )}
            </p>

            <div className="mt-5 w-full rounded-2xl border border-piggie-100 bg-piggie-50/70 p-4 text-left text-xs">
              <div className="flex justify-between border-b border-piggie-100 pb-2 font-semibold text-piggie-900">
                <span>Shopify Cart ID</span>
                <span className="font-mono text-[10px] text-piggie-700">
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
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-piggie-200 pt-2 text-sm font-bold text-piggie-950">
                <span>Order Total</span>
                <span>${total.toFixed(2)} USD</span>
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
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-piggie-50 text-piggie-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold text-piggie-950">
              Your Boutique Bag is Empty
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-piggie-600">
              Tap any illuminated lipstick, compact, or brush inside the 3D
              showroom to try shades and add them to your bag.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-full bg-piggie-950 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-piggie-900"
            >
              Explore the 3D Showroom
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-piggie-100 bg-piggie-50/50 p-3.5 transition hover:border-piggie-200"
              >
                {/* Branded Product Thumbnail or Shade Swatch Orb */}
                {item.primaryImage ? (
                  <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-2xl border border-piggie-200 bg-white p-1 shadow-sm">
                    <img
                      src={item.primaryImage}
                      alt={item.title}
                      className="h-11 w-11 object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white shadow-md"
                    style={{ backgroundColor: item.shadeHex }}
                  />
                )}

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-piggie-950">
                    {item.title}
                  </h4>
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
                      <span className="px-2 text-xs font-bold text-piggie-950">
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
                <div className="text-right text-sm font-bold text-piggie-950">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            {/* Optional Guest Order Notification Email (With CCPA/GDPR Disclosure & Label Linkage) */}
            <div className="mt-4 rounded-2xl border border-piggie-100 bg-white p-3.5">
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
          <div className="border-t border-piggie-100 bg-white px-5 py-4 pb-6">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-piggie-700">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-piggie-700">
                <span>Boutique Express Shipping</span>
                <span>
                  {shippingCost === 0 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-piggie-100 pt-1.5 text-sm font-bold text-piggie-950">
                <span>Estimated Total</span>
                <span>${total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Express Mobile Pay Buttons (Apple Pay / Shop Pay) */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => handleCheckout('apple-pay')}
                className="flex items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-xs font-bold text-white shadow transition hover:bg-neutral-800 active:scale-98"
              >
                <span> Pay</span>
              </button>
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={() => handleCheckout('shop-pay')}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#5A31F4] py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#4922D9] active:scale-98"
              >
                <span>Shop Pay</span>
              </button>
            </div>

            {/* Primary Shopify Guest Checkout CTA */}
            <button
              type="button"
              disabled={isCheckingOut}
              onClick={() => handleCheckout('shopify')}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-piggie-900 hover:to-piggie-800 active:scale-98"
            >
              <Lock className="h-3.5 w-3.5 text-rosegold-light" />
              <span>
                {isCheckingOut
                  ? 'Connecting to Shopify Checkout...'
                  : `Proceed to Shopify Checkout • $${total.toFixed(2)}`}
              </span>
            </button>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-center text-[10px] text-piggie-600">
              <span>
                {isShopifyConfigured()
                  ? 'Secured by Shopify Storefront API'
                  : 'Shopify Storefront Ready'}
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
