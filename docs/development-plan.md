# Amber Stash 開發計劃

> 版本：v2 · 2026-05-15
> 對應 pitch 中「資料 × AI × 方法論 × 收納箱」四角飛輪

---

## 里程碑總覽

| 里程碑 | 範圍 | 狀態 |
|---|---|---|
| **M1 · 骨架** | Expo + RN + TS、5 個 tab 結構、AsyncStorage CRUD | ✅ |
| **M2 · 可用 MVP** | 物品 ↔ 空間關聯、demo 資料、標籤列印 | ✅ |
| **M3 · 方法論引擎** | Methodology / Expert 資料層、規則式評估、預設 + 怦然心動範例、Suggestions 切換 UI | ✅（架構） |
| **M2.5 · Session + Snapshot 架構** | 防重複計算的根本架構（拍照 → 提案 → 確認 → 快照） | ⏳ next |
| **M3.5 · 方法論內容啟動** | 邀請 3-5 位收納師、把示範方法論換成真實授權內容 | 規劃中 |
| **M4 · Claude Vision** | AI 視覺辨識物品名稱 / 分類 / 數量提案（套用 M2.5 流程） | 規劃中 |
| **M5 · 客製收納箱** | 箱規格 / 訂單 / 雷雕字段、SVG 出版 | 規劃中 |
| **M6 · 雲端同步 + 上架** | Supabase / EAS Build / 商店 / Landing | 未啟動 |

---

## 當前狀態

### 已完成（M1 + M2 + M3 架構）

- 5 個底部 tab：物品 / 空間 / 標籤 / 建議 / 購物
- 物品 CRUD（拍照、相簿、分類、數量、空間指派、備註）
- 空間 CRUD（類型、尺寸）
- 物品 ↔ 空間關聯 + ItemsScreen 空間 pill
- **方法論引擎**：`src/services/methodologyEngine.ts` — JSON 結構化規則評估器
- **2 套示範方法論**：`Amber Stash 通用收納`（免費）+ `怦然心動式 (範例)`（NT$79/月 placeholder）
- **建議頁可切換方法論**：每條建議掛來源（方法名 + 作者）
- **使用者偏好持久化**：`src/storage/preferencesStorage.ts`
- 規則式收納用品推薦（依物品量觸發推薦，同樣 methodology-aware）
- 購物清單 CRUD + 「一鍵加入推薦」
- 標籤輸出（多選空間 → 三種尺寸 → PDF 列印 / 分享，含 QR）
- 載入示範資料（一鍵生成 5 空間 + 14 物品 + 3 購物項目）

### 已驗證
- TypeScript strict 通過
- `expo export --platform web` bundle 通過（1.14MB）

---

## M2.5 · Session + Snapshot 架構（下一步）

### 為什麼需要這層
直接「拍照 → 加入物品清單」的累加模型在實務上必然重複計算（同物品多角度、重拍補資料、AI 提案在 N 張照片裡看到同一件襯衫…）。

### 解法 · Capture Session + Space Snapshot
- 每次整理是一個 **Session**（時間戳 + 空間 + 照片組）
- Session 結束產出一個 **Snapshot**（該空間在那個時刻的權威狀態）
- Snapshot 不可變
- 「空間的當前狀態」= 最新 snapshot
- 重複計算結構上不可能（沒有「累加」這個動作）

### Tasks
- [ ] `types/snapshot.ts`：CaptureSession、Detection、SpaceSnapshot
- [ ] `storage/sessionStorage.ts`：CRUD + 取得「某空間最新 snapshot」
- [ ] AddItem flow 改寫成 session-aware：拍照 → 進 session 暫存 → 確認後 commit snapshot
- [ ] 規則式 detection 提案（M4 之前的 fallback：手動輸入會出現在 session 裡）
- [ ] 同框去重（bbox IOU > 0.5 合併）
- [ ] 低信心提示（confidence < 0.6 必須點一下確認）
- [ ] 異常值挑戰（某類別比上次 snapshot 多 3 倍 → alert）
- [ ] 容器歧義（辨識到「收納盒」時詢問展開 / 不展開）

---

## M3.5 · 方法論內容啟動

### Tasks
- [ ] 把現有的 `KONMARI_METHODOLOGY` placeholder 換成真實授權內容（找 3-5 位邀請制收納師談）
- [ ] 收納師授權合約樣板（含分潤比例、IP 歸屬、更新義務）
- [ ] 方法論作者頁面（avatar、bio、其他方法論連結）
- [ ] 方法論列表頁（瀏覽 / 訂閱 / 試用）
- [ ] 訂閱 / 一次性購買金流（Stripe 或 IAP）

### 開放問題
- 收納師授權形式：買斷 / 永久分潤 / 訂閱抽成？
- 內容更新頻率與義務？

---

## M4 · Claude Vision

### 目標
取代 AddItem 的手動輸入：拍照 → AI 提出物品 detection（名稱 / 類別 / 數量 / 信心）→ 使用者審核 → 提交 snapshot。

### Tasks
- [ ] `services/ai/claudeClient.ts`：fetch wrapper + prompt cache headers
- [ ] 環境變數管理（`expo-constants` + `app.config.ts`，`EXPO_PUBLIC_*` 讀 anon key；敏感 key 走後端 proxy）
- [ ] `services/ai/recognizeItems.ts`：base64 上傳 → 多物品 detection
- [ ] AddItem 加入「AI 識別」按鈕，把 detection 結果填入 session
- [ ] 計費 / rate limit（免費版每月 N 次）

### 開放問題
- API key 放哪？前端直接呼叫 vs. 自架 proxy（建議 proxy 才能加 rate limit）
- vision model 用 Claude Opus 4.7 vs. Sonnet 4.6（成本 vs. 精準度）

---

## M5 · 客製收納箱

### Tasks
- [ ] `types/box.ts`：材質、尺寸、雷雕字、QR payload、SKU、價格
- [ ] `services/box.ts`：空間 + 物品清單 → 推薦箱子規格
- [ ] 訂購流程（草稿 / 已下單 / 製作中 / 出貨 / 已到貨）
- [ ] 雷雕字預覽（SVG outline 模式，字型轉外框，不依賴字型檔）
- [ ] 出貨 QR 一掃 → 跳該空間頁面（deep link 已預備）

### 開放問題
- 自架工坊 vs. 外包代工
- 金流：Shopify / 蝦皮 / 自架

---

## M6 · 雲端同步 + 上架

### Tasks
- [ ] Backend 選型：Supabase 推薦
- [ ] Repository 介面抽象（已預備）→ 加 `RemoteRepository`
- [ ] Auth：phone or email magic link
- [ ] 家庭群組 ACL
- [ ] EAS Build + Submit
- [ ] App Store / Google Play 描述 / 截圖 / 預覽影片
- [ ] Landing page（amberstash.com，Claude Design 出視覺 + Next.js 接 waitlist）
- [ ] 隱私政策 / 服務條款
- [ ] 追蹤埋點（PostHog 或 Mixpanel）

---

## 架構決策日誌

### ADR-001 · 為何選 Expo + React Native
跨平台一份碼、Expo 內建拍照/列印/分享/storage、未來上架路徑清楚。

### ADR-002 · 為何先用 AsyncStorage 不上雲
MVP 階段使用者體驗驗證 > 多裝置同步。Repository 介面解耦，未來換 Supabase 只改一層。

### ADR-003 · 為何標籤輸出選 HTML + expo-print 而非 SVG-only
HTML/CSS 開發迭代快、列印 + PDF 一條路徑兩用途。雷雕級 SVG outline 留到 M5。

### ADR-004 · 為何 inventory 免費、AI 推薦付費
inventory 是資料壁壘（越多人用模型越準）。AI 推薦是 hero feature，付費鉤子最強。

### ADR-005 · 為何加入「收納師方法論」這條線（四角飛輪）
- 純 AI 推薦同質化風險高（任何人都能接 Claude API）；綁定授權方法論是內容護城河
- 三方市場：使用者拍照貢獻資料 / 收納師授權方法論 / 工廠出貨收納箱 — 三邊互相強化
- AI 是常駐、方法論是專家頻道（不是取代關係）：免費通用 AI / 付費載入老師方法 / 高階社群活動
- **拒絕** 1-on-1 諮詢：保持平台為「內容 / 工具」，不變成 BetterHelp 型服務

### ADR-006 · 為何方法論用 JSON 結構化規則而非純 prompt
- 規則可在無 LLM 時穩定運作（離線、配額用完都不卡）
- 規則可被工具驗證（單元測試、規則衝突檢查）
- LLM 跟規則並存：`systemPrompt` 給 LLM 路徑、`rules` 給規則式路徑
- 對收納師來說：填表單比寫提示工程簡單

### ADR-007 · 為何用 Session + Snapshot 而非累加模型
詳見 M2.5。重複計算在累加模型下無法結構性避免，必須改用快照。

---

## 驗證方法

| 層級 | 工具 | 跑法 |
|---|---|---|
| 型別 | TypeScript strict | `npm run typecheck` |
| Web bundle | `expo export --platform web` | `EXPO_OFFLINE=1 npx expo export --platform web --output-dir /tmp/web-build` |
| 行動裝置 dev | Expo Go / dev client | `npm run start`，手機掃 QR |
| UI 手動 | dev server | 載入示範資料 → 切換方法論 → 看建議差異 → 列印標籤 → 加購物 |
| 自動測試 | （未建）Jest + Detox | M3.5 之後再上 |

---

## 給 AI 助手 / 設計師的 onboarding 摘要

1. `README.md` — 怎麼跑起來
2. `docs/competitive-analysis.md` — 為什麼這個產品有市場
3. `docs/pitch-brief.md` — 視覺方向 + 商業模式（4 角飛輪）
4. `docs/development-plan.md`（本文件）— 工程節奏
5. `src/types/` — 資料模型（注意 `methodology.ts`）
6. `src/services/methodologies/` — 方法論定義（先讀 `default.ts` 與 `index.ts`）
7. `src/services/methodologyEngine.ts` — 規則評估器
