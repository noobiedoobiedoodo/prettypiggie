import {
  EXPORT_FORMAT_SPECS,
  MAKEOVER_CAMPAIGN,
  MakeoverExportFormat,
  MakeoverPersonality,
} from '@/lib/makeoverStyles';

export interface ComposedBrandedImage {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draw image with aspect-fill cover crop biased slightly upward (0.35)
 * so ears, crowns, hair, and eyes stay centered and unobstructed.
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  verticalBias = 0.35
) {
  const srcRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const dstRatio = dw / Math.max(1, dh);

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / dstRatio;
    sy = (img.naturalHeight - sh) * verticalBias;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Downscales large mobile camera photos client-side into a crisp <=1280px JPEG
 * while stripping EXIF metadata and staying safely under the 6 MB server cap.
 */
export async function prepareSelfieForUpload(
  file: File
): Promise<{ blob: Blob; previewUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const maxEdge = 1280;
    const scale = Math.min(
      1,
      maxEdge / Math.max(img.naturalWidth, img.naturalHeight, 1)
    );
    const targetW = Math.max(256, Math.round(img.naturalWidth * scale));
    const targetH = Math.max(256, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG'))),
        'image/jpeg',
        0.9
      );
    });

    const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { blob, previewUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Pure client-side HD Branded Social Frame Compositor.
 * Generates 9:16 Vertical (1080x1920), 1:1 Square (1080x1080), or 4:5 Portrait (1200x1500).
 * Keeps the Pretty Piggie character large and prominent — branding frames the image cleanly.
 */
export async function composePrettyPiggieOutput(params: {
  imageSrc: string;
  personality: MakeoverPersonality;
  format: MakeoverExportFormat;
  includeFrame: boolean;
  isPreviewDemo?: boolean;
}): Promise<ComposedBrandedImage> {
  const spec = EXPORT_FORMAT_SPECS[params.format];
  const { width, height } = spec;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to initialize canvas compositor.');

  const characterImg = await loadImageElement(params.imageSrc);

  if (!params.includeFrame) {
    drawImageCover(ctx, characterImg, 0, 0, width, height, 0.35);
  } else {
    // 1. Luxury Pretty Piggie Blush-Pink & Rose-Gold Studio Backdrop Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#FFF8FA');
    bgGrad.addColorStop(0.45, '#FCEBF0');
    bgGrad.addColorStop(1, '#F7C6D4');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle rose-gold outer editorial hairline border
    const outerInset = Math.round(width * 0.028);
    ctx.strokeStyle = 'rgba(211, 139, 120, 0.55)';
    ctx.lineWidth = Math.max(2, Math.round(width * 0.003));
    drawRoundedRectPath(
      ctx,
      outerInset,
      outerInset,
      width - outerInset * 2,
      height - outerInset * 2,
      Math.round(width * 0.04)
    );
    ctx.stroke();

    // Proportional frame bands so the character takes ~72-78% of visual focus and is NEVER covered
    const isTall = params.format === 'story-9-16';
    const isSquare = params.format === 'square-1-1';
    const sidePad = Math.round(width * (isSquare ? 0.075 : 0.065));
    const topBandH = Math.round(
      height * (isTall ? 0.135 : isSquare ? 0.135 : 0.13)
    );
    const bottomBandH = Math.round(
      height * (isTall ? 0.165 : isSquare ? 0.155 : 0.155)
    );
    const photoX = sidePad;
    const photoY = topBandH;
    const photoW = width - sidePad * 2;
    const photoH = height - topBandH - bottomBandH;
    const cornerR = Math.round(width * 0.048);

    // 2. Top Branded Header Band (Official Logo Medallion + Personality Pill)
    try {
      const logoImg = await loadImageElement('/brand/prettypiggie-logo.png');
      const logoSize = Math.round(topBandH * 0.56);
      const logoX = sidePad;
      const logoY = Math.round((topBandH - logoSize) / 2) + Math.round(outerInset * 0.25);

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        logoX + logoSize / 2,
        logoY + logoSize / 2,
        logoSize / 2 + 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#E5A999';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(logoImg, logoX + 4, logoY + 4, logoSize - 8, logoSize - 8);
      ctx.restore();

      const textX = logoX + logoSize + Math.round(width * 0.022);
      ctx.fillStyle = '#260B15';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(width * 0.036)}px Georgia, "Bodoni MT", serif`;
      ctx.fillText('Pretty Piggie', textX, logoY + logoSize * 0.36);

      ctx.fillStyle = '#A6335A';
      ctx.font = `700 ${Math.round(width * 0.017)}px "Avenir Next", "Segoe UI", sans-serif`;
      ctx.fillText('MAKEOVER STUDIO', textX, logoY + logoSize * 0.72);
    } catch {
      // Fallback typography header if logo fails
      ctx.fillStyle = '#260B15';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(width * 0.04)}px Georgia, serif`;
      ctx.fillText('Pretty Piggie', sidePad, topBandH * 0.54);
    }

    // Personality Style Pill (Top-Right)
    const pillLabel = params.personality.name.toUpperCase();
    ctx.font = `700 ${Math.round(width * 0.02)}px "Avenir Next", "Segoe UI", sans-serif`;
    const pillTextW = ctx.measureText(pillLabel).width;
    const pillH = Math.round(width * 0.058);
    const pillW = Math.round(pillTextW + width * 0.068);
    const pillX = width - sidePad - pillW;
    const pillY = Math.round((topBandH - pillH) / 2) + Math.round(outerInset * 0.25);

    ctx.fillStyle = '#260B15';
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();

    // Accent dot inside pill
    ctx.beginPath();
    ctx.arc(
      pillX + pillH * 0.44,
      pillY + pillH / 2,
      Math.round(width * 0.008),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = params.personality.accentHex;
    ctx.fill();

    ctx.fillStyle = '#FFF8FA';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(pillLabel, pillX + pillH * 0.72, pillY + pillH / 2 + 1);

    // 3. Prominent Unobstructed Pretty Piggie Character Aperture
    ctx.save();
    ctx.shadowColor = 'rgba(74, 24, 41, 0.22)';
    ctx.shadowBlur = Math.round(width * 0.036);
    ctx.shadowOffsetY = Math.round(width * 0.014);
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, cornerR);
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, cornerR);
    ctx.clip();
    drawImageCover(ctx, characterImg, photoX, photoY, photoW, photoH, 0.35);
    ctx.restore();

    // Rose-gold frame ring around character portrait
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(4, Math.round(width * 0.007));
    drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, cornerR);
    ctx.stroke();

    // Honest Preview Label ONLY when rendering the Master Reference Demo
    if (params.isPreviewDemo) {
      const demoText = 'STUDIO REFERENCE PREVIEW';
      ctx.font = `700 ${Math.round(width * 0.017)}px "Avenir Next", "Segoe UI", sans-serif`;
      const dw = ctx.measureText(demoText).width + Math.round(width * 0.05);
      const dh = Math.round(width * 0.044);
      const dx = photoX + Math.round((photoW - dw) / 2);
      const dy = photoY + photoH - dh - Math.round(width * 0.025);
      ctx.fillStyle = 'rgba(38, 11, 21, 0.82)';
      drawRoundedRectPath(ctx, dx, dy, dw, dh, dh / 2);
      ctx.fill();
      ctx.fillStyle = '#F8E3D8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(demoText, dx + dw / 2, dy + dh / 2 + 1);
    }

    // 4. Bottom Campaign Footer Band ("What's Your Pretty Piggie?" + #MyPrettyPiggie + PrettyPiggie.com)
    const footerTop = photoY + photoH;
    const footerCenterY = footerTop + bottomBandH * 0.5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#260B15';
    ctx.font = `700 ${Math.round(width * (isTall ? 0.048 : 0.042))}px Georgia, "Bodoni MT", serif`;
    ctx.fillText(
      MAKEOVER_CAMPAIGN.headline,
      width / 2,
      footerCenterY - bottomBandH * 0.17
    );

    // Hashtag + URL Pill Row
    const subText = `${MAKEOVER_CAMPAIGN.hashtag}  •  ${MAKEOVER_CAMPAIGN.domain}`;
    ctx.font = `700 ${Math.round(width * (isTall ? 0.026 : 0.023))}px "Avenir Next", "Segoe UI", sans-serif`;
    const subW = ctx.measureText(subText).width + Math.round(width * 0.08);
    const subH = Math.round(width * (isTall ? 0.064 : 0.056));
    const subX = Math.round((width - subW) / 2);
    const subY = Math.round(footerCenterY + bottomBandH * 0.08);

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRectPath(ctx, subX, subY, subW, subH, subH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 70, 115, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#A6335A';
    ctx.fillText(subText, width / 2, subY + subH / 2 + 1);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to render PNG'))),
      'image/png'
    );
  });

  const dataUrl = canvas.toDataURL('image/png');
  const suffix = params.includeFrame ? 'framed' : 'clean';
  const fileName = `pretty-piggie-${params.personality.id}-${params.format}-${suffix}.png`;

  return { blob, dataUrl, fileName, width, height };
}
