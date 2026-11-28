import { BoundedProportions } from './CharacterParameters';

/**
 * Canonical 52 ARKit Blendshape Channel Names (Mandatory Correction #6).
 * Matches both MediaPipe Face Landmarker blendshape categories and standard
 * artist-authored ARKit GLB morphTargetDictionary keys.
 */
export const ARKIT_52_BLENDSHAPE_NAMES = [
  'browDownLeft',
  'browDownRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  'cheekPuff',
  'cheekSquintLeft',
  'cheekSquintRight',
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'eyeLookDownLeft',
  'eyeLookDownRight',
  'eyeLookInLeft',
  'eyeLookInRight',
  'eyeLookOutLeft',
  'eyeLookOutRight',
  'eyeLookUpLeft',
  'eyeLookUpRight',
  'eyeSquintLeft',
  'eyeSquintRight',
  'eyeWideLeft',
  'eyeWideRight',
  'jawForward',
  'jawLeft',
  'jawOpen',
  'jawRight',
  'mouthClose',
  'mouthDimpleLeft',
  'mouthDimpleRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'mouthFunnel',
  'mouthLeft',
  'mouthLowerDownLeft',
  'mouthLowerDownRight',
  'mouthPressLeft',
  'mouthPressRight',
  'mouthPucker',
  'mouthRight',
  'mouthRollLower',
  'mouthRollUpper',
  'mouthShrugLower',
  'mouthShrugUpper',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthStretchLeft',
  'mouthStretchRight',
  'mouthUpperUpLeft',
  'mouthUpperUpRight',
  'noseSneerLeft',
  'noseSneerRight',
  'tongueOut',
] as const;

export type ARKitBlendshapeName = (typeof ARKIT_52_BLENDSHAPE_NAMES)[number];
export type ARKitBlendshapeMap = Record<ARKitBlendshapeName, number>;

const ARKIT_NAME_LOOKUP: ReadonlyMap<string, ARKitBlendshapeName> = (() => {
  const m = new Map<string, ARKitBlendshapeName>();
  for (const name of ARKIT_52_BLENDSHAPE_NAMES) {
    m.set(name, name);
    m.set(name.toLowerCase(), name);
    // Support PascalCase or _L/_R artist GLB export conventions as well
    m.set(name[0].toUpperCase() + name.slice(1), name);
  }
  return m;
})();

export function createNeutralARKitBlendshapes(): ARKitBlendshapeMap {
  const out = {} as ARKitBlendshapeMap;
  for (const key of ARKIT_52_BLENDSHAPE_NAMES) {
    out[key] = 0;
  }
  return out;
}

export interface RawMediaPipeCategory {
  categoryName?: string;
  displayName?: string;
  score?: number;
}

/**
 * Explicit, clamped MediaPipe -> ARKit-52 blendshape mapper.
 * Safely ignores `_neutral` and unknown categories while clamping all scores to [0, 1].
 */
export function mapMediaPipeToARKitBlendshapes(
  categories: ReadonlyArray<RawMediaPipeCategory> | null | undefined
): ARKitBlendshapeMap {
  const map = createNeutralARKitBlendshapes();
  if (!Array.isArray(categories)) return map;

  for (const cat of categories) {
    if (!cat || typeof cat !== 'object') continue;
    const rawName = (cat.categoryName || cat.displayName || '').trim();
    if (!rawName || rawName === '_neutral') continue;

    const canonical =
      ARKIT_NAME_LOOKUP.get(rawName) ??
      ARKIT_NAME_LOOKUP.get(rawName.toLowerCase());
    if (!canonical) continue;

    const rawScore = typeof cat.score === 'number' ? cat.score : Number(cat.score);
    if (!Number.isFinite(rawScore)) continue;
    map[canonical] = Math.max(0, Math.min(1, rawScore));
  }

  return map;
}

export interface PiggieRigExpressionPose {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  gazeX: number;
  gazeY: number;
  browLiftLeft: number;
  browLiftRight: number;
  jawOpen: number;
  smileAmount: number;
  mouthPucker: number;
  cheekPuff: number;
  snoutWiggle: number;
}

/**
 * Resolves ARKit-52 blendshapes + character baseline smile into normalized rig channels.
 */
export function deriveRigExpressionPose(
  blendshapes: ARKitBlendshapeMap | null | undefined,
  proportions: BoundedProportions
): PiggieRigExpressionPose {
  if (!blendshapes) {
    return {
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0,
      eyeWideLeft: 0.08,
      eyeWideRight: 0.08,
      gazeX: 0,
      gazeY: 0,
      browLiftLeft: Math.max(0, proportions.browHeight * 0.5),
      browLiftRight: Math.max(0, proportions.browHeight * 0.5),
      jawOpen: 0.04,
      smileAmount: proportions.smileCurve,
      mouthPucker: 0.1,
      cheekPuff: Math.max(0, proportions.cheekFullness * 0.25),
      snoutWiggle: 0,
    };
  }

  const rawSmile =
    (blendshapes.mouthSmileLeft + blendshapes.mouthSmileRight) * 0.5 -
    (blendshapes.mouthFrownLeft + blendshapes.mouthFrownRight) * 0.25;
  const blendedSmile = Math.max(
    0,
    Math.min(1, rawSmile * 0.65 + proportions.smileCurve * 0.35)
  );

  const gazeX =
    (blendshapes.eyeLookOutRight -
      blendshapes.eyeLookInRight +
      blendshapes.eyeLookInLeft -
      blendshapes.eyeLookOutLeft) *
    0.5;
  const gazeY =
    (blendshapes.eyeLookUpLeft +
      blendshapes.eyeLookUpRight -
      blendshapes.eyeLookDownLeft -
      blendshapes.eyeLookDownRight) *
    0.5;

  return {
    eyeBlinkLeft: Math.min(
      0.95,
      blendshapes.eyeBlinkLeft + blendshapes.eyeSquintLeft * 0.25
    ),
    eyeBlinkRight: Math.min(
      0.95,
      blendshapes.eyeBlinkRight + blendshapes.eyeSquintRight * 0.25
    ),
    eyeWideLeft: blendshapes.eyeWideLeft,
    eyeWideRight: blendshapes.eyeWideRight,
    gazeX: Math.max(-1, Math.min(1, gazeX)),
    gazeY: Math.max(-1, Math.min(1, gazeY)),
    browLiftLeft: Math.max(
      -0.6,
      Math.min(
        1,
        blendshapes.browOuterUpLeft * 0.65 +
          blendshapes.browInnerUp * 0.55 -
          blendshapes.browDownLeft * 0.7
      )
    ),
    browLiftRight: Math.max(
      -0.6,
      Math.min(
        1,
        blendshapes.browOuterUpRight * 0.65 +
          blendshapes.browInnerUp * 0.55 -
          blendshapes.browDownRight * 0.7
      )
    ),
    jawOpen: Math.max(0, Math.min(0.85, blendshapes.jawOpen)),
    smileAmount: blendedSmile,
    mouthPucker: Math.max(
      0,
      Math.min(1, blendshapes.mouthPucker * 0.8 + blendshapes.mouthFunnel * 0.3)
    ),
    cheekPuff: Math.max(
      0,
      Math.min(
        1,
        blendshapes.cheekPuff * 0.7 +
          (blendshapes.cheekSquintLeft + blendshapes.cheekSquintRight) * 0.25
      )
    ),
    snoutWiggle: Math.max(
      0,
      Math.min(
        1,
        (blendshapes.noseSneerLeft + blendshapes.noseSneerRight) * 0.65
      )
    ),
  };
}
