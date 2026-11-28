'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  SwitchCamera,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';
import {
  DEFAULT_MOBILE_CAPABILITY,
  detectDeviceCapability,
} from '@/lib/deviceCapability';
import { DeviceCapabilityProfile } from '@/types/boutique';
import {
  BoundedProportions,
  CharacterParameters,
  PIGGIE_ACCESSORY_OPTIONS,
  PIGGIE_COLLECTION_IDS,
  PIGGIE_EYE_COLORS,
  PIGGIE_HAIRSTYLE_OPTIONS,
  PIGGIE_HAIR_COLORS,
  PIGGIE_SKIN_TONES,
  PiggieCollectionId,
  clampProportions,
  createDefaultCharacterParameters,
  decodePiggieShareToken,
} from '@/pretty-piggie/character/CharacterParameters';
import {
  randomizePiggieStyle,
  transformFaceToPiggie,
} from '@/pretty-piggie/character/CharacterMapper';
import { ARKitBlendshapeMap } from '@/pretty-piggie/character/MorphController';
import { PiggieFaceTracker } from '@/pretty-piggie/tracking/FaceTracker';
import {
  MAKEUP_COLLECTION_PRESETS,
  getMakeupPreset,
} from '@/pretty-piggie/makeup/MakeupPresets';
import type { CharacterStageHandle } from '@/pretty-piggie/rendering/CharacterRenderer';
import {
  PiggieCameraController,
  detectInAppWebView,
} from '@/pretty-piggie/camera/CameraController';
import {
  ExportedPiggieCreation,
  PiggieSocialFormat,
  exportBrandedPiggiePng,
} from '@/pretty-piggie/capture/ImageCapture';
import {
  buildShareableCreationUrl,
  buildViralShareCaption,
  sharePiggieCreation,
  triggerPngDownload,
} from '@/pretty-piggie/sharing/ShareController';
import {
  LocalProcessingGuard,
  PIGGIE_PRIVACY_DISCLOSURE_SHORT,
} from '@/pretty-piggie/privacy/LocalProcessingHelper';
import { trackPiggieEvent } from '@/pretty-piggie/analytics/PiggieEvents';

const CharacterRenderer = dynamic(
  () =>
    import('@/pretty-piggie/rendering/CharacterRenderer').then(
      (m) => m.CharacterRenderer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-piggie-100 to-piggie-200 text-xs font-bold text-piggie-800">
        Loading Pretty Piggie 3D Stage…
      </div>
    ),
  }
);

type ExperienceScreen =
  | 'discovery'
  | 'camera'
  | 'transforming'
  | 'customize'
  | 'reveal';

type CustomizeTab = 'makeup' | 'hair-skin' | 'accessories' | 'face-fit';

function loadDecodedImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode selected photo'));
    img.src = src;
  });
}

export function PrettyPiggieExperience() {
  const [capability, setCapability] = useState<DeviceCapabilityProfile>(
    DEFAULT_MOBILE_CAPABILITY
  );
  const [screen, setScreen] = useState<ExperienceScreen>('discovery');
  const [params, setParams] = useState<CharacterParameters>(() =>
    createDefaultCharacterParameters('glam-piggie')
  );
  const [photoBaselineProportions, setPhotoBaselineProportions] =
    useState<BoundedProportions | null>(null);
  const [capturedBlendshapes, setCapturedBlendshapes] =
    useState<ARKitBlendshapeMap | null>(null);
  const [originalSelfieUrl, setOriginalSelfieUrl] = useState<string | null>(
    null
  );
  const [sharedCreationParams, setSharedCreationParams] =
    useState<CharacterParameters | null>(null);

  // Camera & Tracking UI states
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    'user' | 'environment'
  >('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackingBanner, setTrackingBanner] = useState<string | null>(null);
  const [inAppInfo, setInAppInfo] = useState<{
    isRestrictedInAppWebView: boolean;
    appName: string | null;
  }>({ isRestrictedInAppWebView: false, appName: null });

  // Customization & Export states
  const [customTab, setCustomTab] = useState<CustomizeTab>('makeup');
  const [forceCanvas2D, setForceCanvas2D] = useState(false);
  const [isCapturingExport, setIsCapturingExport] = useState(false);
  const [exportsByFormat, setExportsByFormat] = useState<{
    '9:16': ExportedPiggieCreation | null;
    '1:1': ExportedPiggieCreation | null;
  }>({ '9:16': null, '1:1': null });
  const [activeExportFormat, setActiveExportFormat] =
    useState<PiggieSocialFormat>('9:16');
  const [revealViewMode, setRevealViewMode] = useState<'branded' | 'compare'>(
    'branded'
  );
  const [galleryOptInPreview, setGalleryOptInPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<'caption' | 'link' | null>(
    null
  );

  // Non-React-state resource controllers (Mandatory Correction #12)
  const stageHandleRef = useRef<CharacterStageHandle | null>(null);
  const faceTrackerRef = useRef<PiggieFaceTracker | null>(null);
  const cameraControllerRef = useRef<PiggieCameraController | null>(null);
  const privacyGuardRef = useRef<LocalProcessingGuard | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const nativeSelfieInputRef = useRef<HTMLInputElement | null>(null);

  const getPrivacyGuard = useCallback(() => {
    if (!privacyGuardRef.current) {
      privacyGuardRef.current = new LocalProcessingGuard();
    }
    return privacyGuardRef.current;
  }, []);

  const telemetryCtx = useMemo(
    () => ({
      deviceTier: capability.tier,
      isMobile: capability.isMobile,
    }),
    [capability.tier, capability.isMobile]
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3400);
  }, []);

  // Mount initialization: capability profile, shared ?c= token decode, analytics open event
  useEffect(() => {
    const profile = detectDeviceCapability();
    const webview = detectInAppWebView();
    const currentSearch =
      typeof window !== 'undefined' ? window.location.search : '';
    const sp = new URLSearchParams(currentSearch);
    const sharedToken = sp.get('c');
    const refParam = sp.get('ref');

    queueMicrotask(() => {
      setCapability(profile);
      setInAppInfo(webview);

      trackPiggieEvent('piggie_experience_opened', {
        deviceTier: profile.tier,
        isMobile: profile.isMobile,
      });

      if (sharedToken) {
        const decoded = decodePiggieShareToken(sharedToken);
        if (decoded.valid) {
          setSharedCreationParams(decoded.params);
          setParams(decoded.params);
          trackPiggieEvent(
            'referral_link_opened',
            { deviceTier: profile.tier, isMobile: profile.isMobile },
            {
              collectionId: decoded.params.collectionId,
              ...(refParam && /^ref_[a-z0-9]{4,12}$/.test(refParam)
                ? { refCode: refParam }
                : {}),
            }
          );
        }
      }
    });

    const tracker = faceTrackerRef;
    const cam = cameraControllerRef;
    const guard = privacyGuardRef;

    return () => {
      cam.current?.stop();
      tracker.current?.dispose();
      guard.current?.releaseAll();
    };
  }, []);

  // Ensure camera hardware stops immediately whenever leaving the 'camera' screen
  useEffect(() => {
    if (screen !== 'camera') {
      cameraControllerRef.current?.stop();
      queueMicrotask(() => setIsCameraRunning(false));
    }
  }, [screen]);

  const processPortraitDataUrl = useCallback(
    async (dataUrl: string, source: 'camera' | 'upload') => {
      setOriginalSelfieUrl(dataUrl);
      setTrackingBanner(null);
      setScreen('transforming');

      const startMs = performance.now();
      trackPiggieEvent('face_tracking_started', telemetryCtx, { source });

      try {
        const img = await loadDecodedImage(dataUrl);
        if (!faceTrackerRef.current) {
          faceTrackerRef.current = new PiggieFaceTracker();
        }
        const { extraction, delegate } =
          await faceTrackerRef.current.analyzeImage(img);

        if (!extraction.valid) {
          trackPiggieEvent('face_tracking_failed', telemetryCtx, {
            errorCode: 'NO_FACE',
            delegate,
          });
          setTrackingBanner(
            'No clear face was detected in that photo — try brighter front lighting, or customize your Pretty Piggie manually below!'
          );
          const fallbackParams = createDefaultCharacterParameters(
            params.collectionId
          );
          setParams((prev) => ({
            ...fallbackParams,
            skinToneId: prev.skinToneId,
            hairstyleId: prev.hairstyleId,
            hairColorId: prev.hairColorId,
            eyeColorId: prev.eyeColorId,
          }));
          setCapturedBlendshapes(null);
        } else {
          if (extraction.additionalFacesDetected) {
            setTrackingBanner(
              `Multiple faces detected (${extraction.faceCount}) — personalized to the primary centered face.`
            );
            trackPiggieEvent('face_tracking_failed', telemetryCtx, {
              errorCode: 'MULTI_FACE',
              faceCount: extraction.faceCount,
            });
          }

          const personalized = transformFaceToPiggie(
            extraction,
            params.collectionId,
            {
              skinToneId: params.skinToneId,
              hairstyleId: params.hairstyleId,
              hairColorId: params.hairColorId,
              eyeColorId: params.eyeColorId,
            }
          );
          setParams(personalized);
          setPhotoBaselineProportions(personalized.proportions);
          setCapturedBlendshapes(extraction.blendshapes);

          trackPiggieEvent('transformation_completed', telemetryCtx, {
            collectionId: personalized.collectionId,
            delegate,
            source,
            durationMs: Math.round(performance.now() - startMs),
            faceCount: extraction.faceCount,
          });
        }
      } catch {
        trackPiggieEvent('face_tracking_failed', telemetryCtx, {
          errorCode: 'TRACKER_ERROR',
        });
        setTrackingBanner(
          'Local landmark analyzer encountered a device limit — initialized signature proportions with full manual Face Fit controls below.'
        );
      }

      // Satisfying transformation reveal beat (instant if reduced-motion)
      const minRevealMs = capability.prefersReducedMotion ? 80 : 950;
      const elapsed = performance.now() - startMs;
      if (elapsed < minRevealMs) {
        await new Promise((r) => setTimeout(r, minRevealMs - elapsed));
      }
      setScreen('customize');
    },
    [capability.prefersReducedMotion, params, telemetryCtx]
  );

  const handleFileChosen = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) {
        showToast('Please select a JPEG, PNG, or WebP portrait image.');
        return;
      }

      const guard = getPrivacyGuard();
      const objUrl = URL.createObjectURL(file);
      guard.registerObjectUrl(objUrl);

      try {
        const img = await loadDecodedImage(objUrl);
        const maxEdge = 1080;
        const scale = Math.min(
          1,
          maxEdge / Math.max(img.naturalWidth, img.naturalHeight, 1)
        );
        const w = Math.max(256, Math.round(img.naturalWidth * scale));
        const h = Math.max(256, Math.round(img.naturalHeight * scale));
        const scratch = guard.createScratchCanvas(w, h);
        scratch.width = w;
        scratch.height = h;
        const ctx = scratch.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const cleanDataUrl = scratch.toDataURL('image/jpeg', 0.9);
        guard.releaseCanvas(scratch);

        trackPiggieEvent('selfie_uploaded', telemetryCtx, { source: 'upload' });
        await processPortraitDataUrl(cleanDataUrl, 'upload');
      } catch {
        showToast('Could not read that photo. Please try another portrait.');
      } finally {
        guard.revokeObjectUrl(objUrl);
      }
    },
    [getPrivacyGuard, processPortraitDataUrl, showToast, telemetryCtx]
  );

  const handleStartLiveCamera = useCallback(async () => {
    setCameraError(null);
    if (!videoRef.current) return;
    if (!cameraControllerRef.current) {
      cameraControllerRef.current = new PiggieCameraController();
    }
    try {
      await cameraControllerRef.current.start(videoRef.current, 'user');
      setCameraFacingMode('user');
      setIsCameraRunning(true);
      trackPiggieEvent('camera_permission_granted', telemetryCtx);
    } catch {
      setIsCameraRunning(false);
      trackPiggieEvent('camera_permission_denied', telemetryCtx, {
        errorCode: 'CAMERA_BLOCKED',
      });
      setCameraError(
        inAppInfo.isRestrictedInAppWebView
          ? `${inAppInfo.appName}’s in-app browser restricts live WebRTC camera streams. Tap "Snap Selfie / Choose Photo" below or open PrettyPiggie.com in Safari / Chrome.`
          : 'Camera permission was declined or unavailable on this device. You can snap or upload a selfie directly below!'
      );
    }
  }, [inAppInfo, telemetryCtx]);

  const handleFlipCamera = useCallback(async () => {
    if (!videoRef.current || !cameraControllerRef.current) return;
    try {
      await cameraControllerRef.current.flipCamera(videoRef.current);
      setCameraFacingMode(cameraControllerRef.current.getFacingMode());
    } catch {
      showToast('Front/rear camera switch is not available on this device.');
    }
  }, [showToast]);

  const handleCaptureCameraFrame = useCallback(async () => {
    const captured = cameraControllerRef.current?.captureFrame({
      stopAfterCapture: true,
    });
    setIsCameraRunning(false);
    if (!captured) {
      showToast('Camera frame not ready yet — please try again.');
      return;
    }
    getPrivacyGuard().releaseCanvas(captured.canvas);
    await processPortraitDataUrl(captured.dataUrl, 'camera');
  }, [getPrivacyGuard, processPortraitDataUrl, showToast]);

  const handleSelectCollection = useCallback(
    (collectionId: PiggieCollectionId) => {
      const preset = getMakeupPreset(collectionId);
      setParams((prev) => ({
        ...prev,
        collectionId,
        accessoryId: preset.defaultAccessoryId,
        lipShadeIndex: 0,
      }));
      trackPiggieEvent('makeup_style_selected', telemetryCtx, { collectionId });
    },
    [telemetryCtx]
  );

  const handleRandomize = useCallback(() => {
    setParams((prev) => {
      const next = randomizePiggieStyle(prev);
      trackPiggieEvent('makeup_style_selected', telemetryCtx, {
        collectionId: next.collectionId,
      });
      return next;
    });
  }, [telemetryCtx]);

  const handleCaptureCharacter = useCallback(async () => {
    const snapshot = stageHandleRef.current?.captureSnapshotDataUrl();
    const rendererUsed = stageHandleRef.current?.activeRenderer ?? 'webgl';
    if (!snapshot) {
      showToast('Stage is still warming up — tap Capture again in a moment.');
      return;
    }

    setIsCapturingExport(true);
    try {
      const [portrait916, square11] = await Promise.all([
        exportBrandedPiggiePng({
          characterSnapshotDataUrl: snapshot,
          characterParams: params,
          format: '9:16',
        }),
        exportBrandedPiggiePng({
          characterSnapshotDataUrl: snapshot,
          characterParams: params,
          format: '1:1',
        }),
      ]);

      setExportsByFormat({ '9:16': portrait916, '1:1': square11 });
      setRevealViewMode('branded');
      setScreen('reveal');
      trackPiggieEvent('character_captured', telemetryCtx, {
        collectionId: params.collectionId,
        renderer: rendererUsed,
      });
    } catch {
      showToast('Could not render branded PNG — please try again.');
    } finally {
      setIsCapturingExport(false);
    }
  }, [params, showToast, telemetryCtx]);

  const activeExport = exportsByFormat[activeExportFormat];
  const activePreset = getMakeupPreset(params.collectionId);
  const shareUrlBundle = useMemo(
    () => buildShareableCreationUrl(params),
    [params]
  );
  const shareCaption = useMemo(() => buildViralShareCaption(params), [params]);

  const eligiblePairedProducts = useMemo(
    () =>
      activePreset.eligibleProductHandles
        .map((h) =>
          PRETTYPIGGIE_PRODUCTS.find((p) => p.handle === h && p.canPurchase)
        )
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [activePreset]
  );

  const handleNativeShare = useCallback(async () => {
    if (!activeExport) return;
    trackPiggieEvent('native_share_opened', telemetryCtx, {
      collectionId: params.collectionId,
      format: activeExportFormat,
    });
    const outcome = await sharePiggieCreation(activeExport, params);
    if (outcome.status === 'shared-native') {
      trackPiggieEvent('share_completed', telemetryCtx, {
        collectionId: params.collectionId,
        format: activeExportFormat,
      });
      showToast('Shared! Tag Pretty Piggie with #MyPrettyPiggie 💗');
    } else if (outcome.status === 'fallback-downloaded') {
      trackPiggieEvent('image_downloaded', telemetryCtx, {
        collectionId: params.collectionId,
        format: activeExportFormat,
      });
      showToast(outcome.message);
    }
  }, [activeExport, activeExportFormat, params, showToast, telemetryCtx]);

  const handleDownloadPng = useCallback(() => {
    if (!activeExport) return;
    triggerPngDownload(activeExport);
    trackPiggieEvent('image_downloaded', telemetryCtx, {
      collectionId: params.collectionId,
      format: activeExportFormat,
    });
    showToast(`Downloaded ${activeExport.fileName} (${activeExport.width}×${activeExport.height})`);
  }, [activeExport, activeExportFormat, params.collectionId, showToast, telemetryCtx]);

  const handleCopyText = useCallback(
    async (kind: 'caption' | 'link', text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedTarget(kind);
        setTimeout(() => setCopiedTarget(null), 2200);
        showToast(
          kind === 'link'
            ? 'Shareable Pretty Piggie link copied!'
            : 'Viral share caption copied!'
        );
      } catch {
        showToast('Long-press the text box below to copy.');
      }
    },
    [showToast]
  );

  const handleResetSession = useCallback(() => {
    cameraControllerRef.current?.stop();
    privacyGuardRef.current?.releaseAll();
    setOriginalSelfieUrl(null);
    setCapturedBlendshapes(null);
    setPhotoBaselineProportions(null);
    setExportsByFormat({ '9:16': null, '1:1': null });
    setTrackingBanner(null);
    setGalleryOptInPreview(false);
    setParams(createDefaultCharacterParameters('glam-piggie'));
    setScreen('discovery');
    showToast('Local session photo & temporary buffers cleared.');
  }, [showToast]);

  const updateProportion = (key: keyof BoundedProportions, value: number) => {
    setParams((prev) => ({
      ...prev,
      proportions: clampProportions({
        ...prev.proportions,
        [key]: value,
      }),
    }));
  };

  return (
    <div className="piggie-scrollbar h-[100dvh] w-full overflow-y-auto overscroll-contain bg-gradient-to-b from-piggie-100 via-piggie-50 to-white text-piggie-950">
      {/* Hidden File Pickers (Zero-Friction Upload & Native Camera Fallback) */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleFileChosen}
        className="hidden"
        aria-label="Upload a selfie photograph"
      />
      <input
        ref={nativeSelfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChosen}
        className="hidden"
        aria-label="Take a selfie with device camera"
      />

      {/* ====================================================================
          PERSISTENT MOBILE-FIRST STUDIO HEADER (44px Apple HIG Targets)
         ==================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-piggie-200/80 bg-piggie-50/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl md:px-6">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3.5 text-xs font-bold text-piggie-950 shadow-sm transition hover:bg-piggie-50 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-piggie-700" />
          <span>Boutique</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/brand/prettypiggie-logo.png"
            alt="Pretty Piggie"
            className="h-9 w-9 shrink-0 rounded-full border border-piggie-200 bg-white object-contain p-0.5 shadow-sm"
          />
          <div className="min-w-0">
            <span className="block truncate font-serif text-sm font-bold text-piggie-950">
              Pretty Piggie™ Studio
            </span>
            <span className="block truncate text-[10px] font-semibold text-emerald-800">
              100% On-Device • Free
            </span>
          </div>
        </div>

        <Link
          href="/makeover-studio"
          className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-full border border-piggie-200 bg-white px-3 text-[11px] font-bold text-piggie-800 shadow-sm transition hover:bg-piggie-100 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 text-piggie-600" />
          <span className="hidden sm:inline">AI Cartoon Mode</span>
          <span className="sm:hidden">AI Mode</span>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-3.5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-3.5 sm:px-6">
        {/* ====================================================================
            SCREEN 1 — DISCOVERY
           ==================================================================== */}
        {screen === 'discovery' && (
          <section aria-label="Pretty Piggie Discovery">
            {sharedCreationParams && (
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-piggie-300 bg-white px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-piggie-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-piggie-800">
                    Shared Pretty Piggie Challenge
                  </span>
                  <p className="mt-1 text-xs font-bold text-piggie-950">
                    Viewing a shared{' '}
                    {getMakeupPreset(sharedCreationParams.collectionId).name}{' '}
                    creation — make your own below or remix this look!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('customize')}
                  className="min-h-[40px] shrink-0 rounded-full bg-piggie-100 px-3.5 text-xs font-bold text-piggie-950 transition hover:bg-piggie-200 active:scale-95"
                >
                  Remix This Look →
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-piggie-200 bg-white shadow-xl md:grid md:grid-cols-12">
              {/* Interactive 3D Character Showcase Stage */}
              <div className="relative h-[300px] w-full sm:h-[360px] md:col-span-6 md:h-auto md:min-h-[460px]">
                <CharacterRenderer
                  params={params}
                  supportsWebGL={capability.supportsWebGL}
                  forceCanvas2D={forceCanvas2D}
                  dpr={capability.dpr}
                  prefersReducedMotion={capability.prefersReducedMotion}
                  onFallbackActivated={() =>
                    trackPiggieEvent(
                      'renderer_fallback_activated',
                      telemetryCtx,
                      { errorCode: 'WEBGL_LOST' }
                    )
                  }
                />
                {/* Collection Quick-Preview Pills Over Stage Bottom */}
                <div className="absolute inset-x-2 bottom-2.5 flex items-center justify-center gap-1 overflow-x-auto px-1 no-scrollbar">
                  {PIGGIE_COLLECTION_IDS.map((cid) => {
                    const p = MAKEUP_COLLECTION_PRESETS[cid];
                    const active = params.collectionId === cid;
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => handleSelectCollection(cid)}
                        className={`min-h-[34px] shrink-0 rounded-full px-2.5 text-[11px] font-bold shadow-sm backdrop-blur-md transition ${
                          active
                            ? 'bg-piggie-950 text-white'
                            : 'bg-white/90 text-piggie-900 hover:bg-white'
                        }`}
                      >
                        {p.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Viral Discovery Copy & Zero-Account CTAs */}
              <div className="flex flex-col justify-between p-5 sm:p-6 md:col-span-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-piggie-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-piggie-800">
                    <Sparkles className="h-3 w-3 text-piggie-600" />
                    No Account Required • Instant 3D Glam
                  </span>

                  <h1 className="mt-3 font-serif text-2xl font-bold leading-tight text-piggie-950 sm:text-3xl">
                    WHAT WOULD YOU LOOK LIKE AS A PRETTY PIGGIE?
                  </h1>

                  <p className="mt-2 text-sm font-medium text-piggie-700">
                    Your face. Your glam. Your Pretty Piggie.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setScreen('camera')}
                      className="btn-luxury-sheen flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 px-5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition active:scale-98"
                    >
                      <Camera className="h-4 w-4 text-rosegold-light" />
                      <span>CREATE MY PIGGIE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border-2 border-piggie-300 bg-piggie-50/70 px-5 text-xs font-extrabold uppercase tracking-wider text-piggie-950 transition hover:bg-piggie-100 active:scale-98"
                    >
                      <Upload className="h-4 w-4 text-piggie-700" />
                      <span>UPLOAD A SELFIE</span>
                    </button>
                  </div>
                </div>

                {/* Transparent Local vs Analytics Privacy Summary */}
                <div className="mt-5 rounded-2xl border border-piggie-100 bg-piggie-50/60 p-3 text-[11px] leading-relaxed text-piggie-800">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div>
                      <strong className="text-piggie-950">
                        100% On-Device Selfie Processing:
                      </strong>{' '}
                      {PIGGIE_PRIVACY_DISCLOSURE_SHORT}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================================
            SCREEN 2 — CAMERA & UPLOAD
           ==================================================================== */}
        {screen === 'camera' && (
          <section
            aria-label="Camera Capture"
            className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-piggie-200 bg-white p-4 shadow-xl sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setScreen('discovery')}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-piggie-50 px-3.5 text-xs font-bold text-piggie-900 hover:bg-piggie-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-piggie-700">
                Selfie Camera
              </span>
              {isCameraRunning ? (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  aria-label="Flip front and rear camera"
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-piggie-100 px-3.5 text-xs font-bold text-piggie-950 active:scale-95"
                >
                  <SwitchCamera className="h-4 w-4" />
                  <span>Flip</span>
                </button>
              ) : (
                <span className="w-14" />
              )}
            </div>

            {/* Pre-Activation Camera Privacy Explanation */}
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[11px] leading-snug text-emerald-950">
              <strong>Why camera access is requested:</strong> Your camera frames
              stay inside your browser to measure facial proportions locally and
              personalize your Pretty Piggie. Camera hardware turns off
              immediately after capture.
            </div>

            {/* Live Camera Viewfinder */}
            <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-piggie-950">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  isCameraRunning ? 'opacity-100' : 'opacity-0'
                } ${
                  cameraFacingMode !== 'environment'
                    ? '-scale-x-100'
                    : ''
                }`}
              />

              {/* Face Framing Guide Oval */}
              {isCameraRunning && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-[64%] w-[62%] rounded-full border-2 border-dashed border-rosegold-light/85 shadow-[0_0_0_9999px_rgba(38,11,21,0.32)]" />
                  <span className="mt-3 rounded-full bg-piggie-950/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    Center your face &amp; smile!
                  </span>
                </div>
              )}

              {/* Pre-Start or Blocked Overlay */}
              {!isCameraRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                    <Camera className="h-8 w-8 text-rosegold-light" />
                  </div>
                  <h2 className="mt-3 font-serif text-xl font-bold">
                    Ready for Your Piggie Glow-Up?
                  </h2>
                  <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-piggie-100">
                    {cameraError ||
                      'Tap Enable Live Camera below, or upload an existing selfie from your camera roll.'}
                  </p>

                  <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartLiveCamera}
                      className="btn-luxury-sheen flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-extrabold uppercase tracking-wider text-piggie-950 shadow-lg active:scale-95"
                    >
                      <Camera className="h-4 w-4 text-piggie-700" />
                      <span>Enable Live Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => nativeSelfieInputRef.current?.click()}
                      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-white/50 bg-white/15 px-4 text-xs font-bold text-white backdrop-blur-sm active:scale-95"
                    >
                      <span>Snap Selfie / Choose Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Camera Capture & Upload Controls */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full border border-piggie-300 bg-white px-4 text-xs font-bold text-piggie-950 active:scale-95"
              >
                <Upload className="h-4 w-4 text-piggie-700" />
                <span>Upload Photo</span>
              </button>

              {isCameraRunning && (
                <button
                  type="button"
                  onClick={handleCaptureCameraFrame}
                  className="btn-luxury-sheen flex min-h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-full bg-piggie-950 px-5 text-sm font-extrabold text-white shadow-lg active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-rosegold-light" />
                  <span>Capture &amp; Transform</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* ====================================================================
            SCREEN 3 — TRANSFORMATION ANIMATION
           ==================================================================== */}
        {screen === 'transforming' && (
          <section
            role="status"
            aria-live="polite"
            className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-piggie-200 bg-white px-6 py-14 text-center shadow-xl"
          >
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-rosegold bg-piggie-50 p-3 shadow-rose-glow">
              <img
                src="/brand/prettypiggie-logo.png"
                alt="Transforming"
                className="h-full w-full object-contain animate-pulse motion-reduce:animate-none"
              />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold text-piggie-950">
              Sculpting Your Pretty Piggie…
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-piggie-700">
              Mapping facial proportions locally in your browser &amp; applying{' '}
              <strong>{activePreset.name}</strong> couture glam.
            </p>
            <div className="mt-5 h-2 w-56 overflow-hidden rounded-full bg-piggie-100">
              <div className="h-full w-4/5 animate-pulse rounded-full bg-gradient-to-r from-piggie-500 to-rosegold" />
            </div>
          </section>
        )}

        {/* ====================================================================
            SCREEN 4 — INSTANT MODULAR CUSTOMIZATION
           ==================================================================== */}
        {screen === 'customize' && (
          <section aria-label="Customize Your Pretty Piggie">
            {trackingBanner && (
              <div className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                {trackingBanner}
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-piggie-200 bg-white shadow-xl md:grid md:grid-cols-12">
              {/* Live 3D / 2D Stage */}
              <div className="relative h-[300px] w-full sm:h-[360px] md:col-span-6 md:h-auto md:min-h-[520px]">
                <CharacterRenderer
                  params={params}
                  capturedBlendshapes={capturedBlendshapes}
                  supportsWebGL={capability.supportsWebGL}
                  forceCanvas2D={forceCanvas2D}
                  dpr={capability.dpr}
                  prefersReducedMotion={capability.prefersReducedMotion}
                  stageHandleRef={stageHandleRef}
                  onFallbackActivated={() =>
                    trackPiggieEvent(
                      'renderer_fallback_activated',
                      telemetryCtx,
                      { errorCode: 'WEBGL_LOST' }
                    )
                  }
                />

                {/* Floating Stage Quick Actions */}
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setScreen('camera')}
                    className="flex min-h-[38px] items-center gap-1 rounded-full bg-white/90 px-3 text-[11px] font-bold text-piggie-950 shadow-sm backdrop-blur-md active:scale-95"
                  >
                    <Camera className="h-3.5 w-3.5 text-piggie-700" />
                    <span>New Photo</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {capability.supportsWebGL && (
                      <button
                        type="button"
                        onClick={() => setForceCanvas2D((v) => !v)}
                        className="min-h-[38px] rounded-full bg-white/90 px-3 text-[11px] font-bold text-piggie-800 shadow-sm backdrop-blur-md active:scale-95"
                      >
                        {forceCanvas2D ? '3D Stage' : '2D Mode'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="flex min-h-[38px] items-center gap-1 rounded-full bg-piggie-950/90 px-3.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-rosegold-light" />
                      <span>Randomize</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modular Customization Console */}
              <div className="flex flex-col justify-between p-4 sm:p-5 md:col-span-6">
                <div>
                  {/* 5 Launch Makeup Collections */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                      Makeup Collection
                    </span>
                    <span className="text-xs font-bold text-piggie-950">
                      {activePreset.name}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {PIGGIE_COLLECTION_IDS.map((cid) => {
                      const preset = MAKEUP_COLLECTION_PRESETS[cid];
                      const selected = params.collectionId === cid;
                      return (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => handleSelectCollection(cid)}
                          className={`min-h-[42px] shrink-0 rounded-full px-3.5 text-xs font-bold transition ${
                            selected
                              ? 'bg-piggie-950 text-white shadow-sm'
                              : 'border border-piggie-200 bg-piggie-50/70 text-piggie-900 hover:bg-piggie-100'
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Customization Sub-Tabs */}
                  <div
                    role="tablist"
                    aria-label="Character customization categories"
                    className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-piggie-50 p-1 text-[11px] font-bold"
                  >
                    {(
                      [
                        { id: 'makeup', label: 'Lips' },
                        { id: 'hair-skin', label: 'Hair & Tone' },
                        { id: 'accessories', label: 'Accessories' },
                        { id: 'face-fit', label: 'Face Fit' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={customTab === tab.id}
                        onClick={() => setCustomTab(tab.id)}
                        className={`min-h-[38px] rounded-xl px-1.5 transition ${
                          customTab === tab.id
                            ? 'bg-white text-piggie-950 shadow-sm'
                            : 'text-piggie-700 hover:text-piggie-950'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Sub-Tab Panels */}
                  <div className="mt-3 min-h-[195px]">
                    {customTab === 'makeup' && (
                      <div className="space-y-3">
                        <p className="text-xs text-piggie-700">
                          {activePreset.tagline}
                        </p>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                            Lip Gloss Shade
                          </span>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {activePreset.lipShades.map((shade, idx) => {
                              const active = params.lipShadeIndex === idx;
                              return (
                                <button
                                  key={shade.label}
                                  type="button"
                                  onClick={() =>
                                    setParams((p) => ({
                                      ...p,
                                      lipShadeIndex: idx,
                                    }))
                                  }
                                  className={`flex min-h-[44px] items-center gap-2.5 rounded-2xl border px-3 text-left text-xs font-bold transition ${
                                    active
                                      ? 'border-piggie-950 bg-piggie-950 text-white'
                                      : 'border-piggie-200 bg-white text-piggie-900'
                                  }`}
                                >
                                  <span
                                    className="h-5 w-5 shrink-0 rounded-full border border-white/80 shadow-sm"
                                    style={{ backgroundColor: shade.hex }}
                                  />
                                  <span className="truncate">{shade.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                            Eye Iris Color
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {PIGGIE_EYE_COLORS.map((ec) => {
                              const active = params.eyeColorId === ec.id;
                              return (
                                <button
                                  key={ec.id}
                                  type="button"
                                  onClick={() =>
                                    setParams((p) => ({
                                      ...p,
                                      eyeColorId: ec.id,
                                    }))
                                  }
                                  aria-label={ec.label}
                                  title={ec.label}
                                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                                    active
                                      ? 'scale-105 ring-2 ring-piggie-950 ring-offset-2'
                                      : 'ring-1 ring-black/15'
                                  }`}
                                  style={{ backgroundColor: ec.irisHex }}
                                >
                                  {active && (
                                    <Check className="h-4 w-4 text-white drop-shadow" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {customTab === 'hair-skin' && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                            Complexion Tone
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {PIGGIE_SKIN_TONES.map((st) => {
                              const active = params.skinToneId === st.id;
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() =>
                                    setParams((p) => ({
                                      ...p,
                                      skinToneId: st.id,
                                    }))
                                  }
                                  aria-label={st.label}
                                  title={st.label}
                                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                                    active
                                      ? 'scale-105 ring-2 ring-piggie-950 ring-offset-2'
                                      : 'ring-1 ring-black/15'
                                  }`}
                                  style={{ backgroundColor: st.skinHex }}
                                >
                                  {active && (
                                    <Check className="h-4 w-4 text-piggie-950" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                            Hairstyle
                          </span>
                          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                            {PIGGIE_HAIRSTYLE_OPTIONS.map((hs) => (
                              <button
                                key={hs.id}
                                type="button"
                                onClick={() =>
                                  setParams((p) => ({
                                    ...p,
                                    hairstyleId: hs.id,
                                  }))
                                }
                                className={`min-h-[40px] rounded-xl border px-2 text-[11px] font-bold transition ${
                                  params.hairstyleId === hs.id
                                    ? 'border-piggie-950 bg-piggie-950 text-white'
                                    : 'border-piggie-200 bg-white text-piggie-900'
                                }`}
                              >
                                {hs.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-piggie-700">
                            Hair Shade
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {PIGGIE_HAIR_COLORS.map((hc) => {
                              const active = params.hairColorId === hc.id;
                              return (
                                <button
                                  key={hc.id}
                                  type="button"
                                  onClick={() =>
                                    setParams((p) => ({
                                      ...p,
                                      hairColorId: hc.id,
                                    }))
                                  }
                                  aria-label={hc.label}
                                  title={hc.label}
                                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                                    active
                                      ? 'scale-105 ring-2 ring-piggie-950 ring-offset-2'
                                      : 'ring-1 ring-black/20'
                                  }`}
                                  style={{ backgroundColor: hc.hex }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {customTab === 'accessories' && (
                      <div className="grid grid-cols-2 gap-2">
                        {PIGGIE_ACCESSORY_OPTIONS.map((acc) => {
                          const active = params.accessoryId === acc.id;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() =>
                                setParams((p) => ({
                                  ...p,
                                  accessoryId: acc.id,
                                }))
                              }
                              className={`flex min-h-[46px] items-center justify-center rounded-2xl border px-3 text-center text-xs font-bold transition ${
                                active
                                  ? 'border-piggie-950 bg-piggie-950 text-white shadow-sm'
                                  : 'border-piggie-200 bg-white text-piggie-900 hover:bg-piggie-50'
                              }`}
                            >
                              {acc.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {customTab === 'face-fit' && (
                      <div className="space-y-2.5 text-xs">
                        {(
                          [
                            {
                              key: 'eyeScale',
                              label: 'Eye Prominence',
                              min: -1,
                              max: 1,
                            },
                            {
                              key: 'eyeSpacing',
                              label: 'Eye Spacing',
                              min: -1,
                              max: 1,
                            },
                            {
                              key: 'snoutScale',
                              label: 'Snout Scale',
                              min: -1,
                              max: 1,
                            },
                            {
                              key: 'cheekFullness',
                              label: 'Cheek Sculpt',
                              min: -1,
                              max: 1,
                            },
                            {
                              key: 'smileCurve',
                              label: 'Smile Expression',
                              min: 0,
                              max: 1,
                            },
                          ] as const
                        ).map((slider) => (
                          <label key={slider.key} className="block">
                            <div className="flex justify-between text-[11px] font-semibold text-piggie-800">
                              <span>{slider.label}</span>
                              <span className="tabular-nums text-piggie-600">
                                {params.proportions[slider.key].toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={slider.min}
                              max={slider.max}
                              step={0.05}
                              value={params.proportions[slider.key]}
                              onChange={(e) =>
                                updateProportion(
                                  slider.key,
                                  Number(e.target.value)
                                )
                              }
                              className="mt-1 h-2 w-full cursor-pointer accent-piggie-800"
                            />
                          </label>
                        ))}
                        {photoBaselineProportions && (
                          <button
                            type="button"
                            onClick={() =>
                              setParams((p) => ({
                                ...p,
                                proportions: { ...photoBaselineProportions },
                              }))
                            }
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-piggie-200 bg-piggie-50 px-3 text-[11px] font-bold text-piggie-900"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset to My Photo Proportions</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Capture CTA */}
                <div className="mt-4 border-t border-piggie-100 pt-3.5">
                  <button
                    type="button"
                    disabled={isCapturingExport}
                    onClick={handleCaptureCharacter}
                    className="btn-luxury-sheen flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950 px-5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition active:scale-98 disabled:opacity-60"
                  >
                    {isCapturingExport ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Rendering HD Creation…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-rosegold-light" />
                        <span>CAPTURE MY PRETTY PIGGIE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================================
            SCREEN 5 — REVEAL & VIRAL SOCIAL SHARING
           ==================================================================== */}
        {screen === 'reveal' && (
          <section aria-label="Reveal and Share Your Pretty Piggie">
            <div className="rounded-3xl border border-piggie-200 bg-white p-4 shadow-xl sm:p-6">
              {/* Viral Challenge Headline */}
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-piggie-100 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-piggie-800">
                  {activePreset.name} • #MyPrettyPiggie
                </span>
                <h1 className="mt-2 font-serif text-2xl font-bold text-piggie-950 sm:text-3xl">
                  NOW SHOW US YOUR PRETTY PIGGIE!
                </h1>
                <p className="mt-1 text-xs text-piggie-700">
                  Share your creation, tag Pretty Piggie, and challenge a friend
                  to create theirs!
                </p>
              </div>

              {/* Format & Before/After Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {(['9:16', '1:1'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setActiveExportFormat(fmt);
                      setRevealViewMode('branded');
                    }}
                    className={`min-h-[42px] rounded-full px-4 text-xs font-bold transition ${
                      revealViewMode === 'branded' && activeExportFormat === fmt
                        ? 'bg-piggie-950 text-white shadow-sm'
                        : 'border border-piggie-200 bg-white text-piggie-800'
                    }`}
                  >
                    {fmt === '9:16'
                      ? '9:16 Story / TikTok'
                      : '1:1 Square Post'}
                  </button>
                ))}
                {originalSelfieUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setRevealViewMode((m) =>
                        m === 'compare' ? 'branded' : 'compare'
                      )
                    }
                    className={`min-h-[42px] rounded-full px-4 text-xs font-bold transition ${
                      revealViewMode === 'compare'
                        ? 'bg-piggie-800 text-white shadow-sm'
                        : 'border border-piggie-200 bg-piggie-50 text-piggie-900'
                    }`}
                  >
                    Before &amp; After
                  </button>
                )}
              </div>

              {/* Branded PNG Preview OR Local Before/After Comparison */}
              <div className="mt-3 flex justify-center">
                {revealViewMode === 'compare' && originalSelfieUrl ? (
                  <div className="grid w-full max-w-lg grid-cols-2 gap-2.5">
                    <figure className="overflow-hidden rounded-2xl border border-piggie-200 bg-piggie-50">
                      <img
                        src={originalSelfieUrl}
                        alt="Original selfie (local only)"
                        className="aspect-[3/4] w-full object-cover"
                      />
                      <figcaption className="py-1.5 text-center text-[11px] font-bold text-piggie-700">
                        Original (Local Only)
                      </figcaption>
                    </figure>
                    <figure className="overflow-hidden rounded-2xl border border-piggie-300 bg-white shadow-sm">
                      {exportsByFormat['9:16'] && (
                        <img
                          src={exportsByFormat['9:16'].dataUrl}
                          alt="Finished Pretty Piggie"
                          className="aspect-[3/4] w-full object-cover"
                        />
                      )}
                      <figcaption className="py-1.5 text-center text-[11px] font-bold text-piggie-950">
                        {activePreset.name}
                      </figcaption>
                    </figure>
                  </div>
                ) : activeExport ? (
                  <div className="overflow-hidden rounded-2xl border border-piggie-200 bg-piggie-50/40 p-2 shadow-inner">
                    <img
                      src={activeExport.dataUrl}
                      alt={`Exported ${activePreset.name} ${activeExportFormat} card`}
                      className="max-h-[56dvh] w-auto max-w-full rounded-xl object-contain"
                    />
                  </div>
                ) : null}
              </div>

              {/* Primary Viral Share & Download CTAs (Immediate, Unburied!) */}
              <div className="mx-auto mt-4 grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="btn-luxury-sheen flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-600 to-piggie-500 px-5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg transition active:scale-98"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share My Pretty Piggie</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-piggie-950 px-5 text-sm font-bold text-white shadow-md transition active:scale-98"
                >
                  <Download className="h-4 w-4 text-rosegold-light" />
                  <span>Download {activeExportFormat} PNG</span>
                </button>
              </div>

              {/* Shareable Creation Link, Caption & Challenge Friend */}
              <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-piggie-100 bg-piggie-50/60 p-3.5">
                <p className="select-text rounded-xl bg-white p-2.5 text-xs text-piggie-900 ring-1 ring-piggie-100">
                  {shareCaption}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText('caption', shareCaption)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3 text-xs font-bold text-piggie-950 active:scale-95"
                  >
                    {copiedTarget === 'caption' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-piggie-700" />
                    )}
                    <span>
                      {copiedTarget === 'caption' ? 'Copied!' : 'Copy Caption'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText('link', shareUrlBundle.url)
                    }
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3 text-xs font-bold text-piggie-950 active:scale-95"
                  >
                    {copiedTarget === 'link' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5 text-piggie-700" />
                    )}
                    <span>
                      {copiedTarget === 'link'
                        ? 'Link Copied!'
                        : 'Challenge Link'}
                    </span>
                  </button>
                </div>

                <p className="mt-2 text-center text-[10px] text-piggie-600">
                  Your share link reproduces your Pretty Piggie look using an
                  integrity-checked preset code — zero personal data or photos
                  are ever embedded in the link.
                </p>
              </div>

              {/* Quick Remix / Capture Again */}
              <div className="mx-auto mt-3 flex max-w-lg flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('customize')}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-piggie-300 bg-white px-4 text-xs font-bold text-piggie-950 active:scale-95"
                >
                  <Sliders className="h-3.5 w-3.5 text-piggie-700" />
                  <span>Try Another Makeup Collection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('camera')}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-piggie-300 bg-white px-4 text-xs font-bold text-piggie-950 active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5 text-piggie-700" />
                  <span>Capture Again</span>
                </button>
              </div>

              {/* Separate OFF-by-Default Community Gallery Interest Consent */}
              <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-dashed border-piggie-200 p-3">
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-piggie-800">
                  <input
                    type="checkbox"
                    checked={galleryOptInPreview}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setGalleryOptInPreview(next);
                      if (next) {
                        trackPiggieEvent(
                          'gallery_consent_given',
                          telemetryCtx,
                          { collectionId: params.collectionId }
                        );
                      }
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-piggie-300 text-piggie-800"
                  />
                  <span>
                    <strong className="text-piggie-950">
                      Optional Community Gallery Consent (Default OFF):
                    </strong>{' '}
                    I’m interested in submitting finished Pretty Piggie
                    creations when the moderated Community Gallery opens. No
                    photo or selfie is uploaded right now, and tagging on social
                    media is voluntary (never a contest or guaranteed repost).
                  </span>
                </label>
              </div>

              {/* Shop the Makeup Collection (Strictly VERIFIED_IN_STOCK Only) */}
              {eligiblePairedProducts.length > 0 && (
                <div className="mx-auto mt-5 max-w-lg border-t border-piggie-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-piggie-950">
                      <ShoppingBag className="h-4 w-4 text-piggie-600" />
                      Shop Real {activePreset.shortName} Piggie Cosmetics
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Verified In Stock
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {eligiblePairedProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/?product=${encodeURIComponent(prod.handle)}`}
                        className="flex flex-col items-center rounded-2xl border border-piggie-100 bg-white p-2 text-center shadow-sm transition hover:border-piggie-300 active:scale-95"
                      >
                        {prod.primaryImage && (
                          <img
                            src={prod.primaryImage}
                            alt={prod.title}
                            className="h-12 w-12 object-contain"
                          />
                        )}
                        <span className="mt-1 line-clamp-1 text-[11px] font-bold text-piggie-950">
                          {prod.title}
                        </span>
                        <span className="text-[11px] font-extrabold tabular-nums text-piggie-700">
                          ${prod.price.toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetSession}
                className="mx-auto mt-4 flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-piggie-700 underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Session &amp; Start Fresh</span>
              </button>
            </div>
          </section>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="animate-toast-pop fixed inset-x-3 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-rosegold/60 bg-piggie-950/95 px-4 py-3 text-center text-xs font-bold text-white shadow-2xl backdrop-blur-xl"
          >
            {toastMessage}
          </div>
        )}

        {/* Footer Dual-Mode & Storefront Links */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center text-[11px] text-piggie-700">
          <Link href="/" className="font-bold underline hover:text-piggie-950">
            3D Makeup Boutique
          </Link>
          <span>•</span>
          <Link
            href="/?mode=2d"
            className="font-bold underline hover:text-piggie-950"
          >
            Shop 2D Catalogue
          </Link>
          <span>•</span>
          <Link
            href="/makeover-studio"
            className="inline-flex items-center gap-1 font-bold underline hover:text-piggie-950"
          >
            <span>Optional AI Photoreal Cartoon Studio</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-piggie-600">
            <Users className="h-3 w-3" />
            #MyPrettyPiggie
          </span>
        </footer>
      </main>
    </div>
  );
}
