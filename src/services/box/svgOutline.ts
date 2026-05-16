/**
 * 雷雕級 SVG outline 產生器。
 *
 * 與 services/labelHtml.ts 的差異：
 *   - labelHtml.ts：印紙標籤（HTML/CSS）— 給 expo-print，依賴系統字型
 *   - svgOutline.ts：雷雕外框（純 path）— 給 LightBurn / Illustrator / 雷雕機，
 *                    字型必須 outline 化（不能在工廠端裝字型）、QR 也必須是 path
 *
 * 設計準則：
 *   - 字型用 Noto Sans TC weight 900（與 labelHtml 對齊「同字、同 emoji、同色」）
 *   - 線寬 0.5pt = 約 0.18 mm（雷雕機標準切割線寬）
 *   - viewBox 對齊雷雕區實體尺寸（cm）— 一個單位 = 1 mm，避免縮放後 hairline 失準
 *   - QR Code 必須是 path（不是 rect / square），方便雷雕機處理為連續切割
 */

import opentype from 'opentype.js';
// qrcode-svg 沒有官方 d.ts，inline 宣告 minimal 介面
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCodeSvg = require('qrcode-svg') as new (opts: QRCodeSvgOptions) => {
  svg(): string;
};

import type { EngravingArea } from '@/types/box';
import { ENGRAVABLE_MATERIALS, type BoxMaterial } from '@/types/box';

interface QRCodeSvgOptions {
  content: string;
  padding?: number;
  width?: number;
  height?: number;
  color?: string;
  background?: string;
  ecl?: 'L' | 'M' | 'Q' | 'H';
  join?: boolean;
  container?: 'svg' | 'svg-viewbox' | 'g' | 'none';
  predefined?: boolean;
  pretty?: boolean;
  xmlDeclaration?: boolean;
}

// ---------- 配置常數 ----------

/** 雷雕機標準切割線寬（mm）— 0.5pt ≈ 0.176 mm */
export const ENGRAVING_STROKE_MM = 0.18;

/** 雷雕色（與 labelHtml 同色：深焙木 #1A1108） */
export const ENGRAVING_COLOR = '#1A1108';

/** 內邊距（mm）— 雷雕區四周留白 */
export const ENGRAVING_PADDING_MM = 2;

/** QR Code 寬高比 — 占雷雕區短邊的比例 */
export const QR_SIZE_RATIO = 0.4;

/** QR 與文字間距（mm） */
export const QR_TEXT_GAP_MM = 3;

// ---------- 字型載入 ----------

/** 載入後快取，避免重複 parse。 */
let cachedFont: opentype.Font | null = null;

/**
 * 設定字型來源（給 app 啟動時呼叫一次）。
 *
 * 為什麼這樣設計：opentype.js 需要 ArrayBuffer 形式的 .otf/.ttf。
 * 在 Node 測試環境用 fs.readFileSync 載入；在 RN 用 expo-asset / require。
 * 兩種環境的載入策略不一樣，但 SVG 產生邏輯一致，所以把字型 inject 出來。
 */
export function setEngravingFont(buffer: ArrayBuffer | Uint8Array): void {
  const ab =
    buffer instanceof ArrayBuffer
      ? buffer
      : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  cachedFont = opentype.parse(ab);
}

/** 清掉快取的字型 — 測試 between cases 用。 */
export function _resetEngravingFontCache(): void {
  cachedFont = null;
}

/** 取得當前字型；未設定則拋錯。 */
function requireFont(): opentype.Font {
  if (!cachedFont) {
    throw new Error(
      'svgOutline: 未設定雷雕字型。請先呼叫 setEngravingFont(buffer) 載入 NotoSansTC-Black.ttf。',
    );
  }
  return cachedFont;
}

// ---------- 字型 → path（含 fit-to-area）----------

/**
 * 把文字轉成 SVG path。
 *
 * 演算法：
 *   1. 試以 maxFontSize 算 path 寬度
 *   2. 若寬度超過 maxWidthMm，等比例縮小字級
 *   3. 用最後字級重新算 path，回傳 path data + bbox
 *
 * 對中文字：x advance 在變動字重下也準，opentype.js 走 hmtx 表。
 */
function textToFittedPath(
  text: string,
  maxWidthMm: number,
  maxHeightMm: number,
  /** 起始字級（mm）— 通常從區域高度開始 */
  maxFontSizeMm: number,
): { d: string; widthMm: number; heightMm: number; fontSizeMm: number } {
  const font = requireFont();

  // opentype.js 內部單位用 font unit；getPath 的 fontSize 跟 viewBox 同單位即可
  // variation: weight 900 — 變動字型必須這樣指定 weight 才會生效；
  // opentype.js 的型別檔沒涵蓋 variation key，這裡用 cast 繞過。
  const renderOpts = { variation: { wght: 900 } } as unknown as opentype.RenderOptions;
  let fontSize = maxFontSizeMm;
  let advance = font.getAdvanceWidth(text, fontSize, renderOpts);

  // 寬度 fit
  if (advance > maxWidthMm) {
    fontSize = fontSize * (maxWidthMm / advance);
    advance = font.getAdvanceWidth(text, fontSize, renderOpts);
  }

  // 高度 fit — 用 ascender + descender 比例
  const unitsPerEm = font.unitsPerEm;
  const ascender = font.ascender;
  const descender = font.descender; // 負數
  const totalUnits = ascender - descender;
  const heightAtSize = (totalUnits / unitsPerEm) * fontSize;
  if (heightAtSize > maxHeightMm) {
    fontSize = fontSize * (maxHeightMm / heightAtSize);
  }

  // 重算最終 path
  // y 位置：baseline 落在 area 的「上邊 + ascender 比例」處
  const baselineY = (ascender / unitsPerEm) * fontSize;
  const path = font.getPath(text, 0, baselineY, fontSize, renderOpts);

  const bbox = path.getBoundingBox();
  const widthMm = bbox.x2 - bbox.x1;
  const heightMm = bbox.y2 - bbox.y1;
  const d = path.toPathData(3);

  return { d, widthMm, heightMm, fontSizeMm: fontSize };
}

// ---------- QR Code → path ----------

/**
 * 產生 QR Code 的 path data（pure path，非 rect）。
 *
 * qrcode-svg 的 `join: true` 模式會把所有 module 合併成單一 path，
 * 雷雕機處理連續路徑比一堆 rect 順暢。
 */
function qrToPath(payload: string, sizeMm: number): { d: string; sizeMm: number } {
  const qr = new QRCodeSvg({
    content: payload,
    padding: 0,
    width: sizeMm,
    height: sizeMm,
    color: ENGRAVING_COLOR,
    background: '#ffffff',
    ecl: 'M',
    join: true, // 合併成單一 path
    container: 'none', // 不要包 <svg> 外層
    pretty: false,
    xmlDeclaration: false,
  });
  const svgFragment = qr.svg();

  // qrcode-svg 在 container=none 時會輸出 `<path d="..." ... />`，
  // 抽出 d 屬性以便我們重新組裝
  const match = svgFragment.match(/<path\s+[^>]*d="([^"]+)"/);
  if (!match || !match[1]) {
    throw new Error(`svgOutline: 無法解析 qrcode-svg 輸出：${svgFragment.slice(0, 120)}`);
  }
  return { d: match[1], sizeMm };
}

// ---------- 公開 API ----------

export type SvgOutlineInput = {
  /** 雷雕文字 */
  text: string;
  /** QR Code payload（通常是 deep link） */
  qrPayload: string;
  /** 雷雕區尺寸（cm） */
  engravingArea: EngravingArea;
  /** 材質 — 若不可雷雕會回傳警告，但依然產 SVG */
  material?: BoxMaterial;
};

export type SvgOutlineResult = {
  /** 完整的 SVG XML 字串 — 可直接寫 .svg 檔給雷雕機 */
  svg: string;
  /** viewBox 寬高（mm） */
  widthMm: number;
  heightMm: number;
  /** 字型用的字級（mm）— debug / UI 預覽 */
  fontSizeMm: number;
  /** 警告訊息（如材質不可雷雕） */
  warnings: string[];
};

/**
 * 給定文字 + QR + 雷雕區 → 產生雷雕級 SVG。
 *
 * 注意：
 *   - 呼叫前必須先 setEngravingFont(buffer) 載入字型
 *   - SVG 的 viewBox 單位是 mm（1 unit = 1 mm），給雷雕機解析更直觀
 *   - 文字與 QR 並排：QR 在右、文字在左；若無 QR payload 則文字置中
 */
export function buildEngravingSvg(input: SvgOutlineInput): SvgOutlineResult {
  const { text, qrPayload, engravingArea, material } = input;

  const warnings: string[] = [];
  if (material && !ENGRAVABLE_MATERIALS.has(material)) {
    warnings.push(`材質 ${material} 不支援雷雕；輸出之 SVG 僅作預覽用。`);
  }

  // cm → mm
  const widthMm = engravingArea.widthCm * 10;
  const heightMm = engravingArea.heightCm * 10;

  const innerW = widthMm - ENGRAVING_PADDING_MM * 2;
  const innerH = heightMm - ENGRAVING_PADDING_MM * 2;

  const hasQr = qrPayload.trim().length > 0;
  const qrSizeMm = hasQr ? Math.min(innerH, innerW) * QR_SIZE_RATIO : 0;
  const textAreaW = hasQr ? innerW - qrSizeMm - QR_TEXT_GAP_MM : innerW;
  const textAreaH = innerH;

  // 文字 path
  const textFit = textToFittedPath(text, textAreaW, textAreaH, textAreaH);

  // 文字置中於 textArea
  const textOffsetX = ENGRAVING_PADDING_MM + (textAreaW - textFit.widthMm) / 2;
  const textOffsetY = ENGRAVING_PADDING_MM + (textAreaH - textFit.heightMm) / 2;

  // QR 置於右側（並對齊文字垂直中線）
  let qrPath = '';
  let qrOffsetX = 0;
  let qrOffsetY = 0;
  if (hasQr) {
    const qr = qrToPath(qrPayload, qrSizeMm);
    qrPath = qr.d;
    qrOffsetX = ENGRAVING_PADDING_MM + textAreaW + QR_TEXT_GAP_MM;
    qrOffsetY = ENGRAVING_PADDING_MM + (innerH - qrSizeMm) / 2;
  }

  // 組合 SVG — viewBox 單位 mm（1 = 1 mm）
  const stroke = ENGRAVING_STROKE_MM;
  const color = ENGRAVING_COLOR;
  const svgParts: string[] = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm} ${heightMm}" width="${widthMm}mm" height="${heightMm}mm">`,
  );
  // bbox 預覽框（雷雕機通常忽略 stroke-only frame，但給設計師對齊用）
  svgParts.push(
    `<rect x="0" y="0" width="${widthMm}" height="${heightMm}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="1 1" />`,
  );
  // 文字 group
  svgParts.push(
    `<g transform="translate(${textOffsetX.toFixed(3)} ${textOffsetY.toFixed(3)})">` +
      `<path d="${textFit.d}" fill="${color}" stroke="${color}" stroke-width="${stroke}" />` +
      `</g>`,
  );
  // QR group
  if (hasQr) {
    svgParts.push(
      `<g transform="translate(${qrOffsetX.toFixed(3)} ${qrOffsetY.toFixed(3)})">` +
        `<path d="${qrPath}" fill="${color}" stroke="none" />` +
        `</g>`,
    );
  }
  svgParts.push('</svg>');

  return {
    svg: svgParts.join(''),
    widthMm,
    heightMm,
    fontSizeMm: textFit.fontSizeMm,
    warnings,
  };
}
