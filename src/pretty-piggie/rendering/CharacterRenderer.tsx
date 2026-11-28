'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterParameters } from '../character/CharacterParameters';
import { ARKitBlendshapeMap } from '../character/MorphController';
import { PiggieCharacter } from '../character/PiggieCharacter';
import { getMakeupPreset } from '../makeup/MakeupPresets';
import { renderPrettyPiggie2DFallback } from './CanvasFallback';

export interface CharacterStageHandle {
  captureSnapshotDataUrl: () => string | null;
  activeRenderer: 'webgl' | 'canvas2d';
}

interface CharacterRendererProps {
  params: CharacterParameters;
  capturedBlendshapes?: ARKitBlendshapeMap | null;
  blendshapesRef?: React.RefObject<ARKitBlendshapeMap | null>;
  supportsWebGL: boolean;
  forceCanvas2D?: boolean;
  dpr?: [number, number];
  prefersReducedMotion?: boolean;
  stageHandleRef?: React.MutableRefObject<CharacterStageHandle | null>;
  onFallbackActivated?: (reason: string) => void;
}

function disposeSceneResources(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      for (const m of mat) m.dispose();
    } else if (mat) {
      mat.dispose();
    }
  });
}

export function CharacterRenderer({
  params,
  capturedBlendshapes,
  blendshapesRef,
  supportsWebGL,
  forceCanvas2D = false,
  dpr = [1, 1.5],
  prefersReducedMotion = false,
  stageHandleRef,
  onFallbackActivated,
}: CharacterRendererProps) {
  const [contextLost, setContextLost] = useState(false);
  const use2DFallback = !supportsWebGL || forceCanvas2D || contextLost;

  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneCleanupRef = useRef<(() => void) | null>(null);

  const makeup = getMakeupPreset(params.collectionId);

  // Render 2D Illustrated Fallback whenever active or params change
  useEffect(() => {
    if (!use2DFallback || !fallbackCanvasRef.current) return;
    renderPrettyPiggie2DFallback(fallbackCanvasRef.current, params, 768);
  }, [use2DFallback, params]);

  const captureSnapshotDataUrl = useCallback((): string | null => {
    try {
      if (use2DFallback && fallbackCanvasRef.current) {
        renderPrettyPiggie2DFallback(fallbackCanvasRef.current, params, 1024);
        return fallbackCanvasRef.current.toDataURL('image/png');
      }
      if (glCanvasRef.current) {
        return glCanvasRef.current.toDataURL('image/png');
      }
      return null;
    } catch {
      return null;
    }
  }, [use2DFallback, params]);

  useEffect(() => {
    if (!stageHandleRef) return;
    stageHandleRef.current = {
      captureSnapshotDataUrl,
      activeRenderer: use2DFallback ? 'canvas2d' : 'webgl',
    };
    return () => {
      if (stageHandleRef.current) {
        stageHandleRef.current = null;
      }
    };
  }, [stageHandleRef, captureSnapshotDataUrl, use2DFallback]);

  // Mandatory Correction #12: Release WebGL listeners & GPU scene resources on unmount
  useEffect(() => {
    return () => {
      sceneCleanupRef.current?.();
      sceneCleanupRef.current = null;
      glCanvasRef.current = null;
    };
  }, []);

  if (use2DFallback) {
    return (
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${makeup.backdropTopHex} 0%, ${makeup.backdropBottomHex} 100%)`,
        }}
      >
        <canvas
          ref={fallbackCanvasRef}
          aria-label="Pretty Piggie 2D illustrated character"
          className="h-full max-h-[420px] w-auto max-w-full object-contain"
        />
        <span className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-piggie-950/75 px-3 py-0.5 text-[10px] font-semibold text-rosegold-light backdrop-blur-sm">
          2D Illustrated Fallback Mode
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${makeup.backdropTopHex} 0%, ${makeup.backdropBottomHex} 100%)`,
      }}
    >
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0.08, 3.15], fov: 36, near: 0.1, far: 25 }}
        onCreated={({ gl, scene }) => {
          sceneCleanupRef.current?.();
          const domEl = gl.domElement;
          glCanvasRef.current = domEl;

          const onLost = (ev: Event) => {
            ev.preventDefault();
            setContextLost(true);
            onFallbackActivated?.('webglcontextlost');
          };
          const onRestored = () => {
            setContextLost(false);
          };

          domEl.addEventListener('webglcontextlost', onLost, false);
          domEl.addEventListener('webglcontextrestored', onRestored, false);

          sceneCleanupRef.current = () => {
            domEl.removeEventListener('webglcontextlost', onLost, false);
            domEl.removeEventListener('webglcontextrestored', onRestored, false);
            disposeSceneResources(scene);
          };
        }}
      >
        {/* Warm 4-Point Studio Beauty Lighting */}
        <ambientLight intensity={1.25} color="#FFF8FA" />
        <directionalLight
          position={[2.4, 3.2, 4.2]}
          intensity={1.45}
          color="#FFFDFB"
        />
        <pointLight
          position={[-2.6, 1.8, 2.5]}
          intensity={1.15}
          color="#FFD8E8"
        />
        <pointLight
          position={[2.2, -1.2, 2.2]}
          intensity={0.85}
          color="#FCE2CC"
        />
        <pointLight
          position={[0, 2.4, -2.2]}
          intensity={1.35}
          color="#FFF0F6"
        />

        <PiggieCharacter
          params={params}
          capturedBlendshapes={capturedBlendshapes}
          blendshapesRef={blendshapesRef}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
}
