'use client';

import React from 'react';
import {
  Eye,
  FileText,
  HeartHandshake,
  Lock,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react';
import { LegalPolicyTab } from '@/types/boutique';

interface LegalComplianceModalProps {
  isOpen: boolean;
  activeTab: LegalPolicyTab;
  onSelectTab: (tab: LegalPolicyTab) => void;
  onClose: () => void;
}

const TABS: Array<{
  id: LegalPolicyTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'shipping', label: 'Shipping & Returns', icon: Truck },
  { id: 'safety', label: 'FDA / MoCRA Safety', icon: ShieldAlert },
  { id: 'privacy', label: 'Privacy (CCPA/GDPR)', icon: Lock },
  { id: 'terms', label: 'Terms of Sale', icon: FileText },
  { id: 'accessibility', label: 'Accessibility (ADA)', icon: Eye },
];

export function LegalComplianceModal({
  isOpen,
  activeTab,
  onSelectTab,
  onClose,
}: LegalComplianceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-piggie-950/65 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-piggie-100 bg-white text-piggie-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-piggie-100 bg-gradient-to-r from-piggie-50 via-white to-piggie-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/brand/prettypiggie-logo.png"
              alt="Pretty Piggie Makeup"
              className="h-10 w-10 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm"
            />
            <div>
              <h2
                id="legal-modal-title"
                className="font-serif text-lg font-bold text-piggie-950 md:text-xl"
              >
                Pretty Piggie Makeup — Customer Care, Safety & Legal Policies
              </h2>
              <p className="text-[11px] text-piggie-600">
                FDA / MoCRA Cosmetic Safety • FTC Consumer Protection • CCPA /
                GDPR Privacy • WCAG 2.1 AA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal and customer care policies"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-piggie-100 text-piggie-800 hover:bg-piggie-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Policy Tab Bar */}
        <div
          role="tablist"
          aria-label="Legal and compliance policy sections"
          className="flex flex-wrap gap-1.5 border-b border-piggie-100 bg-piggie-50/60 px-5 py-2.5"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-piggie-950 text-white shadow-sm'
                    : 'bg-white text-piggie-700 hover:bg-piggie-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-xs leading-relaxed text-piggie-800">
          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                Shipping & 30-Day Shade Guarantee Policy
              </h3>
              <p>
                <strong>Free Express Boutique Shipping ($65+ USD):</strong>{' '}
                Orders totaling $65.00 USD or more before tax qualify
                automatically for complimentary tracked shipping within the
                United States and Canada. Orders under $65.00 ship at a flat
                rate of $7.00 USD.
              </p>
              <p>
                <strong>Fulfillment & Delivery Timeline (FTC 16 CFR Part 435):</strong>{' '}
                In-stock items are processed within 1–2 business days and
                typically arrive within 3–7 business days via tracked carrier.
                If an unexpected delay occurs, we will notify you promptly with
                the option to consent to the new timeline or receive an
                immediate full refund.
              </p>
              <p>
                <strong>30-Day Shade Guarantee & Easy Returns:</strong> We want
                you to love your Pretty Piggie Makeup shade. If a product or
                shade is not your match, you may request a free exchange or full
                refund to your original payment method within 30 days of
                delivery. Gently swatched items qualify under our 30-Day Shade
                Guarantee; returned cosmetics are never restocked and are
                responsibly recycled.
              </p>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                FDA / MoCRA Cosmetic Safety, INCI Labeling & Adverse Event
                Reporting
              </h3>
              <p>
                <strong>Complete INCI Ingredient Transparency (21 CFR § 701.3):</strong>{' '}
                Every product in the Pretty Piggie Makeup Virtual Boutique
                includes a full International Nomenclature of Cosmetic
                Ingredients (INCI) declaration and `[+/- May Contain]` color
                additive disclosure under the <strong>Ingredients</strong> tab
                on its product presentation sheet.
              </p>
              <p>
                <strong>Patch Test & External Use Advisory:</strong> All
                cosmetics and skincare products are for external use only. Avoid
                direct contact with the inner eye. We recommend performing a
                24-hour skin patch test on the inner forearm prior to first use.
                Discontinue use immediately and consult a physician if
                redness, rash, or irritation develops.
              </p>
              <p>
                <strong>AHA / Retinoid Sunburn Alert:</strong> Products
                containing Alpha-Hydroxy Acids (such as Glycolic Acid) or
                Retinoids may increase your skin’s sensitivity to the sun. Use a
                broad-spectrum sunscreen, wear protective clothing, and limit
                sun exposure while using these products and for one week
                afterwards.
              </p>
              <p>
                <strong>Sunless Tanner Warning (21 CFR § 740.19):</strong>{' '}
                Self-tanning drops and mousses do not contain a sunscreen and do
                not protect against sunburn. Repeated exposure of unprotected
                skin while tanning may increase the risk of skin aging, skin
                cancer, and other harmful effects to the skin even if you do not
                burn.
              </p>
              <div className="rounded-2xl border border-piggie-200 bg-piggie-50 p-3.5">
                <strong className="block text-piggie-950">
                  MoCRA Responsible Person & Adverse Event Contact (21 U.S.C. §
                  364e):
                </strong>
                <span className="mt-1 block text-piggie-700">
                  Pretty Piggie Makeup Consumer Safety Desk • Email:{' '}
                  <strong>safety@prettypiggie.com</strong> • Customer Care:{' '}
                  <strong>support@prettypiggie.com</strong>. Please report any
                  unexpected product reaction or quality concern with the
                  product SKU and batch code.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                Privacy Policy & Notice at Collection (CCPA / CPRA / GDPR)
              </h3>
              <p>
                <strong>Information We Collect:</strong> PrettyPiggie.com stores
                your active Shopping Bag locally in your browser (
                <code>localStorage</code>) so your selected shades persist
                during your visit. If you enter an optional email address for
                Guest Checkout tracking or complete a purchase via Shopify
                Checkout, we collect only the contact, shipping, and payment
                details required to fulfill your order.
              </p>
              <p>
                <strong>How We Use Your Information:</strong> Your information
                is used strictly for order processing, delivery updates, and
                customer support. We <strong>do not sell or share</strong> your
                personal information for cross-context behavioral advertising
                under the California Consumer Privacy Act (CCPA/CPRA).
              </p>
              <p>
                <strong>Your Privacy Rights:</strong> You have the right to
                request access to, correction of, or deletion of your personal
                data at any time by contacting{' '}
                <strong>privacy@prettypiggie.com</strong>.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                Terms of Service & Conditions of Sale
              </h3>
              <p>
                <strong>Pricing & Currency:</strong> All prices displayed inside
                the Pretty Piggie Makeup 3D Virtual Boutique and 2D Catalog are
                listed in United States Dollars (USD). Applicable sales tax and
                shipping charges (if under the $65.00 free shipping threshold)
                are calculated transparently at checkout prior to payment.
              </p>
              <p>
                <strong>Color & 3D Shade Representation:</strong> Our 3D PBR
                shaders and RGB shade swatches are calibrated directly against
                physical product formulations; however, subtle variations may
                occur across different screen calibrations and lighting
                environments. All purchases are covered by our 30-Day Shade
                Guarantee.
              </p>
              <p>
                <strong>Cosmetic Appearance Claims:</strong> Product
                descriptions refer strictly to cosmetic appearance benefits
                (such as moisturizing, smoothing, or brightening the look of
                skin) and are not intended to diagnose, treat, cure, or prevent
                any medical condition.
              </p>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                ADA & WCAG 2.1 AA Digital Accessibility Statement
              </h3>
              <p>
                <strong>Accessible by Design:</strong> PrettyPiggie.com is
                engineered so every customer can explore and shop our collection
                effortlessly, regardless of device capability, assistive
                technology, or motion sensitivity.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Instant 2D Catalog Mode:</strong> Customers using
                  screen readers, keyboard-only navigation, or low-GPU devices
                  can switch to our full <strong>2D Catalog Mode</strong> at any
                  time via the top navigation bar.
                </li>
                <li>
                  <strong>Reduced Motion Support:</strong> Our 3D showroom
                  automatically detects <code>prefers-reduced-motion</code> to
                  disable particle effects, auto-rotation, and long camera
                  flights.
                </li>
                <li>
                  <strong>Keyboard & Zoom Support:</strong> Supports browser
                  pinch-to-zoom up to 500%, full keyboard navigation (
                  <code>Tab</code>, <code>ArrowLeft</code>,{' '}
                  <code>ArrowRight</code>, <code>Escape</code>), and high
                  contrast text controls.
                </li>
              </ul>
              <p>
                Need assistance placing an order? Contact{' '}
                <strong>accessibility@prettypiggie.com</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-piggie-100 bg-piggie-50/70 px-6 py-3.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-piggie-700">
            <HeartHandshake className="h-4 w-4 text-piggie-600" />
            Pretty Piggie Makeup • Official Brand Policies
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-piggie-950 px-5 py-2 text-xs font-bold text-white shadow hover:bg-piggie-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
