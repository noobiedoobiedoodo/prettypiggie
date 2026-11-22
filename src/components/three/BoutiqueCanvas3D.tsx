'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import { BOUTIQUE_ZONES } from '@/data/boutiqueData';
import {
  BoutiqueProduct,
  BoutiqueZoneId,
  DeviceCapabilityProfile,
  ProductShade,
} from '@/types/boutique';
import { VirtualBoutiqueEnvironment3D } from './VirtualBoutiqueEnvironment3D';
import { ProductPresentationStage3D } from './ProductPresentationStage3D';

interface CameraControllerProps {
  activeZone: BoutiqueZoneId;
  selectedProduct: BoutiqueProduct | null;
  capability: DeviceCapabilityProfile;
  panOffsetX: number;
}

function BoutiqueCameraController({
  activeZone,
  selectedProduct,
  capability,
  panOffsetX,
}: CameraControllerProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 2.0, -1.5));
  const animatedTarget = useRef({ x: 0, y: 2.0, z: -1.5 });

  useEffect(() => {
    const perspCam = camera as THREE.PerspectiveCamera;

    if (selectedProduct) {
      // Transition camera to the 3D Product Presentation Stage (Screenshot 220242)
      const stageCamPos = capability.isMobile
        ? { x: 0.0, y: 13.75, z: 4.85 }
        : capability.isTablet
        ? { x: 0.65, y: 13.7, z: 4.4 }
        : { x: 1.05, y: 13.7, z: 4.35 };

      const stageTarget = capability.isMobile
        ? { x: 0.0, y: 12.75, z: 0.0 }
        : capability.isTablet
        ? { x: 0.55, y: 13.2, z: 0.0 }
        : { x: 0.85, y: 13.25, z: 0.0 };

      const duration = capability.prefersReducedMotion ? 0.05 : 1.05;

      gsap.to(perspCam.position, {
        x: stageCamPos.x,
        y: stageCamPos.y,
        z: stageCamPos.z,
        duration,
        ease: 'power3.inOut',
      });

      gsap.to(animatedTarget.current, {
        x: stageTarget.x,
        y: stageTarget.y,
        z: stageTarget.z,
        duration,
        ease: 'power3.inOut',
      });

      gsap.to(perspCam, {
        fov: capability.isMobile ? 54 : 44,
        duration,
        ease: 'power2.out',
        onUpdate: () => perspCam.updateProjectionMatrix(),
      });
      return;
    }

    // Otherwise transition camera to the active Boutique Zone waypoint
    const zone =
      BOUTIQUE_ZONES.find((z) => z.id === activeZone) ?? BOUTIQUE_ZONES[0];

    const waypoint = capability.isMobile
      ? zone.mobileCamera
      : capability.isTablet
      ? zone.tabletCamera
      : zone.desktopCamera;

    const duration = capability.prefersReducedMotion ? 0.05 : 1.15;

    gsap.to(perspCam.position, {
      x: waypoint.position[0],
      y: waypoint.position[1],
      z: waypoint.position[2],
      duration,
      ease: 'power3.inOut',
    });

    gsap.to(animatedTarget.current, {
      x: waypoint.target[0],
      y: waypoint.target[1],
      z: waypoint.target[2],
      duration,
      ease: 'power3.inOut',
    });

    gsap.to(perspCam, {
      fov: waypoint.fov,
      duration,
      ease: 'power2.out',
      onUpdate: () => perspCam.updateProjectionMatrix(),
    });
  }, [
    activeZone,
    selectedProduct,
    capability.isMobile,
    capability.isTablet,
    capability.prefersReducedMotion,
    camera,
  ]);

  useFrame((state) => {
    const pointerX = capability.isMobile ? panOffsetX : state.pointer.x * 0.35 + panOffsetX;
    const pointerY = capability.isMobile ? 0 : state.pointer.y * 0.15;

    const targetX =
      animatedTarget.current.x + (selectedProduct ? 0 : pointerX * 0.85);
    const targetY =
      animatedTarget.current.y + (selectedProduct ? 0 : pointerY * 0.45);
    const targetZ = animatedTarget.current.z;

    lookAtTarget.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.1);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

interface BoutiqueCanvas3DProps {
  products: BoutiqueProduct[];
  activeZone: BoutiqueZoneId;
  selectedProduct: BoutiqueProduct | null;
  selectedShade: ProductShade | null;
  capability: DeviceCapabilityProfile;
  onSelectZone: (zoneId: BoutiqueZoneId) => void;
  onSelectProduct: (product: BoutiqueProduct) => void;
  onSwipeZone: (direction: 'prev' | 'next') => void;
  onContextLost?: () => void;
}

export function BoutiqueCanvas3D({
  products,
  activeZone,
  selectedProduct,
  selectedShade,
  capability,
  onSelectZone,
  onSelectProduct,
  onSwipeZone,
  onContextLost,
}: BoutiqueCanvas3DProps) {
  const [dynamicDpr, setDynamicDpr] = useState<number>(capability.dpr[1]);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [productRotationY, setProductRotationY] = useState<number>(0);
  const [panOffsetX, setPanOffsetX] = useState<number>(0);

  const dragStartRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const contextLostCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      contextLostCleanupRef.current?.();
      contextLostCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    setDynamicDpr(capability.dpr[1]);
  }, [capability.dpr]);

  // Reset pan offset when changing zones
  useEffect(() => {
    setPanOffsetX(0);
  }, [activeZone]);

  // Reset product rotation when selecting a new product
  useEffect(() => {
    setProductRotationY(0);
  }, [selectedProduct?.id]);

  // Non-negotiable requirement: Pause rendering when the experience is not visible
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      active: true,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current.active) return;
    const deltaX = e.clientX - dragStartRef.current.x;

    if (selectedProduct) {
      // 360-degree touch/mouse rotation of the product on the stage
      setProductRotationY((prev) => prev + deltaX * 0.014);
      dragStartRef.current.x = e.clientX;
    } else {
      // Gentle horizontal look pan inside the active boutique zone
      const clampedPan = Math.max(-1.4, Math.min(1.4, -deltaX * 0.0045));
      setPanOffsetX(clampedPan);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current.active) return;
    const totalDeltaX = e.clientX - dragStartRef.current.x;
    const totalDeltaY = Math.abs(e.clientY - dragStartRef.current.y);
    dragStartRef.current.active = false;

    // On mobile/tablet, a quick horizontal swipe switches departments
    if (!selectedProduct && Math.abs(totalDeltaX) > 75 && totalDeltaY < 60) {
      setPanOffsetX(0);
      if (totalDeltaX < 0) {
        onSwipeZone('next');
      } else {
        onSwipeZone('prev');
      }
    }
  };

  const activeStageShade =
    selectedShade ?? selectedProduct?.shades[0] ?? null;

  return (
    <div
      className="relative h-full w-full touch-pan-y select-none overflow-hidden bg-gradient-to-b from-[#F5C6D6] via-[#E8A9BF] to-[#D48BA5]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartRef.current.active = false;
      }}
    >
      <Canvas
        dpr={[capability.dpr[0], dynamicDpr]}
        frameloop={isTabVisible ? 'always' : 'never'}
        gl={{
          antialias: capability.tier !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{
          position: [0, 2.35, 9.8],
          fov: capability.isMobile ? 62 : 46,
          near: 0.1,
          far: 60,
        }}
        onCreated={({ gl }) => {
          contextLostCleanupRef.current?.();
          const canvasEl = gl.domElement;
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            onContextLost?.();
          };
          canvasEl.addEventListener(
            'webglcontextlost',
            handleContextLost,
            false
          );
          contextLostCleanupRef.current = () => {
            canvasEl.removeEventListener(
              'webglcontextlost',
              handleContextLost,
              false
            );
          };
        }}
      >
        <color attach="background" args={['#E6A6BD']} />
        <fog attach="fog" args={['#E6A6BD', 13, 25]} />

        <PerformanceMonitor
          onDecline={() => {
            setDynamicDpr((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))));
          }}
          onIncline={() => {
            setDynamicDpr((prev) =>
              Math.min(capability.dpr[1], Number((prev + 0.1).toFixed(2)))
            );
          }}
        />

        {/* Soft Cinematic Boutique Lighting Setup */}
        <ambientLight intensity={1.15} color="#FFF4F8" />
        <directionalLight
          position={[4, 8, 5]}
          intensity={1.35}
          color="#FFF7FA"
        />
        <pointLight
          position={[0, 5.2, 0.5]}
          intensity={1.85}
          distance={16}
          color="#FFE3EE"
        />
        <pointLight
          position={[0, 3.6, -5.8]}
          intensity={1.55}
          distance={12}
          color="#FFF2F7"
        />
        <pointLight
          position={[-5.2, 3.2, 0.2]}
          intensity={1.2}
          distance={10}
          color="#FCE0C8"
        />
        <pointLight
          position={[5.2, 3.2, 0.2]}
          intensity={1.2}
          distance={10}
          color="#FFD6E7"
        />

        {/* GSAP Responsive Camera Controller */}
        <BoutiqueCameraController
          activeZone={activeZone}
          selectedProduct={selectedProduct}
          capability={capability}
          panOffsetX={panOffsetX}
        />

        {/* Main 3D Virtual Boutique Showroom */}
        <VirtualBoutiqueEnvironment3D
          products={products}
          activeZone={activeZone}
          selectedProduct={selectedProduct}
          capability={capability}
          onSelectZone={onSelectZone}
          onSelectProduct={onSelectProduct}
        />

        {/* Dedicated 3D Product Presentation Stage (Screenshot 220242) */}
        {selectedProduct && activeStageShade && (
          <ProductPresentationStage3D
            product={selectedProduct}
            selectedShade={activeStageShade}
            rotationYOffset={productRotationY}
            prefersReducedMotion={capability.prefersReducedMotion}
          />
        )}
      </Canvas>
    </div>
  );
}
