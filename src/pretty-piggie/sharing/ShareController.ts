import {
  CharacterParameters,
  encodePiggieShareToken,
} from '../character/CharacterParameters';
import { getMakeupPreset } from '../makeup/MakeupPresets';
import { ExportedPiggieCreation } from '../capture/ImageCapture';

const REF_STORAGE_KEY = 'pp_anon_referral_id';

/**
 * Generates or retrieves a lightweight non-PII anonymous referral code (`ref_xxxxxx`).
 */
export function getOrCreateAnonymousReferralCode(): string {
  if (typeof window === 'undefined') return 'ref_piggie';
  try {
    const existing = window.sessionStorage.getItem(REF_STORAGE_KEY);
    if (existing && /^ref_[a-z0-9]{6}$/.test(existing)) {
      return existing;
    }
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let suffix = '';
    const rand = new Uint8Array(6);
    crypto.getRandomValues(rand);
    for (let i = 0; i < 6; i += 1) {
      suffix += chars[rand[i] % chars.length];
    }
    const code = `ref_${suffix}`;
    window.sessionStorage.setItem(REF_STORAGE_KEY, code);
    return code;
  } catch {
    return 'ref_piggie';
  }
}

/**
 * Builds a deterministic, integrity-checked, zero-PII shareable creation URL.
 */
export function buildShareableCreationUrl(
  params: CharacterParameters,
  origin?: string
): { url: string; token: string; refCode: string } {
  const token = encodePiggieShareToken(params);
  const refCode = getOrCreateAnonymousReferralCode();
  const base =
    origin ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://prettypiggie.com');
  const url = `${base}/pretty-piggie?c=${encodeURIComponent(
    token
  )}&ref=${encodeURIComponent(refCode)}`;
  return { url, token, refCode };
}

export function buildViralShareCaption(params: CharacterParameters): string {
  const preset = getMakeupPreset(params.collectionId);
  return `Meet my ${preset.name}! 💗🐷 What would you look like as a Pretty Piggie? Create yours at PrettyPiggie.com #MyPrettyPiggie`;
}

export function triggerPngDownload(creation: ExportedPiggieCreation): void {
  const url = URL.createObjectURL(creation.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = creation.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export type ShareAttemptOutcome =
  | { status: 'shared-native' }
  | { status: 'cancelled' }
  | { status: 'fallback-downloaded'; message: string };

/**
 * Best-effort native Web Share API with verified download + clipboard fallback
 * (Mandatory Correction #13 — never reports cancelled shares as completed).
 */
export async function sharePiggieCreation(
  creation: ExportedPiggieCreation,
  params: CharacterParameters
): Promise<ShareAttemptOutcome> {
  const caption = buildViralShareCaption(params);
  const { url } = buildShareableCreationUrl(params);
  const file = new File([creation.blob], creation.fileName, {
    type: 'image/png',
  });

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const canShareFiles =
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          title: 'My Pretty Piggie™',
          text: `${caption}\n${url}`,
          files: [file],
        });
        return { status: 'shared-native' };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      // Fall through to verified download + copy fallback on WebView share errors
    }
  }

  triggerPngDownload(creation);
  try {
    await navigator.clipboard.writeText(`${caption} ${url}`);
    return {
      status: 'fallback-downloaded',
      message:
        'Your high-resolution PNG was downloaded and your share caption + link were copied to the clipboard!',
    };
  } catch {
    return {
      status: 'fallback-downloaded',
      message:
        'Your high-resolution PNG was downloaded! Tap Copy Caption or Copy Link below to post it.',
    };
  }
}
