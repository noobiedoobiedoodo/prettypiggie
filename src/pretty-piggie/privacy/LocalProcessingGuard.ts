/**
 * Local Processing & Ephemeral Memory Guard (Mandatory Corrections #10 & #12).
 * Tracks temporary blob ObjectURLs and offscreen canvases created during a session
 * and releases them deterministically when the experience resets or unmounts.
 */
export class LocalProcessingGuard {
  private readonly objectUrls = new Set<string>();
  private readonly scratchCanvases = new Set<HTMLCanvasElement>();

  registerObjectUrl(url: string): string {
    if (url.startsWith('blob:')) {
      this.objectUrls.add(url);
    }
    return url;
  }

  revokeObjectUrl(url: string | null | undefined): void {
    if (!url || !url.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore already-revoked URLs
    }
    this.objectUrls.delete(url);
  }

  createScratchCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.scratchCanvases.add(canvas);
    return canvas;
  }

  releaseCanvas(canvas: HTMLCanvasElement | null | undefined): void {
    if (!canvas) return;
    try {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    } catch {
      // Ignore canvas cleanup errors
    }
    this.scratchCanvases.delete(canvas);
  }

  releaseAll(): void {
    this.objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    });
    this.objectUrls.clear();

    this.scratchCanvases.forEach((c) => {
      try {
        c.width = 0;
        c.height = 0;
      } catch {
        // Ignore
      }
    });
    this.scratchCanvases.clear();
  }
}

/**
 * Accurate, transparent data-flow disclosure (Mandatory Correction #10):
 * Clearly separates 100% browser-local selfie/landmark processing from
 * anonymous server-side funnel telemetry.
 */
export const PIGGIE_PRIVACY_SUMMARY = {
  localProcessingStatement:
    'Your camera feed, uploaded selfie, and facial landmarks are processed 100% locally in your browser and are never uploaded to PrettyPiggie.com or any AI provider.',
  analyticsStatement:
    'Anonymous product usage events (such as screen steps, chosen makeup collection, and device performance tier — never photos, landmarks, or biometric data) are sent to PrettyPiggie.com unless Do Not Track / Global Privacy Control is enabled.',
} as const;
