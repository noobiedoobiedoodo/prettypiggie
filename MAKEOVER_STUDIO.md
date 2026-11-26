# Pretty Piggie Makeover Studio — Runbook, Privacy & Retention Policy

Route: `/makeover-studio` · APIs: `POST /api/makeover/transform`, `GET /api/makeover/health`

## Status
- Code complete; **live AI quality NOT yet validated** — no provider key has been configured or tested.
- Without `GEMINI_API_KEY` or `OPENAI_API_KEY` the transform API fails closed (HTTP 503 `AI_PROVIDER_NOT_CONFIGURED`). It never returns a sticker/mask fallback.
- Release gate: `npm run audit:release` check `MAKEOVER_STUDIO_PRIVACY_GATES_VALIDATION_AND_FAIL_CLOSED`.

## Architecture
1. Browser downsizes the photo to ≤1280px JPEG (strips EXIF) and POSTs multipart to the server.
2. Server validates: same-origin, multipart, ≤6 MB, magic-byte JPEG/PNG/WebP, valid personality, `consentAccepted=true`, `ageConfirmed=true`.
3. Server rate limits (5/min, 15/hour per IP) and reserves estimated cost against `MAKEOVER_DAILY_BUDGET_USD` (default $25) before calling the provider; reservation is released on failure.
4. Server sends **Image 1 = customer portrait** + **Image 2 = Master Pretty Piggie reference** + a shared style bible + a per-personality directive to the provider's image-edit API (image-to-image, not text-to-image).
5. Output is magic-byte validated (≥8 KB) before it is returned as a data URL. The branded 9:16 / 1:1 / 4:5 frames are composed client-side.

## Master character
`public/brand/makeover-studio/master-pretty-piggie-reference.png` — all five personalities share `MASTER_PRETTY_PIGGIE_STYLE_BIBLE` (`src/lib/makeoverStyles.ts`); only makeup/accessory directives differ.

## Retention policy (as implemented)
- Pretty Piggie writes **no** original photo or generated image to disk, database, or logs. Request buffers are zero-filled after processing.
- Nothing is posted publicly; there is no gallery. Sharing is always a customer action.
- The photo IS transmitted to the configured third-party AI provider; that provider's API data-retention terms apply. **Review/confirm those terms and update the on-page consent text before launch.**
- The optional "featuring" checkbox is separate and records nothing server-side today (no storage exists). Any future gallery needs its own storage, consent log, and deletion flow.
- Minors: customers must confirm 18+ or parent/guardian permission. This is a self-attestation, not age verification.

## Open items before launch (need human/legal decisions)
- Privacy/legal counsel review (face-image processing, biometric-privacy statutes, COPPA/minors, provider terms, CCPA).
- Choose provider, set key + daily budget in Vercel env vars, then run real photos through all five personalities and judge likeness, snout/ear quality, and consistency before expanding styles.
- Confirm official social handles to tag (none are hard-coded; only `#MyPrettyPiggie` and PrettyPiggie.com are used).
- Rate limiting and daily budget are in-memory per serverless instance; use a shared store (e.g. Redis/KV) for a hard global cap in production.
