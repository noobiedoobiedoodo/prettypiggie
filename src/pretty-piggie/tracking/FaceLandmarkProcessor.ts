import {
  ARKitBlendshapeMap,
  RawMediaPipeCategory,
  createNeutralARKitBlendshapes,
  mapMediaPipeToARKitBlendshapes,
} from '../character/MorphController';

export interface LandmarkPoint3D {
  x: number;
  y: number;
  z?: number;
}

export interface ExtractedFacialFeatures {
  valid: boolean;
  confidence: number;
  faceCount: number;
  additionalFacesDetected: boolean;
  /** Inter-pupil distance divided by bizygomatic cheek width (~0.40..0.52 typical) */
  interOcularRatio: number;
  /** Eye width + openness composite ratio (~0.21..0.29 typical) */
  eyeProminenceRatio: number;
  /** Canthal tilt in radians (positive = upward outer corner) */
  canthalTiltRad: number;
  /** Bizygomatic cheek width divided by forehead-to-chin height (~0.76..0.96 typical) */
  faceWidthToHeightRatio: number;
  /** Mid-cheek fullness index (~0.62..0.82 typical) */
  cheekFullnessRatio: number;
  /** Bigonial jaw width divided by bizygomatic cheek width (~0.68..0.88 typical) */
  jawToCheekRatio: number;
  /** Brow-to-eye vertical clearance divided by face height (~0.07..0.13 typical) */
  browClearanceRatio: number;
  /** Brow arch curvature index (~0.01..0.05 typical) */
  browArchRatio: number;
  /** Nose alar width divided by bizygomatic cheek width (~0.24..0.34 typical) */
  noseWidthRatio: number;
  /** Smile curvature [0..1] combining landmark lip corners & blendshapes */
  smileIntensity: number;
  /** Head orientation in radians */
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  blendshapes: ARKitBlendshapeMap;
}

function finiteCoord(v: unknown, fallback = 0.5): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dist2D(a: LandmarkPoint3D, b: LandmarkPoint3D): number {
  const dx = finiteCoord(a.x) - finiteCoord(b.x);
  const dy = finiteCoord(a.y) - finiteCoord(b.y);
  return Math.hypot(dx, dy);
}

function midpoint(a: LandmarkPoint3D, b: LandmarkPoint3D): LandmarkPoint3D {
  return {
    x: (finiteCoord(a.x) + finiteCoord(b.x)) * 0.5,
    y: (finiteCoord(a.y) + finiteCoord(b.y)) * 0.5,
    z: (finiteCoord(a.z, 0) + finiteCoord(b.z, 0)) * 0.5,
  };
}

/**
 * Selects the primary face deterministically when multiple faces are detected
 * (largest bounding box biased toward frame center — never switches randomly).
 */
export function selectPrimaryFaceIndex(
  faces: ReadonlyArray<ReadonlyArray<LandmarkPoint3D>>
): number {
  if (faces.length <= 1) return 0;
  let bestIdx = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < faces.length; i += 1) {
    const pts = faces[i];
    if (!pts || pts.length < 468) continue;
    const leftCheek = pts[234];
    const rightCheek = pts[454];
    const forehead = pts[10];
    const chin = pts[152];
    const w = dist2D(leftCheek, rightCheek);
    const h = dist2D(forehead, chin);
    const area = w * h;
    const cx = (finiteCoord(leftCheek.x) + finiteCoord(rightCheek.x)) * 0.5;
    const cy = (finiteCoord(forehead.y) + finiteCoord(chin.y)) * 0.5;
    const centerPenalty = Math.hypot(cx - 0.5, cy - 0.5) * 0.35;
    const score = area - centerPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function extractEulerFromMatrix4(
  matrixData: ArrayLike<number> | null | undefined
): { yaw: number; pitch: number; roll: number } | null {
  if (!matrixData || matrixData.length < 16) return null;
  // Column-major 4x4 matrix from MediaPipe
  const m00 = Number(matrixData[0]);
  const m01 = Number(matrixData[1]);
  const m02 = Number(matrixData[2]);
  const m12 = Number(matrixData[6]);
  const m22 = Number(matrixData[10]);
  if (![m00, m01, m02, m12, m22].every(Number.isFinite)) return null;

  const pitch = Math.asin(Math.max(-1, Math.min(1, -m12)));
  const yaw = Math.atan2(m02, m22);
  const roll = Math.atan2(m01, m00);
  return { yaw, pitch, roll };
}

/**
 * Pure, scale- and roll-normalized geometric facial feature extractor.
 * Requires >= 468 MediaPipe Face Mesh landmarks.
 */
export function extractFacialFeatures(params: {
  allFaceLandmarks: ReadonlyArray<ReadonlyArray<LandmarkPoint3D>>;
  allBlendshapes?: ReadonlyArray<ReadonlyArray<RawMediaPipeCategory>>;
  allTransformationMatrices?: ReadonlyArray<{ data?: ArrayLike<number> }>;
}): ExtractedFacialFeatures {
  const faces = params.allFaceLandmarks ?? [];
  const validFaces = faces.filter((f) => Array.isArray(f) && f.length >= 468);

  if (validFaces.length === 0) {
    return {
      valid: false,
      confidence: 0,
      faceCount: 0,
      additionalFacesDetected: false,
      interOcularRatio: 0.46,
      eyeProminenceRatio: 0.25,
      canthalTiltRad: 0.04,
      faceWidthToHeightRatio: 0.85,
      cheekFullnessRatio: 0.72,
      jawToCheekRatio: 0.78,
      browClearanceRatio: 0.095,
      browArchRatio: 0.025,
      noseWidthRatio: 0.28,
      smileIntensity: 0.5,
      headPose: { yaw: 0, pitch: 0, roll: 0 },
      blendshapes: createNeutralARKitBlendshapes(),
    };
  }

  const primaryIdx = selectPrimaryFaceIndex(validFaces);
  const pts = validFaces[primaryIdx];
  const blendshapes = mapMediaPipeToARKitBlendshapes(
    params.allBlendshapes?.[primaryIdx]
  );

  // Key anatomical landmarks (MediaPipe canonical 468/478 topology)
  const forehead = pts[10];
  const chin = pts[152];
  const leftCheek = pts[234];
  const rightCheek = pts[454];
  const leftMidCheek = pts[50];
  const rightMidCheek = pts[280];
  const leftJaw = pts[172];
  const rightJaw = pts[397];

  const leftEyeOuter = pts[33];
  const leftEyeInner = pts[133];
  const leftEyeTop = pts[159];
  const leftEyeBottom = pts[145];

  const rightEyeInner = pts[362];
  const rightEyeOuter = pts[263];
  const rightEyeTop = pts[386];
  const rightEyeBottom = pts[374];

  const leftBrowPeak = pts[105];
  const leftBrowInner = pts[70];
  const rightBrowPeak = pts[334];
  const rightBrowInner = pts[300];

  const noseTip = pts[4];
  const noseBridge = pts[6];
  const noseLeftAlar = pts[98];
  const noseRightAlar = pts[327];

  const mouthLeft = pts[61];
  const mouthRight = pts[291];
  const upperLip = pts[13];
  const lowerLip = pts[14];

  const leftEyeCenter = midpoint(leftEyeOuter, leftEyeInner);
  const rightEyeCenter = midpoint(rightEyeInner, rightEyeOuter);

  const cheekWidth = Math.max(0.05, dist2D(leftCheek, rightCheek));
  const faceHeight = Math.max(0.05, dist2D(forehead, chin));

  // Roll-compensated head orientation
  const eyeRoll = Math.atan2(
    finiteCoord(rightEyeCenter.y) - finiteCoord(leftEyeCenter.y),
    Math.max(1e-4, finiteCoord(rightEyeCenter.x) - finiteCoord(leftEyeCenter.x))
  );

  const matrixPose = extractEulerFromMatrix4(
    params.allTransformationMatrices?.[primaryIdx]?.data
  );
  const noseRelX =
    (finiteCoord(noseTip.x) -
      (finiteCoord(leftCheek.x) + finiteCoord(rightCheek.x)) * 0.5) /
    cheekWidth;
  const noseRelY =
    (finiteCoord(noseTip.y) - finiteCoord(noseBridge.y)) / faceHeight - 0.16;

  const headYaw = matrixPose ? matrixPose.yaw : -noseRelX * 1.4;
  const headPitch = matrixPose ? matrixPose.pitch : noseRelY * 1.6;
  const headRoll = matrixPose ? matrixPose.roll : eyeRoll;

  // Compensate horizontal widths for moderate head yaw cos(yaw)
  const yawCos = Math.max(0.72, Math.cos(Math.min(0.65, Math.abs(headYaw))));
  const normCheekWidth = cheekWidth / yawCos;

  const interOcularDist = dist2D(leftEyeCenter, rightEyeCenter) / yawCos;
  const interOcularRatio = interOcularDist / normCheekWidth;

  const leftEyeW = dist2D(leftEyeOuter, leftEyeInner) / yawCos;
  const rightEyeW = dist2D(rightEyeInner, rightEyeOuter) / yawCos;
  const leftEyeH = dist2D(leftEyeTop, leftEyeBottom);
  const rightEyeH = dist2D(rightEyeTop, rightEyeBottom);
  const avgEyeSpan =
    ((leftEyeW + rightEyeW) * 0.5 + (leftEyeH + rightEyeH) * 0.85) /
    normCheekWidth;

  // Canthal tilt (corrected for overall head roll)
  const leftTilt = Math.atan2(
    finiteCoord(leftEyeInner.y) - finiteCoord(leftEyeOuter.y),
    Math.max(1e-4, finiteCoord(leftEyeInner.x) - finiteCoord(leftEyeOuter.x))
  );
  const rightTilt = Math.atan2(
    finiteCoord(rightEyeInner.y) - finiteCoord(rightEyeOuter.y),
    Math.max(1e-4, finiteCoord(rightEyeOuter.x) - finiteCoord(rightEyeInner.x))
  );
  const canthalTiltRad = (leftTilt + rightTilt) * 0.5 + eyeRoll * 0.25;

  const faceWidthToHeightRatio = normCheekWidth / faceHeight;
  const midCheekSpan = dist2D(leftMidCheek, rightMidCheek) / yawCos;
  const cheekFullnessRatio = midCheekSpan / normCheekWidth;
  const jawWidth = dist2D(leftJaw, rightJaw) / yawCos;
  const jawToCheekRatio = jawWidth / normCheekWidth;

  const leftBrowClear =
    Math.abs(finiteCoord(leftEyeCenter.y) - finiteCoord(leftBrowPeak.y)) /
    faceHeight;
  const rightBrowClear =
    Math.abs(finiteCoord(rightEyeCenter.y) - finiteCoord(rightBrowPeak.y)) /
    faceHeight;
  const browClearanceRatio = (leftBrowClear + rightBrowClear) * 0.5;

  const leftArch =
    Math.max(0, finiteCoord(leftBrowInner.y) - finiteCoord(leftBrowPeak.y)) /
    faceHeight;
  const rightArch =
    Math.max(0, finiteCoord(rightBrowInner.y) - finiteCoord(rightBrowPeak.y)) /
    faceHeight;
  const browArchRatio = (leftArch + rightArch) * 0.5;

  const noseWidthRatio =
    dist2D(noseLeftAlar, noseRightAlar) / yawCos / normCheekWidth;

  // Smile from both mouth-corner lift & ARKit mouthSmile blendshapes
  const lipMidY = (finiteCoord(upperLip.y) + finiteCoord(lowerLip.y)) * 0.5;
  const cornerAvgY =
    (finiteCoord(mouthLeft.y) + finiteCoord(mouthRight.y)) * 0.5;
  const mouthWidthRatio = dist2D(mouthLeft, mouthRight) / yawCos / normCheekWidth;
  const geometricSmile = Math.max(
    0,
    Math.min(1, 0.45 + ((lipMidY - cornerAvgY) / faceHeight) * 8.5 + (mouthWidthRatio - 0.36) * 1.8)
  );
  const blendshapeSmile =
    (blendshapes.mouthSmileLeft + blendshapes.mouthSmileRight) * 0.5;
  const smileIntensity =
    blendshapeSmile > 0.02
      ? blendshapeSmile * 0.65 + geometricSmile * 0.35
      : geometricSmile;

  const confidence = Math.max(
    0.5,
    Math.min(1, (cheekWidth * faceHeight) / 0.08)
  );

  return {
    valid: true,
    confidence,
    faceCount: validFaces.length,
    additionalFacesDetected: validFaces.length > 1,
    interOcularRatio,
    eyeProminenceRatio: avgEyeSpan,
    canthalTiltRad,
    faceWidthToHeightRatio,
    cheekFullnessRatio,
    jawToCheekRatio,
    browClearanceRatio,
    browArchRatio,
    noseWidthRatio,
    smileIntensity: Math.max(0, Math.min(1, smileIntensity)),
    headPose: {
      yaw: Math.max(-0.6, Math.min(0.6, headYaw)),
      pitch: Math.max(-0.5, Math.min(0.5, headPitch)),
      roll: Math.max(-0.5, Math.min(0.5, headRoll)),
    },
    blendshapes,
  };
}
