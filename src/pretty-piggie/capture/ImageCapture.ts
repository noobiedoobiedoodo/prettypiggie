import { CharacterParameters } from '../character/CharacterParameters';
import { getMakeupPreset } from '../makeup/MakeupPresets';

export type PiggieSocialFormat = '9:16' | '1:1';

export interface ExportedPiggieCreation {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
  format: PiggieSocialFormat;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image for export'));
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const srcRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const dstRatio = dw / Math.max(1, dh);
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio;
    sx = (img.naturalWidth - sw) * 0.5;
  } else {
    sh = img.naturalWidth / dstRatio;
    sy = (img.naturalHeight - sh) * 0.42;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Generates high-resolution branded social PNGs in Portrait 9:16 (1080x1920)
 * and Square 1:1 (1080x1080) with the mandatory viral watermark:
 *   PRETTY PIGGIE™
 *   CREATE YOURS AT PRETTYPIGGIE.COM
 */
export async function exportBrandedPiggiePng(params: {
  characterSnapshotDataUrl: string;
  characterParams: CharacterParameters;
  format: PiggieSocialFormat;
}): Promise<ExportedPiggieCreation> {
  const isPortrait = params.format === '9:16';
  const width = 1080;
  const height = isPortrait ? 1920 : 1080;
  const preset = getMakeupPreset(params.characterParams.collectionId);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Luxury Blush & Rose-Gold Studio Backdrop
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#FFF8FB');
  bg.addColorStop(0.5, preset.backdropTopHex);
  bg.addColorStop(1, preset.backdropBottomHex);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Outer rose-gold couture border
  const borderPad = 28;
  ctx.strokeStyle = 'rgba(166, 51, 90, 0.28)';
  ctx.lineWidth = 3;
  roundedRect(
    ctx,
    borderPad,
    borderPad,
    width - borderPad * 2,
    height - borderPad * 2,
    42
  );
  ctx.stroke();

  // Frame layout keeping character prominent (~74% of frame height)
  const sideMargin = isPortrait ? 68 : 74;
  const topHeaderH = isPortrait ? 210 : 138;
  const bottomFooterH = isPortrait ? 260 : 162;
  const stageX = sideMargin;
  const stageY = topHeaderH;
  const stageW = width - sideMargin * 2;
  const stageH = height - topHeaderH - bottomFooterH;

  // 2. Top Brand Crest + Collection Pill
  try {
    const logo = await loadImg('/brand/prettypiggie-logo.png');
    const logoSize = isPortrait ? 92 : 70;
    const lx = sideMargin;
    const ly = Math.round((topHeaderH - logoSize) * 0.5) + 8;

    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5A999';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(logo, lx + 4, ly + 4, logoSize - 8, logoSize - 8);
    ctx.restore();

    ctx.fillStyle = '#260B15';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${isPortrait ? 38 : 32}px Georgia, "Bodoni MT", serif`;
    ctx.fillText('PRETTY PIGGIE™', lx + logoSize + 20, ly + logoSize * 0.4);

    ctx.fillStyle = '#A6335A';
    ctx.font = `700 ${isPortrait ? 20 : 17}px "Avenir Next", "Segoe UI", sans-serif`;
    ctx.fillText('#MyPrettyPiggie', lx + logoSize + 20, ly + logoSize * 0.76);
  } catch {
    ctx.fillStyle = '#260B15';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 36px Georgia, serif';
    ctx.fillText('PRETTY PIGGIE™', sideMargin, topHeaderH * 0.55);
  }

  // Collection Name Pill (Top-Right)
  const colLabel = preset.name.toUpperCase();
  ctx.font = `700 ${isPortrait ? 22 : 19}px "Avenir Next", "Segoe UI", sans-serif`;
  const pillW = Math.round(ctx.measureText(colLabel).width + 58);
  const pillH = isPortrait ? 58 : 48;
  const pillX = width - sideMargin - pillW;
  const pillY = Math.round((topHeaderH - pillH) * 0.5) + 8;

  ctx.fillStyle = '#260B15';
  roundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = '#FFF8FA';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(colLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);

  // 3. Centered Character Portrait Frame
  const charImg = await loadImg(params.characterSnapshotDataUrl);

  ctx.save();
  ctx.shadowColor = 'rgba(74, 24, 41, 0.2)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, stageX, stageY, stageW, stageH, 46);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, stageX, stageY, stageW, stageH, 46);
  ctx.clip();
  drawCover(ctx, charImg, stageX, stageY, stageW, stageH);
  ctx.restore();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  roundedRect(ctx, stageX, stageY, stageW, stageH, 46);
  ctx.stroke();

  // 4. Mandatory Viral Watermark Footer ("PRETTY PIGGIE™" + "CREATE YOURS AT PRETTYPIGGIE.COM")
  const footerMidY = stageY + stageH + bottomFooterH * 0.5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#260B15';
  ctx.font = `700 ${isPortrait ? 44 : 34}px Georgia, "Bodoni MT", serif`;
  ctx.fillText(
    'PRETTY PIGGIE™',
    width / 2,
    footerMidY - (isPortrait ? 36 : 24)
  );

  const ctaText = 'CREATE YOURS AT PRETTYPIGGIE.COM';
  ctx.font = `800 ${isPortrait ? 24 : 20}px "Avenir Next", "Segoe UI", sans-serif`;
  const ctaW = Math.round(ctx.measureText(ctaText).width + 72);
  const ctaH = isPortrait ? 62 : 50;
  const ctaX = Math.round((width - ctaW) / 2);
  const ctaY = Math.round(footerMidY + (isPortrait ? 10 : 6));

  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 70, 115, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#A6335A';
  ctx.fillText(ctaText, width / 2, ctaY + ctaH / 2 + 1);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))),
      'image/png'
    );
  });

  const dataUrl = canvas.toDataURL('image/png');
  const ratioSlug = isPortrait ? '9x16' : '1x1';
  const fileName = `pretty-piggie-${params.characterParams.collectionId}-${ratioSlug}.png`;

  return { blob, dataUrl, fileName, width, height, format: params.format };
}
