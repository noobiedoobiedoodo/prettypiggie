import {
  PIGGIE_COLLECTION_IDS,
  PiggieCollectionId,
} from '../character/CharacterParameters';

/**
 * Closed allowlist of first-party Pretty Piggie funnel & reliability events (Section 12).
 */
export const ALLOWED_PIGGIE_EVENT_NAMES = [
  'piggie_experience_opened',
  'camera_permission_granted',
  'camera_permission_denied',
  'selfie_uploaded',
  'face_tracking_started',
  'transformation_completed',
  'makeup_style_selected',
  'character_captured',
  'image_downloaded',
  'native_share_opened',
  'share_completed',
  'referral_link_opened',
  'gallery_consent_given',
  'face_tracking_failed',
  'renderer_fallback_activated',
] as const;

export type PiggieEventName = (typeof ALLOWED_PIGGIE_EVENT_NAMES)[number];
export type PiggieDeviceTier = 'low' | 'medium' | 'high';

export interface PiggieEventProps {
  collectionId?: PiggieCollectionId;
  format?: '9:16' | '1:1';
  delegate?: 'GPU' | 'CPU';
  renderer?: 'webgl' | 'canvas2d';
  source?: 'camera' | 'upload' | 'shared-link';
  durationMs?: number;
  fps?: number;
  faceCount?: number;
  refCode?: string;
  errorCode?:
    | 'NO_FACE'
    | 'MULTI_FACE'
    | 'CAMERA_BLOCKED'
    | 'TRACKER_ERROR'
    | 'WEBGL_LOST';
}

export interface PiggieAnalyticsPayload {
  event: PiggieEventName;
  sessionId: string;
  timestampMs: number;
  deviceTier: PiggieDeviceTier;
  isMobile: boolean;
  props?: PiggieEventProps;
}

const TOP_LEVEL_KEYS = new Set([
  'event',
  'sessionId',
  'timestampMs',
  'deviceTier',
  'isMobile',
  'props',
]);

const EVENT_SET = new Set<string>(ALLOWED_PIGGIE_EVENT_NAMES);
const COLLECTION_SET = new Set<string>(PIGGIE_COLLECTION_IDS);
const DEVICE_TIERS = new Set<string>(['low', 'medium', 'high']);
const FORMAT_SET = new Set<string>(['9:16', '1:1']);
const DELEGATE_SET = new Set<string>(['GPU', 'CPU']);
const RENDERER_SET = new Set<string>(['webgl', 'canvas2d']);
const SOURCE_SET = new Set<string>(['camera', 'upload', 'shared-link']);
const ERROR_CODES = new Set<string>([
  'NO_FACE',
  'MULTI_FACE',
  'CAMERA_BLOCKED',
  'TRACKER_ERROR',
  'WEBGL_LOST',
]);

const SESSION_ID_REGEX = /^pp_[a-z0-9]{8,24}$/;
const REF_CODE_REGEX = /^ref_[a-z0-9]{4,12}$/;

export type AnalyticsValidationResult =
  | { valid: true; sanitized: PiggieAnalyticsPayload }
  | { valid: false; code: 'SCHEMA_VALIDATION_FAILED'; field: string };

/**
 * Strict closed-world schema validator (Mandatory Correction #11).
 * Rejects any unknown key, nested object, array, or free-form string — making it
 * structurally impossible for selfies, facial landmarks, or PII to pass validation.
 */
export function validatePiggieAnalyticsPayload(
  input: unknown
): AnalyticsValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, code: 'SCHEMA_VALIDATION_FAILED', field: 'root' };
  }
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0 || keys.length > TOP_LEVEL_KEYS.size) {
    return { valid: false, code: 'SCHEMA_VALIDATION_FAILED', field: 'root' };
  }
  for (const k of keys) {
    if (!TOP_LEVEL_KEYS.has(k)) {
      return { valid: false, code: 'SCHEMA_VALIDATION_FAILED', field: k };
    }
  }

  if (typeof obj.event !== 'string' || !EVENT_SET.has(obj.event)) {
    return { valid: false, code: 'SCHEMA_VALIDATION_FAILED', field: 'event' };
  }
  if (
    typeof obj.sessionId !== 'string' ||
    !SESSION_ID_REGEX.test(obj.sessionId)
  ) {
    return {
      valid: false,
      code: 'SCHEMA_VALIDATION_FAILED',
      field: 'sessionId',
    };
  }
  if (
    typeof obj.timestampMs !== 'number' ||
    !Number.isFinite(obj.timestampMs) ||
    obj.timestampMs < 1_700_000_000_000 ||
    obj.timestampMs > 4_102_444_800_000
  ) {
    return {
      valid: false,
      code: 'SCHEMA_VALIDATION_FAILED',
      field: 'timestampMs',
    };
  }
  if (
    typeof obj.deviceTier !== 'string' ||
    !DEVICE_TIERS.has(obj.deviceTier)
  ) {
    return {
      valid: false,
      code: 'SCHEMA_VALIDATION_FAILED',
      field: 'deviceTier',
    };
  }
  if (typeof obj.isMobile !== 'boolean') {
    return {
      valid: false,
      code: 'SCHEMA_VALIDATION_FAILED',
      field: 'isMobile',
    };
  }

  let cleanProps: PiggieEventProps | undefined;
  if (obj.props !== undefined) {
    if (
      !obj.props ||
      typeof obj.props !== 'object' ||
      Array.isArray(obj.props)
    ) {
      return {
        valid: false,
        code: 'SCHEMA_VALIDATION_FAILED',
        field: 'props',
      };
    }
    const rawProps = obj.props as Record<string, unknown>;
    const propKeys = Object.keys(rawProps);
    if (propKeys.length > 6) {
      return {
        valid: false,
        code: 'SCHEMA_VALIDATION_FAILED',
        field: 'props',
      };
    }

    cleanProps = {};
    for (const pk of propKeys) {
      const pv = rawProps[pk];
      switch (pk) {
        case 'collectionId':
          if (typeof pv !== 'string' || !COLLECTION_SET.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.collectionId',
            };
          }
          cleanProps.collectionId = pv as PiggieCollectionId;
          break;
        case 'format':
          if (typeof pv !== 'string' || !FORMAT_SET.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.format',
            };
          }
          cleanProps.format = pv as '9:16' | '1:1';
          break;
        case 'delegate':
          if (typeof pv !== 'string' || !DELEGATE_SET.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.delegate',
            };
          }
          cleanProps.delegate = pv as 'GPU' | 'CPU';
          break;
        case 'renderer':
          if (typeof pv !== 'string' || !RENDERER_SET.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.renderer',
            };
          }
          cleanProps.renderer = pv as 'webgl' | 'canvas2d';
          break;
        case 'source':
          if (typeof pv !== 'string' || !SOURCE_SET.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.source',
            };
          }
          cleanProps.source = pv as 'camera' | 'upload' | 'shared-link';
          break;
        case 'durationMs':
          if (
            typeof pv !== 'number' ||
            !Number.isFinite(pv) ||
            pv < 0 ||
            pv > 300_000
          ) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.durationMs',
            };
          }
          cleanProps.durationMs = Math.round(pv);
          break;
        case 'fps':
          if (
            typeof pv !== 'number' ||
            !Number.isFinite(pv) ||
            pv < 0 ||
            pv > 240
          ) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.fps',
            };
          }
          cleanProps.fps = Number(pv.toFixed(1));
          break;
        case 'faceCount':
          if (
            typeof pv !== 'number' ||
            !Number.isInteger(pv) ||
            pv < 0 ||
            pv > 10
          ) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.faceCount',
            };
          }
          cleanProps.faceCount = pv;
          break;
        case 'refCode':
          if (typeof pv !== 'string' || !REF_CODE_REGEX.test(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.refCode',
            };
          }
          cleanProps.refCode = pv;
          break;
        case 'errorCode':
          if (typeof pv !== 'string' || !ERROR_CODES.has(pv)) {
            return {
              valid: false,
              code: 'SCHEMA_VALIDATION_FAILED',
              field: 'props.errorCode',
            };
          }
          cleanProps.errorCode = pv as PiggieEventProps['errorCode'];
          break;
        default:
          return {
            valid: false,
            code: 'SCHEMA_VALIDATION_FAILED',
            field: `props.${pk}`,
          };
      }
    }
  }

  return {
    valid: true,
    sanitized: {
      event: obj.event as PiggieEventName,
      sessionId: obj.sessionId,
      timestampMs: Math.round(obj.timestampMs),
      deviceTier: obj.deviceTier as PiggieDeviceTier,
      isMobile: obj.isMobile,
      ...(cleanProps && Object.keys(cleanProps).length > 0
        ? { props: cleanProps }
        : {}),
    },
  };
}

let cachedSessionId: string | null = null;

function getEphemeralSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = 'pp_';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(12);
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length; i += 1) {
      out += chars[buf[i] % chars.length];
    }
  } else {
    out += Math.random().toString(36).slice(2, 12);
  }
  cachedSessionId = out;
  return out;
}

function isPrivacyOptedOut(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return (
    nav.globalPrivacyControl === true || navigator.doNotTrack === '1'
  );
}

/**
 * Non-blocking first-party telemetry dispatcher.
 * Never throws; application remains 100% functional if /api/events is unreachable.
 */
export function trackPiggieEvent(
  event: PiggieEventName,
  context: { deviceTier: PiggieDeviceTier; isMobile: boolean },
  props?: PiggieEventProps
): void {
  if (typeof window === 'undefined' || isPrivacyOptedOut()) return;

  const payload: PiggieAnalyticsPayload = {
    event,
    sessionId: getEphemeralSessionId(),
    timestampMs: Date.now(),
    deviceTier: context.deviceTier,
    isMobile: context.isMobile,
    ...(props ? { props } : {}),
  };

  const validated = validatePiggieAnalyticsPayload(payload);
  if (!validated.valid) return;

  const json = JSON.stringify(validated.sanitized);
  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([json], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/events', blob);
      if (queued) return;
    }
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent resilience per Section 2
  }
}
