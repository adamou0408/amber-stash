// 把 PWA 需要的 <head> tags 注入 expo export 產出的 dist/index.html。
//
// 為什麼用 postbuild 注入：本專案用 React Navigation（非 Expo Router），
// 沒有 +html.tsx 可客製 Metro web 的 index.html head。manifest.json 與 icon
// 走 public/ 由 Expo 自動複製進 dist/；這支只負責補 head 裡的 link/meta。
//
// idempotent：偵測到已注入就跳過，重複跑不會疊加。

import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const HTML = join(DIST, 'index.html');
const MARKER = 'data-pwa-injected';

const HEAD_TAGS = `
    <link rel="manifest" href="/manifest.json" ${MARKER} />
    <meta name="theme-color" content="#C8821A" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Amber Stash" />`;

async function main() {
  try {
    await access(HTML);
  } catch {
    console.error(`[inject-pwa] 找不到 ${HTML} — 請先跑 expo export --platform web`);
    process.exit(1);
  }

  let html = await readFile(HTML, 'utf8');

  if (html.includes(MARKER)) {
    console.log('[inject-pwa] head 已注入，跳過。');
    return;
  }

  if (!html.includes('</head>')) {
    console.error('[inject-pwa] index.html 沒有 </head>，無法注入。');
    process.exit(1);
  }

  html = html.replace('</head>', `${HEAD_TAGS}\n  </head>`);
  await writeFile(HTML, html, 'utf8');

  // sanity：確認 manifest 與 icon 都被 Expo 從 public/ 複製進來了
  const required = ['manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
  const missing = [];
  for (const f of required) {
    try {
      await access(join(DIST, f));
    } catch {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    console.error(`[inject-pwa] 缺少 dist 內檔案（public/ 應提供）：${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('[inject-pwa] 已注入 manifest / theme-color / apple-touch-icon。');
}

main();
