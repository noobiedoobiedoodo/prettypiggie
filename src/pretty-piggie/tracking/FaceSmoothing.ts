/**
 * Allocation-free velocity-adaptive temporal smoother for facial pose & blendshapes.
 * Operates strictly on pre-allocated Float32Arrays — zero React state updates per frame.
 */
export class FaceTemporalSmoother {
  private readonly values: Float32Array;
  private initialized = false;
  private lastSeenTimestampMs = 0;
  private readonly minAlpha: number;
  private readonly maxAlpha: number;
  private readonly velocityScale: number;
  private readonly faceLossTimeoutMs: number;

  constructor(
    channelCount: number,
    options: {
      minAlpha?: number;
      maxAlpha?: number;
      velocityScale?: number;
      faceLossTimeoutMs?: number;
    } = {}
  ) {
    this.values = new Float32Array(channelCount);
    this.minAlpha = options.minAlpha ?? 0.18;
    this.maxAlpha = options.maxAlpha ?? 0.72;
    this.velocityScale = options.velocityScale ?? 6.5;
    this.faceLossTimeoutMs = options.faceLossTimeoutMs ?? 450;
  }

  update(
    incoming: ArrayLike<number>,
    confidence: number,
    timestampMs: number,
    minConfidence = 0.45
  ): { values: Float32Array; faceLost: boolean; reacquired: boolean } {
    if (confidence < minConfidence) {
      const faceLost =
        this.initialized &&
        timestampMs - this.lastSeenTimestampMs > this.faceLossTimeoutMs;
      return { values: this.values, faceLost, reacquired: false };
    }

    const wasLost =
      this.initialized &&
      timestampMs - this.lastSeenTimestampMs > this.faceLossTimeoutMs;
    this.lastSeenTimestampMs = timestampMs;

    const len = Math.min(this.values.length, incoming.length);
    if (!this.initialized) {
      for (let i = 0; i < len; i += 1) {
        const v = incoming[i];
        this.values[i] = Number.isFinite(v) ? v : 0;
      }
      this.initialized = true;
      return { values: this.values, faceLost: false, reacquired: false };
    }

    for (let i = 0; i < len; i += 1) {
      const target = incoming[i];
      if (!Number.isFinite(target)) continue;
      const current = this.values[i];
      const delta = Math.abs(target - current);
      // Prediction-resistant adaptive alpha: steady when still, responsive on fast motion
      const alpha = Math.min(
        this.maxAlpha,
        this.minAlpha + delta * this.velocityScale
      );
      this.values[i] = current + (target - current) * alpha;
    }

    return { values: this.values, faceLost: false, reacquired: wasLost };
  }

  reset(): void {
    this.values.fill(0);
    this.initialized = false;
    this.lastSeenTimestampMs = 0;
  }
}
