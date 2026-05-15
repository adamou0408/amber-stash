# Amber Stash 開發計劃

> 版本：v1 · 2026-05-15
> 對應 pitch 中「MVP App 已完成 → 客製收納箱原型設計中」的工程節奏

---

## 里程碑總覽

| 里程碑 | 範圍 | 狀態 |
|---|---|---|
| **M1 · 骨架** | Expo + RN + TS、5 個 tab 結構、AsyncStorage CRUD | ✅ 完成 |
| **M2 · 可用 MVP** | 物品 ↔ 空間關聯、demo 資料載入、標籤列印 | ✅ 完成（本次） |
| **M3 · AI 顧問** | 接 Claude API 做收納推薦、視覺辨識物品 | ⏳ 下一步 |
| **M4 · 收納箱數據模型** | 客製箱規格、訂單流程、雷雕字段預覽 | 未啟動 |
| **M5 · 雲端同步** | Supabase Auth + Postgres、家庭共享 | 未啟動 |
| **M6 · 上架與品牌** | App Store / Google Play、landing page、icon/splash | 未啟動 |

---

## 當前狀態（M2 結束）

### 已完成功能

- 5 個底部 tab：物品 / 空間 / 標籤 / 建議 / 購物
- 物品 CRUD（拍照、相簿、分類、數量、空間指派、備註）
- 空間 CRUD（類型、尺寸）
- 物品 ↔ 空間關聯（AddItem 內可選空間，ItemsScreen 顯示所屬空間 pill）
- 規則式收納建議（依物品分類 + 空間存在性）
- 規則式收納用品推薦（依物品量觸發推薦）
- 購物清單 CRUD + 「一鍵加入推薦」
- 標籤輸出（多選空間 → 三種尺寸 → PDF 列印 / 分享，含 QR）
- 載入示範資料（一鍵生成 5 個空間 + 14 件物品 + 3 個購物項目）
- Web bundle 編譯通過、TypeScript strict 通過

### 已知限制

- App Icon / Splash / Favicon 暫時用 Expo 預設（PNG 未上傳）
- `qrcode` 套件在 RN runtime 可能需要 Buffer polyfill，需實機驗證
- 標籤的 Noto Sans TC 透過 Google Fonts 線上載入，斷網時 fallback 系統字
- 雲端同步 / 多人共享尚未做（資料只在本機）
- 沒有單元測試 / E2E 測試
- `expo-camera` 在 web 平台僅部分支援，相機體驗以行動裝置為主

---

## M3 · AI 顧問（下一個 sprint）

### 目標
把 `src/services/suggestions.ts` 的規則式換成 Claude API，並加入視覺辨識。

### Tasks
- [ ] 抽 `services/ai/claudeClient.ts`，封裝 fetch + prompt cache headers
- [ ] 環境變數管理（`expo-constants` + `app.config.ts`，從 `EXPO_PUBLIC_*` 讀 anon key，敏感 key 走後端 proxy）
- [ ] `generateAISuggestions(items, spaces)` 取代規則式，回傳 streaming text + actionable list
- [ ] `recognizeItemFromPhoto(uri)` 拍完照後 base64 上傳，回傳「名稱建議 / 分類建議」
- [ ] AddItem 加入「AI 識別」按鈕，把建議自動填入欄位
- [ ] 建議頁加入「重新生成」按鈕 + loading state
- [ ] 速率限制 / 配額提示（免費版每月 N 次）

### 開放問題
- API key 放哪？前端直接呼叫 vs. 自架 proxy（推薦 proxy 才能加 rate limit 與計費）
- 推薦結果要不要快取？避免相同物品組合重複呼叫
- vision model 用 Claude Opus 4.7 vs. Sonnet 4.6（成本 vs. 精準度）

---

## M4 · 收納箱數據模型

### 目標
讓 app 從「整理工具」變成「箱子銷售前台」。

### Tasks
- [ ] 新型別：`Box`（材質、尺寸、雷雕字、QR payload、SKU、價格）
- [ ] `services/box.ts`：給定空間 + 物品清單 → 推薦箱子規格（尺寸、刻字）
- [ ] 新增 tab 或 modal：「客製收納箱」訂購流程
- [ ] 雷雕字預覽（沿用現有 `labelHtml`，調整字級 + 加 SVG outline 模式）
- [ ] SVG 匯出（路徑模式，不依賴字型，可直接給雷雕機）
- [ ] 訂單狀態：草稿 / 已下單 / 製作中 / 出貨 / 已到貨
- [ ] 出貨後 QR 在 app 一掃 → 跳到該空間頁面（deep link 已預備）

### 開放問題
- 訂單系統自架 vs. 用 Shopify / 蝦皮接金流？
- 雷雕工廠合作模式：自家工坊 vs. 外包代工（影響 SKU 範圍與起訂量）

---

## M5 · 雲端同步

### Tasks
- [ ] 選擇 backend：Supabase（推薦）vs. Firebase
- [ ] 從 `AsyncStorage` 抽 repository 介面，加上 `RemoteRepository` 實作
- [ ] Auth：手機號碼或 email magic link
- [ ] 家庭群組：邀請成員、空間 / 物品 ACL
- [ ] 衝突解決：last-write-wins 或 CRDT（評估）

---

## M6 · 上架與品牌

### Tasks
- [ ] 設計 App Icon / Splash / Adaptive Icon（給 Claude Design 處理 — 用 pitch-brief 同一套視覺）
- [ ] EAS Build + Submit 配置
- [ ] App Store / Google Play 商店描述、截圖、預覽影片
- [ ] Landing page（amberstash.com，可用 Claude Design 出視覺、Next.js 接 waitlist）
- [ ] 隱私政策 / 服務條款
- [ ] 設定追蹤埋點（PostHog / Mixpanel）

---

## 架構決策日誌

### ADR-001 · 為何選 Expo + React Native
- 跨平台一份程式碼
- Expo 內建拍照、列印、分享、storage 模組
- 未來上架 App Store / Google Play 路徑清楚

### ADR-002 · 為何先用 AsyncStorage 不上雲
- MVP 階段使用者體驗驗證 > 多裝置同步
- AsyncStorage CRUD 與 repository 介面解耦，未來換 Supabase 只改一層

### ADR-003 · 為何標籤輸出選 HTML + expo-print 而非 SVG-only
- HTML/CSS 開發迭代快，視覺好調整
- expo-print 同時支援列印 + PDF 匯出，一條路徑兩個用途
- 雷雕級的 SVG outline 留到 M4，避開字體外框轉換的工程成本

### ADR-004 · 為何 inventory 免費、AI 推薦付費
- inventory 是資料壁壘 — 越多人用，AI 模型越準
- AI 推薦是 hero feature，付費鉤子最強
- 詳見 `docs/competitive-analysis.md`

---

## 驗證方法

| 層級 | 工具 | 跑法 |
|---|---|---|
| 型別 | TypeScript strict | `npm run typecheck` |
| Web bundle | `expo export --platform web` | `EXPO_OFFLINE=1 npx expo export --platform web --output-dir /tmp/web-build` |
| 行動裝置 dev | Expo Go / dev client | `npm run start`，手機掃 QR |
| UI 手動 | 在 dev server 跑 | 物品建檔 → 空間建立 → 建議查看 → 標籤列印 → 購物清單 |
| 自動測試 | （未建）Jest + Detox | M3 之後再上 |

---

## 給 AI 助手 / 設計師的 onboarding 摘要

如果你是新加入這個專案的 AI 助手或設計師，依序看：

1. `README.md` — 怎麼跑起來
2. `docs/competitive-analysis.md` — 為什麼這個產品有市場
3. `docs/pitch-brief.md` — 視覺方向與商業模式
4. `docs/development-plan.md`（本文件）— 工程節奏
5. `src/types/index.ts` — 資料模型
6. `src/services/` — 商業邏輯（先看 `suggestions.ts` 與 `labelHtml.ts`）
