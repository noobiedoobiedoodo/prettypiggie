import { DeviceCapabilityProfile, PerformanceTier } from '@/types/boutique';

export const DEFAULT_MOBILE_CAPABILITY: DeviceCapabilityProfile = {
  tier: 'medium',
  isMobile: true,
  isTablet: false,
  isPortrait: true,
  supportsWebGL: true,
  prefersReducedMotion: false,
  saveData: false,
  dpr: [1, 1.4],
  particleCount: 28,
  enableReflections: true,
  recommendFallback2D: false,
  gpuRenderer: 'Mobile WebGL GPU',
};

export function detectDeviceCapability(): DeviceCapabilityProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_MOBILE_CAPABILITY;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height >= width;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width <= 1024;

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  const nav = window.navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

  const saveData = Boolean(nav.connection?.saveData);
  const slowConnection =
    nav.connection?.effectiveType === 'slow-2g' ||
    nav.connection?.effectiveType === '2g';
  const deviceMemory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;

  // Test WebGL2 / WebGL1 capability & GPU string
  let supportsWebGL = false;
  let gpuRenderer = 'Standard WebGL GPU';
  let isSoftwareOrWeakGPU = false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (gl && 'getExtension' in gl) {
      supportsWebGL = true;
      const debugInfo = (gl as WebGLRenderingContext).getExtension(
        'WEBGL_debug_renderer_info'
      );
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL
        );
        if (typeof renderer === 'string' && renderer.trim().length > 0) {
          gpuRenderer = renderer;
          const lower = renderer.toLowerCase();
          if (
            lower.includes('swiftshader') ||
            lower.includes('llvmpipe') ||
            lower.includes('software') ||
            lower.includes('mali-4') ||
            lower.includes('adreno (tm) 3')
          ) {
            isSoftwareOrWeakGPU = true;
          }
        }
      }
      // Explicitly release probe WebGL context so mobile WebViews do not hit active context limits
      const loseExt = (gl as WebGLRenderingContext).getExtension(
        'WEBGL_lose_context'
      );
      loseExt?.loseContext();
    }
  } catch {
    supportsWebGL = false;
  }

  // Determine performance tier
  let tier: PerformanceTier = 'high';

  if (!supportsWebGL || isSoftwareOrWeakGPU || slowConnection || deviceMemory <= 2 || cores <= 2) {
    tier = 'low';
  } else if (isMobile || deviceMemory <= 4 || cores <= 4) {
    tier = 'medium';
  } else {
    tier = 'high';
  }

  const dpr: [number, number] =
    tier === 'low'
      ? [1, 1]
      : isMobile
      ? [1, 1.4]
      : isTablet
      ? [1, 1.65]
      : [1, 2];

  const particleCount =
    tier === 'low' ? 12 : isMobile ? 28 : isTablet ? 48 : 85;

  const enableReflections = tier !== 'low';

  const recommendFallback2D =
    !supportsWebGL || isSoftwareOrWeakGPU || saveData || slowConnection;

  return {
    tier,
    isMobile,
    isTablet,
    isPortrait,
    supportsWebGL,
    prefersReducedMotion,
    saveData,
    dpr,
    particleCount,
    enableReflections,
    recommendFallback2D,
    gpuRenderer,
  };
}
