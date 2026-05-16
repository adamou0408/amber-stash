# Amber Stash 開發計劃

> 版本：v3 · 2026-05-15
> 全書一致：每個里程碑都有「目標 / 範圍 / 驗收標準 / 驗收方法」
> 北極星：**朋友拿你手機，3 分鐘就能感受 magic moment 不卡關**

---

## 戰略架構（recap）

### 四角飛輪

```
        使用者資料
            ↕
收納師方法論  ⇄  AI 推薦
            ↕
         客製收納箱
```

四角缺一不可：少 AI 是 inventory app；少方法論會同質化；少箱子沒實體 SKU；少使用者資料是空殼。

### 三條變現線

| 變現線 | 形式 | 啟動時機 |
|---|---|---|
| A · AI 推薦進階訂閱 | 月費 | M5 完成後 |
| B · 客製收納箱直營 | 一次性購買 | M7 完成後 |
| C · 收納師方法論授權 / 訂閱 | 月費 / 一次性 | M6 完成後 |

---

## 里程碑總覽

| # | 名稱 | 主要交付 | 狀態 |
|---|---|---|---|
| M1 | 骨架 | Expo 專案 + 5 tab + AsyncStorage CRUD | ✅ ship（commit `618b09b`） |
| M2 | 可用 MVP | 物品↔空間關聯 + 示範資料 + 標籤列印 | ✅ ship（commit `fc7f9bf` / `7268cec`） |
| M3 | 方法論引擎 | JSON 規則 + 切換 UI + 2 套示範方法論 | ✅ ship（commit `40cfa41`） |
| M4 | Session + Snapshot | 防重複計算的根本架構 | ✅ 架構 ship（commit `4cbd8aa`+`dfaf2fc`+`9984df7`） · ⚠️ UX 部分延後 |
| M5 | Claude Vision | 拍照辨識 → detection proposal 進 session | ✅ 架構 ship（commit `0ed0f66`） · ⚠️ UX 部分延後 |
| M6 | 方法論內容啟動 | 邀請 3-5 收納師、授權合約、訂閱金流 | 🔄 進行中 — 材料 ship（commit `07bda99`）/ 真實邀請待你動手 |
| M7 | 客製收納箱 | 箱規格 / 訂單 / 雷雕字段 / SVG outline | ✅ 工程核心 ship（commit `ad3f0fe`，純資料 + 邏輯，無 UI；UI 下一輪） |
| M8 | 雲端 + 上架 | Supabase / EAS / 商店 / Landing | ❌ 未啟動 |
| **M0.5** | 工程衛生 | CI / 真機驗證 / 效能 profiling / App Icon | ❌ 未啟動（橫切，分散在各 milestone） |

依賴關係：M1 → M2 → M3 → M4 → M5 → M7 → M8；M3 → M6（與 M5 並行）

詳細「已交付 / 已延後」清單見下方 **〈現況 Snapshot〉** 一節。

---

## 現況 Snapshot

> 隨每次 ship 更新；最後同步：2026-05-16（M7 工程核心 ship，HEAD `ad3f0fe`）
> 規則：完成項目要打 `[x]`、延後項目維持 `[ ]` 並標 `(deferred → M?)`

### ✅ 已 ship

- [x] M1 骨架：Expo 54 / RN 0.81 / TS strict / 5 tab / AsyncStorage CRUD
- [x] M2 物品↔空間關聯：AddItem 空間 chip、ItemsScreen 空間 pill、demo data 載入
- [x] M2 標籤列印：5 空間多選 / 3 尺寸 / Noto Sans TC 900 / QR + PDF + 列印
- [x] M3 方法論引擎：`Methodology` / `Expert` / `DecisionRule` / 規則評估器 + 模板填詞
- [x] M3 2 套示範方法論：`amberstash-default`（免費）+ `konmari-zh`（NT$79/月 placeholder）
- [x] M3 建議頁切換 + attribution 卡 + 偏好持久化
- [x] M4 Session + Snapshot 資料模型 + storage CRUD + dedup（IOU > 0.5）+ anomaly 偵測
- [x] M4 AddItem 雙模式：選空間走 session/snapshot、未選 fallback quick-save
- [x] M4 Jest + ts-jest 設定 + 4 個測試 suite（39 tests）
- [x] M5 AI service 層：config / claudeClient / recognizeItems / mockDetections / quota
- [x] M5 三層 backend 回退：proxy / direct / mock
- [x] M5 AddItem「🤖 AI 辨識」按鈕串接 session pendings
- [x] M5 配額管理 + QuotaExceededError + 月份 rollover
- [x] M5 AI service 單元測試（+13 tests，共 52 tests）
- [x] M6 outreach 材料 5 份：候選名單 / 授權 outline / 邀請信 / 撰寫指南 / 分潤模式
- [x] 多機開發環境：`.env.example` / `package-lock.json` 納管 / `.gitignore` 修嚴
- [x] M7 工程核心（commit `ad3f0fe`）：`types/box.ts` / `services/box/catalog.ts`（13 SKU）/ `recommender.ts` / `svgOutline.ts`（opentype.js + Noto Sans TC 900）/ `boxOrderStorage.ts`（狀態機含合法/非法轉移驗證）+ 71 個新測試（共 123 tests）

### ⚠️ 架構做了但 UX/功能未完整

- [ ] M4 容器歧義 UI（辨識到收納盒時詢問展開／不展開） (deferred → M5.5)
- [ ] M4 低信心強制確認對話（confidence < 0.6 必須點一下） (deferred → M5.5)
- [ ] M5 Streaming 進度條（vision call 5-10 秒，目前只 spinner） (deferred → M5.5)
- [ ] M5 Bbox 預覽 / 編輯 UI（資料層備好，UI 沒畫） (deferred → M5.5)
- [ ] M5 Server-side proxy 實際部署（Cloudflare Worker / Vercel function） (deferred → M5.5)
- [ ] M5 黃金測試集（10 張人工標註照片做 vision 迴歸） (deferred → M5.5，需要使用者提供照片)
- [ ] M5 真實 Claude API 端對端驗證（環境沒 key，只跑了 mock + 解析） (deferred → 使用者本機驗)
- [ ] M6 方法論列表頁 / 作者頁 UI（資料模型完整、UI 沒做） (deferred → M6.5)
- [ ] M6 訂閱金流（Stripe / IAP） (deferred → M6.5)

### ❌ 完全未啟動

- [ ] M6 真實邀請 3-5 位收納師（材料 ready，需要使用者親自談）
- [ ] M6 律師 review 授權合約 outline 第 1.3 / 2.2 / 7.3 條
- [x] M7 客製收納箱（工程核心，commit `ad3f0fe`）：`types/box.ts` / `services/box/{catalog,recommender,svgOutline}.ts` / `storage/boxOrderStorage.ts` / 71 個測試 — 純資料 + 邏輯層 ship
- [ ] M7 客製收納箱（UI 層）：訂購流程 screen / 雷雕字預覽 UI / SKU 選擇 UI (deferred → 下一輪)
- [ ] M7 雷雕工廠合作關係（需使用者談）
- [ ] M8 Supabase Auth + Postgres、Repository 介面換實作
- [ ] M8 家庭群組 ACL
- [ ] M8 EAS Build + Submit
- [ ] M8 App Store / Google Play 上架（需 Apple / Google 開發者帳號）
- [ ] M8 Landing page（amberstash.com + waitlist）
- [ ] M8 隱私政策 / 服務條款（需律師）
- [ ] M8 埋點（PostHog / Mixpanel）

### 🩺 M0.5 工程衛生（橫切，隨時可補）

- [x] App Icon / Splash / Adaptive Icon PNG（SVG 源 + sharp script 產出，commit `c17aa02`）
- [x] GitHub Actions CI（push / PR 自動跑 tsc + test + web bundle + 上傳 web bundle artifact，commit `c17aa02`）
- [x] E2E 測試 baseline（Detox config + jest config + firstRun smoke test 已立，commit `c17aa02`） · ⚠️ 真實 run 仍需 iOS / Android 模擬器
- [ ] 真實 iOS / Android 模擬器跑 smoke test（環境只跑得了 web bundle，需要使用者本機跑 `npm run e2e:ios` / `npm run e2e:android`）
- [ ] 效能 profiling（大量物品 > 500 筆下 FlatList 表現）
- [ ] 把 `KONMARI_METHODOLOGY` 的 placeholder 換成真實授權內容（屬 M6）

---

## 跨 Session 接手指南

> 給之後接手的 Claude / 人類工程師看。
> 目的：**不用 grep commit log 也能 30 秒搞清楚現況**

### Step 1 · 看現況
- 讀本文件的「現況 Snapshot」section — 那就是真實狀態
- `git log --oneline d321548..HEAD` 看新增 commit

### Step 2 · 看資料模型
- `src/types/index.ts` — Item / Space / ShoppingItem
- `src/types/methodology.ts` — Methodology / Expert / DecisionRule
- `src/types/snapshot.ts` — Session / Detection / Snapshot

### Step 3 · 看商業邏輯
- `src/services/methodologyEngine.ts` — 規則評估
- `src/services/methodologies/{default,konmari,index}.ts` — 已內建方法論
- `src/services/ai/recognizeItems.ts` — vision 入口（內部會用 mock 或 real）
- `src/services/dedup.ts` + `anomaly.ts` — snapshot 寫入前的純函式

### Step 4 · 看現有測試
- `npm test` — 52 tests
- 不要破壞既有 test，新功能要加新 test

### Step 5 · 動工前的三問
- **這項目在「現況 Snapshot」哪個 section？** 已 ship / 已延後 / 未啟動？
- **驗收標準是什麼？** 看對應 milestone 段落的「驗收標準」
- **動完要怎麼驗證？** 至少跑驗收三層（tsc / jest / web bundle），標 `[x]`、commit + push

### Step 6 · ship 後一定要做
- 在「現況 Snapshot」對應條目把 `[ ]` 改成 `[x]`
- 寫 commit hash 進去（讓下個 session 可以回溯）
- 更新本文件最後同步日期與 HEAD

> **金句**：plan = 真實狀態。如果你發現 plan 跟 code 不同，**修 plan 而非 code**（除非那是 bug）。

---

## 驗收手法總則

### 五層驗收層級（每個 milestone 至少跑前 3 層）

| 層 | 名稱 | 用什麼跑 | 目的 |
|---|---|---|---|
| 1 | **型別** | `npx tsc --noEmit` | 介面與資料模型不破壞 |
| 2 | **建置** | `EXPO_OFFLINE=1 npx expo export --platform web --output-dir /tmp/web-build` | 整個 bundle 編得起來 |
| 3 | **單元** | Jest（M4 起導入） | 純函式邏輯正確（規則評估、IOU 去重、模板填詞） |
| 4 | **手動 E2E** | dev server + Chrome / 實機 | 真實 UX 跑得通 |
| 5 | **使用者煙霧測試** | 找 3 位非團隊成員 | 不被內部視角污染的真實反饋 |

### 通用驗收三問

每完成一個 milestone 自問：

1. **可逆嗎？** — 出包能不能 rollback 一個 commit 就修復
2. **示範資料能 demo 嗎？** — 點「載入示範資料」之後，這個 milestone 的功能能立即看到
3. **新人能 onboarding 嗎？** — 不看其他 doc，只看 README + 這個 milestone 的 task list 能跑起來

任一題答「不」就還沒驗收完。

---

## M1 · 骨架 ✅

### 目標
跑起來的 Expo 殼，可以開始疊功能。

### 範圍
- Expo SDK 54 + React Native 0.81 + TypeScript strict
- 5 個底部 tab：物品 / 空間 / 標籤 / 建議 / 購物
- AsyncStorage CRUD（items / spaces / shopping）
- 設計 token（`src/theme/colors.ts`）

### 驗收標準
- [x] `npm install` 不出錯
- [x] `npm run web` 開瀏覽器顯示 5 個 tab
- [x] 點每個 tab 不會 crash
- [x] TS strict + web bundle 通過

### 驗收方法
- 層 1：`npx tsc --noEmit`
- 層 2：`expo export --platform web`
- 層 4：手動點過 5 個 tab

---

## M2 · 可用 MVP ✅

### 目標
有「demo 能跑全套流程」的功能 surface。

### 範圍
- 物品 CRUD（含拍照、相簿、空間指派）
- 空間 CRUD
- 物品 ↔ 空間 關聯顯示
- 載入示範資料（5 空間 / 14 物品 / 3 購物）
- 標籤列印（多選空間 → 3 種尺寸 → PDF 列印 / 分享、含 QR）

### 驗收標準
- [x] 載入示範資料後，每個 tab 都看到資料
- [x] 物品新增可選空間，列表顯示空間 pill
- [x] 標籤頁勾選空間 → PDF / 列印對話框可開
- [x] 長按物品 / 空間 / 購物可刪除

### 驗收方法
- 層 1 + 層 2
- 層 4 手動：依「載入示範資料 → 新增物品 → 列印標籤」順序走一遍

---

## M3 · 方法論引擎 ✅

### 目標
建議與購物推薦可被「換腦袋」— 規則式為主、未來 LLM 也走同一層。

### 範圍
- `Methodology` / `Expert` / `DecisionRule` / `ShoppingRule` 型別
- JSON 條件 schema：`categoryCount` / `hasSpaceKind` / `noSpaces` / `noItems` / `and` / `or`
- 規則評估器 + 模板填詞（`{clothing}` 等變數）
- 2 套示範方法論：`amberstash-default`（免費）+ `konmari-zh`（NT$79/月 placeholder）
- 建議頁加方法論切換 chip + attribution 卡
- 購物 picks 也跟著切換
- 使用者偏好持久化

### 驗收標準
- [x] 兩套方法論切換後，建議與購物 picks 都改變
- [x] 每條建議顯示「by [作者]」
- [x] App 重啟後，上次選的方法論仍是 active

### 驗收方法
- 層 1 + 層 2
- 層 4 A/B test：切到怦然心動式 → 衣物建議變成「全部拿出來堆」、購物推薦變成「⚠️ 先別買」

---

## M4 · Session + Snapshot 架構（next）

### 目標
建立「拍照 → 提案 → 確認 → 不可變快照」的工作流；結構性消除重複計算。

### 範圍
- `types/snapshot.ts`：`CaptureSession`、`Detection`（含 bbox / confidence）、`SpaceSnapshot`
- `storage/sessionStorage.ts`：session CRUD、「某空間最新 snapshot」查詢
- 規則式 detection 提案（手動輸入也走 session，當 M5 還沒上線時的 fallback）
- AddItem flow 改寫：拍照 → 進 session 暫存 → 審核確認 → commit snapshot（取代當前空間狀態）
- 同框去重（IOU > 0.5）
- 低信心提示（confidence < 0.6 必須點一下確認）
- 異常值挑戰（某類別比上次 snapshot 多 3 倍 → 確認對話）
- 容器歧義（辨識到收納盒 → 「展開內容物 / 只算盒子」二選一）

### 驗收標準
- [ ] 同物品連拍 3 張，commit 後資料仍為 1 件
- [ ] 修改 snapshot 不影響歷史 snapshot
- [ ] 異常值有對話框攔截
- [ ] App 重啟後，最新 snapshot 仍可讀
- [ ] 既有 M3 建議引擎自動使用最新 snapshot 的 items

### 驗收方法
- 層 1 + 層 2
- 層 3 單元測試：
  - `dedupeByIOU([{bbox, score}, ...])` 期望結果
  - `commitSnapshot(session)` 寫入後 `loadCurrent(spaceId)` 取得最新
  - 模擬連拍 3 張同物品 → 期望最終 1 件
- 層 4 手動：載入示範資料 → 對一個空間做 capture session → 確認 snapshot 已取代不是疊加

---

## M5 · Claude Vision

### 目標
取代手動輸入：拍照 → AI 出 detection 提案 → 使用者確認 → 走 M4 session 流程。

### 範圍
- `services/ai/claudeClient.ts`：fetch wrapper + prompt cache headers
- 環境變數：`expo-constants` + `app.config.ts`，`EXPO_PUBLIC_*` anon key；敏感 key 走 proxy（M5.5 加 proxy）
- `services/ai/recognizeItems.ts`：base64 上傳 → 結構化回傳 `Detection[]`
- AddItem 加「AI 識別」按鈕，把結果灌進 session
- 免費配額（每月 N 次，超過導訂閱）
- Streaming 進度條（vision call 可能 3-8 秒）

### 驗收標準
- [ ] 上傳一張衣物照片，5-10 秒內回傳結構化 detection
- [ ] 配額用完顯示明確提示與 upgrade CTA
- [ ] 低信心 detection 在 UI 上以警示樣式呈現
- [ ] AI 結果 100% 經過 M4 session 確認流程才會寫入 snapshot

### 驗收方法
- 層 1 + 層 2 + 層 3（mock claudeClient 的單元測試）
- **黃金測試集**：建一個 `tests/golden-photos/` 含 10 張人工標註過的標準照片（衣物堆 / 抽屜 / 書架 / 廚房 / 桌面 / 玩具區 / 文件夾 / 工具區 / 美妝抽屜 / 雜物盒）
  - 每張人工標註正確 detection
  - 跑 AI 比對：誤差容忍 ±20% 數量、類別命中率 > 80%
- 層 4 手動：找一個真實抽屜拍照，看建議是否合理
- 層 5 使用者煙霧：找 3 位朋友拍自己家拍一個空間，問「結果合理嗎」

---

## M6 · 方法論內容啟動（與 M5 並行）

### 目標
把示範 placeholder 換成真實授權的 3-5 套方法論；上線變現 C。

### 範圍
- 邀請名單（3-5 位收納師）+ 授權合約 outline
- 方法論作者頁面（avatar / bio / 其他方法）
- 方法論列表頁（瀏覽 / 試用 / 訂閱）
- 訂閱金流（Stripe Web → 之後 IAP）

### 驗收標準
- [ ] 至少 3 位收納師簽完授權合約
- [ ] 每位至少 1 套方法論 JSON 上線（rules 數量 ≥ 5 條）
- [ ] 訂閱 / 取消訂閱流程可走完
- [ ] 切換訂閱中方法論 → 建議內容立即反映

### 驗收方法
- 層 4：用 3-5 個假帳號實際走完訂閱流程
- 層 5：請收納師本人試用 app 看自己的方法論落地對不對

### 開放問題
- 收納師授權形式：買斷 / 永久分潤 / 訂閱抽成？
- 內容更新義務（每月 1 條新規則？）

---

## M7 · 客製收納箱

### 目標
把線上方案實體化：app 的 AI 建議能直接導到一個可下單的箱子。

### 範圍
- `types/box.ts`：材質、尺寸、雷雕字、QR payload、SKU、價格
- `services/box.ts`：空間 + 物品 → 推薦箱規
- 訂購流程：草稿 → 已下單 → 製作中 → 出貨 → 已到貨
- 雷雕字預覽：**SVG outline 模式**（字型轉外框，不依賴字型檔，可直接給雷雕機）
- 出貨後 QR 一掃 → 跳該空間頁面（deep link 已預備）

### 驗收標準
- [x] 跑 3 個典型空間（衣櫃 / 抽屜 / 書桌）→ 每個推薦至少 1 個箱規格（recommender.test.ts）
- [ ] 推薦的尺寸 ± 工廠 SKU 容差內可生產（待真實工廠合作）
- [x] SVG outline 由 opentype.js 把字轉 path、QR 也轉 path（svgOutline.test.ts；實機 LightBurn 驗證待）
- [x] 訂單狀態流轉合法/非法都有單元測試（boxOrderStorage.test.ts）
- [x] catalog 至少 10 個 SKU 涵蓋小/中/大三種尺寸帶（13 SKU，catalog.test.ts）

### 驗收方法
- 層 1 + 層 2 + 層 3：`tsc --noEmit` / web bundle / Jest（123 tests 全綠）
- 層 4：UI 下一輪做完後手動跑訂購流程
- 工廠端驗收：實際打樣 1 個箱子（等待 UI 完成 + 工廠對接）

### 開放問題
- 自架工坊 vs. 外包代工
- 金流：Shopify / 蝦皮 / 自架
- 字型檔（12 MB）是否走 git LFS？目前直接 commit 在 `src/services/box/fonts/`

---

## M8 · 雲端 + 上架

### 目標
從 demo-able 到 download-able。

### 範圍
- Backend：Supabase（Auth + Postgres）
- Repository 介面 → `RemoteRepository` 實作
- Auth：phone or email magic link
- 家庭群組 ACL
- EAS Build + Submit
- App Store / Google Play 描述 / 截圖 / 預覽影片
- Landing page（amberstash.com，Claude Design 出視覺 + Next.js 接 waitlist）
- 隱私政策 / 服務條款
- 埋點：PostHog / Mixpanel

### 驗收標準
- [ ] 跨裝置登入後資料同步（一台手機新增物品，另一台 30 秒內看到）
- [ ] App Store / Play Store submit 通過
- [ ] Landing page Lighthouse > 90
- [ ] 隱私政策 / TOS 上線並可從 app 內連到
- [ ] 100 個 waitlist 註冊

### 驗收方法
- 層 4 + 層 5
- 真實裝置雙開、用兩個 Apple ID 走完整流程
- 找 10 位外部使用者跑一次 onboarding，記錄卡關點

---

## ADR 決策日誌

### ADR-001 · 選 Expo + React Native
跨平台一份碼、Expo 內建拍照/列印/分享/storage、未來上架路徑清楚。

### ADR-002 · 先用 AsyncStorage 不上雲
MVP 階段 UX 驗證 > 多裝置同步。Repository 介面解耦，M8 換 Supabase 只改一層。

### ADR-003 · 標籤輸出選 HTML + expo-print 而非 SVG-only
HTML/CSS 開發迭代快、列印 + PDF 一條路徑兩用途。雷雕級 SVG outline 留到 M7。

### ADR-004 · inventory 免費、AI 推薦付費
inventory 是資料壁壘（越多人用模型越準）。AI 推薦是 hero feature，付費鉤子最強。

### ADR-005 · 加入「收納師方法論」這條線（四角飛輪）
- 純 AI 推薦同質化風險高；綁定授權方法論是內容護城河
- 三方市場：使用者 / 收納師 / 工廠 相互強化
- AI 常駐、方法論專家頻道；不接 1-on-1（保持工具 / 內容定位）

### ADR-006 · 方法論用 JSON 結構化規則而非純 prompt
- 規則離線可跑（無 LLM 也穩定）
- 規則可單元測試 / 衝突檢查
- LLM 跟規則並存（`systemPrompt` 給 LLM、`rules` 給規則式）
- 收納師填表單比寫提示工程簡單

### ADR-007 · Session + Snapshot 而非累加模型
累加模型結構性無法避免重複計算。Snapshot 不可變、Session 提供「拍照 → 提案 → 確認」中介層。

### ADR-008 · M5 / M6 並行而非串行
M5 是工程任務（可內部自驅）、M6 是供應鏈任務（看外部進度）。串行會浪費時段。

---

## Onboarding 摘要

新加入專案的 AI 助手 / 設計師依序看：

1. `README.md` — 怎麼跑起來
2. `docs/competitive-analysis.md` — 為什麼這個產品有市場
3. `docs/pitch-brief.md` — 視覺方向 + 四角飛輪 + 三變現線
4. `docs/development-plan.md`（本文件）— 工程節奏
5. `src/types/` — 資料模型（先讀 `index.ts` 與 `methodology.ts`）
6. `src/services/methodologies/` — 方法論定義（先讀 `default.ts` 與 `index.ts`）
7. `src/services/methodologyEngine.ts` — 規則評估器

跑一遍 demo 流程：
```bash
npm install
npm run web
# 載入示範資料 → 物品 / 空間 / 建議切換方法論 / 標籤列印 / 購物
```
