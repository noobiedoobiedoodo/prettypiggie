import assetManifest from '../assetManifest.json';
import {
  ExtractedFacialFeatures,
  extractFacialFeatures,
} from './FaceLandmarkProcessor';

export type FaceTrackerDelegate = 'GPU' | 'CPU';

interface MediaPipeFaceLandmarkerLike {
  detect(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    faceBlendshapes?: Array<{
      categories?: Array<{
        categoryName?: string;
        displayName?: string;
        score?: number;
      }>;
    }>;
    facialTransformationMatrixes?: Array<{ data?: Float32Array | number[] }>;
  };
  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number
  ): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    faceBlendshapes?: Array<{
      categories?: Array<{
        categoryName?: string;
        displayName?: string;
        score?: number;
      }>;
    }>;
    facialTransformationMatrixes?: Array<{ data?: Float32Array | number[] }>;
  };
  setOptions(options: { runningMode: 'IMAGE' | 'VIDEO' }): Promise<void>;
  close(): void;
}

/**
 * Self-hosted MediaPipe Face Landmarker controller with explicit GPU -> CPU fallback
 * and deterministic resource cleanup (Mandatory Corrections #1, #3, #12).
 */
export class PiggieFaceTracker {
  private landmarker: MediaPipeFaceLandmarkerLike | null = null;
  private activeDelegate: FaceTrackerDelegate | null = null;
  private runningMode: 'IMAGE' | 'VIDEO' = 'IMAGE';
  private initPromise: Promise<FaceTrackerDelegate> | null = null;
  private disposed = false;

  getDelegate(): FaceTrackerDelegate | null {
    return this.activeDelegate;
  }

  async initialize(options: {
    runningMode?: 'IMAGE' | 'VIDEO';
    forceDelegate?: FaceTrackerDelegate;
  } = {}): Promise<FaceTrackerDelegate> {
    if (this.disposed) {
      this.disposed = false;
    }
    const desiredMode = options.runningMode ?? 'IMAGE';

    if (this.landmarker && this.activeDelegate) {
      if (this.runningMode !== desiredMode) {
        await this.landmarker.setOptions({ runningMode: desiredMode });
        this.runningMode = desiredMode;
      }
      return this.activeDelegate;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.createInstanceWithFallback(
      desiredMode,
      options.forceDelegate
    );
    try {
      return await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async createInstanceWithFallback(
    mode: 'IMAGE' | 'VIDEO',
    forceDelegate?: FaceTrackerDelegate
  ): Promise<FaceTrackerDelegate> {
    const mp = await import('@mediapipe/tasks-vision');
    const vision = await mp.FilesetResolver.forVisionTasks(
      assetManifest.wasmBasePath
    );

    const createForDelegate = async (
      delegate: FaceTrackerDelegate
    ): Promise<MediaPipeFaceLandmarkerLike> => {
      const instance = await mp.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: assetManifest.faceLandmarkerModelPath,
          delegate,
        },
        runningMode: mode,
        numFaces: 2, // Primary face + multi-face interference detection
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      return instance as unknown as MediaPipeFaceLandmarkerLike;
    };

    if (forceDelegate === 'CPU') {
      this.landmarker = await createForDelegate('CPU');
      this.activeDelegate = 'CPU';
      this.runningMode = mode;
      return 'CPU';
    }

    // Attempt GPU WebGL delegate first; fall back cleanly to CPU XNNPACK on error
    try {
      this.landmarker = await createForDelegate('GPU');
      this.activeDelegate = 'GPU';
      this.runningMode = mode;
      return 'GPU';
    } catch {
      try {
        this.landmarker?.close();
      } catch {
        // Ignore partial close failure
      }
      this.landmarker = await createForDelegate('CPU');
      this.activeDelegate = 'CPU';
      this.runningMode = mode;
      return 'CPU';
    }
  }

  async analyzeImage(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): Promise<{
    extraction: ExtractedFacialFeatures;
    delegate: FaceTrackerDelegate;
    fellBackToCpuDuringDetect: boolean;
  }> {
    let delegate = await this.initialize({ runningMode: 'IMAGE' });
    let fellBackToCpuDuringDetect = false;

    if (!this.landmarker) {
      throw new Error('Face Landmarker failed to initialize.');
    }

    let rawResult: ReturnType<MediaPipeFaceLandmarkerLike['detect']>;
    try {
      rawResult = this.landmarker.detect(source);
    } catch {
      // Runtime GPU inference failure (e.g. WebGL driver rejection on first frame) -> switch to CPU
      if (this.activeDelegate === 'GPU') {
        this.dispose();
        delegate = await this.initialize({
          runningMode: 'IMAGE',
          forceDelegate: 'CPU',
        });
        fellBackToCpuDuringDetect = true;
        if (!this.landmarker) {
          throw new Error('CPU Face Landmarker fallback failed to initialize.');
        }
        rawResult = this.landmarker.detect(source);
      } else {
        throw new Error('Facial landmark inference failed on this image.');
      }
    }

    const extraction = extractFacialFeatures({
      allFaceLandmarks: rawResult.faceLandmarks ?? [],
      allBlendshapes: (rawResult.faceBlendshapes ?? []).map(
        (b) => b.categories ?? []
      ),
      allTransformationMatrices: rawResult.facialTransformationMatrixes ?? [],
    });

    return {
      extraction,
      delegate,
      fellBackToCpuDuringDetect,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.initPromise = null;
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignore close errors
      }
      this.landmarker = null;
    }
    this.activeDelegate = null;
  }
}
