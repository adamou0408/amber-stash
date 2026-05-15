import QRCode from 'qrcode';
import type { Space } from '@/types';
import { SPACE_EMOJI } from '@/types';

export type LabelSize = 'small' | 'medium' | 'large';

export type LabelSizeSpec = {
  id: LabelSize;
  label: string;
  widthMm: number;
  heightMm: number;
  nameFontPx: number;
  emojiFontPx: number;
  subFontPx: number;
  qrSizeMm: number;
};

export const LABEL_SIZES: LabelSizeSpec[] = [
  {
    id: 'small',
    label: '小 · 物品 4×3 cm',
    widthMm: 40,
    heightMm: 30,
    nameFontPx: 18,
    emojiFontPx: 16,
    subFontPx: 8,
    qrSizeMm: 14,
  },
  {
    id: 'medium',
    label: '中 · 抽屜 7×5 cm',
    widthMm: 70,
    heightMm: 50,
    nameFontPx: 30,
    emojiFontPx: 28,
    subFontPx: 11,
    qrSizeMm: 22,
  },
  {
    id: 'large',
    label: '大 · 收納盒 10×7 cm',
    widthMm: 100,
    heightMm: 70,
    nameFontPx: 46,
    emojiFontPx: 40,
    subFontPx: 13,
    qrSizeMm: 32,
  },
];

export type LabelOptions = {
  size: LabelSize;
  showEmoji: boolean;
  showQr: boolean;
  showSubtitle: boolean;
};

async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#1A1108', light: '#FFFFFF00' },
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function deepLinkFor(space: Space): string {
  return `amberstash://space/${space.id}`;
}

function subtitleFor(space: Space): string {
  if (space.widthCm && space.heightCm && space.depthCm) {
    return `${space.widthCm} × ${space.heightCm} × ${space.depthCm} cm`;
  }
  return '';
}

async function renderOne(space: Space, opts: LabelOptions, spec: LabelSizeSpec): Promise<string> {
  const qr = opts.showQr ? await qrSvg(deepLinkFor(space)) : '';
  const emoji = opts.showEmoji ? SPACE_EMOJI[space.kind] : '';
  const subtitle = opts.showSubtitle ? subtitleFor(space) : '';
  return `
  <div class="label">
    <div class="head">
      ${emoji ? `<div class="emoji">${emoji}</div>` : ''}
      <div class="name">${escapeHtml(space.name)}</div>
    </div>
    ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}
    ${qr ? `<div class="qr">${qr}</div>` : ''}
  </div>`;
}

export async function buildLabelHtml(spaces: Space[], opts: LabelOptions): Promise<string> {
  const spec = LABEL_SIZES.find((s) => s.id === opts.size) ?? LABEL_SIZES[1];
  const cards = await Promise.all(spaces.map((s) => renderOne(s, opts, spec)));

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>Amber Stash 標籤</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&display=swap" rel="stylesheet" />
<style>
  @page { margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Noto Sans TC', 'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', system-ui, sans-serif;
    color: #1A1108;
    background: #FFFFFF;
  }
  .sheet {
    display: flex;
    flex-wrap: wrap;
    gap: 4mm;
    padding: 4mm;
  }
  .label {
    width: ${spec.widthMm}mm;
    height: ${spec.heightMm}mm;
    border: 1.4px solid #1A1108;
    border-radius: 3mm;
    padding: 3mm 3.5mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
    background: #FFFFFF;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 2.5mm;
    min-width: 0;
  }
  .emoji {
    font-size: ${spec.emojiFontPx}px;
    line-height: 1;
    flex-shrink: 0;
  }
  .name {
    font-weight: 900;
    font-size: ${spec.nameFontPx}px;
    line-height: 1.05;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }
  .sub {
    font-weight: 500;
    font-size: ${spec.subFontPx}px;
    color: #4B3A22;
    letter-spacing: 0.04em;
  }
  .qr {
    align-self: flex-end;
    width: ${spec.qrSizeMm}mm;
    height: ${spec.qrSizeMm}mm;
  }
  .qr svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
  <div class="sheet">
    ${cards.join('\n')}
  </div>
</body>
</html>`;
}
