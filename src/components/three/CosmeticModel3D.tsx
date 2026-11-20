'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FinishType, ProductModelType } from '@/types/boutique';
import { BrandLogo3D } from './BrandLogo3D';

interface CosmeticModel3DProps {
  modelType: ProductModelType;
  shadeHex: string;
  secondaryHex?: string;
  finish?: FinishType;
  isStage?: boolean;
  isHovered?: boolean;
  scale?: number;
  autoRotate?: boolean;
}

export function CosmeticModel3D({
  modelType,
  shadeHex,
  secondaryHex = '#F5D5E0',
  finish = 'Satin Crème',
  isStage = false,
  isHovered = false,
  scale = 1,
  autoRotate = true,
}: CosmeticModel3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const isMatte = finish === 'Velvet Matte';
  const isGloss = finish === 'Mirror Gloss';
  const isShimmer = finish === 'Rose Shimmer';

  const formulaRoughness = isMatte ? 0.58 : isGloss ? 0.06 : isShimmer ? 0.18 : 0.22;
  const formulaMetalness = isShimmer ? 0.38 : 0.08;
  const formulaClearcoat = isMatte ? 0.1 : isGloss ? 1.0 : 0.75;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) {
      groupRef.current.rotation.y += delta * (isStage ? 0.45 : isHovered ? 1.4 : 0.35);
    }
    if (!isStage) {
      const floatOffset = Math.sin(state.clock.elapsedTime * 2.2) * 0.03;
      groupRef.current.position.y = floatOffset + (isHovered ? 0.08 : 0);
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {modelType === 'lipstick' && (
        <group position={[isStage ? 0.16 : 0, 0, 0]}>
          {/* Lower Square Obsidian & Brushed Rose-Gold Case (Screenshot 220242) */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.38, 0.68, 0.38]} />
            <meshStandardMaterial
              color="#F2CBAE"
              metalness={0.88}
              roughness={0.18}
            />
          </mesh>
          {/* Obsidian Black Inset Panels on the 4 faces */}
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.32, 0.59, 0.4]} />
            <meshStandardMaterial color="#181216" metalness={0.35} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.4, 0.59, 0.32]} />
            <meshStandardMaterial color="#181216" metalness={0.35} roughness={0.25} />
          </mesh>

          {/* Official Pretty Piggie Makeup Couture Emblem on Lipstick Case */}
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 0.35, 0.203]}
            scale={1.08}
          />
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 0.35, -0.203]}
            rotation={[0, Math.PI, 0]}
            scale={1.08}
          />

          {/* Stepped Gold Collar */}
          <mesh position={[0, 0.71, 0]}>
            <boxGeometry args={[0.32, 0.06, 0.32]} />
            <meshStandardMaterial color="#F5D7B8" metalness={0.92} roughness={0.14} />
          </mesh>

          {/* Champagne Gold Inner Barrel */}
          <mesh position={[0, 0.94, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.42, 32]} />
            <meshStandardMaterial color="#F8DEC0" metalness={0.95} roughness={0.12} />
          </mesh>

          {/* Sculpted Lipstick Bullet in Selected Shade */}
          <group position={[0, 1.25, 0]}>
            <mesh>
              <cylinderGeometry args={[0.112, 0.115, 0.36, 32]} />
              <meshPhysicalMaterial
                color={shadeHex}
                roughness={formulaRoughness}
                metalness={formulaMetalness}
                clearcoat={formulaClearcoat}
                clearcoatRoughness={0.12}
              />
            </mesh>
            {/* Diamond Angled Lipstick Tip */}
            <mesh position={[0, 0.2, 0.01]} rotation={[0.52, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.112, 0.14, 32]} />
              <meshPhysicalMaterial
                color={shadeHex}
                roughness={formulaRoughness}
                metalness={formulaMetalness}
                clearcoat={formulaClearcoat}
                clearcoatRoughness={0.1}
              />
            </mesh>
          </group>

          {/* Companion Obsidian & Gold Cap beside the lipstick (as seen in Screenshot 220242) */}
          {isStage && (
            <group position={[-0.56, -0.06, 0.04]} rotation={[0, 0.22, 0]}>
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.38, 0.68, 0.38]} />
                <meshStandardMaterial color="#F2CBAE" metalness={0.88} roughness={0.18} />
              </mesh>
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.32, 0.59, 0.4]} />
                <meshStandardMaterial color="#181216" metalness={0.35} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[0.4, 0.59, 0.32]} />
                <meshStandardMaterial color="#181216" metalness={0.35} roughness={0.25} />
              </mesh>
              <BrandLogo3D
                variant="product-stamp"
                position={[0, 0.35, 0.203]}
                scale={1.08}
              />
            </group>
          )}
        </group>
      )}

      {modelType === 'lipgloss' && (
        <group>
          {/* Outer Crystal Glass Vial */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.86, 32]} />
            <meshPhysicalMaterial
              color="#FFF5F8"
              transparent
              opacity={0.36}
              roughness={0.05}
              metalness={0.05}
              transmission={0.65}
              clearcoat={1}
            />
          </mesh>
          {/* Inner Gloss Pigment Chamber */}
          <mesh position={[0, 0.43, 0]}>
            <cylinderGeometry args={[0.138, 0.138, 0.76, 28]} />
            <meshPhysicalMaterial
              color={shadeHex}
              roughness={0.08}
              metalness={isShimmer ? 0.32 : 0.08}
              clearcoat={1}
              clearcoatRoughness={0.06}
            />
          </mesh>
          {/* Rose-Gold Base Band */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.172, 0.172, 0.06, 32]} />
            <meshStandardMaterial color="#E8B298" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Rose-Gold Collar & Cap */}
          <mesh position={[0, 0.92, 0]}>
            <cylinderGeometry args={[0.155, 0.168, 0.1, 32]} />
            <meshStandardMaterial color="#F3D2B8" metalness={0.92} roughness={0.14} />
          </mesh>
          <mesh position={[0, 1.19, 0]}>
            <cylinderGeometry args={[0.15, 0.155, 0.44, 32]} />
            <meshStandardMaterial color="#FCE4EC" metalness={0.35} roughness={0.2} />
          </mesh>
          {/* Top Rose-Gold Crown */}
          <mesh position={[0, 1.42, 0]}>
            <cylinderGeometry args={[0.152, 0.152, 0.05, 32]} />
            <meshStandardMaterial color="#E8B298" metalness={0.92} roughness={0.14} />
          </mesh>
          {/* Official Pretty Piggie Makeup Emblem on Lip Gloss Cap */}
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 1.18, 0.156]}
            scale={0.85}
          />
        </group>
      )}

      {modelType === 'compact' && (
        <group position={[0, 0.02, 0]}>
          {/* Compact Lower Rose-Gold Dish */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.48, 0.44, 0.14, 40]} />
            <meshStandardMaterial color="#E8B298" metalness={0.88} roughness={0.18} />
          </mesh>
          {/* Inner Obsidian Frame */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.03, 40]} />
            <meshStandardMaterial color="#23181D" metalness={0.4} roughness={0.3} />
          </mesh>
          {/* Embossed Blush / Highlighter Cushion Pan */}
          <mesh position={[0, 0.165, 0]}>
            <cylinderGeometry args={[0.37, 0.37, 0.035, 40]} />
            <meshPhysicalMaterial
              color={shadeHex}
              roughness={formulaRoughness}
              metalness={formulaMetalness}
              clearcoat={0.45}
            />
          </mesh>
          {/* Subtle Silk Wave Rings on Pan */}
          <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.015, 12, 36]} />
            <meshStandardMaterial
              color={secondaryHex}
              metalness={0.45}
              roughness={0.22}
            />
          </mesh>

          {/* Open Hinged Mirrored Lid */}
          <group position={[0, 0.16, -0.42]} rotation={[0.42, 0, 0]}>
            <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.47, 0.47, 0.07, 40]} />
              <meshStandardMaterial color="#E8B298" metalness={0.88} roughness={0.18} />
            </mesh>
            {/* Blush Enamel Exterior Top */}
            <mesh position={[0, 0.42, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.02, 40]} />
              <meshPhysicalMaterial color="#F8C8D8" roughness={0.15} clearcoat={1} />
            </mesh>
            {/* Interior Vanity Mirror */}
            <mesh position={[0, 0.42, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.01, 40]} />
              <meshStandardMaterial color="#FFF6FA" metalness={0.98} roughness={0.04} />
            </mesh>
            {/* Pretty Piggie Makeup Crest on Compact Lid */}
            <BrandLogo3D
              variant="product-stamp"
              position={[0, 0.42, 0.046]}
              scale={1.55}
            />
          </group>
        </group>
      )}

      {modelType === 'foundation' && (
        <group>
          {/* Frosted Glass Base Pedestal */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.08, 32]} />
            <meshStandardMaterial color="#E8B298" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Frosted Satin Serum Bottle */}
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.86, 32]} />
            <meshPhysicalMaterial
              color={shadeHex}
              roughness={0.24}
              metalness={0.05}
              clearcoat={0.85}
              clearcoatRoughness={0.12}
            />
          </mesh>
          {/* Rose-Gold Brand Band */}
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.234, 0.234, 0.06, 32]} />
            <meshStandardMaterial color="#F3D2B8" metalness={0.92} roughness={0.14} />
          </mesh>
          {/* Pump Shoulder & Dispenser */}
          <mesh position={[0, 1.02, 0]}>
            <cylinderGeometry args={[0.15, 0.21, 0.14, 32]} />
            <meshStandardMaterial color="#E8B298" metalness={0.92} roughness={0.14} />
          </mesh>
          <mesh position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.2, 24]} />
            <meshStandardMaterial color="#1E1519" metalness={0.5} roughness={0.25} />
          </mesh>
          {/* Translucent Blush Overcap */}
          <mesh position={[0, 1.18, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.34, 32]} />
            <meshPhysicalMaterial
              color="#FCE6EE"
              transparent
              opacity={0.48}
              roughness={0.08}
              clearcoat={1}
            />
          </mesh>
          {/* Pretty Piggie Makeup Seal on Foundation Bottle */}
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 0.5, 0.233]}
            scale={1.25}
          />
        </group>
      )}

      {modelType === 'palette' && (
        <group position={[0, 0.02, 0]}>
          {/* Palette Base Tray */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.92, 0.09, 0.74]} />
            <meshStandardMaterial color="#E8B298" metalness={0.86} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.86, 0.03, 0.68]} />
            <meshStandardMaterial color="#1E1419" metalness={0.4} roughness={0.35} />
          </mesh>

          {/* 9 Couture Eyeshadow Pans (3x3 Grid) */}
          {[-0.25, 0, 0.25].map((x, xi) =>
            [-0.19, 0, 0.19].map((z, zi) => {
              const idx = xi * 3 + zi;
              const panColors = [
                shadeHex,
                secondaryHex,
                '#F7D8E2',
                '#C85A7C',
                shadeHex,
                '#E8B298',
                '#7D2948',
                secondaryHex,
                '#FCEBF0',
              ];
              const isFoil = idx % 2 === 0;
              return (
                <mesh key={`${xi}-${zi}`} position={[x, 0.12, z]}>
                  <boxGeometry args={[0.2, 0.025, 0.14]} />
                  <meshPhysicalMaterial
                    color={panColors[idx]}
                    metalness={isFoil ? 0.55 : 0.08}
                    roughness={isFoil ? 0.16 : 0.55}
                    clearcoat={isFoil ? 0.9 : 0.1}
                  />
                </mesh>
              );
            })
          )}

          {/* Open Mirrored Lid with Glowing Frame */}
          <group position={[0, 0.11, -0.36]} rotation={[-0.38, 0, 0]}>
            <mesh position={[0, 0.37, 0]}>
              <boxGeometry args={[0.92, 0.74, 0.05]} />
              <meshStandardMaterial color="#F2C2D4" metalness={0.45} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0.37, 0.028]}>
              <boxGeometry args={[0.8, 0.62, 0.01]} />
              <meshStandardMaterial color="#FFF6FA" metalness={0.96} roughness={0.05} />
            </mesh>
            {/* Pretty Piggie Makeup Crest on Palette Mirror Frame */}
            <BrandLogo3D
              variant="product-stamp"
              position={[0, 0.37, 0.036]}
              scale={1.7}
            />
          </group>
        </group>
      )}

      {modelType === 'brushset' && (
        <group>
          {/* Sculptural Blush & Rose-Gold Vanity Cylinder (Screenshot 220326) */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.28, 0.26, 0.54, 32]} />
            <meshPhysicalMaterial
              color="#F4B8CC"
              roughness={0.18}
              metalness={0.15}
              clearcoat={0.85}
            />
          </mesh>
          {/* Rose-Gold & Obsidian LED Accent Rings on Holder */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.286, 0.286, 0.05, 32]} />
            <meshStandardMaterial color="#1C1418" metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.266, 0.266, 0.05, 32]} />
            <meshStandardMaterial color="#E8B298" metalness={0.92} roughness={0.14} />
          </mesh>
          {/* Pretty Piggie Makeup Crest on Brush Vanity Cylinder */}
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 0.26, 0.275]}
            scale={1.35}
          />
          <BrandLogo3D
            variant="product-stamp"
            position={[0, 0.26, -0.275]}
            rotation={[0, Math.PI, 0]}
            scale={1.35}
          />

          {/* 5 Sculptural Makeup Brushes Fanning Out */}
          {[
            { x: 0, z: 0, h: 0.72, r: 0.17, rotZ: 0, rotX: 0 },
            { x: -0.13, z: 0.06, h: 0.65, r: 0.13, rotZ: 0.14, rotX: 0.06 },
            { x: 0.13, z: 0.06, h: 0.64, r: 0.14, rotZ: -0.14, rotX: 0.06 },
            { x: -0.09, z: -0.09, h: 0.58, r: 0.09, rotZ: 0.08, rotX: -0.1 },
            { x: 0.09, z: -0.09, h: 0.58, r: 0.09, rotZ: -0.08, rotX: -0.1 },
          ].map((b, i) => (
            <group
              key={i}
              position={[b.x, 0.42, b.z]}
              rotation={[b.rotX, 0, b.rotZ]}
            >
              {/* Handle */}
              <mesh position={[0, b.h * 0.35, 0]}>
                <cylinderGeometry args={[0.036, 0.028, b.h * 0.7, 20]} />
                <meshStandardMaterial
                  color={secondaryHex}
                  metalness={0.45}
                  roughness={0.22}
                />
              </mesh>
              {/* Rose-Gold Ferrule */}
              <mesh position={[0, b.h * 0.75, 0]}>
                <cylinderGeometry args={[0.045, 0.036, 0.18, 20]} />
                <meshStandardMaterial
                  color={shadeHex}
                  metalness={0.92}
                  roughness={0.14}
                />
              </mesh>
              {/* Plush Two-Tone Dome Bristles */}
              <mesh position={[0, b.h * 0.95, 0]} scale={[1, 1.15, 0.85]}>
                <sphereGeometry args={[b.r, 24, 24]} />
                <meshStandardMaterial
                  color="#26181F"
                  roughness={0.85}
                  metalness={0.05}
                />
              </mesh>
              {/* Blush-Dipped Bristle Tips */}
              <mesh position={[0, b.h * 1.01, 0]} scale={[0.92, 0.65, 0.78]}>
                <sphereGeometry args={[b.r, 20, 20]} />
                <meshStandardMaterial
                  color="#FCE8F0"
                  roughness={0.78}
                  metalness={0.05}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}
