'use client';

import React, { useMemo, useState } from 'react';
import { Html, MeshReflectorMaterial, Sparkles } from '@react-three/drei';
import {
  BoutiqueProduct,
  BoutiqueZoneId,
  DeviceCapabilityProfile,
} from '@/types/boutique';
import { CosmeticModel3D } from './CosmeticModel3D';
import { BrandLogo3D } from './BrandLogo3D';

interface VirtualBoutiqueEnvironment3DProps {
  products: BoutiqueProduct[];
  activeZone: BoutiqueZoneId;
  selectedProduct: BoutiqueProduct | null;
  capability: DeviceCapabilityProfile;
  onSelectZone: (zoneId: BoutiqueZoneId) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
}

export function VirtualBoutiqueEnvironment3D({
  products,
  activeZone,
  selectedProduct,
  capability,
  onSelectZone,
  onSelectProduct,
}: VirtualBoutiqueEnvironment3DProps) {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  // Precompute crystal chandelier drop coordinates (adaptive count for mobile performance)
  const chandelierDrops = useMemo(() => {
    const drops: Array<{ x: number; y: number; z: number; h: number }> = [];
    const ringConfigs =
      capability.tier === 'low'
        ? [
            { radius: 1.35, count: 10, y: 5.55, h: 0.45 },
            { radius: 0.75, count: 6, y: 5.32, h: 0.55 },
          ]
        : [
            { radius: 1.65, count: 18, y: 5.65, h: 0.48 },
            { radius: 1.15, count: 14, y: 5.42, h: 0.56 },
            { radius: 0.65, count: 10, y: 5.2, h: 0.62 },
          ];

    ringConfigs.forEach((ring) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        drops.push({
          x: Math.cos(angle) * ring.radius,
          y: ring.y,
          z: 0.5 + Math.sin(angle) * ring.radius,
          h: ring.h,
        });
      }
    });
    return drops;
  }, [capability.tier]);

  // Precompute sculptural petal chandelier above the Makeup Wall (Screenshot 220304)
  const petalAngles = useMemo(() => {
    const count = capability.tier === 'low' ? 10 : 16;
    return Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2);
  }, [capability.tier]);

  return (
    <group>
      {/* ==================================================================
          1. POLISHED REFLECTIVE BLUSH-MARBLE FLOOR & ARCHITECTURAL ENVELOPE
         ================================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        {capability.enableReflections ? (
          <MeshReflectorMaterial
            blur={capability.isMobile ? [180, 60] : [300, 100]}
            resolution={capability.isMobile ? 256 : 512}
            mixBlur={0.85}
            mixStrength={0.38}
            roughness={0.22}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.25}
            color="#F7E4EC"
            metalness={0.18}
            mirror={0.35}
          />
        ) : (
          <meshPhysicalMaterial
            color="#F7E4EC"
            roughness={0.18}
            metalness={0.12}
            clearcoat={0.85}
          />
        )}
      </mesh>

      {/* Rose-Gold Floor Inlay Border Ring & Pretty Piggie Makeup Floor Medallion in Central Rotunda */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.8]}>
        <ringGeometry args={[3.45, 3.53, 64]} />
        <meshStandardMaterial color="#E6A998" metalness={0.9} roughness={0.18} />
      </mesh>
      <BrandLogo3D
        variant="floor-medallion"
        position={[0, 0.007, 0.8]}
        scale={1.08}
      />

      {/* Boutique Perimeter Blush Walls */}
      {/* Back Wall behind Makeup Wall */}
      <mesh position={[0, 3.2, -7.45]}>
        <boxGeometry args={[18, 6.6, 0.3]} />
        <meshStandardMaterial color="#F4C7D7" roughness={0.45} metalness={0.05} />
      </mesh>
      {/* Left Wall behind Bestsellers Display */}
      <mesh position={[-7.6, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[16, 6.6, 0.3]} />
        <meshStandardMaterial color="#F2C0D2" roughness={0.45} metalness={0.05} />
      </mesh>
      {/* Right Wall behind Discovery Room */}
      <mesh position={[7.6, 3.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[16, 6.6, 0.3]} />
        <meshStandardMaterial color="#F2C0D2" roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Main Blush Architectural Ceiling Plane */}
      <mesh position={[0, 6.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#F9DCE6" roughness={0.4} metalness={0.08} />
      </mesh>

      {/* ==================================================================
          2. GRAND ROTUNDA CEILING COVE & CRYSTAL CHANDELIER (Screenshot 220209)
         ================================================================== */}
      <group position={[0, 0, 0]}>
        {/* Recessed Oval Cove Glowing Perimeter Ring */}
        <mesh position={[0, 6.18, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.65, 0.07, 16, 64]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F6"
            emissiveIntensity={2.4}
          />
        </mesh>
        {/* Mirrored Rose-Gold Ceiling Medallion Plate */}
        <mesh position={[0, 6.22, 0.5]}>
          <cylinderGeometry args={[1.95, 1.95, 0.06, 48]} />
          <meshStandardMaterial color="#E29E8D" metalness={0.94} roughness={0.12} />
        </mesh>
        {/* Crystal Chandelier Tiered Drops */}
        {chandelierDrops.map((d, idx) => (
          <mesh key={idx} position={[d.x, d.y, d.z]}>
            <cylinderGeometry args={[0.032, 0.018, d.h, 8]} />
            <meshPhysicalMaterial
              color="#FFF9FB"
              emissive="#FFE8F0"
              emissiveIntensity={0.9}
              roughness={0.08}
              metalness={0.2}
              clearcoat={1}
            />
          </mesh>
        ))}
      </group>

      {/* ==================================================================
          3. ZONE 1: THE MAKEUP WALL (Back LED Alcoves & Petal Chandelier — Screenshot 220304)
         ================================================================== */}
      <group position={[0, 0, -7.0]}>
        {/* Sculptural Layered Blush Petal Ceiling Fixture above Makeup Wall */}
        <group position={[0, 5.95, 1.4]}>
          {petalAngles.map((angle, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 0.72, 0, Math.sin(angle) * 0.72]}
              rotation={[0.28, -angle, 0.35]}
            >
              <boxGeometry args={[0.62, 0.04, 0.24]} />
              <meshPhysicalMaterial
                color="#F6B8CC"
                roughness={0.25}
                clearcoat={0.7}
              />
            </mesh>
          ))}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.32, 24, 16]} />
            <meshStandardMaterial
              color="#FFF5F8"
              emissive="#FFE4EE"
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>

        {/* Three Rounded-Frame Glowing LED Wall Alcoves (Left, Center, Right) */}
        {[-2.6, 0, 2.6].map((alcoveX, aIdx) => (
          <group
            key={aIdx}
            position={[alcoveX, 2.45, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone('makeup-wall');
            }}
          >
            {/* Alcove Back Panel */}
            <mesh position={[0, 0, -0.15]}>
              <boxGeometry args={[2.25, 3.85, 0.08]} />
              <meshStandardMaterial color="#FCE4EC" roughness={0.35} />
            </mesh>

            {/* Glowing LED Frame Perimeter around Alcove (Screenshot 220304) */}
            {/* Top LED Bar */}
            <mesh position={[0, 1.92, 0.06]}>
              <boxGeometry args={[2.3, 0.075, 0.08]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF5F9"
                emissiveIntensity={2.6}
              />
            </mesh>
            {/* Bottom LED Bar */}
            <mesh position={[0, -1.92, 0.06]}>
              <boxGeometry args={[2.3, 0.075, 0.08]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF5F9"
                emissiveIntensity={2.2}
              />
            </mesh>
            {/* Left LED Vertical Pillar */}
            <mesh position={[-1.14, 0, 0.06]}>
              <boxGeometry args={[0.075, 3.9, 0.08]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF5F9"
                emissiveIntensity={2.6}
              />
            </mesh>
            {/* Right LED Vertical Pillar */}
            <mesh position={[1.14, 0, 0.06]}>
              <boxGeometry args={[0.075, 3.9, 0.08]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF5F9"
                emissiveIntensity={2.6}
              />
            </mesh>

            {/* 4 Illuminated Floating Shelves inside each Alcove */}
            {[-1.15, -0.35, 0.45, 1.25].map((shelfY, sIdx) => (
              <group key={sIdx} position={[0, shelfY, 0.08]}>
                {/* Shelf Surface */}
                <mesh>
                  <boxGeometry args={[2.1, 0.055, 0.44]} />
                  <meshStandardMaterial
                    color="#F5C0D2"
                    metalness={0.25}
                    roughness={0.22}
                  />
                </mesh>
                {/* Under-Shelf Warm LED Light Strip */}
                <mesh position={[0, -0.036, 0.14]}>
                  <boxGeometry args={[2.04, 0.025, 0.04]} />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    emissive="#FFF4F8"
                    emissiveIntensity={2.4}
                  />
                </mesh>

                {/* Decorative Companion Cosmetic Bottles on Upper/Lower Shelves (Screenshot 220304) */}
                {sIdx !== 1 && (
                  <group position={[0, 0.14, 0]}>
                    {[-0.68, -0.34, 0, 0.34, 0.68].map((bx, bIdx) => (
                      <mesh key={bIdx} position={[bx, 0, 0]}>
                        <cylinderGeometry args={[0.055, 0.055, 0.24, 12]} />
                        <meshPhysicalMaterial
                          color={
                            bIdx % 2 === 0
                              ? '#E87A9E'
                              : bIdx === 1
                              ? '#F3D2B8'
                              : '#23171C'
                          }
                          roughness={0.2}
                          metalness={bIdx === 1 ? 0.85 : 0.2}
                          clearcoat={0.8}
                        />
                      </mesh>
                    ))}
                  </group>
                )}
              </group>
            ))}
          </group>
        ))}

        {/* Illuminated Official Pretty Piggie Makeup Architectural Brand Crest Above Makeup Wall */}
        <mesh position={[-2.2, 4.95, 0.1]}>
          <boxGeometry args={[1.8, 0.08, 0.08]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F7"
            emissiveIntensity={2.4}
          />
        </mesh>
        <mesh position={[2.2, 4.95, 0.1]}>
          <boxGeometry args={[1.8, 0.08, 0.08]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F7"
            emissiveIntensity={2.4}
          />
        </mesh>
        <BrandLogo3D
          variant="wall-crest"
          position={[0, 4.95, 0.16]}
          scale={0.78}
        />
      </group>

      {/* ==================================================================
          4. ZONE 2: THE BEAUTY COUNTER (Dual-LED Blush Counter — Screenshot 220304)
         ================================================================== */}
      <group
        position={[0, 0, -3.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('beauty-counter');
        }}
      >
        {/* Main Counter Body */}
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.4, 1.24, 1.18]} />
          <meshPhysicalMaterial
            color="#EAAEC2"
            roughness={0.22}
            metalness={0.12}
            clearcoat={0.75}
          />
        </mesh>
        {/* Counter Top Glossy Rose-Gold & Glass Slab */}
        <mesh position={[0, 1.26, 0]}>
          <boxGeometry args={[5.48, 0.05, 1.24]} />
          <meshStandardMaterial color="#F7DDE6" metalness={0.45} roughness={0.12} />
        </mesh>
        {/* Upper Horizontal Recessed Glowing LED Strip (Screenshot 220304) */}
        <mesh position={[0, 1.14, 0.605]}>
          <boxGeometry args={[5.44, 0.065, 0.04]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF5F8"
            emissiveIntensity={2.8}
          />
        </mesh>
        {/* Lower Kickplate Horizontal Glowing LED Strip (Screenshot 220304) */}
        <mesh position={[0, 0.16, 0.605]}>
          <boxGeometry args={[5.44, 0.075, 0.04]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF5F8"
            emissiveIntensity={2.8}
          />
        </mesh>
        {/* Split Rose-Gold Trim Wings Flanking the Official Pretty Piggie Makeup Counter Seal */}
        <mesh position={[-1.55, 0.65, 0.598]}>
          <boxGeometry args={[2.1, 0.03, 0.02]} />
          <meshStandardMaterial color="#E6A998" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[1.55, 0.65, 0.598]}>
          <boxGeometry args={[2.1, 0.03, 0.02]} />
          <meshStandardMaterial color="#E6A998" metalness={0.92} roughness={0.15} />
        </mesh>
        <BrandLogo3D
          variant="counter-seal"
          position={[0, 0.65, 0.62]}
          scale={0.92}
        />
      </group>

      {/* ==================================================================
          5. ZONE 3: THE PRETTYPIGGIE COLLECTION (Central Oval Blush Islands — Screenshot 220209)
         ================================================================== */}
      {[
        { x: -1.45, z: 1.2 },
        { x: 1.45, z: 2.2 },
      ].map((island, idx) => (
        <group
          key={idx}
          position={[island.x, 0, island.z]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectZone('collection');
          }}
        >
          {/* Brushed Champagne Rose-Gold Baseboard Kickplate (Screenshot 220209) */}
          <mesh position={[0, 0.08, 0]} scale={[1.25, 1, 0.88]}>
            <cylinderGeometry args={[0.96, 0.96, 0.16, 48]} />
            <meshStandardMaterial
              color="#E6AC96"
              metalness={0.92}
              roughness={0.16}
            />
          </mesh>
          {/* Smooth Curved Blush-Pink Pedestal Body */}
          <mesh position={[0, 0.64, 0]} scale={[1.25, 1, 0.88]} castShadow>
            <cylinderGeometry args={[0.93, 0.93, 1.02, 48]} />
            <meshPhysicalMaterial
              color="#F5C4D4"
              roughness={0.2}
              metalness={0.08}
              clearcoat={0.85}
            />
          </mesh>
          {/* Glowing Under-Counter Rim LED */}
          <mesh position={[0, 1.17, 0]} scale={[1.25, 1, 0.88]}>
            <cylinderGeometry args={[0.95, 0.95, 0.05, 48]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFF5F9"
              emissiveIntensity={2.4}
            />
          </mesh>
          {/* Glossy White & Rose-Gold Counter Top */}
          <mesh position={[0, 1.22, 0]} scale={[1.25, 1, 0.88]}>
            <cylinderGeometry args={[0.94, 0.94, 0.05, 48]} />
            <meshStandardMaterial color="#FFF8FA" roughness={0.12} metalness={0.2} />
          </mesh>
          {/* Pretty Piggie Makeup Seal on Central Collection Island Front */}
          <BrandLogo3D
            variant="counter-seal"
            position={[0, 0.65, 0.83]}
            scale={0.65}
          />

          {/* Sculptural Peony Bouquet Accent on Island (Screenshot 220209) */}
          <group position={[idx === 0 ? -0.45 : 0.45, 1.25, -0.18]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.09, 0.07, 0.28, 20]} />
              <meshStandardMaterial color="#E6A998" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#E87FA2" roughness={0.6} />
            </mesh>
            <mesh position={[0.08, 0.31, 0.06]}>
              <sphereGeometry args={[0.11, 14, 14]} />
              <meshStandardMaterial color="#F7B8CE" roughness={0.6} />
            </mesh>
          </group>
        </group>
      ))}

      {/* ==================================================================
          6. ZONE 4: THE BESTSELLERS DISPLAY (Left Curved Vitrine & Halo Podiums)
         ================================================================== */}
      <group
        position={[-5.8, 0, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('bestsellers');
        }}
      >
        {/* Illuminated Rose-Gold Wall Backdrop Arch & Pretty Piggie Medallion */}
        <mesh position={[-1.4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.85, 0.045, 16, 64, Math.PI]} />
          <meshStandardMaterial
            color="#F5D7B8"
            metalness={0.92}
            roughness={0.14}
            emissive="#FCE0C8"
            emissiveIntensity={0.6}
          />
        </mesh>
        <BrandLogo3D
          variant="wall-crest"
          position={[-1.55, 3.25, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.72}
        />

        {/* Twin LED-Rimmed Cylindrical Bestseller Podiums */}
        {[-1.1, 1.1].map((zOffset, idx) => (
          <group key={idx} position={[0, 0, zOffset]}>
            <mesh position={[0, 0.72, 0]} castShadow>
              <cylinderGeometry args={[0.68, 0.72, 1.44, 40]} />
              <meshPhysicalMaterial
                color="#F4BED0"
                roughness={0.2}
                clearcoat={0.8}
              />
            </mesh>
            {/* Glowing LED Ring */}
            <mesh position={[0, 1.36, 0]}>
              <cylinderGeometry args={[0.7, 0.7, 0.06, 40]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF4F8"
                emissiveIntensity={2.6}
              />
            </mesh>
            {/* Lower LED Ring */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.73, 0.73, 0.06, 40]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFF4F8"
                emissiveIntensity={2.4}
              />
            </mesh>
            {/* Rose-Gold Halo Ring Above Podium (elevated clear of pedestal top) */}
            <mesh position={[-0.25, 2.22, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.52, 0.025, 16, 48]} />
              <meshStandardMaterial
                color="#F2CBAE"
                metalness={0.94}
                roughness={0.12}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ==================================================================
          7. ZONE 5: THE DISCOVERY ROOM (Right Futuristic Neon Counter — Screenshot 220326)
         ================================================================== */}
      <group
        position={[5.8, 0, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('discovery-room');
        }}
      >
        {/* Futuristic Rounded Counter with Obsidian Contrast Band & Dual LED Strips (Screenshot 220326) */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[1.55, 1.36, 3.6]} />
          <meshPhysicalMaterial
            color="#E89CB7"
            roughness={0.16}
            metalness={0.18}
            clearcoat={0.9}
          />
        </mesh>
        {/* Sleek Obsidian Black Architectural Accent Band (Screenshot 220326) */}
        <mesh position={[-0.02, 1.02, 0]}>
          <boxGeometry args={[1.6, 0.22, 3.64]} />
          <meshStandardMaterial color="#181015" metalness={0.6} roughness={0.18} />
        </mesh>
        {/* Top Glowing Neon LED Rim */}
        <mesh position={[0, 1.28, 0]}>
          <boxGeometry args={[1.62, 0.075, 3.66]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFEBF3"
            emissiveIntensity={2.8}
          />
        </mesh>
        {/* Mid Glowing Neon LED Rim */}
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[1.61, 0.06, 3.65]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFEBF3"
            emissiveIntensity={2.5}
          />
        </mesh>
        {/* Base Glowing Neon LED Rim */}
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[1.61, 0.065, 3.65]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFEBF3"
            emissiveIntensity={2.5}
          />
        </mesh>

        {/* Overhead Futuristic Glowing LED Ceiling Track Rectangle (Screenshot 220326) */}
        <mesh position={[-0.2, 5.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.75, 0.04, 12, 48]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFF2F7"
            emissiveIntensity={2.6}
          />
        </mesh>
        {/* Discovery Room Illuminated Pretty Piggie Wall Crest & Counter Seal */}
        <BrandLogo3D
          variant="wall-crest"
          position={[1.55, 3.3, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={0.75}
        />
        <BrandLogo3D
          variant="counter-seal"
          position={[-0.82, 0.43, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={0.52}
        />
      </group>

      {/* ==================================================================
          8. ATMOSPHERIC ROSE-GOLD SPARKLE PARTICLES (Adaptive Count)
         ================================================================== */}
      {!capability.prefersReducedMotion && (
        <Sparkles
          count={capability.particleCount}
          scale={[13, 4.5, 13]}
          position={[0, 2.6, -1]}
          size={capability.isMobile ? 1.8 : 2.4}
          speed={0.25}
          opacity={0.55}
          color="#FFF2F7"
        />
      )}

      {/* ==================================================================
          9. INTERACTIVE 3D PRODUCT DISPLAYS & TOUCH HOTSPOTS
         ================================================================== */}
      {products.map((product) => {
        const isHovered = hoveredProductId === product.id;
        const primaryShade = product.shades[0];

        return (
          <group
            key={product.id}
            position={product.position3D}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredProductId(product.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredProductId((prev) => (prev === product.id ? null : prev));
              document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
          >
            {/* Illuminated Rose-Gold Product Coaster Disc */}
            <mesh position={[0, 0.015, 0]}>
              <cylinderGeometry args={[0.38, 0.42, 0.03, 32]} />
              <meshStandardMaterial
                color={isHovered ? '#FFFFFF' : '#E8B298'}
                metalness={0.85}
                roughness={0.18}
                emissive={isHovered ? '#FFCCE0' : '#F7C2D4'}
                emissiveIntensity={isHovered ? 1.6 : 0.35}
              />
            </mesh>

            {/* 3D Cosmetic Model */}
            <CosmeticModel3D
              modelType={product.modelType}
              shadeHex={primaryShade.hex}
              secondaryHex={primaryShade.secondaryHex}
              finish={primaryShade.finish}
              isStage={false}
              isHovered={isHovered}
              scale={0.76}
              autoRotate={!capability.prefersReducedMotion}
            />

            {/* Floating Touch-Friendly Interactive Product Pill Tag (Kept mounted stably for React 19 + Drei v10 portal safety) */}
            {(() => {
              const isMobileRotundaFocal =
                product.handle === 'single-pan-eyeshadow' ||
                product.handle === 'bronzer' ||
                product.handle === 'foundation-primer';
              const isTagVisible =
                !selectedProduct &&
                (activeZone === product.zoneId ||
                  (activeZone === 'rotunda' &&
                    (capability.isMobile
                      ? isMobileRotundaFocal
                      : product.zoneId === 'collection' ||
                        product.zoneId === 'beauty-counter' ||
                        product.handle === 'single-pan-eyeshadow')));
              const yOffset =
                activeZone === 'rotunda'
                  ? product.zoneId === 'collection'
                    ? product.handle === 'luminizing-powder'
                      ? 0.78
                      : 1.08
                    : 1.12
                  : product.zoneId === 'collection'
                  ? product.handle === 'luminizing-powder'
                    ? 0.78
                    : 1.08
                  : product.zoneId === 'beauty-counter'
                  ? 0.88
                  : 1.05;
              return (
                <Html
                  position={[0, yOffset, 0]}
                  center
                  distanceFactor={capability.isMobile ? 5.6 : 7.0}
                  zIndexRange={[20, 0]}
                  style={{
                    display: isTagVisible ? 'block' : 'none',
                    pointerEvents: isTagVisible ? 'auto' : 'none',
                  }}
                >
                  <button
                    type="button"
                    tabIndex={isTagVisible ? 0 : -1}
                    aria-hidden={!isTagVisible}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isTagVisible) return;
                      onSelectProduct(product);
                    }}
                    aria-label={`Inspect ${product.title}, $${product.price.toFixed(2)}`}
                    className="group flex min-h-[44px] min-w-[44px] flex-col items-center justify-center p-1 transition-all duration-300 select-none"
                  >
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 backdrop-blur-md border transition-all shadow-lg whitespace-nowrap sm:px-3 ${
                        isHovered
                          ? 'bg-piggie-950/95 text-white border-rosegold scale-105'
                          : 'bg-white/95 text-piggie-950 border-piggie-200 hover:bg-white'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/15 shrink-0"
                        style={{ backgroundColor: primaryShade.hex }}
                      />
                      <span className="max-w-[96px] truncate text-[11px] font-bold tracking-tight sm:max-w-none">
                        {product.title}
                      </span>
                      <span className="text-[11px] font-extrabold tabular-nums text-piggie-600 group-hover:text-rosegold-light">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.canPurchase && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
                          title="In Stock"
                        />
                      )}
                    </div>
                    {/* Shade count micro-badge (shown inside dedicated department view) */}
                    {activeZone !== 'rotunda' && (
                      <span className="mt-1 whitespace-nowrap rounded-full bg-piggie-900/90 px-2.5 py-0.5 text-[10px] font-semibold text-piggie-100 shadow-sm backdrop-blur-sm">
                        {product.shades.length}{' '}
                        {product.shades.length === 1 ? 'Formula' : 'Shades'} •{' '}
                        {product.canPurchase ? 'Tap to Shop 3D' : '3D Preview'}
                      </span>
                    )}
                  </button>
                </Html>
              );
            })()}
          </group>
        );
      })}
    </group>
  );
}
