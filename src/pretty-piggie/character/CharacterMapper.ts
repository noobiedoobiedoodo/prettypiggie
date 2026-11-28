import {
  BoundedProportions,
  CharacterParameters,
  PIGGIE_ACCESSORY_OPTIONS,
  PIGGIE_COLLECTION_IDS,
  PIGGIE_EYE_COLORS,
  PIGGIE_HAIRSTYLE_OPTIONS,
  PIGGIE_HAIR_COLORS,
  PiggieCollectionId,
  clampProportions,
  createDefaultCharacterParameters,
} from './CharacterParameters';
import { ExtractedFacialFeatures } from '../tracking/FaceLandmarkProcessor';

/**
 * Smooth hyperbolic-tangent soft-knee mapper into [-1, 1].
 * Preserves clear, recognizable facial differences near typical human means
 * while smoothly clamping extreme facial angles/measurements without distortion.
 */
function softNormalizedDelta(
  value: number,
  mean: number,
  spread: number,
  bias = 0
): number {
  if (!Number.isFinite(value)) return Math.max(-1, Math.min(1, bias));
  const z = (value - mean) / Math.max(1e-5, spread) + bias;
  return Number(Math.tanh(z * 0.85).toFixed(3));
}

export interface AppearanceOverrides {
  skinToneId?: string;
  hairstyleId?: CharacterParameters['hairstyleId'];
  hairColorId?: string;
  eyeColorId?: string;
  accessoryId?: CharacterParameters['accessoryId'];
  lipShadeIndex?: number;
}

/**
 * Deterministic, repeatable FaceLandmarks -> CharacterParameters mapping function.
 * Identical extracted facial features + preset always produce byte-identical output.
 */
export function transformFaceToPiggie(
  extraction: ExtractedFacialFeatures,
  collectionPreset: PiggieCollectionId = 'glam-piggie',
  overrides?: AppearanceOverrides
): CharacterParameters {
  const base = createDefaultCharacterParameters(collectionPreset);

  if (!extraction || !extraction.valid) {
    return {
      ...base,
      ...(overrides ?? {}),
    };
  }

  const rawProportions: BoundedProportions = {
    eyeSpacing: softNormalizedDelta(extraction.interOcularRatio, 0.455, 0.048),
    eyeScale: softNormalizedDelta(
      extraction.eyeProminenceRatio,
      0.248,
      0.036,
      0.12
    ),
    eyeTilt: softNormalizedDelta(extraction.canthalTiltRad, 0.045, 0.095),
    faceWidth: softNormalizedDelta(
      extraction.faceWidthToHeightRatio,
      0.845,
      0.085
    ),
    faceLength: softNormalizedDelta(
      1 / Math.max(0.5, extraction.faceWidthToHeightRatio),
      1.18,
      0.12
    ),
    cheekFullness: softNormalizedDelta(
      extraction.cheekFullnessRatio,
      0.71,
      0.065,
      0.15
    ),
    jawWidth: softNormalizedDelta(extraction.jawToCheekRatio, 0.775, 0.075),
    browHeight: softNormalizedDelta(
      extraction.browClearanceRatio,
      0.095,
      0.024
    ),
    browArch: softNormalizedDelta(extraction.browArchRatio, 0.024, 0.014, 0.1),
    snoutScale: softNormalizedDelta(extraction.noseWidthRatio, 0.285, 0.045),
    smileCurve: Number(
      Math.max(0.2, Math.min(1, extraction.smileIntensity)).toFixed(3)
    ),
    headYaw: Number(
      Math.max(-0.35, Math.min(0.35, extraction.headPose.yaw * 0.45)).toFixed(3)
    ),
    headPitch: Number(
      Math.max(-0.25, Math.min(0.25, extraction.headPose.pitch * 0.4)).toFixed(3)
    ),
  };

  return {
    ...base,
    proportions: clampProportions(rawProportions),
    ...(overrides?.skinToneId ? { skinToneId: overrides.skinToneId } : {}),
    ...(overrides?.hairstyleId ? { hairstyleId: overrides.hairstyleId } : {}),
    ...(overrides?.hairColorId ? { hairColorId: overrides.hairColorId } : {}),
    ...(overrides?.eyeColorId ? { eyeColorId: overrides.eyeColorId } : {}),
    ...(overrides?.accessoryId ? { accessoryId: overrides.accessoryId } : {}),
    ...(typeof overrides?.lipShadeIndex === 'number'
      ? {
          lipShadeIndex: Math.max(
            0,
            Math.min(3, Math.round(overrides.lipShadeIndex))
          ),
        }
      : {}),
  };
}

/**
 * Curated "Randomize My Piggie" generator (Section 7 Screen 4).
 * Produces attractive, brand-harmonious makeup/hair/accessory combinations
 * while preserving the customer's personalized facial proportions and skin tone.
 */
export function randomizePiggieStyle(
  current: CharacterParameters,
  seed?: number
): CharacterParameters {
  const s =
    typeof seed === 'number' && Number.isFinite(seed)
      ? Math.abs(Math.floor(seed))
      : Math.floor(Math.random() * 1_000_000);

  // Pick a different collection than current so every tap visibly changes the look
  const currentColIdx = PIGGIE_COLLECTION_IDS.indexOf(current.collectionId);
  const nextColIdx =
    (currentColIdx + 1 + (s % (PIGGIE_COLLECTION_IDS.length - 1))) %
    PIGGIE_COLLECTION_IDS.length;
  const collectionId = PIGGIE_COLLECTION_IDS[nextColIdx];

  const hairstyleId =
    PIGGIE_HAIRSTYLE_OPTIONS[(s * 3 + 1) % PIGGIE_HAIRSTYLE_OPTIONS.length].id;
  const hairColorId =
    PIGGIE_HAIR_COLORS[(s * 5 + 2) % PIGGIE_HAIR_COLORS.length].id;
  const eyeColorId =
    PIGGIE_EYE_COLORS[(s * 7 + 3) % PIGGIE_EYE_COLORS.length].id;

  // Exclude 'none' during randomize so accessories delight the user
  const nonEmptyAccessories = PIGGIE_ACCESSORY_OPTIONS.filter(
    (a) => a.id !== 'none'
  );
  const accessoryId =
    collectionId === 'royal-piggie'
      ? 'royal-crown'
      : nonEmptyAccessories[(s * 11) % nonEmptyAccessories.length].id;
  const lipShadeIndex = (s * 13) % 4;

  return {
    ...current,
    collectionId,
    hairstyleId,
    hairColorId,
    eyeColorId,
    accessoryId,
    lipShadeIndex,
  };
}
