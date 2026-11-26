'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoutiqueProduct, ProductShade } from '@/types/boutique';
import { CosmeticModel3D } from './CosmeticModel3D';
import { BrandLogo3D } from './BrandLogo3D';

interface ProductPresentationStage3DProps {
  product: BoutiqueProduct;
  selectedShade: ProductShade;
  rotationYOffsetRef: React.RefObject<number>;
  prefersReducedMotion?: boolean;
}

export function ProductPresentationStage3D({
  product,
  selectedShade,
  rotationYOffsetRef,
  prefersReducedMotion = false,
}: ProductPresentationStage3DProps) {
  const floatingLeftSphere = useRef<THREE.Mesh>(null);
  const floatingRightSphere = useRef<THREE.Mesh>(null);
  const floatingLeftCube = useRef<THREE.Mesh>(null);
  const floatingRightCube = useRef<THREE.Mesh>(null);
  const productPivotRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!prefersReducedMotion) {
      const t = state.clock.elapsedTime;

      if (floatingLeftSphere.current) {
        floatingLeftSphere.current.position.y =
          1.65 + Math.sin(t * 1.6) * 0.11;
      }
      if (floatingRightSphere.current) {
        floatingRightSphere.current.position.y =
          2.35 + Math.sin(t * 1.4 + 1.2) * 0.13;
      }
      if (floatingLeftCube.current) {
        floatingLeftCube.current.rotation.x = 0.5 + t * 0.35;
        floatingLeftCube.current.rotation.y = 0.4 + t * 0.25;
        floatingLeftCube.current.position.y =
          1.15 + Math.cos(t * 1.3 + 0.5) * 0.09;
      }
      if (floatingRightCube.current) {
        floatingRightCube.current.rotation.x = -0.4 + t * 0.3;
        floatingRightCube.current.rotation.z = 0.35 + t * 0.22;
        floatingRightCube.current.position.y =
          1.85 + Math.sin(t * 1.5 + 2.1) * 0.1;
      }
    }
    if (productPivotRef.current) {
      productPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        productPivotRef.current.rotation.y,
        rotationYOffsetRef.current ?? 0,
        0.14
      );
    }
  });

  return (
    <group position={[0, 12.0, 0]}>
      {/* Dedicated Studio Lighting for the Product Presentation Stage */}
      <pointLight position={[0, 4.2, 3.2]} intensity={2.2} color="#FFF7FA" />
      <pointLight position={[-2.8, 2.5, 2.2]} intensity={1.4} color="#FFD6E6" />
      <pointLight position={[2.8, 2.2, 2.0]} intensity={1.3} color="#FCE1C9" />

      {/* Soft Mauve-Blush Editorial Studio Backdrop & Floor (Screenshot 220242) */}
      <mesh position={[0, 2.4, -2.4]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#C888AC" roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshPhysicalMaterial
          color="#BA8B9E"
          roughness={0.22}
          metalness={0.18}
          clearcoat={0.75}
        />
      </mesh>

      {/* Main Cylindrical Blush Podium with Glowing Warm-White LED Ring (Screenshot 220242) */}
      <group position={[-0.25, 0, 0.2]}>
        {/* Lower Cylinder Base */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[1.22, 1.22, 0.32, 64]} />
          <meshPhysicalMaterial
            color="#F5C6D6"
            roughness={0.2}
            metalness={0.12}
            clearcoat={0.8}
          />
        </mesh>
        {/* Glowing Warm-White LED Strip Band Around Podium */}
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[1.238, 1.238, 0.075, 64]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF6FA"
            emissiveIntensity={2.8}
          />
        </mesh>
        {/* Brushed Rose-Gold Top Surface Plate */}
        <mesh position={[0, 0.325, 0]}>
          <cylinderGeometry args={[1.21, 1.21, 0.015, 64]} />
          <meshStandardMaterial color="#E6A998" metalness={0.88} roughness={0.18} />
        </mesh>
      </group>

      {/* Tiered Rectangular Blush Block Platform Behind/Right (Screenshot 220242) */}
      <group position={[0.48, 0, -0.15]}>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[1.38, 0.68, 0.96]} />
          <meshPhysicalMaterial
            color="#F4BFD1"
            roughness={0.22}
            metalness={0.1}
            clearcoat={0.7}
          />
        </mesh>
        {/* Mid Seam Accent & Official Pretty Piggie Makeup Podium Seal (Elevated above circular base) */}
        <mesh position={[0, 0.34, -0.02]}>
          <boxGeometry args={[1.39, 0.02, 0.92]} />
          <meshStandardMaterial color="#8A4860" metalness={0.5} roughness={0.3} />
        </mesh>
        <BrandLogo3D
          variant="counter-seal"
          position={[0.42, 0.51, 0.49]}
          scale={0.34}
        />
      </group>

      {/* Vertical Glowing Rose-Gold Light Bar on Outer Left (Screenshot 220242) */}
      <mesh position={[-2.48, 1.9, -0.35]}>
        <cylinderGeometry args={[0.032, 0.032, 3.4, 24]} />
        <meshStandardMaterial
          color="#FCE0C8"
          metalness={0.95}
          roughness={0.1}
          emissive="#FAD5B8"
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Semicircular Rose-Gold Halo Arch Behind Podium (Screenshot 220242) */}
      <mesh position={[0.42, 0.1, -0.52]}>
        <torusGeometry args={[1.18, 0.032, 20, 64, Math.PI]} />
        <meshStandardMaterial color="#F2C8AD" metalness={0.94} roughness={0.12} />
      </mesh>

      {/* Upper-Left Pretty Piggie Makeup Illuminated Backdrop Medallion & Upper-Right Rose-Gold Halo Ring */}
      <BrandLogo3D
        variant="stage-backdrop"
        position={[-1.55, 2.15, -1.45]}
        scale={0.82}
      />
      <mesh position={[2.25, 2.65, -1.5]}>
        <torusGeometry args={[0.82, 0.035, 20, 64]} />
        <meshStandardMaterial color="#F2C8AD" metalness={0.94} roughness={0.12} />
      </mesh>

      {/* Floating Glossy Shade-Matched Spheres (Screenshot 220242) */}
      <mesh ref={floatingLeftSphere} position={[-0.26, 1.65, -0.25]}>
        <sphereGeometry args={[0.21, 36, 36]} />
        <meshPhysicalMaterial
          color={selectedShade.hex}
          roughness={0.06}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      <mesh ref={floatingRightSphere} position={[1.28, 2.35, -0.35]}>
        <sphereGeometry args={[0.25, 36, 36]} />
        <meshPhysicalMaterial
          color={selectedShade.hex}
          roughness={0.06}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Floating Brushed Champagne / Rose-Gold Cubes (Screenshot 220242) */}
      <mesh ref={floatingLeftCube} position={[-1.75, 1.15, -0.3]}>
        <boxGeometry args={[0.44, 0.44, 0.44]} />
        <meshStandardMaterial color="#F3CEB4" metalness={0.82} roughness={0.22} />
      </mesh>
      <mesh ref={floatingRightCube} position={[1.85, 1.85, -0.35]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color="#F3CEB4" metalness={0.82} roughness={0.22} />
      </mesh>

      {/* Hero 3D Cosmetic Product on the Stage with 360° Touch/Drag Rotation */}
      <group ref={productPivotRef} position={[0.18, 0.49, 0.02]}>
        <CosmeticModel3D
          modelType={product.modelType}
          shadeHex={selectedShade.hex}
          secondaryHex={selectedShade.secondaryHex}
          finish={selectedShade.finish}
          isStage={true}
          scale={1.32}
          autoRotate={!prefersReducedMotion}
        />
      </group>
    </group>
  );
}
