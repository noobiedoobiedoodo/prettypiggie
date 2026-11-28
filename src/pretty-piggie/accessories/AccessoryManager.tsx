'use client';

import React from 'react';
import { PiggieAccessoryId } from '../character/CharacterParameters';

interface AccessoryManagerProps {
  accessoryId: PiggieAccessoryId;
  headWidthScale: number;
  headLengthScale: number;
  eyeY: number;
}

/**
 * Pre-mounted modular 3D accessories attached to standardized character sockets.
 * Switching accessories toggles `visible` cleanly with zero geometry reallocation.
 */
export function AccessoryManager({
  accessoryId,
  headWidthScale,
  headLengthScale,
  eyeY,
}: AccessoryManagerProps) {
  const crownY = 0.88 * headLengthScale;

  return (
    <group>
      {/* 1. ROYAL ROSE-GOLD & PEARL CROWN */}
      <group visible={accessoryId === 'royal-crown'} position={[0, crownY, 0.08]}>
        {/* Sculpted Rose-Gold Circlet Band */}
        <mesh rotation={[Math.PI / 2 - 0.18, 0, 0]}>
          <torusGeometry args={[0.38, 0.026, 16, 48, Math.PI * 1.15]} />
          <meshStandardMaterial
            color="#F2C6A8"
            metalness={0.92}
            roughness={0.14}
          />
        </mesh>
        {/* 5 Couture Tiara Spires + Pearl Finials */}
        {[-0.52, -0.26, 0, 0.26, 0.52].map((angle, idx) => {
          const isCenter = idx === 2;
          const height = isCenter ? 0.26 : idx === 1 || idx === 3 ? 0.19 : 0.13;
          const radius = 0.37;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius - 0.06;
          return (
            <group key={idx} position={[x, height * 0.5, z]}>
              <mesh>
                <coneGeometry args={[0.042, height, 16]} />
                <meshStandardMaterial
                  color="#F5CFB2"
                  metalness={0.94}
                  roughness={0.12}
                />
              </mesh>
              <mesh position={[0, height * 0.52, 0]}>
                <sphereGeometry args={[isCenter ? 0.038 : 0.028, 20, 20]} />
                <meshPhysicalMaterial
                  color={isCenter ? '#F7B7CD' : '#FFFDF9'}
                  roughness={0.08}
                  metalness={0.1}
                  clearcoat={1}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 2. COUTURE PEARL & ROSE-GOLD DROP STUDS */}
      <group visible={accessoryId === 'pearl-studs'}>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.78 * headWidthScale, -0.08, 0.12]}
          >
            <mesh>
              <torusGeometry args={[0.055, 0.014, 12, 24]} />
              <meshStandardMaterial
                color="#F2C6A8"
                metalness={0.9}
                roughness={0.16}
              />
            </mesh>
            <mesh position={[0, -0.075, 0.01]}>
              <sphereGeometry args={[0.052, 24, 24]} />
              <meshPhysicalMaterial
                color="#FFF9FC"
                roughness={0.08}
                metalness={0.08}
                clearcoat={1}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. STARLIGHT GLITTER HAIR CLIPS */}
      <group visible={accessoryId === 'starlight-clips'}>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.66 * headWidthScale, 0.44 * headLengthScale, 0.48]}
            rotation={[0, side * 0.45, side * -0.25]}
          >
            <mesh>
              <octahedronGeometry args={[0.085, 0]} />
              <meshPhysicalMaterial
                color="#F9D5E8"
                emissive="#F48FB1"
                emissiveIntensity={0.35}
                metalness={0.65}
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>
            <mesh position={[side * -0.075, -0.06, 0.02]} scale={0.65}>
              <octahedronGeometry args={[0.085, 0]} />
              <meshPhysicalMaterial
                color="#FFF5D6"
                metalness={0.8}
                roughness={0.1}
                clearcoat={1}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. SILK RIBBON COUTURE BOW */}
      <group
        visible={accessoryId === 'velvet-bow'}
        position={[0, crownY + 0.04, 0.16]}
        rotation={[-0.15, 0, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.068, 20, 20]} />
          <meshPhysicalMaterial
            color="#E86F9A"
            roughness={0.28}
            clearcoat={0.6}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.17, 0.02, -0.01]}
            rotation={[0, 0, side * -0.22]}
            scale={[1.35, 0.85, 0.55]}
          >
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshPhysicalMaterial
              color="#F48FB1"
              roughness={0.25}
              clearcoat={0.65}
            />
          </mesh>
        ))}
      </group>

      {/* 5. RUNWAY ROSÉ CAT-EYE SHADES */}
      <group
        visible={accessoryId === 'couture-shades'}
        position={[0, eyeY - 0.01, 0.86]}
      >
        {/* Rose-Gold Bridge */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.22, 12]} />
          <meshStandardMaterial
            color="#F2C6A8"
            metalness={0.92}
            roughness={0.14}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.31, 0.01, 0]}
            rotation={[0, side * -0.14, side * 0.12]}
          >
            {/* Cat-Eye Rim */}
            <mesh scale={[1.32, 0.86, 1]}>
              <torusGeometry args={[0.17, 0.022, 14, 36]} />
              <meshStandardMaterial
                color="#260B15"
                metalness={0.45}
                roughness={0.2}
              />
            </mesh>
            {/* Translucent Rosé Tinted Lens (Eyes remain expressive underneath!) */}
            <mesh scale={[1.28, 0.82, 0.12]}>
              <sphereGeometry args={[0.165, 24, 24]} />
              <meshPhysicalMaterial
                color="#D85B88"
                transparent
                opacity={0.46}
                roughness={0.05}
                metalness={0.15}
                clearcoat={1}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
