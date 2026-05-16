# Amber Stash

居家收納推薦 App — React Native + Expo。

把家裡的物品拍進來、設定空間，App 會給你收納建議與該補的收納用品清單。

## 核心功能

1. **物品清單與分類** — 拍照、分類、數量、備註，本機儲存
2. **空間規劃** — 衣櫃 / 抽屜 / 書桌等空間紀錄（含尺寸）
3. **AI 收納建議** — 依物品與空間自動生成（MVP 版本為規則式，之後接 LLM）
4. **購物清單 / 收納用品推薦** — 依物品量自動推薦收納盒、層架等

## 技術棧

- Expo SDK 54 / React Native 0.81
- TypeScript（strict）
- React Navigation（Bottom Tabs + Native Stack）
- AsyncStorage（先用本機儲存，未來再接 Supabase / Firebase）
- expo-camera + expo-image-picker

## 開始開發

```bash
npm install
npm run start        # 啟動 Expo dev server
npm run ios          # iOS 模擬器（macOS only）
npm run android      # Android 模擬器
npm run web          # Web 模式（部分相機 API 不適用）
npm run typecheck    # TypeScript 檢查
```

手機掃描 dev server QR Code 即可在 Expo Go 預覽（注意相機等原生模組需要 dev client 才能完整測試）。

## 專案結構

```
src/
├── components/      共用 UI 元件
├── navigation/      導覽結構（Tabs / Stack）
├── screens/         四大功能頁面
├── services/        商業邏輯（推薦演算法等）
├── storage/         AsyncStorage 封裝
├── theme/           顏色等設計 token
└── types/           共用型別

docs/
└── competitive-analysis.md   競品分析（廣度 + 深度 + 機會缺口）
```

## 後續方向

- [ ] 把 `services/suggestions.ts` 的規則式邏輯換成 Claude API
- [ ] 拍照後自動辨識物品名稱與分類（vision model）
- [ ] 加入「掃 QR / 條碼」識別商品
- [ ] 雲端同步（Supabase）與多人共享
- [ ] 換季 / 保固提醒推播

詳細市場分析與差異化策略請看 [`docs/competitive-analysis.md`](docs/competitive-analysis.md)。

---

## CI 狀態

[![CI](https://github.com/OWNER/amber-stash/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/amber-stash/actions/workflows/ci.yml)

> 把 `OWNER` 換成實際 GitHub 帳號 / 組織。CI 在 push / PR 時跑 `typecheck` + `test` + web bundle，並把 web bundle 上傳成 artifact 供下載驗證。

---

## Multi-machine setup

第一次在新機器拉專案，照這順序：

```bash
# 1. clone
git clone <repo-url> amber-stash
cd amber-stash

# 2. 安裝相依（一律加 --legacy-peer-deps；Expo SDK 54 + React 19 對 peer deps 嚴格）
npm ci --legacy-peer-deps

# 3. 環境變數（沒設也能跑，AI 會走 mock）
cp .env.example .env
# 開 .env 填入需要的 EXPO_PUBLIC_* 變數

# 4. 驗證
npm run typecheck                              # TS strict
npm test                                       # 52 unit tests
EXPO_OFFLINE=1 npx expo export --platform web  # web bundle 通過

# 5. 跑起來
npm run web        # 開瀏覽器（最快驗 UX）
npm run ios        # iOS 模擬器（macOS 需安裝 Xcode）
npm run android    # Android 模擬器（需安裝 Android Studio + AVD）
```

> 換新機器或拉新 commit 後跑不起來？先 `rm -rf node_modules && npm ci --legacy-peer-deps`，多半是 lockfile 漂移。

---

## 環境變數

完整列表攤開（對應 `.env.example`）：

| 變數 | 用途 | 預設 | 必填 |
|---|---|---|---|
| `EXPO_PUBLIC_AMBER_PROXY_URL` | 自架 AI proxy URL（生產環境建議走這個 — 隱藏 key + rate limit + 計費） | — | 否（沒設就回退） |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | 直接打 Anthropic 的 API key（dev / demo 用；`EXPO_PUBLIC_*` 會被 bundle 進 client，**不要長期放生產**） | — | 否（沒設就回退） |
| `EXPO_PUBLIC_ANTHROPIC_MODEL` | Claude 模型版本 | `claude-sonnet-4-6` | 否 |
| `EXPO_PUBLIC_FREE_MONTHLY_QUOTA` | 免費版每月 AI 配額 | `10` | 否 |

三層回退規則（`src/services/ai/recognizeItems.ts`）：

1. `aiProxyUrl` 有設 → 走 proxy
2. 否則 `anthropicApiKey` 有設 → 直接打 Anthropic
3. 都沒設 → 走 mock 假資料（dev 流程不卡關）

---

## Test 跑法

### 單元測試（Jest + ts-jest，52 tests）

```bash
npm test                          # 跑全部
npm test -- --watch               # watch 模式
npm test -- dedup                 # 只跑檔名匹配的 suite
```

涵蓋：methodology engine、dedup（IOU）、anomaly、session storage、quota、recognizeItems。

### E2E 測試（Detox，baseline 已立）

> **需要真實 iOS 模擬器或 Android 模擬器才跑得起來。** CI 上不跑、純手動裝置驗收用。

iOS（macOS only）：

```bash
# 一次性
npx expo prebuild --platform ios
npm run e2e:build:ios
# 之後每次
npm run e2e:ios
```

Android：

```bash
npx expo prebuild --platform android
npm run e2e:build:android
npm run e2e:android
```

設定檔：`.detoxrc.js`、`e2e/jest.config.js`、`e2e/firstRun.test.ts`（首跑 smoke：載入示範資料 → 切到建議 tab → 切換方法論 → 斷言看到新建議）。

模擬器名稱可用環境變數覆寫：`DETOX_DEVICE="iPhone 15 Pro"` / `DETOX_AVD="Pixel_8_API_35"`。

---

## Build & 部署

### Web bundle（CI 上跑、本地也能驗）

```bash
EXPO_OFFLINE=1 npx expo export --platform web --output-dir ./web-build
# 產出在 web-build/ 可直接丟 Cloudflare Pages / Vercel / Netlify static hosting
```

### EAS Build（未來 M8，給 store 上架用）

```bash
# 一次性
npx eas-cli login
npx eas-cli build:configure
# 之後
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

> EAS 需要 Apple Developer / Google Play Console 帳號，屬 M8 範疇。

### App Icon 重新產生

設計師改完 `assets/icon-source.svg` 後：

```bash
npm run generate-icons
# 把 assets/*.png 一起 commit
```

---

## 貢獻指南

### Commit message 格式

照已 ship 的 commit 風格：`<type>(<scope>): <summary>`

範例：
- `feat(M5): Claude Vision integration with mock fallback`
- `fix(snapshot): dedup edge case when bbox missing`
- `docs(plan): update M0.5 progress`
- `chore: bump expo to 54.0.33`
- `test(quota): cover monthly rollover boundary`

### PR 流程

1. 開 branch：`feat/<milestone>-<short-desc>` 或 `fix/<area>-<issue>`
2. 至少跑驗收三層：`npm run typecheck` + `npm test` + `EXPO_OFFLINE=1 npx expo export --platform web --output-dir /tmp/wb`
3. CI 綠了再 review；衝突先 rebase 上 main
4. Squash merge（保持 main 線性）
5. 合進去後 `docs/development-plan.md` 對應條目改 `[x]` + 寫 commit hash

### 跨 Session 接手指南

接手任何 task 之前，**先讀** [`docs/development-plan.md`](docs/development-plan.md) 的「**跨 Session 接手指南**」section 與「**現況 Snapshot**」section。那兩塊是 source of truth。

### Code review checklist

- [ ] TypeScript strict 通過（`tsc --noEmit` 0 error）
- [ ] 既有測試沒被破壞（52 tests 全綠）
- [ ] 新功能有對應單元測試
- [ ] 動到 UX 的 PR 附 screenshot / GIF
- [ ] `docs/development-plan.md` 對應條目狀態同步更新

---

## 目錄結構

```text
.
├── .detoxrc.js              Detox E2E 設定（iOS sim + Android emu）
├── .env.example             環境變數範本（複製為 .env）
├── .github/
│   └── workflows/           GitHub Actions CI（ci.yml）
├── App.tsx                  RN 進入元件
├── README.md                這份文件
├── app.config.ts            Expo dynamic config（注入 extra）
├── app.json                 Expo static config（icon / splash / plugins）
├── assets/
│   ├── adaptive-icon.png    Android adaptive 前景（1024×1024）
│   ├── favicon.png          Web favicon（48×48）
│   ├── icon-source.svg      所有 icon 的 SVG 源檔（給設計師迭代）
│   ├── icon.png             iOS app icon（1024×1024）
│   └── splash-icon.png      啟動畫面中央圖（1024×1024）
├── docs/
│   ├── competitive-analysis.md   競品分析
│   ├── development-plan.md       全書一致的開發節奏 + 現況 Snapshot
│   ├── m6-outreach/              M6 收納師邀請材料 5 份
│   └── pitch-brief.md            視覺方向 + 飛輪 + 變現線
├── e2e/
│   ├── firstRun.test.ts     首跑 smoke 測試（demo data + 方法論切換）
│   └── jest.config.js       Detox 專用 jest config
├── index.ts                 RN entry
├── jest.config.js           單元測試 jest config
├── package-lock.json        鎖定版本（一定要納管）
├── package.json             scripts / dependencies
├── scripts/
│   ├── generate-icons.ts    從 SVG 產出 4 個 PNG（sharp）
│   └── tsconfig.json        script 專屬 TS 設定（隔離 Expo bundler 模式）
├── src/
│   ├── __test_mocks__/      jest module mock（uuid / AsyncStorage / expo-constants）
│   ├── components/          共用 UI（Button / Section）
│   ├── navigation/          5 tab + Stack
│   ├── screens/             Items / Spaces / Labels / Suggestions / Shopping / AddItem
│   ├── services/            methodology engine / ai / dedup / anomaly / quota
│   ├── storage/             AsyncStorage 封裝 + sessionStorage
│   ├── theme/               色票
│   └── types/               資料模型（items / methodology / snapshot）
└── tsconfig.json            主 TS 設定（extends expo/tsconfig.base，strict）
```

