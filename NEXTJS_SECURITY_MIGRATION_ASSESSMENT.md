# PrettyPiggie.com — Next.js Security & Framework Migration Assessment (Section 10)

**Selected Target Baseline:** **`next@16.4.6` + `react@19.3.1` + `@react-three/fiber@9.8.2` + `@react-three/drei@10.7.9` + `postcss@8.5.33` + `eslint@9`**  
**Migration Execution Status:** **COMPLETED & VERIFIED LOCALLY (`0` npm vulnerabilities, `15/15` release audit PASS, `0` 3D/2D browser console errors)**  
**Release Status:** **`NO-GO`** *(Pending external Shopify, Blanka, Vercel staging, supplier documentation, regulatory review, and physical-device verification)*

---

## 1. Security Rationale & Version Comparison

| Criterion | Previous `next@14.2.35` | Evaluated `next@15.5.29` | **Selected `next@16.4.6`** |
|---|---|---|---|
| **Production `npm audit --omit=dev`** | **FAIL** (1 Critical, 1 High: `next <= 16.3.0-preview.10`, `postcss <= 8.5.22`) | **FAIL** (Still within `next <= 16.3.0-preview.10` Critical CVE range) | **PASS (`0` vulnerabilities across all 446 packages)** |
| **React Compatibility** | `react@18.3.1` | `react@18` or `19` | **`react@19.3.1` & `react-dom@19.3.1`** |
| **React Three Fiber** | `@react-three/fiber@8.17.10` | v8 or v9 | **`@react-three/fiber@9.8.2`** (`react >=19 <19.4`, `three >=0.156`) |
| **Drei** | `@react-three/drei@9.117.3` | v9 or v10 | **`@react-three/drei@10.7.9`** (`react ^19`, `r3f ^9`, `three >=0.159`) |
| **Three.js & GSAP** | `three@0.169.0`, `gsap@3.12.5` | Same | **Preserved (`three@0.169.0`, `gsap@3.12.5`) — zero shader/animation changes** |
| **Vercel Deployment Support** | Legacy 14.x | Supported | **First-class Next.js 16 Turbopack runtime on Vercel** |
| **Decision** | **REJECTED (Vulnerable)** | **REJECTED (Still Vulnerable)** | **SELECTED & VERIFIED** |

---

## 2. Targeted Compatibility Fixes Applied

1. **Async Route Handler `params` (`Next.js 15/16` App Router requirement):** Updated [route.ts](file:///c:/Users/ssabe/Downloads/prettypiggie/src/app/api/product-image/%5Bslug%5D/%5Bvariant%5D/route.ts) to `await context.params`.
2. **ESLint 9 Flat Config Migration:** Replaced legacy `.eslintrc.json` with [eslint.config.mjs](file:///c:/Users/ssabe/Downloads/prettypiggie/eslint.config.mjs) using `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` and updated `"lint": "eslint ."`.
3. **React 19 Strict Effect Hygiene:** Removed synchronous `setState`-in-effect resets in [BoutiqueCanvas3D.tsx](file:///c:/Users/ssabe/Downloads/prettypiggie/src/components/three/BoutiqueCanvas3D.tsx) (using derived zone/product-keyed state) and deferred browser mount hydration in [PrettyPiggieBoutiqueApp.tsx](file:///c:/Users/ssabe/Downloads/prettypiggie/src/components/PrettyPiggieBoutiqueApp.tsx).
4. **Drei v10 + React 19 `<Html>` Portal Unmount Race Fix:** During live browser regression testing of `Makeup Wall` transitions, conditionally unmounting `<Html>` in [VirtualBoutiqueEnvironment3D.tsx](file:///c:/Users/ssabe/Downloads/prettypiggie/src/components/three/VirtualBoutiqueEnvironment3D.tsx) emitted `NotFoundError: Failed to execute 'removeChild' on 'Node'`. Keeping the 11 showroom `<Html>` tags stably mounted and toggling visibility cleanly via CSS `display` + `pointerEvents` + `aria-hidden`/`tabIndex` eliminated the error completely (`0` errors across all 6 zones and 3D product stage).

---

## 3. Empirical Regression Matrix (`Build ID: VuyReC9_cNlnFdJAo-TNw`)

| Check | Result | Evidence |
|---|---|---|
| **Dependency Security (`npm audit --omit=dev` & `npm audit`)** | **PASS** | `found 0 vulnerabilities` across all 446 packages. |
| **TypeScript (`npm run typecheck`)** | **PASS** | `0` errors (`tsc --noEmit`). |
| **ESLint 9 (`npm run lint`)** | **PASS** | `0` errors, `0` warnings. |
| **Production Build (`npm run build`)** | **PASS** | Next.js `16.4.6` (Turbopack) compiled in `2.1s`, all 11 routes built cleanly. |
| **Adversarial Release Audit (`npm run audit:release`)** | **PASS** | **`15 / 15`** checks passed (including CSP, CSRF, DoS, rate-limit `429`, `54/4/52` locks, webhook HMAC fail-closed, `0` bundle leaks across 17 JS chunks). |
| **3D Showroom Regression (Live Browser, `http://localhost:3002`)** | **PASS** | All 6 bottom-dock zones (`Boutique`, `Makeup Wall`, `Counter`, `Collection`, `Bestsellers`, `Discovery`) + 3D Product Presentation Stage (`Luminizing Powder`) + return navigation verified with **`0` console errors**, **`0` WebGL errors**, **`0` CSP violations**. |
| **2D Fallback & Image Proxy Regression** | **PASS** | `/?mode=2d` rendered `52 / 4 / 54` reconciled pills; `/api/product-image/luminizing-powder/primary` returned `HTTP 200` (`image/webp`, rendered visibly); `/?product=lipstick` purchase lock verified disabled. |
| **Shopify Checkout & Webhook Regression** | **PASS (Local)** | `POST /api/checkout` preview (`\$40.50 USD`) verified in UI; isolated live HMAC webhook test confirmed forged `401`, `orders/paid` -> `SUPPLIER_SUBMISSION_PENDING` (not shipped), duplicate webhook deduped, and `fulfillments/update` -> `TRACKING_AVAILABLE`. |
| **Physical-Device Regression** | **PENDING** | Requires Vercel staging URL (`iPhone Safari`, `Android Chrome`, `TikTok`, `Instagram`). |

---

## 4. Rollback Procedure

To roll back immediately to the frozen `v1.0.0-rc1` baseline or pre-Next.js-16 RC2 commit:
```bash
# Option A — Frozen v1.0.0-rc1 baseline (Build ID 8iwZOJS3uDI5rLgSQuRKs)
git fetch origin --tags
git checkout -b rollback/v1.0.0-rc1 v1.0.0-rc1

# Option B — Prior hardened Next.js 14.2.35 RC2 commit (before Next.js 16 upgrade)
git checkout -b rollback/rc2-next14 3c105feeda9825c9ab8c056c931d59465d56d36d
```
