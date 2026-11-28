# Pretty Piggie™ Viral Character Engine (`src/pretty-piggie/`)

Zero-cost, **100% browser-local** algorithmic selfie-to-3D Pretty Piggie character studio (`/pretty-piggie`), coexisting alongside the 3D Virtual Boutique (`/`), 2D Luxury Catalogue (`/?mode=2d`), and optional AI Photoreal Cartoon Studio (`/makeover-studio`).

---

## 1. Architecture & Privacy Boundary

| Layer | Execution Context | Data Processed | External Network / Paid AI Calls |
| :--- | :--- | :--- | :--- |
| **Camera & Selfie Loader** (`CameraController.ts`, `LocalProcessingGuard.ts`) | Customer Browser Only | Live `MediaStream` frames / uploaded portrait bitmap (EXIF stripped on scratch `<canvas>`) | **Zero** |
| **Facial Landmark & Blendshape Analyzer** (`FaceTracker.ts`, `FaceLandmarkProcessor.ts`) | Customer Browser Only (Self-hosted WebAssembly + WebGL/CPU delegate) | 478 3D MediaPipe facial landmarks, 52 blendshape scores, `4×4` head pose matrix | **Zero** (`/pretty-piggie/wasm/*` & `/pretty-piggie/models/face_landmarker.task` served from `'self'`) |
| **Deterministic Personalization** (`CharacterMapper.ts`) | Customer Browser Only | Scale/pose-normalized geometric ratios mapped via `tanh` soft-knee clamping into `CharacterParameters` | **Zero** |
| **3D Stage & 2D Fallback** (`CharacterRenderer.tsx`, `PiggieCharacter.tsx`, `CanvasFallback.ts`) | Customer Browser Only | Sculpted Three.js / R3F 3D rig (or `"2D Illustrated Fallback Mode"` when WebGL is unavailable/lost) | **Zero** |
| **Branded Social Exports & Share Codec** (`ImageCapture.ts`, `ShareController.ts`) | Customer Browser Only | `9:16` (`1080×1920`) and `1:1` (`1080×1080`) PNGs + 27-byte (`36`-char base64url) `'PP\x01'` + IEEE CRC32 `?c=` token | **Zero** |
| **Anonymous Funnel Telemetry** (`PiggieEvents.ts` → `POST /api/events`) | First-Party Next.js API | Strict closed-world allowlisted event name, `deviceTier`, `isMobile`, and primitive metadata (`<= 2048` bytes). **Never** receives photos, landmarks, biometrics, or PII. | First-party `POST /api/events` only |

> **Important Appearance Customization Note:** Facial landmarks capture geometric proportions and expression cues only — they do **not** segment hair silhouette or complexion. Skin tone, hairstyle, hair shade, eye color, lip shade, and `Face Fit` proportion sliders remain 100% customer-controlled in Screen 4 (`Customize`).

---

## 2. Self-Hosted MediaPipe Assets & Integrity

To keep `Content-Security-Policy` locked to `'self'` (`connect-src 'self' blob: data: https://*.myshopify.com`), all MediaPipe runtime artifacts are vendored locally and verified by `npm run piggie:sync-wasm` (`scripts/sync-mediapipe-assets.mjs`) and `src/pretty-piggie/assetManifest.json`:

- `/pretty-piggie/wasm/vision_wasm_internal.js` (`336,624` bytes, `application/javascript; charset=utf-8`)
- `/pretty-piggie/wasm/vision_wasm_internal.wasm` (`14,665,716` bytes, `application/wasm`, `\0asm` header verified)
- `/pretty-piggie/models/face_landmarker.task` (`3,758,596` bytes, `application/octet-stream`, Google float16 Face Landmarker bundle)

> **Verified CSP Behavior on MediaPipe Internal ODML Counter:** `@mediapipe/tasks-vision@1.2.3` contains an internal Google ODML usage logger targeting `https://odml.pa.googleapis.com/v1/log`. Because `next.config.mjs` restricts `connect-src` to `'self' blob: data: https://*.myshopify.com`, the browser kernel blocks that request before any packet leaves the device; the SDK catches the network rejection once, clears its internal `setInterval`, and runs `FaceLandmarker` 100% locally without disruption.

When upgrading `@mediapipe/tasks-vision`, run:

```bash
npm run piggie:sync-wasm
```

---

## 3. Drop-In Artist `.glb` Contract (`PIGGIE_GLB_NODE_CONTRACT`)

Milestone 1 ships a sculpted procedural 3D Pretty Piggie bust in `PiggieCharacter.tsx` wired to the canonical 52 ARKit blendshape schema (`ARKIT_52_BLENDSHAPE_NAMES` in `MorphController.ts`) and `CharacterRig.ts`.

To swap in an artist-authored `.glb` without modifying tracking, customization, exports, or share links:

1. Export the `.glb` with named nodes matching `PIGGIE_GLB_NODE_CONTRACT` (`HeadPivot`, `FaceMesh`, `PigSnout`, `EarLeftPivot`, `EarRightPivot`, `EyeLeft`, `EyeRight`, `JawPivot`, `HairSocket`, `CrownSocket`, `EarStudLeftSocket`, `EarStudRightSocket`, `GlassesSocket`) and ARKit-52 morph targets on `FaceMesh`.
2. Place the model under `public/pretty-piggie/models/` and bind via `applyARKitMorphsToGLBScene()` in `src/pretty-piggie/character/CharacterRig.ts`.

---

## 4. Serverless Abuse-Control & Telemetry Configuration

`POST /api/events` and `POST /api/makeover/transform` use the layered rate limiter in `src/lib/rateLimit.ts`:

1. **Tier 1 — Distributed KV / Upstash Redis REST Counter (when configured):**
   Set `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) in production for cross-isolate atomic fixed-window enforcement.
2. **Tier 2 — Stateless HMAC-SHA256 Signed `HttpOnly` Quota Cookie:**
   Carries tamper-evident `{ scope, windowId, count }` across serverless cold starts even before Redis/KV is provisioned (configure `RATE_LIMIT_SIGNING_SECRET` in production).
3. **Tier 3 — Warm Isolate Memory Bucket:**
   Immediate synchronous guard for burst requests hitting the same warm Node isolate.

---

## 5. Milestone Roadmap

- **Milestone 1 (Complete):** Photo upload + single-shot live camera capture, self-hosted MediaPipe `IMAGE` landmark & blendshape extraction (`GPU` → `CPU` automatic fallback), deterministic `transformFaceToPiggie`, 5 modular makeup collections (`Glam`, `Sweet`, `Glitter`, `Royal`, `Fashion`), 6 hairstyles, 6 accessories, customer `Face Fit` controls, `"2D Illustrated Fallback Mode"`, `9:16` & `1:1` branded PNG exports, versioned CRC32 `?c=` share links, and closed-world `/api/events` telemetry.
- **Milestone 2 (Planned):** `PRETTYPIGGIE MIRROR` live `VIDEO`-mode AR camera (`24–30 FPS`) driving `CharacterRig` via `FaceSmoothing.ts` `Float32Array` buffers inside `useFrame` with zero React re-renders.
- **Milestone 3 (Planned):** Opt-in moderated Community Gallery backed by Vercel KV/Postgres + Blob storage (explicit OFF-by-default publication consent, finished-character-only uploads, moderation queue, and 1-click takedown).
