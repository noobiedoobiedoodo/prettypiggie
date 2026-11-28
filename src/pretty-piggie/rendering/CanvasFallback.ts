import {
  CharacterParameters,
  PIGGIE_EYE_COLORS,
  PIGGIE_HAIR_COLORS,
  PIGGIE_SKIN_TONES,
} from '../character/CharacterParameters';
import { computeProceduralRigMetrics } from '../character/CharacterRig';
import { getMakeupPreset } from '../makeup/MakeupPresets';

/**
 * 2D Illustrated Fallback Renderer (Mandatory Correction #14).
 * Activated automatically when WebGL is unsupported or experiences context loss.
 * Note: Intentionally styled as a clean 2D vector illustration — never represented
 * as identical in shader/lighting fidelity to the 3D WebGL renderer.
 */
export function renderPrettyPiggie2DFallback(
  canvas: HTMLCanvasElement,
  params: CharacterParameters,
  size = 720
): void {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const skin =
    PIGGIE_SKIN_TONES.find((s) => s.id === params.skinToneId) ??
    PIGGIE_SKIN_TONES[1];
  const hair =
    PIGGIE_HAIR_COLORS.find((c) => c.id === params.hairColorId) ??
    PIGGIE_HAIR_COLORS[0];
  const eye =
    PIGGIE_EYE_COLORS.find((e) => e.id === params.eyeColorId) ??
    PIGGIE_EYE_COLORS[0];
  const makeup = getMakeupPreset(params.collectionId);
  const lipShade =
    makeup.lipShades[Math.max(0, Math.min(3, params.lipShadeIndex || 0))] ??
    makeup.lipShades[0];
  const rig = computeProceduralRigMetrics(params);

  const cx = size * 0.5;
  const cy = size * 0.52;
  const r = size * 0.25;

  // 1. Studio Gradient Background
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, makeup.backdropTopHex);
  bg.addColorStop(1, makeup.backdropBottomHex);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // 2. Back Hair Silhouette
  ctx.fillStyle = hair.hex;
  if (params.hairstyleId === 'soft-waves' || params.hairstyleId === 'sleek-bob') {
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + r * 0.25,
      r * 1.24 * rig.headScaleX,
      r * (params.hairstyleId === 'soft-waves' ? 1.45 : 1.15),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else if (params.hairstyleId === 'space-buns') {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        cx + side * r * 0.72,
        cy - r * 0.96,
        r * 0.34,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (params.hairstyleId === 'high-pony') {
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.85, r * 0.52, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (params.hairstyleId === 'curly-halo') {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * r * 1.05,
        cy - r * 0.08 + Math.sin(a) * r * 1.02,
        r * 0.38,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // 3. Champagne Silk Collar & Neck
  ctx.fillStyle = skin.skinHex;
  ctx.fillRect(cx - r * 0.28, cy + r * 0.82, r * 0.56, r * 0.55);
  ctx.fillStyle = '#F5DFCF';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 1.55, r * 1.15, r * 0.55, 0, Math.PI, 0);
  ctx.fill();

  // 4. Pig Ears
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * r * 0.82 * rig.headScaleX, cy - r * 0.68);
    ctx.rotate(side * 0.52);
    ctx.fillStyle = skin.earOuterHex;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.28, r * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.earInnerHex;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.04, r * 0.17, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Sculpted Head Oval
  ctx.fillStyle = skin.skinHex;
  ctx.beginPath();
  ctx.ellipse(
    cx,
    cy,
    r * rig.headScaleX,
    r * 1.06 * rig.headScaleY,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Top Hair Fringe
  ctx.fillStyle = hair.hex;
  ctx.beginPath();
  ctx.ellipse(
    cx,
    cy - r * 0.68 * rig.headScaleY,
    r * 1.02 * rig.headScaleX,
    r * 0.48,
    0,
    Math.PI,
    0
  );
  ctx.fill();

  // 6. Cheek Blush
  for (const side of [-1, 1]) {
    const bx = cx + side * r * 0.56 * rig.headScaleX;
    const by = cy + r * 0.14;
    const bGrad = ctx.createRadialGradient(bx, by, 4, bx, by, r * 0.34);
    bGrad.addColorStop(0, makeup.blushHex + '88');
    bGrad.addColorStop(1, makeup.blushHex + '00');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Expressive Eyes, Shadow, Lashes & Brows
  const eyeSpanX = r * (0.42 + params.proportions.eyeSpacing * 0.07);
  const eyeY = cy - r * 0.14;
  const eyeR = r * 0.21 * rig.eyeScale;

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpanX;

    // Eyeshadow wash
    ctx.fillStyle = makeup.eyeshadowPrimaryHex + '99';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - eyeR * 0.25, eyeR * 1.25, eyeR * 0.95, 0, Math.PI, 0);
    ctx.fill();

    // Sclera
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR * 1.12, eyeR * 0.96, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris & Pupil
    ctx.fillStyle = eye.irisHex;
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR * 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#12070B';
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex + eyeR * 0.24, eyeY - eyeR * 0.24, eyeR * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Eyeliner & Lash strokes
    ctx.strokeStyle = makeup.linerHex;
    ctx.lineWidth = Math.max(3, size * 0.008);
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR * 1.08, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    // Eyebrow
    ctx.strokeStyle = hair.hex;
    ctx.lineWidth = Math.max(4, size * 0.011);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(
      ex,
      eyeY - eyeR * 0.95 - params.proportions.browHeight * r * 0.08,
      eyeR * 1.15,
      Math.PI * 1.18,
      Math.PI * 1.82
    );
    ctx.stroke();
  }

  // 8. Signature Pig Snout
  const snoutY = cy + r * 0.14;
  const snoutW = r * 0.24 * rig.snoutScale;
  const snoutH = r * 0.18 * rig.snoutScale;
  ctx.fillStyle = skin.snoutHex;
  ctx.beginPath();
  ctx.ellipse(cx, snoutY, snoutW, snoutH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.nostrilHex;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      cx + side * snoutW * 0.38,
      snoutY,
      snoutW * 0.16,
      snoutH * 0.28,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 9. Glossy Lips
  const mouthY = cy + r * 0.48;
  const mouthW = r * 0.28 * rig.mouthWidthScale;
  ctx.fillStyle = lipShade.hex;
  ctx.beginPath();
  ctx.ellipse(cx, mouthY, mouthW, r * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, mouthY + r * 0.03, mouthW * 0.45, r * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();

  // 10. Accessories
  if (params.accessoryId === 'royal-crown') {
    ctx.fillStyle = '#E5A999';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.38, cy - r * 0.95);
    ctx.lineTo(cx - r * 0.24, cy - r * 1.24);
    ctx.lineTo(cx - r * 0.1, cy - r * 1.04);
    ctx.lineTo(cx, cy - r * 1.34);
    ctx.lineTo(cx + r * 0.1, cy - r * 1.04);
    ctx.lineTo(cx + r * 0.24, cy - r * 1.24);
    ctx.lineTo(cx + r * 0.38, cy - r * 0.95);
    ctx.closePath();
    ctx.fill();
  } else if (params.accessoryId === 'velvet-bow') {
    ctx.fillStyle = '#E86F9A';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy - r * 1.02, r * 0.2, r * 0.12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + r * 0.2, cy - r * 1.02, r * 0.2, r * 0.12, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (params.accessoryId === 'couture-shades') {
    ctx.fillStyle = 'rgba(216, 91, 136, 0.48)';
    ctx.strokeStyle = '#260B15';
    ctx.lineWidth = Math.max(3, size * 0.008);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * eyeSpanX, eyeY, eyeR * 1.32, eyeR * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
