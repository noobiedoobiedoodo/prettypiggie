import * as THREE from 'three';
import {
  ARKIT_52_BLENDSHAPE_NAMES,
  ARKitBlendshapeMap,
  PiggieRigExpressionPose,
} from './MorphController';
import {
  CharacterParameters,
  clampProportions,
} from './CharacterParameters';

/**
 * Standardized node & morph contract for optional artist-sculpted GLB replacement.
 * Any future `/pretty-piggie/models/piggie-master.glb` exporting these socket/bone names
 * and ARKit-52 morphTargetDictionary keys plugs into the engine with zero code rewrites.
 */
export const PIGGIE_GLB_NODE_CONTRACT = {
  headBone: 'Head',
  jawBone: 'Jaw',
  snoutNode: 'Snout',
  leftEarBone: 'Ear_L',
  rightEarBone: 'Ear_R',
  leftEyeNode: 'Eye_L',
  rightEyeNode: 'Eye_R',
  hairSocket: 'HairSocket',
  crownSocket: 'CrownSocket',
} as const;

export interface ProceduralRigMetrics {
  headScaleX: number;
  headScaleY: number;
  headScaleZ: number;
  cheekScale: number;
  jawScaleX: number;
  eyeOffsetX: number;
  eyeY: number;
  eyeScale: number;
  eyeTiltRad: number;
  browY: number;
  browArchRad: number;
  snoutScale: number;
  snoutY: number;
  mouthY: number;
  mouthWidthScale: number;
  headYawRad: number;
  headPitchRad: number;
}

/**
 * Deterministic, collision-free rig geometry calculator.
 * Converts clamped [-1, 1] CharacterParameters into safe 3D transforms.
 */
export function computeProceduralRigMetrics(
  params: CharacterParameters,
  expression?: PiggieRigExpressionPose
): ProceduralRigMetrics {
  const p = clampProportions(params.proportions);
  const puff = expression?.cheekPuff ?? 0;
  const wiggle = expression?.snoutWiggle ?? 0;
  const smile = expression?.smileAmount ?? p.smileCurve;

  const headScaleX = 1 + p.faceWidth * 0.085;
  const headScaleY = 1 + p.faceLength * 0.065;
  const headScaleZ = 0.96;

  return {
    headScaleX,
    headScaleY,
    headScaleZ,
    cheekScale: 1 + p.cheekFullness * 0.16 + puff * 0.12 + smile * 0.05,
    jawScaleX: 1 + p.jawWidth * 0.1,
    eyeOffsetX: (0.295 + p.eyeSpacing * 0.048) * headScaleX,
    eyeY: 0.14 * headScaleY,
    eyeScale: 1 + p.eyeScale * 0.14,
    eyeTiltRad: p.eyeTilt * 0.14,
    browY: (0.37 + p.browHeight * 0.038) * headScaleY,
    browArchRad: 0.08 + p.browArch * 0.12,
    snoutScale: (1 + p.snoutScale * 0.12) * (1 + wiggle * 0.05),
    snoutY: -0.075 * headScaleY + wiggle * 0.018,
    mouthY: -0.34 * headScaleY,
    mouthWidthScale: 0.92 + smile * 0.24,
    headYawRad: p.headYaw,
    headPitchRad: p.headPitch,
  };
}

/**
 * Applies all 52 ARKit blendshapes directly onto any Three.js SkinnedMesh / Mesh
 * hierarchy loaded from a future artist GLB (zero allocations per frame).
 */
export function applyARKitMorphsToGLBScene(
  root: THREE.Object3D,
  blendshapes: ARKitBlendshapeMap
): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    const dict = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;
    if (!dict || !influences) return;

    for (let i = 0; i < ARKIT_52_BLENDSHAPE_NAMES.length; i += 1) {
      const name = ARKIT_52_BLENDSHAPE_NAMES[i];
      const idx = dict[name];
      if (idx !== undefined && idx < influences.length) {
        influences[idx] = blendshapes[name] ?? 0;
      }
    }
  });
}
