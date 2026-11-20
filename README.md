# PrettyPiggie.com — Mobile-First 3D Virtual Makeup Boutique

A luxury, **mobile-first 3D virtual makeup boutique** engineered with **Next.js**, **Three.js**, **React Three Fiber**, **GSAP**, and the **Shopify Storefront GraphQL API**.

Designed primarily for **iPhone Safari** and **Android Chrome** (specifically social traffic arriving from TikTok and Instagram), with enhanced tablet and desktop showroom adaptations built on the same underlying architecture.

---

## Key Features

- **Portrait-First 3D Virtual Showroom (`9:16` Priority):**
  - **Grand Chandelier Rotunda:** Recessed oval ceiling cove with a crystal & rose-gold chandelier, polished reflective blush-marble floor, and 360° navigation.
  - **The Makeup Wall:** Triple rounded wall alcoves framed in warm glowing LED tubing beneath a sculptural lotus-petal chandelier (`design idea/Screenshot 2026-11-18 220304.png`).
  - **The Beauty Counter:** Dual-LED horizontal blush beauty counter with featured complexion & cheek essentials.
  - **The PrettyPiggie Collection:** Central oval blush pedestal islands with brushed champagne rose-gold baseboard trim (`design idea/Screenshot 2026-11-18 220209.png`).
  - **The Bestsellers Display:** Glowing LED-rimmed cylindrical podiums with rose-gold halo arches.
  - **The Discovery Room:** Futuristic high-gloss blush sanctuary with curved LED ceiling tracks, obsidian accent bands, and sculptural 3D makeup brush sets (`design idea/Screenshot 2026-11-18 220326.png`).
- **3D Product Presentation Stage (`design idea/Screenshot 2026-11-18 220242.png`):**
  - Tapping any product glides the camera to a dedicated 3D presentation stage featuring an LED-rimmed blush podium, floating rose-gold halo rings, rotating champagne cubes, and glossy shade-matched floating spheres.
  - **360° Touch & Drag Spin:** Rotate any lipstick, gloss, compact, foundation, palette, or brush set 360 degrees with one finger.
  - **Live 3D Shade Swatches:** Tapping any shade swatch updates the 3D product formula and floating 3D spheres in real time.
- **Non-Negotiable Mobile Performance & Automatic 2D Luxury Fallback:**
  - Real-time device capability detector (`src/lib/deviceCapability.ts`) checks GPU tier, WebGL support, device memory, `prefers-reduced-motion`, and Save-Data headers.
  - Adaptive DPR (`[1, 1.4]` on mobile), dynamic `<PerformanceMonitor />` scaling, and automatic render pausing when backgrounded (`document.visibilityState`).
  - Instant automatic or user-toggled **2D Luxury Editorial Boutique Mode** (`src/components/ui/LuxuryFallback2D.tsx`) so a 3D rendering limitation never prevents a customer from shopping.
- **Conversion-Optimized Shopify Commerce:**
  - Persistent Shopping Bag drawer with Free Express Shipping progress meter, Apple Pay / Shop Pay express triggers, guest checkout (no mandatory account creation), and Shopify Storefront GraphQL `cartCreate` integration (`src/lib/shopify.ts`).

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Shopify Storefront API (Optional — works out of the box with the built-in PrettyPiggie 3D catalogue):**
   Copy `.env.example` to `.env.local` and supply your Shopify Storefront credentials:
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=prettypiggie.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-public-access-token
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` on your mobile device or desktop browser.

---

## Project Architecture

- [SPECIFICATION.md](./SPECIFICATION.md) — Complete Master Product Vision & Mandatory Mobile-First Developer Specification
- [src/types/boutique.ts](./src/types/boutique.ts) — Core TypeScript interfaces for 3D zones, camera waypoints, products, shades, cart, and device capabilities
- [src/data/boutiqueData.ts](./src/data/boutiqueData.ts) — Portrait-first mobile, tablet, and desktop camera rigs + PrettyPiggie product catalogue
- [src/lib/deviceCapability.ts](./src/lib/deviceCapability.ts) — Mobile GPU/WebGL capability detector & adaptive performance budget engine
- [src/lib/shopify.ts](./src/lib/shopify.ts) — Shopify Storefront GraphQL API client & checkout session manager
- [src/components/three/VirtualBoutiqueEnvironment3D.tsx](./src/components/three/VirtualBoutiqueEnvironment3D.tsx) — 3D blush-pink showroom architecture, chandeliers, LED alcoves, counters, and hotspots
- [src/components/three/ProductPresentationStage3D.tsx](./src/components/three/ProductPresentationStage3D.tsx) — Dedicated 3D product podium with floating rose-gold rings, cubes, and shade spheres
- [src/components/three/CosmeticModel3D.tsx](./src/components/three/CosmeticModel3D.tsx) — Bespoke PBR 3D models for Lipsticks, Lip Glosses, Compacts, Foundations, Palettes, and Brush Sets
- [src/components/ui/BoutiqueNavigationHUD.tsx](./src/components/ui/BoutiqueNavigationHUD.tsx) — Persistent header, quick search modal, and one-handed bottom thumb-zone department dock
- [src/components/ui/ProductPresentationSheet.tsx](./src/components/ui/ProductPresentationSheet.tsx) — Ergonomic mobile bottom-sheet & desktop glass drawer for shades, ingredients, reviews, and Add to Bag
- [src/components/ui/LuxuryFallback2D.tsx](./src/components/ui/LuxuryFallback2D.tsx) — Lightweight 2D luxury editorial boutique fallback
- [src/components/ui/ShoppingBagDrawer.tsx](./src/components/ui/ShoppingBagDrawer.tsx) — Persistent cart & frictionless guest checkout drawer
