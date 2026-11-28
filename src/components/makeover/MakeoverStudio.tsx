'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Download,
  Lock,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { PRETTYPIGGIE_PRODUCTS } from '@/data/boutiqueData';
import {
  ComposedBrandedImage,
  composePrettyPiggieOutput,
  prepareSelfieForUpload,
} from '@/lib/brandedFrameCompositor';
import {
  EXPORT_FORMAT_SPECS,
  MAKEOVER_CAMPAIGN,
  MAKEOVER_PERSONALITIES,
  MASTER_REFERENCE_PUBLIC_PATH,
  MakeoverExportFormat,
  MakeoverPersonalityId,
  getMakeoverPersonality,
} from '@/lib/makeoverStyles';

interface GenerationResult {
  imageSrc: string;
  personalityId: MakeoverPersonalityId;
  isDemo: boolean;
}

interface StudioError {
  message: string;
  code: string;
  retryable: boolean;
}

interface ComposedState extends ComposedBrandedImage {
  key: string;
}

const PROGRESS_STAGES = [
  'Reading your portrait…',
  'Sculpting your pig snout & ears…',
  'Painting your makeup look…',
  'Polishing studio lighting…',
  'Almost ready — finishing touches…',
];

const FORMAT_ORDER: MakeoverExportFormat[] = [
  'story-9-16',
  'square-1-1',
  'portrait-4-5',
];

export function MakeoverStudio() {
  const [photo, setPhoto] = useState<{ blob: Blob; previewUrl: string } | null>(
    null
  );
  const [personalityId, setPersonalityId] =
    useState<MakeoverPersonalityId>('glam-piggie');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [featureOptIn, setFeatureOptIn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [error, setError] = useState<StudioError | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [format, setFormat] = useState<MakeoverExportFormat>('story-9-16');
  const [includeFrame, setIncludeFrame] = useState(true);
  const [composed, setComposed] = useState<ComposedState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captionCopied, setCaptionCopied] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generatingRef = useRef(false);

  const personality = getMakeoverPersonality(personalityId);

  const composeKey = result
    ? `${result.imageSrc.length}:${result.imageSrc.slice(-24)}:${result.personalityId}:${format}:${includeFrame}:${result.isDemo}`
    : null;
  const isComposing = Boolean(composeKey) && composed?.key !== composeKey;

  const pairedProducts = useMemo(() => {
    if (!personality) return [];
    return personality.pairedProductHandles
      .map((handle) =>
        PRETTYPIGGIE_PRODUCTS.find((p) => p.handle === handle && p.canPurchase)
      )
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 3);
  }, [personality]);

  // Compose the branded social frame whenever result/format/frame changes
  useEffect(() => {
    if (!result || !composeKey) return;
    const resultPersonality = getMakeoverPersonality(result.personalityId);
    if (!resultPersonality) return;
    let cancelled = false;
    const run = async () => {
      try {
        const out = await composePrettyPiggieOutput({
          imageSrc: result.imageSrc,
          personality: resultPersonality,
          format,
          includeFrame,
          isPreviewDemo: result.isDemo,
        });
        if (!cancelled) setComposed({ ...out, key: composeKey });
      } catch {
        if (!cancelled) {
          setError({
            message:
              'We could not render your branded image. Please tap Regenerate to try again.',
            code: 'COMPOSE_FAILED',
            retryable: true,
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [result, composeKey, format, includeFrame]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      setError(null);
      setNotice(null);
      if (!file.type.startsWith('image/')) {
        setError({
          message: 'Please choose a photo (JPEG, PNG, or WebP).',
          code: 'NOT_AN_IMAGE',
          retryable: false,
        });
        return;
      }
      try {
        const prepared = await prepareSelfieForUpload(file);
        setPhoto(prepared);
        setResult(null);
        setComposed(null);
      } catch {
        setError({
          message:
            'We could not read that photo. Please try a different JPEG, PNG, or WebP image.',
          code: 'PHOTO_DECODE_FAILED',
          retryable: false,
        });
      }
    },
    []
  );

  const resetAll = useCallback(() => {
    setPhoto(null);
    setResult(null);
    setComposed(null);
    setError(null);
    setConsentAccepted(false);
    setAgeConfirmed(false);
    setFeatureOptIn(false);
    setNotice('Your photo and result were deleted from this device screen.');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generatingRef.current) return;
    if (!photo || !consentAccepted || !ageConfirmed) return;

    generatingRef.current = true;
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    setProgressIdx(0);
    progressTimerRef.current = setInterval(() => {
      setProgressIdx((i) => Math.min(PROGRESS_STAGES.length - 1, i + 1));
    }, 6000);

    try {
      const form = new FormData();
      form.append('photo', photo.blob, 'portrait.jpg');
      form.append('personalityId', personalityId);
      form.append('consentAccepted', 'true');
      form.append('ageConfirmed', 'true');
      form.append('featureOptIn', featureOptIn ? 'true' : 'false');

      const res = await fetch('/api/makeover/transform', {
        method: 'POST',
        body: form,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
        retryable?: boolean;
        imageDataUrl?: string;
        personalityId?: MakeoverPersonalityId;
      } | null;

      if (!res.ok || !data?.imageDataUrl) {
        setError({
          message:
            data?.error ||
            'Something went wrong while creating your Pretty Piggie. Please try again.',
          code: data?.code || 'UNKNOWN',
          retryable: data?.retryable !== false && res.status !== 400,
        });
        return;
      }

      setComposed(null);
      setResult({
        imageSrc: data.imageDataUrl,
        personalityId: data.personalityId ?? personalityId,
        isDemo: false,
      });
    } catch {
      setError({
        message:
          'We could not reach the Makeover Studio. Check your connection and try again.',
        code: 'NETWORK',
        retryable: true,
      });
    } finally {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, [photo, consentAccepted, ageConfirmed, personalityId, featureOptIn]);

  const handleDemoPreview = useCallback(() => {
    setError(null);
    setNotice(null);
    setComposed(null);
    setResult({
      imageSrc: MASTER_REFERENCE_PUBLIC_PATH,
      personalityId,
      isDemo: true,
    });
  }, [personalityId]);

  const triggerDownload = useCallback((image: ComposedBrandedImage) => {
    const url = URL.createObjectURL(image.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = image.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, []);

  const copyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(MAKEOVER_CAMPAIGN.defaultCaption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2200);
    } catch {
      setNotice('Copy is not available here. Long-press the caption to copy.');
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!composed) return;
    const file = new File([composed.blob], composed.fileName, {
      type: 'image/png',
    });
    try {
      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          text: MAKEOVER_CAMPAIGN.defaultCaption,
          title: MAKEOVER_CAMPAIGN.headline,
        });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
    triggerDownload(composed);
    await copyCaption();
    setNotice(
      'Your image was saved and the caption copied. Open TikTok, Instagram, Snapchat, or Facebook and post it — tag Pretty Piggie with #MyPrettyPiggie!'
    );
  }, [composed, copyCaption, triggerDownload]);

  const handleChallengeFriend = useCallback(async () => {
    const url = `${window.location.origin}/makeover-studio`;
    const text = `I made my Pretty Piggie 💗🐷 — what's yours? ${MAKEOVER_CAMPAIGN.hashtag}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: MAKEOVER_CAMPAIGN.headline, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setNotice('Challenge link copied — send it to a friend!');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setNotice('Copy this link to challenge a friend: ' + url);
    }
  }, []);

  const canGenerate =
    Boolean(photo) && consentAccepted && ageConfirmed && !isGenerating;

  const generateLabel = result && !result.isDemo && result.personalityId === personalityId
    ? 'Regenerate My Pretty Piggie'
    : `Create My ${personality?.name ?? 'Pretty Piggie'}`;

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overscroll-contain bg-gradient-to-b from-piggie-100 via-piggie-50 to-white text-piggie-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-piggie-200/75 bg-piggie-50/95 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-piggie-200 bg-white px-3.5 text-xs font-bold text-piggie-950 shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Boutique</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/brand/prettypiggie-logo.png"
            alt="Pretty Piggie Makeup"
            className="h-9 w-9 shrink-0 rounded-full border border-piggie-200 bg-white object-contain p-0.5"
          />
          <span className="truncate font-serif text-sm font-bold">
            AI Cartoon Studio
          </span>
        </div>
        <Link
          href="/pretty-piggie"
          className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-full bg-piggie-950 px-3 text-[11px] font-bold text-white shadow-sm transition active:scale-95"
        >
          <span>Instant 3D Piggie →</span>
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-piggie-200 bg-piggie-950 text-white shadow-xl">
          <div className="grid grid-cols-5">
            <div className="col-span-3 flex flex-col justify-center px-4 py-5">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-piggie-100">
                <Sparkles className="h-3 w-3 text-rosegold" />
                AI Character Makeover
              </span>
              <h1 className="mt-2 font-serif text-2xl font-bold leading-tight">
                {MAKEOVER_CAMPAIGN.headline}
              </h1>
              <p className="mt-1.5 text-xs leading-snug text-rosegold-light">
                Turn your selfie into your own glamorous 3D animated Pretty
                Piggie — then tag us with {MAKEOVER_CAMPAIGN.hashtag}.
              </p>
            </div>
            <div className="relative col-span-2">
              <img
                src={MASTER_REFERENCE_PUBLIC_PATH}
                alt="The Master Pretty Piggie character"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-piggie-950 via-piggie-950/10 to-transparent" />
            </div>
          </div>
        </section>

        {/* Step 1 — Photo */}
        <section className="mt-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-piggie-700">
            Step 1 · Your Photo
          </h2>
          <div className="mt-2 rounded-3xl border border-piggie-100 bg-white p-3 shadow-sm">
            {photo ? (
              <div className="flex items-center gap-3">
                <img
                  src={photo.previewUrl}
                  alt="Your selected portrait"
                  className="h-24 w-24 shrink-0 rounded-2xl border border-piggie-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-piggie-950">
                    Photo ready
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-piggie-700">
                    Best results: one face, good light, looking at the camera.
                  </p>
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="mt-2 min-h-[40px] rounded-full border border-piggie-300 px-3.5 text-xs font-bold text-piggie-900 active:scale-95"
                  >
                    Choose a different photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-piggie-950 px-3 text-white shadow-md transition active:scale-95"
                >
                  <Camera className="h-6 w-6 text-rosegold-light" />
                  <span className="text-sm font-bold">Take a Selfie</span>
                </button>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-piggie-300 bg-piggie-50 px-3 text-piggie-950 transition active:scale-95"
                >
                  <Upload className="h-6 w-6 text-piggie-600" />
                  <span className="text-sm font-bold">Upload a Photo</span>
                </button>
              </div>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileSelected}
              className="hidden"
              aria-label="Take a selfie"
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              onChange={handleFileSelected}
              className="hidden"
              aria-label="Upload a photo"
            />
          </div>
        </section>

        {/* Step 2 — Personality */}
        <section className="mt-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-piggie-700">
            Step 2 · Pick Your Piggie Personality
          </h2>
          <div
            role="radiogroup"
            aria-label="Pretty Piggie personality"
            className="-mx-4 mt-2 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar"
          >
            {MAKEOVER_PERSONALITIES.map((p) => {
              const selected = p.id === personalityId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPersonalityId(p.id)}
                  className={`min-h-[96px] w-[168px] shrink-0 snap-start rounded-2xl border p-3 text-left transition active:scale-95 ${
                    selected
                      ? 'border-piggie-950 bg-piggie-950 text-white shadow-lg'
                      : 'border-piggie-200 bg-white text-piggie-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {p.palette.map((hex) => (
                      <span
                        key={hex}
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 font-serif text-sm font-bold">{p.name}</p>
                  <p
                    className={`mt-0.5 line-clamp-2 text-[11px] leading-snug ${
                      selected ? 'text-rosegold-light' : 'text-piggie-700'
                    }`}
                  >
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3 — Privacy & Consent */}
        <section className="mt-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-piggie-700">
            Step 3 · Privacy &amp; Consent
          </h2>
          <div className="mt-2 rounded-3xl border border-piggie-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-piggie-600" />
              <p className="text-[11px] leading-relaxed text-piggie-800">
                <strong className="text-piggie-950">How your photo is used:</strong>{' '}
                it is sent securely from our server to a third-party AI image
                service, only to create your character. Pretty Piggie does{' '}
                <strong>not</strong> save your original photo or your result,
                does <strong>not</strong> post anything publicly, and does{' '}
                <strong>not</strong> add you to any gallery. Your image exists
                only on this screen until you download or share it yourself.
                The AI service handles the image under its own API data terms.
              </p>
            </div>

            <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl bg-piggie-50/70 p-3 text-xs leading-snug text-piggie-900">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-piggie-300 text-piggie-800 focus:ring-piggie-600"
              />
              <span>
                <strong>Required:</strong> I consent to Pretty Piggie sending my
                photo to an AI service to generate my character.
              </span>
            </label>

            <label className="mt-2 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl bg-piggie-50/70 p-3 text-xs leading-snug text-piggie-900">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-piggie-300 text-piggie-800 focus:ring-piggie-600"
              />
              <span>
                <strong>Required:</strong> I am 18 or older, or I am the parent
                or legal guardian of the person in this photo and give
                permission. Please do not upload photos of children without a
                parent or guardian.
              </span>
            </label>

            <label className="mt-2 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-piggie-200 p-3 text-xs leading-snug text-piggie-800">
              <input
                type="checkbox"
                checked={featureOptIn}
                onChange={(e) => setFeatureOptIn(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-piggie-300 text-piggie-800 focus:ring-piggie-600"
              />
              <span>
                <strong>Optional, separate:</strong> Pretty Piggie may ask to
                feature my character. (Nothing is stored or featured
                automatically — this only records that I am open to being
                contacted.)
              </span>
            </label>
          </div>
        </section>

        {/* Generate */}
        <section className="mt-5">
          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className={`btn-luxury-sheen flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white shadow-lg transition active:scale-98 ${
              canGenerate
                ? 'bg-gradient-to-r from-piggie-950 via-piggie-800 to-piggie-950'
                : 'cursor-not-allowed bg-neutral-400'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                <span>Creating your Pretty Piggie…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{generateLabel}</span>
              </>
            )}
          </button>

          {!canGenerate && !isGenerating && (
            <p className="mt-2 text-center text-[11px] text-piggie-700">
              {!photo
                ? 'Add a photo to begin.'
                : 'Please accept both required checkboxes to continue.'}
            </p>
          )}

          {isGenerating && (
            <div
              role="status"
              aria-live="polite"
              className="mt-3 rounded-2xl border border-piggie-100 bg-white p-3"
            >
              <p className="text-xs font-bold text-piggie-950">
                {PROGRESS_STAGES[progressIdx]}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-piggie-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-piggie-500 to-rosegold-medium transition-all duration-[6000ms] ease-linear"
                  style={{
                    width: `${((progressIdx + 1) / PROGRESS_STAGES.length) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-piggie-600">
                This usually takes 15–45 seconds. Please keep this page open.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-950"
            >
              <strong className="block font-bold">
                {error.code === 'AI_PROVIDER_NOT_CONFIGURED'
                  ? 'Studio engine not connected yet'
                  : 'We could not create your Pretty Piggie'}
              </strong>
              <span className="mt-1 block leading-snug">{error.message}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {error.retryable && photo && canGenerate && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="min-h-[40px] rounded-full bg-rose-700 px-4 text-xs font-bold text-white active:scale-95"
                  >
                    Try again
                  </button>
                )}
                {error.code === 'AI_PROVIDER_NOT_CONFIGURED' && (
                  <button
                    type="button"
                    onClick={handleDemoPreview}
                    className="min-h-[40px] rounded-full border border-rose-300 bg-white px-4 text-xs font-bold text-rose-900 active:scale-95"
                  >
                    Preview the branded frame
                  </button>
                )}
              </div>
            </div>
          )}

          {notice && (
            <p
              role="status"
              className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-snug text-emerald-900"
            >
              {notice}
            </p>
          )}
        </section>

        {/* Result */}
        {result && (
          <section className="mt-6" aria-label="Your Pretty Piggie result">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-piggie-700">
              Your Result · {getMakeoverPersonality(result.personalityId)?.name}
            </h2>

            {result.isDemo && (
              <p className="mt-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs leading-snug text-amber-950">
                <strong>Studio reference preview.</strong> This is the Master
                Pretty Piggie character, shown only so you can test the branded
                frame, download, and share tools. It is not a transformation of
                your photo.
              </p>
            )}

            {/* Before / After */}
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <figure className="overflow-hidden rounded-2xl border border-piggie-100 bg-white">
                {photo && !result.isDemo ? (
                  <img
                    src={photo.previewUrl}
                    alt="Your original photo"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-piggie-50 px-3 text-center text-[11px] text-piggie-600">
                    Your photo appears here
                  </div>
                )}
                <figcaption className="px-2 py-1.5 text-center text-[11px] font-bold text-piggie-700">
                  You
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-piggie-200 bg-white shadow-sm">
                <img
                  src={result.imageSrc}
                  alt="Your Pretty Piggie character"
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="px-2 py-1.5 text-center text-[11px] font-bold text-piggie-950">
                  Your Pretty Piggie
                </figcaption>
              </figure>
            </div>

            {/* Format + Frame */}
            <div className="mt-4 flex gap-1.5 overflow-x-auto no-scrollbar">
              {FORMAT_ORDER.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`min-h-[44px] shrink-0 rounded-full px-4 text-xs font-bold transition ${
                    format === f
                      ? 'bg-piggie-950 text-white shadow-sm'
                      : 'bg-white text-piggie-800 ring-1 ring-piggie-200'
                  }`}
                >
                  {EXPORT_FORMAT_SPECS[f].shortLabel}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIncludeFrame((v) => !v)}
                aria-pressed={includeFrame}
                className={`min-h-[44px] shrink-0 rounded-full px-4 text-xs font-bold transition ${
                  includeFrame
                    ? 'bg-piggie-100 text-piggie-950 ring-1 ring-piggie-400'
                    : 'bg-white text-piggie-700 ring-1 ring-piggie-200'
                }`}
              >
                {includeFrame ? 'Branded frame: On' : 'Branded frame: Off'}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-piggie-600">
              {EXPORT_FORMAT_SPECS[format].ratioLabel} ·{' '}
              {EXPORT_FORMAT_SPECS[format].platformHint}
            </p>

            {/* Composed Preview */}
            <div className="mt-2 flex min-h-[220px] items-center justify-center overflow-hidden rounded-3xl border border-piggie-200 bg-white p-2 shadow-md">
              {composed && !isComposing ? (
                <img
                  src={composed.dataUrl}
                  alt="Branded Pretty Piggie social image preview"
                  className="max-h-[70dvh] w-auto max-w-full rounded-2xl object-contain"
                />
              ) : (
                <p className="text-xs font-semibold text-piggie-600">
                  Rendering your branded image…
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!composed || isComposing}
                onClick={() => composed && triggerDownload(composed)}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-piggie-950 px-4 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                disabled={!composed || isComposing}
                onClick={handleShare}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-piggie-600 to-piggie-500 px-4 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Tag & Challenge */}
            <div className="mt-3 rounded-3xl border border-piggie-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-piggie-950">
                Tag us &amp; challenge a friend 💗
              </p>
              <p className="mt-1 text-[11px] leading-snug text-piggie-700">
                Post to TikTok, Instagram, Snapchat, or Facebook yourself —
                nothing is ever posted for you. Use{' '}
                <strong>{MAKEOVER_CAMPAIGN.hashtag}</strong> and tag Pretty
                Piggie.
              </p>
              <p className="mt-2 select-text rounded-2xl bg-piggie-50 p-3 text-xs leading-snug text-piggie-900">
                {MAKEOVER_CAMPAIGN.defaultCaption}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={copyCaption}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-piggie-300 bg-white px-3 text-xs font-bold text-piggie-950 active:scale-95"
                >
                  {captionCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {captionCopied ? 'Copied!' : 'Copy caption'}
                </button>
                <button
                  type="button"
                  onClick={handleChallengeFriend}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-piggie-300 bg-white px-3 text-xs font-bold text-piggie-950 active:scale-95"
                >
                  <Users className="h-3.5 w-3.5" />
                  Challenge a friend
                </button>
              </div>
            </div>

            {/* Try another style */}
            {!result.isDemo && (
              <p className="mt-3 text-center text-[11px] text-piggie-700">
                Want a different look? Pick another personality above and tap
                Create — your character design stays consistent.
              </p>
            )}

            {/* Shop the look (verified, in-stock products only) */}
            {pairedProducts.length > 0 && (
              <div className="mt-4 rounded-3xl border border-piggie-100 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-sm font-bold text-piggie-950">
                  <ShoppingBag className="h-4 w-4 text-piggie-600" />
                  Shop the {getMakeoverPersonality(result.personalityId)?.shortName} look
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {pairedProducts.map((p) => (
                    <a
                      key={p.id}
                      href={`/?product=${encodeURIComponent(p.handle)}`}
                      className="flex min-h-[44px] flex-col items-center rounded-2xl border border-piggie-100 bg-white p-2 text-center transition active:scale-95"
                    >
                      {p.primaryImage && (
                        <img
                          src={p.primaryImage}
                          alt={p.title}
                          className="h-14 w-14 object-contain"
                        />
                      )}
                      <span className="mt-1 line-clamp-2 text-[11px] font-bold leading-tight text-piggie-950">
                        {p.title}
                      </span>
                      <span className="text-[11px] font-extrabold tabular-nums text-piggie-700">
                        ${p.price.toFixed(2)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={resetAll}
              className="mx-auto mt-4 flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-piggie-700 underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete my photo &amp; result now
            </button>
          </section>
        )}

        {!result && photo && (
          <button
            type="button"
            onClick={resetAll}
            className="mx-auto mt-4 flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-piggie-700 underline"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove my photo
          </button>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[10px] text-piggie-600">
          <Lock className="h-3 w-3" />
          Photos are processed over an encrypted connection and are never stored
          by Pretty Piggie.
        </p>
      </main>
    </div>
  );
}
