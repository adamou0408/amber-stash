import fs from 'fs';
import path from 'path';
import {
  buildEngravingSvg,
  setEngravingFont,
  _resetEngravingFontCache,
  ENGRAVING_COLOR,
  ENGRAVING_STROKE_MM,
} from '../svgOutline';

// 載入字型 — 測試 / dev 走 fs；RN 端走 require .ttf as ArrayBuffer
function loadFontBuffer(): ArrayBuffer {
  const fp = path.join(__dirname, '..', 'fonts', 'NotoSansTC-Black.ttf');
  const buf = fs.readFileSync(fp);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

beforeAll(() => {
  setEngravingFont(loadFontBuffer());
});

afterAll(() => {
  _resetEngravingFontCache();
});

describe('svgOutline — 基本產出', () => {
  test('產生 well-formed SVG（有 <svg> 與 </svg> 標籤）', () => {
    const r = buildEngravingSvg({
      text: '主臥衣櫃',
      qrPayload: 'amberstash://space/sp-001',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
    });
    expect(r.svg.startsWith('<svg')).toBe(true);
    expect(r.svg.endsWith('</svg>')).toBe(true);
    expect(r.svg).toContain('viewBox="0 0 80 40"');
    expect(r.svg).toContain('width="80mm"');
    expect(r.svg).toContain('height="40mm"');
  });

  test('SVG 包含至少 2 個 <path> 元素（文字 + QR）', () => {
    const r = buildEngravingSvg({
      text: '冬衣',
      qrPayload: 'amberstash://space/sp-002',
      engravingArea: { widthCm: 10, heightCm: 5, surface: 'lid' },
    });
    const pathCount = (r.svg.match(/<path /g) ?? []).length;
    expect(pathCount).toBeGreaterThanOrEqual(2);
  });

  test('SVG 包含雷雕標準色與線寬', () => {
    const r = buildEngravingSvg({
      text: '文具',
      qrPayload: 'amberstash://space/x',
      engravingArea: { widthCm: 6, heightCm: 3, surface: 'front' },
    });
    expect(r.svg).toContain(ENGRAVING_COLOR);
    expect(r.svg).toContain(`stroke-width="${ENGRAVING_STROKE_MM}"`);
  });

  test('回傳的 widthMm / heightMm 對應 engravingArea (cm × 10)', () => {
    const r = buildEngravingSvg({
      text: '書籍',
      qrPayload: '',
      engravingArea: { widthCm: 12, heightCm: 6, surface: 'lid' },
    });
    expect(r.widthMm).toBe(120);
    expect(r.heightMm).toBe(60);
  });

  test('fontSizeMm > 0 且 ≤ engravingArea 高度（mm）', () => {
    const r = buildEngravingSvg({
      text: '冬衣',
      qrPayload: '',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
    });
    expect(r.fontSizeMm).toBeGreaterThan(0);
    expect(r.fontSizeMm).toBeLessThanOrEqual(40);
  });
});

describe('svgOutline — 無 QR payload', () => {
  test('沒給 QR payload 時只產文字 path，無 QR group', () => {
    const r = buildEngravingSvg({
      text: '主臥',
      qrPayload: '',
      engravingArea: { widthCm: 6, heightCm: 3, surface: 'front' },
    });
    const pathCount = (r.svg.match(/<path /g) ?? []).length;
    // 文字 path × 1
    expect(pathCount).toBeGreaterThanOrEqual(1);
    expect(pathCount).toBeLessThanOrEqual(1);
  });
});

describe('svgOutline — 字 path 在預期座標範圍', () => {
  test('文字 group 的 translate Y 落在 [0, area height) 內', () => {
    const r = buildEngravingSvg({
      text: '主臥衣櫃',
      qrPayload: 'amberstash://space/test',
      engravingArea: { widthCm: 10, heightCm: 5, surface: 'lid' },
    });
    // SVG group 的 transform="translate(x y)"
    const match = r.svg.match(/<g transform="translate\(([\d.]+) ([\d.]+)\)">\s*<path d="M/);
    expect(match).not.toBeNull();
    if (!match) return;
    const tx = parseFloat(match[1] ?? '0');
    const ty = parseFloat(match[2] ?? '0');
    expect(tx).toBeGreaterThanOrEqual(0);
    expect(tx).toBeLessThan(100); // widthMm = 100
    expect(ty).toBeGreaterThanOrEqual(0);
    expect(ty).toBeLessThan(50); // heightMm = 50
  });

  test('文字 path 的 d 屬性以 M 開頭（合法 SVG path）', () => {
    const r = buildEngravingSvg({
      text: '冬衣',
      qrPayload: '',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
    });
    const match = r.svg.match(/<path d="(M[^"]+)"/);
    expect(match).not.toBeNull();
  });
});

describe('svgOutline — QR Code 是 path 而非 rect', () => {
  test('SVG 內沒有 <rect ...> 形式的 QR module（除了 dashed border 預覽框）', () => {
    const r = buildEngravingSvg({
      text: '冬衣',
      qrPayload: 'amberstash://space/test',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
    });
    // 只允許一個 dashed 預覽框 rect
    const rectMatches = r.svg.match(/<rect /g) ?? [];
    expect(rectMatches.length).toBeLessThanOrEqual(1);
  });
});

describe('svgOutline — 材質警告', () => {
  test('牛皮紙材質會回傳警告', () => {
    const r = buildEngravingSvg({
      text: '玩具',
      qrPayload: 'amberstash://space/test',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
      material: 'kraft_paper',
    });
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    expect(r.warnings[0]).toContain('kraft_paper');
  });

  test('木質材質無警告', () => {
    const r = buildEngravingSvg({
      text: '冬衣',
      qrPayload: 'amberstash://space/test',
      engravingArea: { widthCm: 8, heightCm: 4, surface: 'lid' },
      material: 'wood_walnut',
    });
    expect(r.warnings.length).toBe(0);
  });
});

describe('svgOutline — 字型未載入時拋錯', () => {
  test('reset cache 後呼叫會拋 Error', () => {
    _resetEngravingFontCache();
    expect(() =>
      buildEngravingSvg({
        text: '冬衣',
        qrPayload: '',
        engravingArea: { widthCm: 6, heightCm: 3, surface: 'front' },
      }),
    ).toThrow(/未設定雷雕字型/);
    // 把字型載回來，避免後續測試受影響
    setEngravingFont(loadFontBuffer());
  });
});
