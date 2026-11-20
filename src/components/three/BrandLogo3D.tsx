'use client';

import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface BrandLogo3DProps {
  variant?:
    | 'wall-crest'
    | 'floor-medallion'
    | 'counter-seal'
    | 'stage-backdrop'
    | 'product-stamp';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function BrandLogo3D({
  variant = 'wall-crest',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: BrandLogo3DProps) {
  const rawTexture = useTexture('/brand/prettypiggie-logo.png');

  const logoTexture = useMemo(() => {
    const tex = rawTexture.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }, [rawTexture]);

  if (variant === 'floor-medallion') {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Outer Rose-Gold Floor Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[1.48, 1.62, 64]} />
          <meshStandardMaterial
            color="#E6A998"
            metalness={0.92}
            roughness={0.16}
          />
        </mesh>
        {/* Glowing Warm LED Halo Ring in Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <ringGeometry args={[1.41, 1.48, 64]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F7"
            emissiveIntensity={2.2}
          />
        </mesh>
        {/* Pearl Blush Circular Medallion Base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
          <circleGeometry args={[1.41, 64]} />
          <meshPhysicalMaterial
            color="#FFFBFD"
            roughness={0.15}
            metalness={0.05}
            clearcoat={0.9}
          />
        </mesh>
        {/* Pretty Piggie Makeup Official Logo Inlay */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
          <planeGeometry args={[2.15, 2.15]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      </group>
    );
  }

  if (variant === 'wall-crest') {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Glowing LED Halo Backplate (properly rotated on mesh, not geometry) */}
        <mesh position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.08, 1.08, 0.04, 48]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFE8F1"
            emissiveIntensity={2.4}
          />
        </mesh>
        {/* Brushed Champagne Rose-Gold Frame */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.02, 1.04, 0.06, 48]} />
          <meshStandardMaterial
            color="#E6A998"
            metalness={0.92}
            roughness={0.14}
          />
        </mesh>
        {/* Pearl Illuminated Porcelain Face */}
        <mesh position={[0, 0, 0.036]}>
          <circleGeometry args={[0.95, 48]} />
          <meshStandardMaterial
            color="#FFFBFD"
            emissive="#FFF5F8"
            emissiveIntensity={0.45}
            roughness={0.2}
          />
        </mesh>
        {/* Pretty Piggie Makeup Logo Graphic */}
        <mesh position={[0, 0, 0.048]}>
          <planeGeometry args={[1.48, 1.48]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      </group>
    );
  }

  if (variant === 'counter-seal') {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Rose-Gold Medallion Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.44, 0.03, 40]} />
          <meshStandardMaterial
            color="#E6A998"
            metalness={0.92}
            roughness={0.14}
          />
        </mesh>
        {/* Glowing LED Halo Ring */}
        <mesh position={[0, 0, 0.018]}>
          <ringGeometry args={[0.37, 0.41, 40]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F7"
            emissiveIntensity={2.2}
          />
        </mesh>
        {/* Pearl Backing Disc */}
        <mesh position={[0, 0, 0.022]}>
          <circleGeometry args={[0.37, 40]} />
          <meshStandardMaterial
            color="#FFFBFD"
            emissive="#FFF5F8"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Pretty Piggie Makeup Logo */}
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[0.56, 0.56]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      </group>
    );
  }

  if (variant === 'stage-backdrop') {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Outer Champagne Rose-Gold Halo Ring */}
        <mesh>
          <torusGeometry args={[0.88, 0.032, 20, 64]} />
          <meshStandardMaterial
            color="#F2C8AD"
            metalness={0.94}
            roughness={0.12}
          />
        </mesh>
        {/* Soft Pearl Illuminated Disc */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.85, 64]} />
          <meshStandardMaterial
            color="#FFFBFD"
            emissive="#FFEBF3"
            emissiveIntensity={0.4}
            roughness={0.25}
          />
        </mesh>
        {/* Pretty Piggie Makeup Official Logo */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.34, 1.34]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      </group>
    );
  }

  // variant === 'product-stamp'
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <circleGeometry args={[0.105, 32]} />
        <meshStandardMaterial
          color="#FFFBFD"
          roughness={0.18}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[0.098, 0.11, 32]} />
        <meshStandardMaterial
          color="#E8B298"
          metalness={0.94}
          roughness={0.12}
        />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  );
}

useTexture.preload('/brand/prettypiggie-logo.png');
