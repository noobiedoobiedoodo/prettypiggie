import * as THREE from 'three';
import { MakeupCollectionPreset } from './MakeupPresets';
import { SkinTonePreset } from '../character/CharacterParameters';

/**
 * Generates and updates an in-place procedural 512x512 skin + blush + shimmer/glitter
 * CanvasTexture so switching makeup collections takes < 4ms with zero GPU leaks.
 */
export class ProceduralMakeupSurface {
  private canvas: HTMLCanvasElement | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private lastSignature = '';

  getOrUpdateTexture(
    skin: SkinTonePreset,
    preset: MakeupCollectionPreset
  ): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;

    const sig = `${skin.id}::${preset.id}`;
    if (this.texture && this.lastSignature === sig) {
      return this.texture;
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 512;
      this.canvas.height = 512;
    }
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Base complexion fill
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = skin.skinHex;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Soft forehead & chin tonal warmth
    const centerGlow = ctx.createRadialGradient(256, 235, 20, 256, 256, 220);
    centerGlow.addColorStop(0, 'rgba(255, 248, 250, 0.16)');
    centerGlow.addColorStop(1, 'rgba(166, 51, 90, 0.04)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, 512, 512);

    // 3. Sculpted Dual Cheek Blush (UV mapped across front hemisphere of head sphere)
    // On Three.js SphereGeometry, front center Z+ maps around u=0.25 or u=0.5 depending on Y rotation;
    // we orient the head sphere with rotation.y = -Math.PI / 2 so u = 0.5, v = 0.5 is dead-center front!
    const cheekY = preset.blushHighDrape ? 248 : 268;
    const cheekOffsetX = preset.blushHighDrape ? 64 : 56;
    const cheekRadius = preset.blushHighDrape ? 54 : 48;

    for (const side of [-1, 1]) {
      const cx = 256 + side * cheekOffsetX;
      const grad = ctx.createRadialGradient(cx, cheekY, 4, cx, cheekY, cheekRadius);
      grad.addColorStop(0, this.hexWithAlpha(preset.blushHex, preset.blushOpacity));
      grad.addColorStop(
        0.55,
        this.hexWithAlpha(preset.blushHex, preset.blushOpacity * 0.45)
      );
      grad.addColorStop(1, this.hexWithAlpha(preset.blushHex, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cheekY, cheekRadius, 0, Math.PI * 2);
      ctx.fill();

      // Cheekbone highlighter sheen
      const hx = cx + side * 8;
      const hy = cheekY - 18;
      const hGrad = ctx.createRadialGradient(hx, hy, 2, hx, hy, 26);
      hGrad.addColorStop(
        0,
        this.hexWithAlpha(preset.highlighterHex, preset.highlighterIntensity * 0.5)
      );
      hGrad.addColorStop(1, this.hexWithAlpha(preset.highlighterHex, 0));
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Deterministic micro-sparkle stardust on cheekbones & temples when glitter > 0.2
    if (preset.glitterIntensity > 0.2) {
      const count = Math.round(preset.glitterIntensity * 46);
      for (let i = 0; i < count; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const seed = (i * 73 + 19) % 97;
        const gx = 256 + side * (38 + (seed % 42));
        const gy = 222 + ((seed * 3) % 44);
        const r = 1.0 + (seed % 3) * 0.55;
        ctx.fillStyle =
          i % 3 === 0
            ? 'rgba(255,255,255,0.88)'
            : this.hexWithAlpha(preset.eyeshadowShimmerHex, 0.8);
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!this.texture) {
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
    }
    this.texture.needsUpdate = true;
    this.lastSignature = sig;
    return this.texture;
  }

  private hexWithAlpha(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) || 240;
    const g = parseInt(clean.slice(2, 4), 16) || 140;
    const b = parseInt(clean.slice(4, 6), 16) || 170;
    const a = Math.max(0, Math.min(1, alpha));
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }

  dispose(): void {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
    }
    this.lastSignature = '';
  }
}
