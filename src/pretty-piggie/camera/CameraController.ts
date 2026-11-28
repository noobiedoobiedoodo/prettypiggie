export type CameraFacingMode = 'user' | 'environment';

export interface InAppBrowserInfo {
  isRestrictedInAppWebView: boolean;
  appName: 'Instagram' | 'TikTok' | 'Snapchat' | 'Facebook' | null;
}

/**
 * Detects embedded social-app WebViews where iOS WKWebView frequently blocks getUserMedia.
 */
export function detectInAppWebView(): InAppBrowserInfo {
  if (typeof navigator === 'undefined') {
    return { isRestrictedInAppWebView: false, appName: null };
  }
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) {
    return { isRestrictedInAppWebView: true, appName: 'Instagram' };
  }
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) {
    return { isRestrictedInAppWebView: true, appName: 'TikTok' };
  }
  if (/Snapchat/i.test(ua)) {
    return { isRestrictedInAppWebView: true, appName: 'Snapchat' };
  }
  if (/FBAN|FBAV/i.test(ua)) {
    return { isRestrictedInAppWebView: true, appName: 'Facebook' };
  }
  return { isRestrictedInAppWebView: false, appName: null };
}

/**
 * Browser-native camera controller with deterministic MediaStreamTrack shutoff
 * on capture, backgrounding, pagehide, or unmount (Mandatory Correction #12).
 */
export class PiggieCameraController {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private facingMode: CameraFacingMode = 'user';
  private lifecycleBound = false;

  private readonly handlePageHide = () => {
    this.stop();
  };

  private readonly handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.stop();
    }
  };

  getFacingMode(): CameraFacingMode {
    return this.facingMode;
  }

  isActive(): boolean {
    return Boolean(
      this.stream &&
        this.stream.getVideoTracks().some((t) => t.readyState === 'live')
    );
  }

  async start(
    videoEl: HTMLVideoElement,
    facing: CameraFacingMode = this.facingMode
  ): Promise<{ width: number; height: number; facingMode: CameraFacingMode }> {
    this.stop();
    this.facingMode = facing;

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      throw new Error('CAMERA_API_UNAVAILABLE');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1080 },
        height: { ideal: 1440 },
      },
    });

    this.stream = stream;
    this.videoElement = videoEl;
    videoEl.srcObject = stream;
    videoEl.playsInline = true;
    videoEl.muted = true;
    await videoEl.play();

    this.bindLifecycleListeners();

    return {
      width: videoEl.videoWidth || 720,
      height: videoEl.videoHeight || 960,
      facingMode: facing,
    };
  }

  async flipCamera(
    videoEl: HTMLVideoElement
  ): Promise<{ width: number; height: number; facingMode: CameraFacingMode }> {
    const next: CameraFacingMode =
      this.facingMode === 'user' ? 'environment' : 'user';
    return this.start(videoEl, next);
  }

  /**
   * Captures the current video frame onto a horizontally-corrected JPEG data URL
   * and immediately stops the camera hardware unless keepAlive is true.
   */
  captureFrame(options: { stopAfterCapture?: boolean } = {}): {
    canvas: HTMLCanvasElement;
    dataUrl: string;
  } | null {
    const video = this.videoElement;
    if (!video || video.videoWidth < 2 || video.videoHeight < 2) {
      return null;
    }

    const maxEdge = 1080;
    const scale = Math.min(
      1,
      maxEdge / Math.max(video.videoWidth, video.videoHeight)
    );
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror selfie front camera so captured frame matches the live mirror preview
    if (this.facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (options.stopAfterCapture !== false) {
      this.stop();
    }

    return { canvas, dataUrl };
  }

  stop(): void {
    this.unbindLifecycleListeners();
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      }
      this.stream = null;
    }
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
      } catch {
        // Ignore
      }
      this.videoElement = null;
    }
  }

  private bindLifecycleListeners(): void {
    if (this.lifecycleBound || typeof window === 'undefined') return;
    window.addEventListener('pagehide', this.handlePageHide);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.lifecycleBound = true;
  }

  private unbindLifecycleListeners(): void {
    if (!this.lifecycleBound || typeof window === 'undefined') return;
    window.removeEventListener('pagehide', this.handlePageHide);
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    this.lifecycleBound = false;
  }
}
