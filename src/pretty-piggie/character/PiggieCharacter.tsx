'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CharacterParameters,
  PIGGIE_EYE_COLORS,
  PIGGIE_HAIR_COLORS,
  PIGGIE_SKIN_TONES,
  PiggieHairstyleId,
} from './CharacterParameters';
import {
  ARKitBlendshapeMap,
  deriveRigExpressionPose,
} from './MorphController';
import { computeProceduralRigMetrics } from './CharacterRig';
import { getMakeupPreset } from '../makeup/MakeupPresets';
import { ProceduralMakeupSurface } from '../makeup/MakeupEngine';
import { AccessoryManager } from '../accessories/AccessoryManager';

interface PiggieCharacterProps {
  params: CharacterParameters;
  blendshapesRef?: React.RefObject<ARKitBlendshapeMap | null>;
  capturedBlendshapes?: ARKitBlendshapeMap | null;
  prefersReducedMotion?: boolean;
}

function HairstyleMeshGroup({
  hairstyleId,
  hairHex,
  highlightHex,
  headWidthScale,
  headLengthScale,
}: {
  hairstyleId: PiggieHairstyleId;
  hairHex: string;
  highlightHex: string;
  headWidthScale: number;
  headLengthScale: number;
}) {
  return (
    <group scale={[headWidthScale, headLengthScale, 1]}>
      {/* Crown Hair Cap (Always sits cleanly behind forehead & leaves ear sockets open!) */}
      <mesh position={[0, 0.24, -0.14]} scale={[1.06, 0.98, 1.04]}>
        <sphereGeometry args={[0.84, 36, 36]} />
        <meshPhysicalMaterial
          color={hairHex}
          roughness={0.34}
          metalness={0.08}
          clearcoat={0.45}
          clearcoatRoughness={0.32}
        />
      </mesh>

      {/* Sculpted Side-Swept Curtain Crown Volume */}
      <mesh
        position={[-0.14, 0.72, 0.28]}
        rotation={[0.18, 0.12, -0.22]}
        scale={[1.28, 0.44, 0.68]}
      >
        <sphereGeometry args={[0.42, 28, 28]} />
        <meshPhysicalMaterial
          color={highlightHex}
          roughness={0.3}
          clearcoat={0.5}
        />
      </mesh>
      <mesh
        position={[0.24, 0.68, 0.26]}
        rotation={[0.18, -0.15, 0.25]}
        scale={[1.05, 0.38, 0.62]}
      >
        <sphereGeometry args={[0.38, 28, 28]} />
        <meshPhysicalMaterial
          color={hairHex}
          roughness={0.32}
          clearcoat={0.48}
        />
      </mesh>

      {/* 1. SOFT GLAM WAVES */}
      <group visible={hairstyleId === 'soft-waves'}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh
              position={[side * 0.76, -0.12, -0.02]}
              rotation={[0.08, 0, side * 0.14]}
              scale={[0.42, 1.15, 0.48]}
            >
              <sphereGeometry args={[0.62, 28, 28]} />
              <meshPhysicalMaterial
                color={hairHex}
                roughness={0.32}
                clearcoat={0.48}
              />
            </mesh>
            <mesh
              position={[side * 0.82, -0.62, 0.08]}
              rotation={[0.12, 0, side * -0.18]}
              scale={[0.38, 0.85, 0.42]}
            >
              <sphereGeometry args={[0.52, 24, 24]} />
              <meshPhysicalMaterial
                color={highlightHex}
                roughness={0.3}
                clearcoat={0.5}
              />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.45, -0.46]} scale={[1.18, 1.1, 0.55]}>
          <sphereGeometry args={[0.78, 28, 28]} />
          <meshPhysicalMaterial color={hairHex} roughness={0.35} />
        </mesh>
      </group>

      {/* 2. SLEEK SILK BOB */}
      <group visible={hairstyleId === 'sleek-bob'}>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.74, -0.08, 0.06]}
            rotation={[0, 0, side * 0.08]}
            scale={[0.34, 0.96, 0.54]}
          >
            <sphereGeometry args={[0.62, 28, 28]} />
            <meshPhysicalMaterial
              color={hairHex}
              roughness={0.22}
              clearcoat={0.72}
            />
          </mesh>
        ))}
        <mesh position={[0, -0.18, -0.42]} scale={[1.08, 0.88, 0.52]}>
          <sphereGeometry args={[0.76, 28, 28]} />
          <meshPhysicalMaterial
            color={hairHex}
            roughness={0.24}
            clearcoat={0.68}
          />
        </mesh>
      </group>

      {/* 3. CUTE SPACE BUNS */}
      <group visible={hairstyleId === 'space-buns'}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.44, 0.88, -0.08]}>
            <mesh>
              <sphereGeometry args={[0.28, 28, 28]} />
              <meshPhysicalMaterial
                color={hairHex}
                roughness={0.3}
                clearcoat={0.5}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.045, 14, 28]} />
              <meshPhysicalMaterial color={highlightHex} roughness={0.28} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. SNATCHED HIGH PONY */}
      <group visible={hairstyleId === 'high-pony'}>
        <mesh position={[0, 0.84, -0.36]}>
          <torusGeometry args={[0.16, 0.038, 12, 28]} />
          <meshStandardMaterial
            color="#E5A999"
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        <mesh
          position={[0, 0.55, -0.68]}
          rotation={[0.42, 0, 0]}
          scale={[0.56, 1.32, 0.52]}
        >
          <sphereGeometry args={[0.62, 28, 28]} />
          <meshPhysicalMaterial
            color={hairHex}
            roughness={0.28}
            clearcoat={0.58}
          />
        </mesh>
      </group>

      {/* 5. VOLUMINOUS CURLY HALO */}
      <group visible={hairstyleId === 'curly-halo'}>
        {[
          [-0.78, 0.22, -0.08, 0.34],
          [0.78, 0.22, -0.08, 0.34],
          [-0.86, -0.18, 0.02, 0.36],
          [0.86, -0.18, 0.02, 0.36],
          [-0.72, -0.54, 0.06, 0.31],
          [0.72, -0.54, 0.06, 0.31],
          [-0.45, 0.78, -0.22, 0.32],
          [0.45, 0.78, -0.22, 0.32],
          [0, 0.86, -0.28, 0.35],
        ].map(([x, y, z, r], idx) => (
          <mesh key={idx} position={[x, y, z]}>
            <sphereGeometry args={[r, 22, 22]} />
            <meshPhysicalMaterial
              color={idx % 2 === 0 ? hairHex : highlightHex}
              roughness={0.42}
              clearcoat={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* 6. EDITORIAL PIXIE (Clean sculpted fringe & tapered nape) */}
      <group visible={hairstyleId === 'editorial-pixie'}>
        <mesh
          position={[0.08, 0.74, 0.36]}
          rotation={[0.25, -0.1, 0.18]}
          scale={[1.15, 0.28, 0.55]}
        >
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshPhysicalMaterial
            color={highlightHex}
            roughness={0.26}
            clearcoat={0.62}
          />
        </mesh>
      </group>
    </group>
  );
}

export function PiggieCharacter({
  params,
  blendshapesRef,
  capturedBlendshapes,
  prefersReducedMotion = false,
}: PiggieCharacterProps) {
  const headPivotRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const leftUpperLidRef = useRef<THREE.Mesh>(null);
  const rightUpperLidRef = useRef<THREE.Mesh>(null);
  const snoutGroupRef = useRef<THREE.Group>(null);
  const mouthGroupRef = useRef<THREE.Group>(null);

  const skin = useMemo(
    () =>
      PIGGIE_SKIN_TONES.find((s) => s.id === params.skinToneId) ??
      PIGGIE_SKIN_TONES[1],
    [params.skinToneId]
  );
  const hairColor = useMemo(
    () =>
      PIGGIE_HAIR_COLORS.find((c) => c.id === params.hairColorId) ??
      PIGGIE_HAIR_COLORS[0],
    [params.hairColorId]
  );
  const eyeColor = useMemo(
    () =>
      PIGGIE_EYE_COLORS.find((e) => e.id === params.eyeColorId) ??
      PIGGIE_EYE_COLORS[0],
    [params.eyeColorId]
  );
  const makeup = useMemo(
    () => getMakeupPreset(params.collectionId),
    [params.collectionId]
  );
  const lipShade =
    makeup.lipShades[
      Math.max(0, Math.min(3, params.lipShadeIndex || 0))
    ] ?? makeup.lipShades[0];

  const [makeupSurface] = useState<ProceduralMakeupSurface | null>(() =>
    typeof document !== 'undefined' ? new ProceduralMakeupSurface() : null
  );

  const faceTexture = useMemo(
    () => makeupSurface?.getOrUpdateTexture(skin, makeup) ?? null,
    [makeupSurface, skin, makeup]
  );

  useEffect(() => {
    return () => {
      makeupSurface?.dispose();
    };
  }, [makeupSurface]);

  const staticPose = useMemo(
    () =>
      deriveRigExpressionPose(
        capturedBlendshapes ?? null,
        params.proportions
      ),
    [capturedBlendshapes, params.proportions]
  );

  const rig = useMemo(
    () => computeProceduralRigMetrics(params, staticPose),
    [params, staticPose]
  );

  // Subtle Pixar-like breathing, blink & ear micro-life (zero React state updates!)
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const liveBlendshapes = blendshapesRef?.current ?? capturedBlendshapes ?? null;
    const pose = liveBlendshapes
      ? deriveRigExpressionPose(liveBlendshapes, params.proportions)
      : staticPose;

    if (headPivotRef.current) {
      const idleYaw = prefersReducedMotion ? 0 : Math.sin(t * 0.85) * 0.045;
      const idlePitch = prefersReducedMotion ? 0 : Math.cos(t * 1.1) * 0.022;
      headPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        headPivotRef.current.rotation.y,
        rig.headYawRad + idleYaw,
        0.12
      );
      headPivotRef.current.rotation.x = THREE.MathUtils.lerp(
        headPivotRef.current.rotation.x,
        rig.headPitchRad + idlePitch,
        0.12
      );
    }

    // Periodic natural blink when no live blink blendshape is driving
    const periodicBlink =
      !prefersReducedMotion && !blendshapesRef?.current
        ? Math.pow(Math.max(0, Math.sin(t * 0.95)), 48)
        : 0;
    const blinkL = Math.max(pose.eyeBlinkLeft, periodicBlink);
    const blinkR = Math.max(pose.eyeBlinkRight, periodicBlink);

    if (leftUpperLidRef.current) {
      leftUpperLidRef.current.scale.y = 1 + blinkL * 0.75;
    }
    if (rightUpperLidRef.current) {
      rightUpperLidRef.current.scale.y = 1 + blinkR * 0.75;
    }

    if (!prefersReducedMotion) {
      const earFlutter = Math.sin(t * 1.9) * 0.035 + pose.smileAmount * 0.04;
      if (leftEarRef.current) {
        leftEarRef.current.rotation.z = 0.56 + earFlutter;
      }
      if (rightEarRef.current) {
        rightEarRef.current.rotation.z = -0.56 - earFlutter;
      }
    }

    if (snoutGroupRef.current) {
      snoutGroupRef.current.position.y =
        rig.snoutY + pose.snoutWiggle * 0.025;
    }
    if (mouthGroupRef.current) {
      mouthGroupRef.current.scale.x = 0.92 + pose.smileAmount * 0.24;
      mouthGroupRef.current.position.y = rig.mouthY - pose.jawOpen * 0.04;
    }
  });

  const lashIndices = useMemo(
    () => Array.from({ length: makeup.lashCount }, (_, i) => i),
    [makeup.lashCount]
  );

  return (
    <group position={[0, -0.08, 0]}>
      {/* ====================================================================
          NECK & CHAMPAGNE-SILK LUXURY COLLAR BUST
         ==================================================================== */}
      <group position={[0, -0.96, -0.06]}>
        {/* Sculpted Neck */}
        <mesh position={[0, 0.22, 0.02]}>
          <cylinderGeometry args={[0.24, 0.29, 0.52, 32]} />
          <meshPhysicalMaterial
            color={skin.skinHex}
            roughness={0.42}
            clearcoat={0.22}
          />
        </mesh>
        {/* Silk Couture Shoulders */}
        <mesh position={[0, -0.22, 0]} scale={[1.55, 0.62, 0.82]}>
          <sphereGeometry args={[0.68, 36, 28]} />
          <meshPhysicalMaterial
            color="#F5DFCF"
            roughness={0.26}
            metalness={0.12}
            clearcoat={0.68}
          />
        </mesh>
        {/* Rose-Gold Pearl Button at Collar */}
        <mesh position={[0, -0.06, 0.52]}>
          <sphereGeometry args={[0.048, 24, 24]} />
          <meshPhysicalMaterial
            color="#F6B8CC"
            metalness={0.35}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* ====================================================================
          ARTICULATED HEAD & CHARACTER RIG
         ==================================================================== */}
      <group ref={headPivotRef} position={[0, 0.08, 0]}>
        {/* 1. HAIRSTYLE SYSTEM */}
        <HairstyleMeshGroup
          hairstyleId={params.hairstyleId}
          hairHex={hairColor.hex}
          highlightHex={hairColor.highlightHex}
          headWidthScale={rig.headScaleX}
          headLengthScale={rig.headScaleY}
        />

        {/* 2. SIGNATURE PRETTY PIGGIE EARS (Naturally Integrated Upper Silhouette!) */}
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            ref={side === -1 ? leftEarRef : rightEarRef}
            position={[
              side * 0.64 * rig.headScaleX,
              0.56 * rig.headScaleY,
              0.04,
            ]}
            rotation={[0.24, side * -0.22, side * 0.56]}
          >
            {/* Outer Velvety Pig Ear Lobe */}
            <mesh scale={[0.78, 1.28, 0.34]}>
              <sphereGeometry args={[0.31, 32, 32]} />
              <meshPhysicalMaterial
                color={skin.earOuterHex}
                roughness={0.46}
                clearcoat={0.2}
              />
            </mesh>
            {/* Soft Tip Fold */}
            <mesh
              position={[side * 0.06, 0.33, 0.05]}
              rotation={[0.35, 0, side * -0.35]}
              scale={[0.52, 0.45, 0.28]}
            >
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshPhysicalMaterial color={skin.earOuterHex} roughness={0.45} />
            </mesh>
            {/* Blush-Pink Inner Ear Cushion */}
            <mesh position={[0, -0.02, 0.075]} scale={[0.54, 0.92, 0.2]}>
              <sphereGeometry args={[0.28, 28, 28]} />
              <meshPhysicalMaterial
                color={skin.earInnerHex}
                roughness={0.5}
                clearcoat={0.15}
              />
            </mesh>
          </group>
        ))}

        {/* 3. SCULPTED HEAD, CHEEKS & JAW */}
        <group scale={[rig.headScaleX, rig.headScaleY, rig.headScaleZ]}>
          {/* Primary Cranium & Face Sphere (Rotated -PI/2 so UV center faces Z+ camera!) */}
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <sphereGeometry args={[0.78, 48, 48]} />
            <meshPhysicalMaterial
              map={faceTexture}
              color={faceTexture ? '#FFFFFF' : skin.skinHex}
              roughness={0.4}
              metalness={0.02}
              clearcoat={0.26}
              clearcoatRoughness={0.45}
            />
          </mesh>

          {/* Lower Jaw & Chin Taper Cushion */}
          <mesh
            position={[0, -0.34, 0.14]}
            scale={[0.76 * rig.jawScaleX, 0.62, 0.76]}
          >
            <sphereGeometry args={[0.62, 36, 36]} />
            <meshPhysicalMaterial
              color={skin.skinHex}
              roughness={0.4}
              clearcoat={0.24}
            />
          </mesh>

          {/* Sculpted Apple Cheeks */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.38, -0.12, 0.46]}
              scale={[0.42 * rig.cheekScale, 0.34 * rig.cheekScale, 0.34]}
            >
              <sphereGeometry args={[0.62, 28, 28]} />
              <meshPhysicalMaterial
                color={makeup.blushHex}
                transparent
                opacity={makeup.blushOpacity * 0.38}
                roughness={0.36}
                clearcoat={0.3}
              />
            </mesh>
          ))}
        </group>

        {/* 4. OVERSIZED EXPRESSIVE 3D ANIMATED EYES + EYESHADOW + LASH FANS */}
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            position={[side * rig.eyeOffsetX, rig.eyeY, 0.65]}
            rotation={[0, side * 0.12, side * rig.eyeTiltRad]}
            scale={rig.eyeScale}
          >
            {/* Eyeshadow Halo Dome */}
            <mesh position={[0, 0.035, -0.02]} scale={[1.18, 1.05, 0.72]}>
              <sphereGeometry args={[0.175, 28, 28]} />
              <meshPhysicalMaterial
                color={makeup.eyeshadowPrimaryHex}
                roughness={makeup.eyeshadowRoughness}
                metalness={makeup.eyeshadowMetalness}
                clearcoat={makeup.glitterIntensity * 0.8}
              />
            </mesh>

            {/* Sclera White */}
            <mesh scale={[1.06, 0.98, 0.68]}>
              <sphereGeometry args={[0.165, 32, 32]} />
              <meshPhysicalMaterial
                color="#FFFDFD"
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>

            {/* Outer Iris Limbal Ring */}
            <mesh position={[0, -0.005, 0.086]} scale={[1, 1, 0.35]}>
              <sphereGeometry args={[0.112, 28, 28]} />
              <meshPhysicalMaterial
                color={eyeColor.rimHex}
                roughness={0.12}
                clearcoat={1}
              />
            </mesh>

            {/* Luminous Colored Iris */}
            <mesh position={[0, -0.005, 0.095]} scale={[1, 1, 0.32]}>
              <sphereGeometry args={[0.098, 28, 28]} />
              <meshPhysicalMaterial
                color={eyeColor.irisHex}
                roughness={0.08}
                metalness={0.12}
                clearcoat={1}
              />
            </mesh>

            {/* Deep Velvet Pupil */}
            <mesh position={[0, -0.005, 0.116]} scale={[1, 1, 0.25]}>
              <sphereGeometry args={[0.056, 24, 24]} />
              <meshBasicMaterial color="#0F070B" />
            </mesh>

            {/* Dual Pixar Specular Catchlights */}
            <mesh position={[0.034, 0.034, 0.132]}>
              <sphereGeometry args={[0.022, 16, 16]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[-0.028, -0.028, 0.13]}>
              <sphereGeometry args={[0.011, 12, 12]} />
              <meshBasicMaterial color="#FFF0F6" />
            </mesh>

            {/* Upper Shimmer Eyelid Hood (Animates Blink!) */}
            <mesh
              ref={side === -1 ? leftUpperLidRef : rightUpperLidRef}
              position={[0, 0.055, 0.01]}
              rotation={[-0.38, 0, 0]}
              scale={[1.12, 0.62, 0.74]}
            >
              <sphereGeometry
                args={[0.172, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]}
              />
              <meshPhysicalMaterial
                color={makeup.eyeshadowPrimaryHex}
                emissive={makeup.eyeshadowShimmerHex}
                emissiveIntensity={makeup.glitterIntensity * 0.22}
                roughness={makeup.eyeshadowRoughness}
                metalness={makeup.eyeshadowMetalness}
                clearcoat={0.75}
              />
            </mesh>

            {/* Precision Winged Eyeliner Arch */}
            <mesh
              position={[side * 0.015, 0.02, 0.065]}
              rotation={[0.22, 0, side * -0.08]}
              scale={[1.12, 0.92, 0.7]}
            >
              <torusGeometry args={[0.155, 0.014, 12, 32, Math.PI * 0.92]} />
              <meshStandardMaterial color={makeup.linerHex} roughness={0.25} />
            </mesh>
            {/* Outer Cat-Eye Flick */}
            <mesh
              position={[side * 0.185, 0.055, 0.04]}
              rotation={[0, 0, side * -0.62]}
              scale={[1, makeup.linerWingScale, 0.5]}
            >
              <coneGeometry args={[0.022, 0.095, 12]} />
              <meshStandardMaterial color={makeup.linerHex} roughness={0.22} />
            </mesh>

            {/* Individual Curved 3D Eyelash Fan Blades */}
            {lashIndices.map((idx) => {
              const tNorm =
                lashIndices.length > 1 ? idx / (lashIndices.length - 1) : 0.5;
              const angle = (tNorm - 0.5) * 1.15 + side * 0.18;
              const radius = 0.158;
              const lx = Math.sin(angle) * radius;
              const ly = Math.cos(angle) * radius * 0.82 + 0.012;
              const outerBoost = 0.75 + Math.abs(tNorm - 0.25) * 0.55;
              const len = 0.068 * makeup.lashLength * outerBoost;
              return (
                <mesh
                  key={idx}
                  position={[lx, ly + len * 0.32, 0.075]}
                  rotation={[-0.38, 0, -angle * 0.95]}
                >
                  <coneGeometry
                    args={[0.0085 * makeup.lashThickness, len, 8]}
                  />
                  <meshStandardMaterial
                    color={makeup.linerHex}
                    roughness={0.3}
                  />
                </mesh>
              );
            })}
          </group>
        ))}

        {/* 5. SCULPTED EXPRESSIVE EYEBROWS */}
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            position={[side * (rig.eyeOffsetX * 1.02), rig.browY, 0.67]}
            rotation={[0.12, side * 0.15, side * -rig.browArchRad]}
          >
            <mesh rotation={[0, 0, Math.PI * 0.12]}>
              <torusGeometry args={[0.175, 0.021, 12, 28, Math.PI * 0.72]} />
              <meshStandardMaterial color={hairColor.hex} roughness={0.48} />
            </mesh>
          </group>
        ))}

        {/* 6. SIGNATURE PRETTY PIGGIE BUTTON SNOUT (Adorable, Sculpted, Glossy!) */}
        <group
          ref={snoutGroupRef}
          position={[0, rig.snoutY, 0.74]}
          scale={rig.snoutScale}
        >
          {/* Soft Anatomical Bridge Blend */}
          <mesh position={[0, 0.04, -0.05]} scale={[1.15, 0.88, 0.85]}>
            <sphereGeometry args={[0.145, 28, 28]} />
            <meshPhysicalMaterial
              color={skin.snoutHex}
              roughness={0.32}
              clearcoat={0.45}
            />
          </mesh>
          {/* Upturned Oval Snout Button Cushion */}
          <mesh
            position={[0, 0, 0.045]}
            rotation={[Math.PI / 2 - 0.2, 0, 0]}
            scale={[1.26, 1, 0.92]}
          >
            <cylinderGeometry args={[0.135, 0.148, 0.095, 36]} />
            <meshPhysicalMaterial
              color={skin.snoutHex}
              roughness={0.26}
              clearcoat={0.65}
              clearcoatRoughness={0.22}
            />
          </mesh>
          {/* Soft Beveled Snout Rim */}
          <mesh
            position={[0, 0, 0.084]}
            rotation={[-0.2, 0, 0]}
            scale={[1.24, 0.92, 0.8]}
          >
            <torusGeometry args={[0.122, 0.024, 16, 36]} />
            <meshPhysicalMaterial
              color={skin.snoutHex}
              roughness={0.24}
              clearcoat={0.72}
            />
          </mesh>
          {/* Dual Recessed Teardrop Nostrils */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.055, -0.004, 0.098]}
              rotation={[-0.2, 0, side * -0.22]}
              scale={[0.78, 1.18, 0.45]}
            >
              <sphereGeometry args={[0.032, 20, 20]} />
              <meshStandardMaterial color={skin.nostrilHex} roughness={0.65} />
            </mesh>
          ))}
        </group>

        {/* 7. SCULPTED CUPID'S-BOW GLOSSY LIPS */}
        <group
          ref={mouthGroupRef}
          position={[0, rig.mouthY, 0.66]}
          scale={[rig.mouthWidthScale, 1, 1]}
        >
          {/* Upper Cupid's-Bow Lobes */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.058, 0.022, 0.04]}
              rotation={[0, 0, side * -0.18]}
              scale={[1.38, 0.72, 0.78]}
            >
              <sphereGeometry args={[0.068, 24, 24]} />
              <meshPhysicalMaterial
                color={lipShade.hex}
                roughness={makeup.lipRoughness}
                clearcoat={makeup.lipClearcoat}
                clearcoatRoughness={0.08}
              />
            </mesh>
          ))}
          {/* Smiling Corner Lift Arc */}
          <mesh
            position={[0, 0.038, 0.015]}
            rotation={[Math.PI + 0.15, 0, 0]}
            scale={[1.28, 0.65, 0.7]}
          >
            <torusGeometry args={[0.135, 0.026, 14, 32, Math.PI]} />
            <meshPhysicalMaterial
              color={lipShade.hex}
              roughness={makeup.lipRoughness}
              clearcoat={makeup.lipClearcoat}
            />
          </mesh>
          {/* Plump Lower Lip Cushion */}
          <mesh
            position={[0, -0.028, 0.042]}
            scale={[1.75, 0.82, 0.88]}
          >
            <sphereGeometry args={[0.072, 28, 28]} />
            <meshPhysicalMaterial
              color={lipShade.hex}
              roughness={makeup.lipRoughness}
              clearcoat={makeup.lipClearcoat}
              clearcoatRoughness={0.06}
            />
          </mesh>
        </group>

        {/* 8. MODULAR 3D ACCESSORIES */}
        <AccessoryManager
          accessoryId={params.accessoryId}
          headWidthScale={rig.headScaleX}
          headLengthScale={rig.headScaleY}
          eyeY={rig.eyeY}
        />
      </group>
    </group>
  );
}
