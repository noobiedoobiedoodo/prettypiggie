export type PiggieCollectionId =
  | 'glam-piggie'
  | 'sweet-piggie'
  | 'glitter-piggie'
  | 'royal-piggie'
  | 'fashion-piggie';

export type PiggieHairstyleId =
  | 'soft-waves'
  | 'sleek-bob'
  | 'space-buns'
  | 'high-pony'
  | 'curly-halo'
  | 'editorial-pixie';

export type PiggieAccessoryId =
  | 'none'
  | 'royal-crown'
  | 'pearl-studs'
  | 'starlight-clips'
  | 'velvet-bow'
  | 'couture-shades';

export const PIGGIE_COLLECTION_IDS: readonly PiggieCollectionId[] = [
  'glam-piggie',
  'sweet-piggie',
  'glitter-piggie',
  'royal-piggie',
  'fashion-piggie',
] as const;

export const PIGGIE_HAIRSTYLE_OPTIONS: ReadonlyArray<{
  id: PiggieHairstyleId;
  label: string;
}> = [
  { id: 'soft-waves', label: 'Soft Glam Waves' },
  { id: 'sleek-bob', label: 'Sleek Silk Bob' },
  { id: 'space-buns', label: 'Cute Space Buns' },
  { id: 'high-pony', label: 'Snatched High Pony' },
  { id: 'curly-halo', label: 'Voluminous Curls' },
  { id: 'editorial-pixie', label: 'Editorial Pixie' },
] as const;

export const PIGGIE_ACCESSORY_OPTIONS: ReadonlyArray<{
  id: PiggieAccessoryId;
  label: string;
}> = [
  { id: 'none', label: 'No Accessory' },
  { id: 'royal-crown', label: 'Royal Rose-Gold Crown' },
  { id: 'pearl-studs', label: 'Couture Pearl Studs' },
  { id: 'starlight-clips', label: 'Starlight Hair Clips' },
  { id: 'velvet-bow', label: 'Silk Ribbon Bow' },
  { id: 'couture-shades', label: 'Runway Rosé Shades' },
] as const;

export interface SkinTonePreset {
  id: string;
  label: string;
  skinHex: string;
  snoutHex: string;
  nostrilHex: string;
  earOuterHex: string;
  earInnerHex: string;
}

/**
 * Customer-controlled inclusive complexion presets.
 * Note (Correction #4): MediaPipe Face Landmarker provides 3D mesh geometry,
 * NOT skin/hair segmentation — customers have full, explicit control over tone & hair.
 */
export const PIGGIE_SKIN_TONES: readonly SkinTonePreset[] = [
  {
    id: 'rose-porcelain',
    label: 'Rose Porcelain',
    skinHex: '#FBE3DE',
    snoutHex: '#F5AABF',
    nostrilHex: '#A64D68',
    earOuterHex: '#F7C2CF',
    earInnerHex: '#EE8EA9',
  },
  {
    id: 'petal-ivory',
    label: 'Petal Ivory',
    skinHex: '#F7D7CC',
    snoutHex: '#F29EB4',
    nostrilHex: '#9E4660',
    earOuterHex: '#F4B8C6',
    earInnerHex: '#E985A0',
  },
  {
    id: 'warm-peach',
    label: 'Warm Peach',
    skinHex: '#F0C3AF',
    snoutHex: '#EB92AA',
    nostrilHex: '#943F58',
    earOuterHex: '#ECAEBC',
    earInnerHex: '#E27B97',
  },
  {
    id: 'golden-sand',
    label: 'Golden Sand',
    skinHex: '#E2AC90',
    snoutHex: '#E0859E',
    nostrilHex: '#86364E',
    earOuterHex: '#DF9CAE',
    earInnerHex: '#D56E8A',
  },
  {
    id: 'honey-almond',
    label: 'Honey Almond',
    skinHex: '#CD8F70',
    snoutHex: '#CF748E',
    nostrilHex: '#732B41',
    earOuterHex: '#CC889A',
    earInnerHex: '#C25F7B',
  },
  {
    id: 'caramel-rose',
    label: 'Caramel Rose',
    skinHex: '#B27254',
    snoutHex: '#BC647E',
    nostrilHex: '#612235',
    earOuterHex: '#B67385',
    earInnerHex: '#AE4F6B',
  },
  {
    id: 'rich-amber',
    label: 'Rich Amber',
    skinHex: '#8E533B',
    snoutHex: '#9F526A',
    nostrilHex: '#4B1828',
    earOuterHex: '#985B6C',
    earInnerHex: '#943F59',
  },
  {
    id: 'deep-cocoa',
    label: 'Deep Cocoa',
    skinHex: '#653828',
    snoutHex: '#824157',
    nostrilHex: '#350E1B',
    earOuterHex: '#794454',
    earInnerHex: '#7B3148',
  },
] as const;

export const PIGGIE_HAIR_COLORS: ReadonlyArray<{
  id: string;
  label: string;
  hex: string;
  highlightHex: string;
}> = [
  { id: 'chestnut-rose', label: 'Chestnut Rose', hex: '#5A322E', highlightHex: '#9A5B56' },
  { id: 'espresso-noir', label: 'Espresso Noir', hex: '#231619', highlightHex: '#4B3138' },
  { id: 'champagne-blonde', label: 'Champagne Blonde', hex: '#DFC19B', highlightHex: '#F6E4CA' },
  { id: 'honey-caramel', label: 'Honey Caramel', hex: '#9B6842', highlightHex: '#C9956B' },
  { id: 'cotton-candy', label: 'Cotton Candy Pink', hex: '#EC8EAE', highlightHex: '#FBD2E0' },
  { id: 'copper-velvet', label: 'Copper Velvet', hex: '#9E4731', highlightHex: '#CF7056' },
  { id: 'berry-auburn', label: 'Berry Auburn', hex: '#692338', highlightHex: '#A6425E' },
  { id: 'platinum-pearl', label: 'Platinum Pearl', hex: '#E8E2E6', highlightHex: '#FFFFFF' },
] as const;

export const PIGGIE_EYE_COLORS: ReadonlyArray<{
  id: string;
  label: string;
  irisHex: string;
  rimHex: string;
}> = [
  { id: 'velvet-cocoa', label: 'Velvet Cocoa', irisHex: '#6B3E31', rimHex: '#2E1712' },
  { id: 'honey-hazel', label: 'Honey Hazel', irisHex: '#9C7438', rimHex: '#463114' },
  { id: 'rose-quartz', label: 'Rose Quartz', irisHex: '#C85A82', rimHex: '#561D35' },
  { id: 'sapphire-sky', label: 'Sapphire Sky', irisHex: '#4F7CAC', rimHex: '#1D3552' },
  { id: 'emerald-mist', label: 'Emerald Mist', irisHex: '#4C8B73', rimHex: '#1B4234' },
  { id: 'amethyst-glow', label: 'Amethyst Glow', irisHex: '#82589F', rimHex: '#361E4A' },
] as const;

export interface BoundedProportions {
  eyeSpacing: number;     // [-1, 1]
  eyeScale: number;       // [-1, 1]
  eyeTilt: number;        // [-1, 1]
  faceWidth: number;      // [-1, 1]
  faceLength: number;     // [-1, 1]
  cheekFullness: number;  // [-1, 1]
  jawWidth: number;       // [-1, 1]
  browHeight: number;     // [-1, 1]
  browArch: number;       // [-1, 1]
  snoutScale: number;     // [-1, 1]
  smileCurve: number;     // [0, 1]
  headYaw: number;        // [-0.35, 0.35]
  headPitch: number;      // [-0.25, 0.25]
}

export const DEFAULT_PROPORTIONS: BoundedProportions = {
  eyeSpacing: 0,
  eyeScale: 0.15,
  eyeTilt: 0.08,
  faceWidth: 0,
  faceLength: 0,
  cheekFullness: 0.2,
  jawWidth: 0,
  browHeight: 0.1,
  browArch: 0.15,
  snoutScale: 0,
  smileCurve: 0.55,
  headYaw: 0,
  headPitch: 0,
};

export interface CharacterParameters {
  version: 1;
  proportions: BoundedProportions;
  collectionId: PiggieCollectionId;
  skinToneId: string;
  hairstyleId: PiggieHairstyleId;
  hairColorId: string;
  eyeColorId: string;
  accessoryId: PiggieAccessoryId;
  lipShadeIndex: number; // 0..3
}

function safeClamp(val: unknown, min: number, max: number, fallback: number): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

export function clampProportions(
  raw: Partial<BoundedProportions> | null | undefined
): BoundedProportions {
  const src = raw ?? {};
  return {
    eyeSpacing: safeClamp(src.eyeSpacing, -1, 1, DEFAULT_PROPORTIONS.eyeSpacing),
    eyeScale: safeClamp(src.eyeScale, -1, 1, DEFAULT_PROPORTIONS.eyeScale),
    eyeTilt: safeClamp(src.eyeTilt, -1, 1, DEFAULT_PROPORTIONS.eyeTilt),
    faceWidth: safeClamp(src.faceWidth, -1, 1, DEFAULT_PROPORTIONS.faceWidth),
    faceLength: safeClamp(src.faceLength, -1, 1, DEFAULT_PROPORTIONS.faceLength),
    cheekFullness: safeClamp(
      src.cheekFullness,
      -1,
      1,
      DEFAULT_PROPORTIONS.cheekFullness
    ),
    jawWidth: safeClamp(src.jawWidth, -1, 1, DEFAULT_PROPORTIONS.jawWidth),
    browHeight: safeClamp(src.browHeight, -1, 1, DEFAULT_PROPORTIONS.browHeight),
    browArch: safeClamp(src.browArch, -1, 1, DEFAULT_PROPORTIONS.browArch),
    snoutScale: safeClamp(src.snoutScale, -1, 1, DEFAULT_PROPORTIONS.snoutScale),
    smileCurve: safeClamp(src.smileCurve, 0, 1, DEFAULT_PROPORTIONS.smileCurve),
    headYaw: safeClamp(src.headYaw, -0.35, 0.35, DEFAULT_PROPORTIONS.headYaw),
    headPitch: safeClamp(
      src.headPitch,
      -0.25,
      0.25,
      DEFAULT_PROPORTIONS.headPitch
    ),
  };
}

export function createDefaultCharacterParameters(
  collectionId: PiggieCollectionId = 'glam-piggie'
): CharacterParameters {
  const defaultAccessory: PiggieAccessoryId =
    collectionId === 'royal-piggie'
      ? 'royal-crown'
      : collectionId === 'glam-piggie'
      ? 'pearl-studs'
      : collectionId === 'sweet-piggie'
      ? 'velvet-bow'
      : collectionId === 'glitter-piggie'
      ? 'starlight-clips'
      : 'couture-shades';

  return {
    version: 1,
    proportions: { ...DEFAULT_PROPORTIONS },
    collectionId,
    skinToneId: PIGGIE_SKIN_TONES[1].id,
    hairstyleId: 'soft-waves',
    hairColorId: PIGGIE_HAIR_COLORS[0].id,
    eyeColorId: PIGGIE_EYE_COLORS[0].id,
    accessoryId: defaultAccessory,
    lipShadeIndex: 0,
  };
}

// ============================================================================
// VERSIONED + CRC32 INTEGRITY-CHECKED ZERO-PII SHARE TOKEN CODEC (v1)
// Frame layout (27 bytes -> 36 URL-safe Base64 chars):
//   [0..1]  Magic 'PP' (0x50, 0x50)
//   [2]     Schema version (0x01)
//   [3..9]  7 enum indices (collection, skin, hairstyle, hairColor, eyeColor, accessory, lipShade)
//   [10..19] 10 signed proportions quantized [-1, 1] -> 0..200 (step 0.01)
//   [20]    smileCurve [0, 1] -> 0..200 (step 0.005)
//   [21]    headYaw [-0.35, 0.35] -> 0..140 (step 0.005)
//   [22]    headPitch [-0.25, 0.25] -> 0..100 (step 0.005)
//   [23..26] IEEE 802.3 CRC32 checksum (big-endian uint32 over bytes 0..22)
// ============================================================================

const SHARE_TOKEN_VERSION = 1;
const SHARE_TOKEN_PAYLOAD_BYTES = 23;
const SHARE_TOKEN_TOTAL_BYTES = 27;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(token: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  const padded =
    token.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (token.length % 4)) % 4);
  try {
    if (typeof atob === 'function') {
      const bin = atob(padded);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) {
        out[i] = bin.charCodeAt(i);
      }
      return out;
    }
    return new Uint8Array(Buffer.from(padded, 'base64'));
  } catch {
    return null;
  }
}

const SIGNED_PROP_KEYS: ReadonlyArray<
  Exclude<keyof BoundedProportions, 'smileCurve' | 'headYaw' | 'headPitch'>
> = [
  'eyeSpacing',
  'eyeScale',
  'eyeTilt',
  'faceWidth',
  'faceLength',
  'cheekFullness',
  'jawWidth',
  'browHeight',
  'browArch',
  'snoutScale',
];

export function encodePiggieShareToken(params: CharacterParameters): string {
  const p = clampProportions(params.proportions);
  const buf = new Uint8Array(SHARE_TOKEN_TOTAL_BYTES);

  buf[0] = 0x50; // 'P'
  buf[1] = 0x50; // 'P'
  buf[2] = SHARE_TOKEN_VERSION;

  const colIdx = Math.max(0, PIGGIE_COLLECTION_IDS.indexOf(params.collectionId));
  const skinIdx = Math.max(
    0,
    PIGGIE_SKIN_TONES.findIndex((s) => s.id === params.skinToneId)
  );
  const hairStyleIdx = Math.max(
    0,
    PIGGIE_HAIRSTYLE_OPTIONS.findIndex((h) => h.id === params.hairstyleId)
  );
  const hairColorIdx = Math.max(
    0,
    PIGGIE_HAIR_COLORS.findIndex((c) => c.id === params.hairColorId)
  );
  const eyeColorIdx = Math.max(
    0,
    PIGGIE_EYE_COLORS.findIndex((e) => e.id === params.eyeColorId)
  );
  const accIdx = Math.max(
    0,
    PIGGIE_ACCESSORY_OPTIONS.findIndex((a) => a.id === params.accessoryId)
  );
  const lipIdx = Math.max(0, Math.min(3, Math.round(params.lipShadeIndex || 0)));

  buf[3] = colIdx;
  buf[4] = skinIdx;
  buf[5] = hairStyleIdx;
  buf[6] = hairColorIdx;
  buf[7] = eyeColorIdx;
  buf[8] = accIdx;
  buf[9] = lipIdx;

  for (let i = 0; i < SIGNED_PROP_KEYS.length; i += 1) {
    const v = p[SIGNED_PROP_KEYS[i]];
    buf[10 + i] = Math.max(0, Math.min(200, Math.round((v + 1) * 100)));
  }

  buf[20] = Math.max(0, Math.min(200, Math.round(p.smileCurve * 200)));
  buf[21] = Math.max(0, Math.min(140, Math.round((p.headYaw + 0.35) * 200)));
  buf[22] = Math.max(0, Math.min(100, Math.round((p.headPitch + 0.25) * 200)));

  const crc = computeCrc32(buf.subarray(0, SHARE_TOKEN_PAYLOAD_BYTES));
  buf[23] = (crc >>> 24) & 0xff;
  buf[24] = (crc >>> 16) & 0xff;
  buf[25] = (crc >>> 8) & 0xff;
  buf[26] = crc & 0xff;

  return bytesToBase64Url(buf);
}

export type ShareTokenDecodeResult =
  | { valid: true; params: CharacterParameters }
  | {
      valid: false;
      reason:
        | 'MALFORMED_TOKEN'
        | 'UNSUPPORTED_VERSION'
        | 'CHECKSUM_MISMATCH'
        | 'OUT_OF_RANGE';
    };

export function decodePiggieShareToken(
  rawToken: string | null | undefined
): ShareTokenDecodeResult {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }
  const bytes = base64UrlToBytes(rawToken.trim());
  if (!bytes || bytes.length < 4) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x50) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }
  if (bytes[2] !== SHARE_TOKEN_VERSION) {
    return { valid: false, reason: 'UNSUPPORTED_VERSION' };
  }
  if (bytes.length !== SHARE_TOKEN_TOTAL_BYTES) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }

  const expectedCrc = computeCrc32(bytes.subarray(0, SHARE_TOKEN_PAYLOAD_BYTES));
  const actualCrc =
    ((bytes[23] << 24) |
      (bytes[24] << 16) |
      (bytes[25] << 8) |
      bytes[26]) >>>
    0;

  if (expectedCrc !== actualCrc) {
    return { valid: false, reason: 'CHECKSUM_MISMATCH' };
  }

  const [colIdx, skinIdx, hairStyleIdx, hairColorIdx, eyeColorIdx, accIdx, lipIdx] =
    [bytes[3], bytes[4], bytes[5], bytes[6], bytes[7], bytes[8], bytes[9]];

  if (
    colIdx >= PIGGIE_COLLECTION_IDS.length ||
    skinIdx >= PIGGIE_SKIN_TONES.length ||
    hairStyleIdx >= PIGGIE_HAIRSTYLE_OPTIONS.length ||
    hairColorIdx >= PIGGIE_HAIR_COLORS.length ||
    eyeColorIdx >= PIGGIE_EYE_COLORS.length ||
    accIdx >= PIGGIE_ACCESSORY_OPTIONS.length ||
    lipIdx > 3
  ) {
    return { valid: false, reason: 'OUT_OF_RANGE' };
  }

  const propPartial: Partial<BoundedProportions> = {};
  for (let i = 0; i < SIGNED_PROP_KEYS.length; i += 1) {
    const q = bytes[10 + i];
    if (q > 200) return { valid: false, reason: 'OUT_OF_RANGE' };
    propPartial[SIGNED_PROP_KEYS[i]] = Number(((q - 100) / 100).toFixed(2));
  }

  if (bytes[20] > 200 || bytes[21] > 140 || bytes[22] > 100) {
    return { valid: false, reason: 'OUT_OF_RANGE' };
  }
  propPartial.smileCurve = Number((bytes[20] / 200).toFixed(3));
  propPartial.headYaw = Number((bytes[21] / 200 - 0.35).toFixed(3));
  propPartial.headPitch = Number((bytes[22] / 200 - 0.25).toFixed(3));

  return {
    valid: true,
    params: {
      version: 1,
      proportions: clampProportions(propPartial),
      collectionId: PIGGIE_COLLECTION_IDS[colIdx],
      skinToneId: PIGGIE_SKIN_TONES[skinIdx].id,
      hairstyleId: PIGGIE_HAIRSTYLE_OPTIONS[hairStyleIdx].id,
      hairColorId: PIGGIE_HAIR_COLORS[hairColorIdx].id,
      eyeColorId: PIGGIE_EYE_COLORS[eyeColorIdx].id,
      accessoryId: PIGGIE_ACCESSORY_OPTIONS[accIdx].id,
      lipShadeIndex: lipIdx,
    },
  };
}
