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
  { id: 'shipping', label: 'Shipping & Market Scope', icon: Truck },
  { id: 'safety', label: 'FDA / MoCRA & Health Canada', icon: ShieldAlert },
  { id: 'privacy', label: 'Privacy (CCPA / PIPEDA)', icon: Lock },
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
                Pretty Piggie Makeup — Regulatory, Privacy & Customer Care
                Center
              </h2>
              <p className="text-[11px] text-piggie-600">
                US FDA / MoCRA • Health Canada Cosmetic Regulations • CCPA /
                PIPEDA / CASL • WCAG 2.1 AA
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
                U.S. Domestic Shipping Scope & 30-Day Shade Guarantee
              </h3>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                <strong>Initial Launch Market Scope (U.S. Only):</strong>{' '}
                Checkout and carrier delivery are currently restricted to
                addresses within the <strong>50 United States and D.C.</strong>{' '}
                (enforced via <code>buyerIdentity.countryCode = &apos;US&apos;</code>).
                Canadian and international shipping are disabled until Canadian
                bilingual packaging, Hotlist concentration certificates, and
                post-sale CNF workflows are cleared for activation.
              </div>
              <p>
                <strong>Free Express Boutique Shipping ($65+ USD):</strong>{' '}
                Orders totaling $65.00 USD or more before tax qualify
                automatically for complimentary tracked shipping within the
                United States. Orders under $65.00 ship at a flat rate of $7.00
                USD.
              </p>
              <p>
                <strong>Fulfillment Timeline (FTC 16 CFR Part 435):</strong>{' '}
                Verified in-stock items are processed within 1–2 business days
                and typically arrive within 3–7 business days via tracked
                carrier. If an unexpected delay occurs, we will notify you
                promptly with the option to consent to the revised timeline or
                receive an immediate full refund.
              </p>
              <p>
                <strong>30-Day Shade Guarantee & Easy Returns:</strong> If a
                verified product or shade is not your match, you may request a
                free exchange or full refund to your original payment method
                within 30 days of delivery.
              </p>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                US FDA / MoCRA & Health Canada Cosmetic Regulatory Controls
              </h3>
              <p>
                <strong>Strict Manufacturer INCI Verification Policy (21 CFR § 701.3):</strong>{' '}
                PrettyPiggie.com prohibits synthetic, reconstructed, or inferred
                ingredient declarations. Only products with a complete,
                untruncated manufacturer INCI declaration on file (
                <code>VERIFIED_COMPLETE</code> — 56 products) are enabled for
                commercial checkout. Products whose manufacturer INCI record is
                pending full specification verification (54 products) are marked{' '}
                <strong>UNVERIFIED</strong> and are programmatically locked from
                purchase.
              </p>
              <p>
                <strong>
                  Bilingual English & French Cautionary Warnings (
                  <em>Cosmetic Regulations</em> s. 18 & 24):
                </strong>{' '}
                All product presentation sheets display bilingual English (
                <code>WARNING</code>) and French (<code>MISE EN GARDE</code>)
                cautionary disclosures, including AHA/Retinoid Sunburn Alerts,
                21 CFR § 740.19 Sunless Tanner Warnings, CPSC Candle Fire-Safety
                Warnings, and External Use / Patch-Test Advisories.
              </p>
              <p>
                <strong>
                  Health Canada Cosmetic Notification Form (CNF) Workflow (
                  <em>Cosmetic Regulations</em> s. 30):
                </strong>{' '}
                Under section 30 of Canada&apos;s <em>Cosmetic Regulations</em>,
                manufacturers and importers must submit a Cosmetic Notification
                Form (CNF) to Health Canada <strong>within 10 days after first
                sale in Canada</strong>. PrettyPiggie maintains a pre-sale
                Health Canada Hotlist and CNF preparation register; Canadian
                checkout remains disabled until all Hotlist concentration CoAs
                and Quebec Bill 96 requirements are finalized.
              </p>
              <div className="rounded-2xl border border-piggie-200 bg-piggie-50 p-3.5">
                <strong className="block text-piggie-950">
                  MoCRA Responsible Person & Adverse Event Contact (21 U.S.C. §
                  364e):
                </strong>
                <span className="mt-1 block text-piggie-700">
                  Pretty Piggie Makeup Consumer Safety Desk • Electronic Adverse
                  Event Intake: <strong>safety@prettypiggie.com</strong> •
                  Customer Care: <strong>support@prettypiggie.com</strong> (U.S.
                  physical street address and domestic telephone number to be
                  populated by the Brand Owner prior to General Availability
                  sign-off).
                </span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                Privacy Policy & Notice at Collection (CCPA / CPRA • Canadian
                PIPEDA • CASL • GDPR)
              </h3>
              <p>
                <strong>1. Information Collected & Purpose:</strong>{' '}
                PrettyPiggie.com stores your active Shopping Bag locally in your
                browser (<code>localStorage</code>) containing only public
                product identifiers, shade selections, and retail prices. If you
                provide an optional email address in the Shopping Bag Drawer, it
                is transmitted to Shopify Checkout solely for transactional
                order confirmation and carrier tracking updates.
              </p>
              <p>
                <strong>2. Canadian PIPEDA Fair Information Principles:</strong>{' '}
                In accordance with Canada&apos;s{' '}
                <em>
                  Personal Information Protection and Electronic Documents Act
                  (PIPEDA)
                </em>{' '}
                and provincial privacy statutes (including Quebec Law 25), we
                collect, use, and disclose personal information only with your
                knowledge and consent, limit collection to what is strictly
                necessary for order fulfillment, and safeguard data via TLS
                encryption and Shopify&apos;s PCI-DSS Level 1 infrastructure.
                Data may be processed in the United States and Canada.
              </p>
              <p>
                <strong>3. CASL (Canadian Anti-Spam Legislation) & Marketing Consent:</strong>{' '}
                We never send commercial electronic messages (CEMs) without your
                separate, unchecked-by-default <strong>Express Consent</strong>.
                Transactional order receipts and shipping alerts are exempt
                under CASL s. 6(6). You may withdraw marketing consent at any
                time.
              </p>
              <p>
                <strong>4. CCPA / CPRA Rights:</strong> We do not sell or share
                personal information for cross-context behavioral advertising.
                To exercise access, correction, or deletion rights under PIPEDA,
                CCPA, or GDPR, contact our Privacy Officer at{' '}
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
                <strong>Pricing & Availability:</strong> All prices are listed
                in United States Dollars (USD). Products designated{' '}
                <code>UNVERIFIED</code> are displayed strictly for 3D virtual
                showroom preview and do not constitute an offer for sale until
                manufacturer documentation verification is complete.
              </p>
              <p>
                <strong>Cosmetic Appearance Representations:</strong> All
                product descriptions refer strictly to cosmetic cleansing,
                beautifying, or appearance-enhancing benefits and are not
                intended to diagnose, treat, cure, or prevent any disease or
                alter physiological structure.
              </p>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-bold text-piggie-950">
                ADA & WCAG 2.1 AA Digital Accessibility Statement
              </h3>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Instant 2D Catalog Mode:</strong> Switch between the
                  3D Virtual Showroom and the full 2D Catalog at any time via
                  the top header or <code>/?mode=2d</code>.
                </li>
                <li>
                  <strong>Reduced Motion & Context Recovery:</strong> Respects{' '}
                  <code>prefers-reduced-motion</code> and automatically
                  transitions to 2D Mode if a mobile browser reclaims the WebGL
                  context.
                </li>
                <li>
                  <strong>Zoom & Keyboard Navigation:</strong> Supports 500%
                  pinch-to-zoom, semantic buttons, ARIA dialogs/tabs, and full
                  keyboard navigation.
                </li>
              </ul>
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
