import fs from 'node:fs';
import path from 'node:path';
import {
  MakeoverPersonality,
  buildPrettyPiggiePrompt,
} from '@/lib/makeoverStyles';

export type MakeoverAiProvider = 'gemini' | 'openai';

export interface MakeoverProviderStatus {
  configured: boolean;
  activeProvider: MakeoverAiProvider | null;
  activeModel: string | null;
  supportedProviders: MakeoverAiProvider[];
  masterReferenceReady: boolean;
  estimatedCostPerGenerationUsd: number;
  dailyBudgetUsd: number;
  dailySpentUsd: number;
  dailyBudgetRemainingUsd: number;
  dailyGenerationsCount: number;
  retentionPolicy: 'ZERO_RETENTION_EPHEMERAL';
}

export interface ValidatedImageResult {
  valid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  extension?: 'jpg' | 'png' | 'webp';
  error?: string;
}

export const MAX_MAKEOVER_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB ceiling
const MIN_UPLOAD_BYTES = 1024; // 1 KB minimum valid image
const MIN_OUTPUT_BYTES = 8 * 1024; // 8 KB minimum generated portrait
const UPSTREAM_TIMEOUT_MS = 50_000;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-image';
const DEFAULT_OPENAI_MODEL = 'gpt-image-1';
const DEFAULT_DAILY_BUDGET_USD = 25;

interface DailyBudgetBucket {
  utcDay: string;
  spentUsd: number;
  generations: number;
}

const globalForMakeover = globalThis as typeof globalThis & {
  __prettypiggieMakeoverBudget?: DailyBudgetBucket;
  __prettypiggieMasterRefCache?: { buffer: Buffer; mimeType: 'image/png' } | null;
};

function getUtcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyBudgetBucket(): DailyBudgetBucket {
  const today = getUtcDayKey();
  const existing = globalForMakeover.__prettypiggieMakeoverBudget;
  if (!existing || existing.utcDay !== today) {
    const fresh: DailyBudgetBucket = {
      utcDay: today,
      spentUsd: 0,
      generations: 0,
    };
    globalForMakeover.__prettypiggieMakeoverBudget = fresh;
    return fresh;
  }
  return existing;
}

export function getMasterReferenceFilePath(): string {
  return path.join(
    process.cwd(),
    'public',
    'brand',
    'makeover-studio',
    'master-pretty-piggie-reference.png'
  );
}

export function loadMasterReferenceBuffer(): {
  buffer: Buffer;
  mimeType: 'image/png';
} | null {
  if (globalForMakeover.__prettypiggieMasterRefCache !== undefined) {
    return globalForMakeover.__prettypiggieMasterRefCache;
  }
  const refPath = getMasterReferenceFilePath();
  if (!fs.existsSync(refPath)) {
    return null;
  }
  const buf = fs.readFileSync(refPath);
  if (buf.length < MIN_UPLOAD_BYTES) {
    return null;
  }
  const cached = { buffer: buf, mimeType: 'image/png' as const };
  globalForMakeover.__prettypiggieMasterRefCache = cached;
  return cached;
}

/**
 * Strictly server-only AI provider configuration reader.
 * Never exposed to client bundles; zero credentials ever leave the server.
 */
export function getServerMakeoverConfig(): {
  configured: boolean;
  provider: MakeoverAiProvider | null;
  apiKey: string;
  model: string | null;
  estimatedCostPerGenerationUsd: number;
  dailyBudgetUsd: number;
} {
  const preferred = (process.env.MAKEOVER_AI_PROVIDER || '')
    .trim()
    .toLowerCase();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

  const parsedBudget = Number(process.env.MAKEOVER_DAILY_BUDGET_USD);
  const dailyBudgetUsd =
    Number.isFinite(parsedBudget) && parsedBudget > 0
      ? Math.min(parsedBudget, 1000)
      : DEFAULT_DAILY_BUDGET_USD;

  if (preferred === 'openai' && openaiKey) {
    return {
      configured: true,
      provider: 'openai',
      apiKey: openaiKey,
      model: (process.env.MAKEOVER_OPENAI_MODEL || DEFAULT_OPENAI_MODEL).trim(),
      estimatedCostPerGenerationUsd: 0.08,
      dailyBudgetUsd,
    };
  }

  if (geminiKey) {
    return {
      configured: true,
      provider: 'gemini',
      apiKey: geminiKey,
      model: (process.env.MAKEOVER_GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim(),
      estimatedCostPerGenerationUsd: 0.04,
      dailyBudgetUsd,
    };
  }

  if (openaiKey) {
    return {
      configured: true,
      provider: 'openai',
      apiKey: openaiKey,
      model: (process.env.MAKEOVER_OPENAI_MODEL || DEFAULT_OPENAI_MODEL).trim(),
      estimatedCostPerGenerationUsd: 0.08,
      dailyBudgetUsd,
    };
  }

  return {
    configured: false,
    provider: null,
    apiKey: '',
    model: null,
    estimatedCostPerGenerationUsd: 0.04,
    dailyBudgetUsd,
  };
}

export function getMakeoverProviderStatus(): MakeoverProviderStatus {
  const cfg = getServerMakeoverConfig();
  const bucket = getDailyBudgetBucket();
  const refReady = fs.existsSync(getMasterReferenceFilePath());
  const remaining = Number(
    Math.max(0, cfg.dailyBudgetUsd - bucket.spentUsd).toFixed(2)
  );

  return {
    configured: cfg.configured,
    activeProvider: cfg.provider,
    activeModel: cfg.model,
    supportedProviders: ['gemini', 'openai'],
    masterReferenceReady: refReady,
    estimatedCostPerGenerationUsd: cfg.estimatedCostPerGenerationUsd,
    dailyBudgetUsd: cfg.dailyBudgetUsd,
    dailySpentUsd: Number(bucket.spentUsd.toFixed(2)),
    dailyBudgetRemainingUsd: remaining,
    dailyGenerationsCount: bucket.generations,
    retentionPolicy: 'ZERO_RETENTION_EPHEMERAL',
  };
}

export function reserveDailyBudget(
  costUsd: number,
  dailyBudgetUsd: number
): boolean {
  const bucket = getDailyBudgetBucket();
  if (bucket.spentUsd + costUsd > dailyBudgetUsd + 1e-6) {
    return false;
  }
  bucket.spentUsd = Number((bucket.spentUsd + costUsd).toFixed(4));
  bucket.generations += 1;
  return true;
}

export function releaseDailyBudget(costUsd: number): void {
  const bucket = getDailyBudgetBucket();
  bucket.spentUsd = Number(Math.max(0, bucket.spentUsd - costUsd).toFixed(4));
  bucket.generations = Math.max(0, bucket.generations - 1);
}

/**
 * Inspect binary magic bytes to validate genuine JPEG, PNG, or WebP files.
 * Never trusts client-supplied extensions or MIME strings alone.
 */
export function validateImageMagicBytes(
  buffer: Buffer,
  options: { maxBytes?: number; minBytes?: number } = {}
): ValidatedImageResult {
  const maxBytes = options.maxBytes ?? MAX_MAKEOVER_UPLOAD_BYTES;
  const minBytes = options.minBytes ?? MIN_UPLOAD_BYTES;

  if (!buffer || buffer.length < minBytes) {
    return {
      valid: false,
      error: 'Uploaded image is empty or too small to transform.',
    };
  }
  if (buffer.length > maxBytes) {
    return {
      valid: false,
      error: 'Image exceeds the 6 MB maximum upload size.',
    };
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png', extension: 'png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, mimeType: 'image/webp', extension: 'webp' };
  }

  return {
    valid: false,
    error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photo.',
  };
}

export interface TransformationExecutionResult {
  ok: true;
  imageBase64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  provider: MakeoverAiProvider;
  model: string;
  usedMasterReference: boolean;
}

export interface TransformationExecutionError {
  ok: false;
  code:
    | 'UPSTREAM_ERROR'
    | 'UPSTREAM_SAFETY_BLOCK'
    | 'GENERATION_VALIDATION_FAILED';
  message: string;
  status: number;
}

async function runGeminiImageTransform(params: {
  apiKey: string;
  model: string;
  portraitBuffer: Buffer;
  portraitMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  masterRef: { buffer: Buffer; mimeType: 'image/png' } | null;
  prompt: string;
}): Promise<TransformationExecutionResult | TransformationExecutionError> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent`;

  const parts: Array<Record<string, unknown>> = [
    {
      inlineData: {
        mimeType: params.portraitMimeType,
        data: params.portraitBuffer.toString('base64'),
      },
    },
  ];

  if (params.masterRef) {
    parts.push({
      inlineData: {
        mimeType: params.masterRef.mimeType,
        data: params.masterRef.buffer.toString('base64'),
      },
    });
  }

  parts.push({ text: params.prompt });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': params.apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message:
        'Our AI Makeover Studio engine encountered a temporary error. Please retry in a moment.',
      status: 502,
    };
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
  };

  const candidate = payload.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    return {
      ok: false,
      code: 'UPSTREAM_SAFETY_BLOCK',
      message:
        'This photo could not be processed by our safety filters. Please try a clear, well-lit face portrait.',
      status: 422,
    };
  }

  const responseParts = candidate?.content?.parts ?? [];
  for (const part of responseParts) {
    const rawBase64 = part.inlineData?.data || part.inline_data?.data;
    if (!rawBase64) continue;
    const outBuffer = Buffer.from(rawBase64, 'base64');
    const validated = validateImageMagicBytes(outBuffer, {
      minBytes: MIN_OUTPUT_BYTES,
      maxBytes: 15 * 1024 * 1024,
    });
    if (validated.valid && validated.mimeType) {
      return {
        ok: true,
        imageBase64: outBuffer.toString('base64'),
        mimeType: validated.mimeType,
        provider: 'gemini',
        model: params.model,
        usedMasterReference: Boolean(params.masterRef),
      };
    }
  }

  return {
    ok: false,
    code: 'GENERATION_VALIDATION_FAILED',
    message:
      'The generated character did not pass image quality validation. Please tap Regenerate to try again.',
    status: 422,
  };
}

async function runOpenAiImageTransform(params: {
  apiKey: string;
  model: string;
  portraitBuffer: Buffer;
  portraitMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  portraitExt: 'jpg' | 'png' | 'webp';
  masterRef: { buffer: Buffer; mimeType: 'image/png' } | null;
  prompt: string;
}): Promise<TransformationExecutionResult | TransformationExecutionError> {
  const form = new FormData();
  form.append('model', params.model);
  form.append('prompt', params.prompt);
  form.append('size', '1024x1024');
  form.append('quality', 'medium');
  form.append(
    'image[]',
    new Blob([new Uint8Array(params.portraitBuffer)], {
      type: params.portraitMimeType,
    }),
    `customer-portrait.${params.portraitExt}`
  );

  if (params.masterRef) {
    form.append(
      'image[]',
      new Blob([new Uint8Array(params.masterRef.buffer)], {
        type: params.masterRef.mimeType,
      }),
      'master-pretty-piggie-reference.png'
    );
  }

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: form,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message:
        'Our AI Makeover Studio engine encountered a temporary error. Please retry in a moment.',
      status: 502,
    };
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    return {
      ok: false,
      code: 'GENERATION_VALIDATION_FAILED',
      message:
        'The AI model returned an empty image payload. Please tap Regenerate to try again.',
      status: 422,
    };
  }

  const outBuffer = Buffer.from(b64, 'base64');
  const validated = validateImageMagicBytes(outBuffer, {
    minBytes: MIN_OUTPUT_BYTES,
    maxBytes: 15 * 1024 * 1024,
  });

  if (!validated.valid || !validated.mimeType) {
    return {
      ok: false,
      code: 'GENERATION_VALIDATION_FAILED',
      message:
        'The generated character failed output image validation. Please tap Regenerate to try again.',
      status: 422,
    };
  }

  return {
    ok: true,
    imageBase64: outBuffer.toString('base64'),
    mimeType: validated.mimeType,
    provider: 'openai',
    model: params.model,
    usedMasterReference: Boolean(params.masterRef),
  };
}

export async function transformPortraitToPrettyPiggie(params: {
  portraitBuffer: Buffer;
  portraitMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  portraitExt: 'jpg' | 'png' | 'webp';
  personality: MakeoverPersonality;
}): Promise<TransformationExecutionResult | TransformationExecutionError> {
  const cfg = getServerMakeoverConfig();
  if (!cfg.configured || !cfg.provider || !cfg.model) {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message: 'Live AI image transformation provider is not configured.',
      status: 503,
    };
  }

  const masterRef = loadMasterReferenceBuffer();
  const prompt = buildPrettyPiggiePrompt(params.personality);

  try {
    if (cfg.provider === 'gemini') {
      return await runGeminiImageTransform({
        apiKey: cfg.apiKey,
        model: cfg.model,
        portraitBuffer: params.portraitBuffer,
        portraitMimeType: params.portraitMimeType,
        masterRef,
        prompt,
      });
    }

    return await runOpenAiImageTransform({
      apiKey: cfg.apiKey,
      model: cfg.model,
      portraitBuffer: params.portraitBuffer,
      portraitMimeType: params.portraitMimeType,
      portraitExt: params.portraitExt,
      masterRef,
      prompt,
    });
  } catch {
    return {
      ok: false,
      code: 'UPSTREAM_ERROR',
      message:
        'Transformation timed out or could not reach the AI image engine. Please try again.',
      status: 504,
    };
  }
}
