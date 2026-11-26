import { NextResponse } from 'next/server';
import { getMakeoverPersonality } from '@/lib/makeoverStyles';
import {
  MAX_MAKEOVER_UPLOAD_BYTES,
  getServerMakeoverConfig,
  releaseDailyBudget,
  reserveDailyBudget,
  transformPortraitToPrettyPiggie,
  validateImageMagicBytes,
} from '@/lib/makeoverServer';
import { checkApiRateLimit } from '@/lib/rateLimit';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

function jsonNoStore(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function isSameOriginOrAllowed(request: Request): boolean {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return true;
  try {
    const originHost = new URL(originHeader).host.toLowerCase();
    const requestHost = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    if (requestHost && originHost === requestHost) return true;
    const originHostname = new URL(originHeader).hostname.toLowerCase();
    if (
      originHostname === 'prettypiggie.com' ||
      originHostname === 'www.prettypiggie.com' ||
      originHostname.endsWith('.vercel.app')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // 1. Cross-Origin CSRF check
  if (!isSameOriginOrAllowed(request)) {
    return jsonNoStore(
      {
        error: 'Cross-origin Makeover Studio requests are not permitted.',
        code: 'ORIGIN_MISMATCH',
      },
      { status: 403 }
    );
  }

  // 2. Dual per-IP rate limiting (5/min burst + 15/hour abuse protection)
  const minuteRate = checkApiRateLimit(request, 'makeover-transform-min', 5, 60_000);
  if (!minuteRate.allowed) {
    return jsonNoStore(
      {
        error:
          'You have reached the per-minute studio limit. Please wait a moment before generating another Pretty Piggie.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(minuteRate.retryAfterSeconds) },
      }
    );
  }

  const hourlyRate = checkApiRateLimit(
    request,
    'makeover-transform-hour',
    15,
    60 * 60_000
  );
  if (!hourlyRate.allowed) {
    return jsonNoStore(
      {
        error:
          'You have reached the hourly Pretty Piggie generation limit. Please come back soon!',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(hourlyRate.retryAfterSeconds) },
      }
    );
  }

  // 3. Enforce multipart/form-data Content-Type & request payload ceiling
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('multipart/form-data')) {
    return jsonNoStore(
      {
        error: 'Request must be multipart/form-data with a portrait photo.',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      },
      { status: 415 }
    );
  }

  const declaredLen = Number(request.headers.get('content-length') || 0);
  if (declaredLen > MAX_MAKEOVER_UPLOAD_BYTES + 256 * 1024) {
    return jsonNoStore(
      {
        error: 'Uploaded photo exceeds the 6 MB maximum size.',
        code: 'IMAGE_TOO_LARGE',
      },
      { status: 413 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonNoStore(
      {
        error: 'Unable to parse uploaded form data.',
        code: 'INVALID_FORM_DATA',
      },
      { status: 400 }
    );
  }

  // 4. Server-side Privacy Consent & Minor Protection Gates (Non-Negotiable)
  const consentAccepted = formData.get('consentAccepted') === 'true';
  if (!consentAccepted) {
    return jsonNoStore(
      {
        error:
          'Explicit privacy consent is required before processing your photograph.',
        code: 'CONSENT_REQUIRED',
      },
      { status: 400 }
    );
  }

  const ageConfirmed = formData.get('ageConfirmed') === 'true';
  if (!ageConfirmed) {
    return jsonNoStore(
      {
        error:
          'Age confirmation (18+ or parent/legal guardian consent) is required to protect minors.',
        code: 'AGE_CONFIRMATION_REQUIRED',
      },
      { status: 400 }
    );
  }

  // 5. Validate Makeover Personality Selection
  const personalityId = String(formData.get('personalityId') || '').trim();
  const personality = getMakeoverPersonality(personalityId);
  if (!personality) {
    return jsonNoStore(
      {
        error: 'Please select a valid Pretty Piggie personality style.',
        code: 'INVALID_PERSONALITY',
      },
      { status: 400 }
    );
  }

  // 6. Validate Photo File & Real Binary Magic Bytes
  const photoEntry = formData.get('photo');
  if (!photoEntry || typeof photoEntry === 'string') {
    return jsonNoStore(
      {
        error: 'Please capture or upload a portrait photograph first.',
        code: 'PHOTO_REQUIRED',
      },
      { status: 400 }
    );
  }

  if (photoEntry.size > MAX_MAKEOVER_UPLOAD_BYTES) {
    return jsonNoStore(
      {
        error: 'Photo exceeds the 6 MB maximum upload size.',
        code: 'IMAGE_TOO_LARGE',
      },
      { status: 413 }
    );
  }

  const portraitBuffer = Buffer.from(await photoEntry.arrayBuffer());
  const validation = validateImageMagicBytes(portraitBuffer);
  if (!validation.valid || !validation.mimeType || !validation.extension) {
    portraitBuffer.fill(0);
    return jsonNoStore(
      {
        error: validation.error || 'Invalid image file.',
        code: 'UNSUPPORTED_IMAGE_TYPE',
      },
      { status: 415 }
    );
  }

  // 7. Verify Live Server-Side AI Credentials (Fail Closed — Never Fake a Sticker Filter!)
  const cfg = getServerMakeoverConfig();
  if (!cfg.configured) {
    portraitBuffer.fill(0);
    return jsonNoStore(
      {
        error:
          'Live AI character transformation requires a server-side GEMINI_API_KEY or OPENAI_API_KEY in your environment variables. Your uploaded photo was validated and was not stored.',
        code: 'AI_PROVIDER_NOT_CONFIGURED',
        supportedProviders: ['gemini', 'openai'],
        privacyReceipt: {
          retained: false,
          originalNotPersisted: true,
          processedAtUtc: new Date().toISOString(),
          retentionPolicy: 'ZERO_RETENTION_EPHEMERAL',
        },
      },
      { status: 503 }
    );
  }

  // 8. Cost Monitoring & Daily Spend Cap Guard
  const reserved = reserveDailyBudget(
    cfg.estimatedCostPerGenerationUsd,
    cfg.dailyBudgetUsd
  );
  if (!reserved) {
    portraitBuffer.fill(0);
    return jsonNoStore(
      {
        error:
          'Pretty Piggie Makeover Studio has reached today’s daily generation capacity. Please check back tomorrow!',
        code: 'DAILY_BUDGET_CAP_REACHED',
      },
      { status: 503 }
    );
  }

  // 9. Execute Ephemeral Server-Side AI Transformation & Zero-Fill Original Photo Buffer Immediately
  try {
    const result = await transformPortraitToPrettyPiggie({
      portraitBuffer,
      portraitMimeType: validation.mimeType,
      portraitExt: validation.extension,
      personality,
    });

    if (!result.ok) {
      releaseDailyBudget(cfg.estimatedCostPerGenerationUsd);
      return jsonNoStore(
        {
          error: result.message,
          code: result.code,
          retryable: result.code !== 'UPSTREAM_SAFETY_BLOCK',
        },
        { status: result.status }
      );
    }

    return jsonNoStore({
      mode: 'ai-live',
      personalityId: personality.id,
      personalityName: personality.name,
      imageDataUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
      provider: result.provider,
      model: result.model,
      usedMasterReference: result.usedMasterReference,
      featureOptInRecorded: formData.get('featureOptIn') === 'true',
      privacyReceipt: {
        retained: false,
        originalNotPersisted: true,
        publicGalleryAutoPosted: false,
        processedAtUtc: new Date().toISOString(),
        retentionPolicy: 'ZERO_RETENTION_EPHEMERAL',
      },
    });
  } finally {
    // Zero-retention guarantee: scrub customer portrait bytes from server RAM immediately
    portraitBuffer.fill(0);
  }
}
