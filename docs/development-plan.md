# Amber Stash 開發計劃

> 版本：v4 · 2026-05-17
> 全書一致：每個里程碑都有「目標 / 範圍 / 驗收標準 / 驗收方法」
> 北極星：**朋友拿你手機，3 分鐘就能感受 magic moment 不卡關**
>
> **v4 變更**：目標收斂為「先做出一個好用的收納 app」。原 v3 的三條變現線（訂閱 / 客製箱 / 方法論授權）整體下架不入目標；相關里程碑（M6 內容變現、M7 客製箱銷售、M8 訂閱金流）改為 **post-product 的選項**，**不再是 v4 主線**。

---

## 產品目標（v4）

**唯一目標：做出一個真的好用的居家收納 app。**

衡量好用的三件事：

1. **錄入零摩擦** — 拍照 / 文字輸入登錄一個物品 ≤ 10 秒，使用者不抗拒每天打開。
2. **建議真的有用** — 建議是「我下一步就可以動手做」，而不是「漂亮話 / 道理」。
3. **回訪有理由** — 不只是登錄工具；變動家裡狀態時，使用者會想開 app。

任何不直接服務這三件事的功能 / 商業設計，**v4 期間不做**。

### 為什麼下架變現線

- 變現線會逼迫做「為了付費而做」的功能（配額、付費 paywall、訂閱金流、合約談判），這些都不會讓 app 變更好用，反而拖節奏。
- 沒有 product-market fit 前談變現是顛倒因果；先確認有人離不開，再談付錢。
- 工程資源稀缺，把每一週投在「使用者實際打開時體驗變好」的事情上。

---

## 里程碑總覽（v4）

| # | 名稱 | 主要交付 | 狀態 |
|---|---|---|---|
| M1 | 骨架 | Expo 專案 + 5 tab + AsyncStorage CRUD | ✅ ship（commit `618b09b`） |
| M2 | 可用 MVP | 物品↔空間關聯 + 示範資料 + 標籤列印 | ✅ ship（commit `fc7f9bf` / `7268cec`） |
| M3 | 方法論引擎 | JSON 規則 + 切換 UI + 2 套示範方法論（**內建免費**） | ✅ ship（commit `40cfa41`） |
| M4 | Session + Snapshot | 防重複計算的根本架構 | ✅ 架構 ship（commit `4cbd8aa`+`dfaf2fc`+`9984df7`） · ⚠️ UX 部分延後 |
| M5 | Claude Vision | 拍照辨識 → detection proposal 進 session | ✅ 架構 ship（commit `0ed0f66`） · ⚠️ UX 部分延後（無配額限制，內部 dev key 即可） |
| **M5.5** | **體驗精煉**（**v4 新主線**） | M4/M5 延後 UX 補完 + 錄入摩擦壓到 ≤ 10 秒 + 真機驗證 | ⏳ next up |
| **M6** | **使用者煙霧測試** | 找 5-10 位非團隊成員實際用 2 週，蒐集卡關點 | ❌ 未啟動 |
| M0.5 | 工程衛生 | CI / 真機驗證 / 效能 profiling / App Icon | ❌ 未啟動（橫切） |
| ~~M6 舊~~ | ~~方法論內容變現~~ | ~~邀請收納師 / 授權合約 / 訂閱金流~~ | 🗄️ **v4 下架**（材料保留於 `docs/m6-outreach/`，待 v5 評估） |
| ~~M7 舊~~ | ~~客製收納箱銷售~~ | ~~箱規格 / 訂單 / 雷雕~~ | 🗄️ **v4 下架** |
| ~~M8 舊~~ | ~~雲端 + 上架 + 訂閱~~ | ~~Supabase / EAS / 商店 / Landing / 金流~~ | 🗄️ **拆分**：雲端同步 + 上架留作 v4 後選項；訂閱金流整體下架 |

依賴關係（v4 主線）：M1 → M2 → M3 → M4 → M5 → **M5.5 → M6 煙霧測試**

詳細「已交付 / 已延後」清單見下方 **〈現況 Snapshot〉** 一節。

> **方法論這條線怎麼辦？**
> M3 引擎與內建 2 套方法論（`amberstash-default` 免費 + `konmari-zh` 作為示範）**保留並繼續打磨內容品質**，這是讓建議「真的有用」的核心引擎。
> 邀請外部收納師、簽授權合約、訂閱金流 = **v4 範圍外**。`docs/m6-outreach/` 的材料封存不刪，未來真要做時不用重寫，但**現在不執行**。

---

## 現況 Snapshot

> 隨每次 ship 更新；最後同步：2026-05-17（v4 收斂目標 + M5.5 第一輪「收納師原則」實作完成）
> 規則：完成項目要打 `[x]`、延後項目維持 `[ ]` 並標 `(deferred → M?)`

### ✅ 已 ship

- [x] M1 骨架：Expo 54 / RN 0.81 / TS strict / 5 tab / AsyncStorage CRUD
- [x] M2 物品↔空間關聯：AddItem 空間 chip、ItemsScreen 空間 pill、demo data 載入
- [x] M2 標籤列印：5 空間多選 / 3 尺寸 / Noto Sans TC 900 / QR + PDF + 列印
- [x] M3 方法論引擎：`Methodology` / `Expert` / `DecisionRule` / 規則評估器 + 模板填詞
- [x] M3 2 套示範方法論：`amberstash-default` + `konmari-zh`（v4 下訂閱定價失效，兩者皆作為內建示範方法論）
- [x] M3 建議頁切換 + attribution 卡 + 偏好持久化
- [x] M4 Session + Snapshot 資料模型 + storage CRUD + dedup（IOU > 0.5）+ anomaly 偵測
- [x] M4 AddItem 雙模式：選空間走 session/snapshot、未選 fallback quick-save
- [x] M4 Jest + ts-jest 設定 + 4 個測試 suite（39 tests）
- [x] M5 AI service 層：config / claudeClient / recognizeItems / mockDetections / quota
- [x] M5 三層 backend 回退：proxy / direct / mock
- [x] M5 AddItem「🤖 AI 辨識」按鈕串接 session pendings
- [x] M5 配額管理 + QuotaExceededError + 月份 rollover
- [x] M5 AI service 單元測試（+13 tests，共 52 tests）
- [x] **M5.5-T1 收納師 8 原則第一輪實作**（v4，63 tests）
  - 資料模型：`Item.useFrequency` / `Item.inGoldenZone` / `Space.capacityEstimate`
  - RuleCondition 新增 4 類：`frequencyCount` / `overcapacity` / `zoneMismatch` / `unfrequented`
  - default.ts 加 5 條規則：`capacity-80-warning` / `zone-mismatch-daily` / `daily-zone-good` / `unfrequented-many` / `rarely-many`
  - AddItem：頻率 picker（4 級）+ 黃金區 toggle + 「先清空」hint + 「一進一出」review banner
  - SpacesScreen：容量欄位 + quick presets + 行內填充率顯示（80% 警示變色）
  - ItemsScreen：頻率 pill + 黃金區 pill + 點一下快速設定頻率
  - 對應原則：1（部分）/ 2 UX / 5 / 6 / 8（教育性）/ 7 已 ship
- [x] **M5.5-T1.5 三派全面實作 + lifecycle 切換**（v4，80 tests）
  - 新增 3 個共用 primitive：`Item.color` (12 色 ROYGBIV+中性)、`Item.visibilityTier` (show/stored/shrine)、`Item.placement` (vertical/flat/hanging/standing/rolled)
  - RuleCondition 新增 4 類：`colorDiversity` / `colorCount` / `tierExceeds` / `untieredCount`
  - DecisionContext 新增：`colorCounts` / `categoryColorDiversity` / `dominantColor` / `tierRatios` / `tierCounts` / `untieredCount`
  - Methodology 新增 `lifecyclePhase` 欄位（mindset / deep-clean / maintenance / aesthetic）
  - 4 套方法論完整 ship：
    - amberstash-default（maintenance）— 既有 + 5 條 T1 新規則
    - 怦然心動式 konmari-zh（deep-clean）— 重寫為 10 條規則，五類別順序 + 直立摺 + 同色系
    - 斷捨離 danshari-zh（mindset，新）— 9 條規則，七五一法則 + 三題核心提問 + 消費前暫停
    - The Home Edit home-edit-zh（aesthetic，新）— 9 條規則，彩虹分類 + 透明盒 + 標籤
  - Onboarding：第一次開 app 顯示 4 個 lifecycle 卡片，選了自動套對應方法論
  - SuggestionsScreen：chip 顯示 lifecycle emoji + 階段，attribution 卡顯示階段 badge
  - AddItem：進階屬性 collapsible（顏色 12 色 swatch / 七五一層級 / 擺放方式 picker）
  - ItemsScreen：新增 color pill（含 swatch）+ 七五一 pill
  - demo data：14 件物品全面補新欄位讓四派都能 demo
- [x] **M5.5-T1.7 知識庫擴張 — 廖心筠（台灣本土）+ KC Davis（ADHD 寬容派）**
  - 依台灣收納全景研究報告做第一性原理萃取（見 ADR-010）
  - 新增 2 個 primitive：`Item.associationHint` (free text)、`Item.isHeirloom` (bool)
  - RuleCondition 新增 2 類：`unassociatedCount` / `heirloomCount`
  - 新增 lifecyclePhase：`gentle-reset`（給 ADHD / 心理負擔重者）
  - 新增 2 套方法論：
    - 廖心筠聯想收納 liaohsinyun-zh（maintenance）— 10 條規則，聯想動線 + 華人 8 大文化包袱（祖傳/集點/風水/多代/濕度/米蟲）
    - 寬容派 gentle-zh（gentle-reset）— 9 條規則，5 樣物品法 + 15 分鐘原則 + 不責備 UI 措辭
  - 跨派字眼修正（損失規避）：「未設頻率」→「待你定義頻率」；「丟掉」→「感謝後放手 / 轉送」
  - 跨派規則文字加入：KonMari 拍照留念再放手（Chu & Shu 2023）、KonMari + 斷捨離 20/20 法則
  - Onboarding：5 個 phase 卡片
  - 新增永久知識庫 `docs/methodology-knowledge.md`（10 章節 + 增派 checklist）
- [x] 多機開發環境：`.env.example` / `package-lock.json` 納管 / `.gitignore` 修嚴

### ⚠️ 架構做了但 UX/功能未完整（M5.5 補完）

- [ ] M4 容器歧義 UI（辨識到收納盒時詢問展開／不展開） (deferred → M5.5)
- [ ] M4 低信心強制確認對話（confidence < 0.6 必須點一下） (deferred → M5.5)
- [ ] M5 Streaming 進度條（vision call 5-10 秒，目前只 spinner） (deferred → M5.5)
- [ ] M5 Bbox 預覽 / 編輯 UI（資料層備好，UI 沒畫） (deferred → M5.5)
- [ ] M5 真實 Claude API 端對端驗證（環境沒 key，只跑了 mock + 解析） (deferred → 使用者本機驗)
- [ ] M5 黃金測試集（10 張人工標註照片做 vision 迴歸） (deferred → M5.5，需要使用者提供照片)

### ❌ v4 主線未啟動

- [ ] **M5.5 錄入摩擦 ≤ 10 秒**：AddItem flow 全面計時、優化 tap path
- [ ] **M5.5 真機驗證**：iOS / Android 至少各 1 台跑 smoke test
- [ ] **M5.5-T2 收納師原則第二輪**（依 M6 煙霧測試結果決定是否啟動）：
  - 原則 1 完整版：`Item.usePointOfUseSpaceId`（使用點 ≠ 收納點 → 動線錯位警示）
  - 原則 3 完整版：「5 問 review mode」獨立 screen，逐物品走 5 題輸出淘汰候選
  - 原則 4：`Item.subcategory` + ItemsScreen 一次一類過濾
  - 原則 8 強化版：把目前的教育性 banner 升級為可互動的「淘汰選擇器」
- [ ] **M6 使用者煙霧測試**：找 5-10 位非團隊成員，連用 2 週並蒐集卡關點
- [ ] M0.5 App Icon / Splash / Adaptive Icon PNG（目前用 Expo 預設）
- [ ] M0.5 GitHub Actions CI（push / PR 自動跑 tsc + test + web bundle）
- [ ] M0.5 效能 profiling（大量物品 > 500 筆下 FlatList 表現）

### 🗄️ v4 下架（封存，未來再評估）

> 原 v3 三條變現線相關項目，v4 不執行。材料保留於 `docs/m6-outreach/`，code 不刪。

- [~] ~~M6 真實邀請 3-5 位收納師~~ — outreach 材料已 ship，不執行邀請
- [~] ~~M6 律師 review 授權合約~~ — 無變現需求前不送律師
- [~] ~~M6 訂閱金流（Stripe / IAP）~~ — 整體下架
- [~] ~~M6 方法論列表頁 / 作者頁 UI~~ — 內建 2 套方法論期間不需要列表頁
- [~] ~~M7 客製收納箱（types/box.ts、訂單、SVG outline、雷雕工廠）~~ — 整體下架
- [~] ~~Server-side proxy 部署~~ — 無對外發佈前不需要（dev 用直連 + mock 即可）
- [~] ~~配額 / paywall~~ — 整體下架，內部 dev key 跑即可
- [~] ~~Landing page + waitlist~~ — 無對外發佈前不做
- [~] ~~埋點（PostHog / Mixpanel）~~ — 內測階段用手動訪談蒐集回饋

### 🟡 v4 後可選（不在主線、但保留討論）

- [ ] 雲端同步（Supabase Auth + Postgres）— 多裝置同步是好用 app 的合理延伸，但等煙霧測試確認真有人在用再做
- [ ] 家庭群組 ACL — 同上，依煙霧測試需求決定
- [ ] EAS Build + App Store / Google Play 上架 — 等 M6 煙霧測試結束、產品穩定再走
- [ ] 隱私政策 / 服務條款 — 上架前一步補

### 🩺 M0.5 工程衛生（橫切，隨時可補）

- [ ] App Icon / Splash / Adaptive Icon PNG（目前用 Expo 預設）
- [ ] GitHub Actions CI（push / PR 自動跑 tsc + test + web bundle）
- [ ] E2E 測試（Detox / Maestro）
- [ ] 真實 iOS / Android 模擬器跑 smoke test（環境只跑得了 web bundle）
- [ ] 效能 profiling（大量物品 > 500 筆下 FlatList 表現）
- [~] ~~`KONMARI_METHODOLOGY` placeholder 換真實授權~~ — v4 下架；保留為示範方法論

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
- 環境變數：dev key 直連即可，v4 不部署 proxy
- `services/ai/recognizeItems.ts`：base64 上傳 → 結構化回傳 `Detection[]`
- AddItem 加「AI 識別」按鈕，把結果灌進 session
- ~~免費配額（每月 N 次，超過導訂閱）~~ **v4 下架**：無變現需求，配額限制無意義
- Streaming 進度條（vision call 可能 3-8 秒） → 移到 **M5.5**

### 驗收標準
- [ ] 上傳一張衣物照片，5-10 秒內回傳結構化 detection
- [ ] 低信心 detection 在 UI 上以警示樣式呈現
- [ ] AI 結果 100% 經過 M4 session 確認流程才會寫入 snapshot

### 驗收方法
- 層 1 + 層 2 + 層 3（mock claudeClient 的單元測試）
- 黃金測試集 → 移到 **M5.5**
- 層 4 手動：找一個真實抽屜拍照，看建議是否合理

---

## 收納師 8 原則對應表

> 收納師整理邏輯的 8 條原則 → app 落地對應。
> v4 M5.5-T1 已 ship 第一輪實作（5/8 完整、2/8 部分、1/8 不做）。

| # | 原則 | 第一性原理 | App 落地（已 ship） | 後續迭代 |
|---|---|---|---|---|
| 1 | 以人為中心（動線） | 物品該放哪是人的函數 | `Item.useFrequency` ✅ | M5.5-T2：`usePointOfUseSpaceId` |
| 2 | 全部拿出來 | 局部盤點 = 假信心 | session 入口 hint「先清空」✅ | — |
| 3 | 5 個篩選提問 | 無結構化 prompt = 預設保留 | rule `rarely-many` 文字內列出 5 題 🟡 | M5.5-T2：review mode screen |
| 4 | 分層分類 | 工作記憶 ~7 件 | — | M5.5-T2：`Item.subcategory` + 過濾 |
| 5 | 黃金區法則 | 物理省力 = 頻率 × 取物成本 | `Item.inGoldenZone` + 4 條規則 ✅ | — |
| 6 | 80% 留白原則 | 100% 滿 = 沒緩衝 | `Space.capacityEstimate` + 警示 ✅ | — |
| 7 | 可視化 / 標籤化 | 看不見 = 不存在 | 標籤列印 + 透明箱建議 ✅ | — |
| 8 | 一進一出 | 流入 > 流出 = 熵增 | commit review banner（教育性）🟡 | M5.5-T2：互動式淘汰選擇器 |

### 第一性原理推導出的共用底層欄位

兩個欄位解鎖 5 條原則：

- **`Item.useFrequency`**（daily / weekly / monthly / rarely）→ 解鎖 1 / 5 / 8
- **`Space.capacityEstimate`**（粗估件數）→ 解鎖 5 / 6

這兩個欄位是「第一性思考」的結論 — 不要為每條原則做獨立資料模型，找出共用 primitive，一處變更全面解鎖。

---

## 四派全面支援（M5.5-T1.5 已 ship）

四派同時內建，靠 `Methodology.lifecyclePhase` 對應整理流程的四階段。使用者依當前階段切換，不是同時開啟 — 因為流派的「聲音」需要一致（KonMari「全部拿出來」vs 斷捨離「每天一點」會打架）。

| 派別 | id | lifecyclePhase | 何時用 |
|---|---|---|---|
| Amber Stash 通用 | `amberstash-default` | maintenance | 日常維持 |
| 斷捨離（山下英子）| `danshari-zh` | mindset | 想改變消費 / 對物品的想法 |
| 怦然心動式（近藤）| `konmari-zh` | deep-clean | 想一次徹底整理 |
| The Home Edit | `home-edit-zh` | aesthetic | 已減量完，想視覺升級 |

### 三派落地對應的共用 primitive

| primitive | 解鎖的派 / 規則 |
|---|---|
| `Item.color` (12 色) | Home Edit 彩虹分類、KonMari 同色系收納 |
| `Item.visibilityTier` (show/stored/shrine) | 斷捨離七五一法則（7 成看見 / 5 成收 / 1 成念）|
| `Item.placement` (vertical/flat/hanging/standing/rolled) | KonMari 直立摺、工具站立法 |

加上既有 `useFrequency` + `inGoldenZone` + `capacityEstimate`，**5 個 Item 欄位 + 1 個 Space 欄位** 完整支撐四派所有可規則化動作。

### Onboarding 流程
第一次開 app 顯示 4 個 lifecycle 卡片 → 使用者點一個 → 自動套對應方法論 + `onboarded: true`。可跳過 = 用 default。之後在「建議」tab 隨時切換。

---

## M5.5 · 體驗精煉（v4 next up）

### 目標
把 M4 / M5 已有架構但 UX 沒做完的部分補完，**並把錄入摩擦壓到 ≤ 10 秒**。讓 app 達到「我願意每天打開」的水準。

### 範圍

**T1（已 ship）— 收納師 8 原則第一輪落地**
見上方「收納師 8 原則對應表」。

**M4/M5 延後 UX 補完**
- 容器歧義 UI（辨識到收納盒時詢問展開／不展開）
- 低信心強制確認對話（confidence < 0.6 必須點一下）
- Vision call streaming 進度條
- Bbox 預覽 / 編輯 UI

**錄入摩擦優化**
- AddItem flow 全面計時：拍照、輸入、儲存各環節秒數
- 砍掉非必要欄位 / tap、預填合理預設值
- 頻率 picker 預設值（依分類給一個合理預設）
- 「再來一個」快速連續錄入模式

**真機驗證**
- iOS 模擬器或實機跑 smoke test
- Android 模擬器或實機跑 smoke test

**Vision 品質迴歸**
- 黃金測試集 `tests/golden-photos/`（10 張人工標註照片）
- 跑 AI 比對：誤差容忍 ±20% 數量、類別命中率 > 80%
- **此項目需使用者提供照片**

### 驗收標準
- [ ] 從 launcher 點開 app 到「新增完一個物品」≤ 10 秒（含拍照）
- [ ] 容器歧義 / 低信心 / streaming / bbox 四個 UI 都跑得通
- [ ] iOS + Android 至少各 1 台跑得起來、5 tab 不 crash
- [ ] 黃金測試集跑過，類別命中率 > 80%

### 驗收方法
- 層 4 手動：自己用 2 週，每天至少錄入 5 件物品，記錄卡關
- 層 1-3 不退化

---

## M6 · 使用者煙霧測試（v4 主線）

> **注意**：v4 的 M6 = **使用者煙霧測試**，不是 v3 的「方法論內容啟動」。原 v3 的 M6（收納師授權 / 訂閱金流）已 v4 下架，封存於下方「已下架里程碑」段與 `docs/m6-outreach/`。

### 目標
找出「真實使用者離不離得開這個 app」。蒐集卡關點 → 回饋到下一輪迭代。

### 範圍
- 招募 5-10 位非團隊成員（家人、朋友、同事均可，但**不是工程師**）
- 連續使用 2 週
- 每位使用者錄入自己家至少 1 個空間 + 10 件物品
- 每週 1 次 15 分鐘訪談（電話或文字）

### 驗收標準
- [ ] 5-10 位實際完成 2 週測試
- [ ] 至少 3 位回答「我會繼續用 / 推薦給朋友」
- [ ] 蒐集到具體卡關清單（依嚴重度排序）
- [ ] 依卡關清單規劃下一輪迭代（v5 plan 起點）

### 驗收方法
- 層 5 使用者煙霧：直接訪談 + 觀察實際使用錄影 / 截圖
- 出口指標：訪談結果決定 v5 主線是「繼續打磨」還是「擴展功能」

### 開放問題
- 找誰測？（最好包含至少 1 位非科技背景使用者）
- 怎麼觀察？（自陳 vs. 看實際操作）

---

## 🗄️ 已下架的里程碑（v3 → v4 封存）

以下 milestones 在 v3 規劃中存在，**v4 整體下架**。code / 文件保留不刪，未來真要做時不必重寫。

### ~~M6 舊 · 方法論內容變現~~
- 邀請 3-5 收納師、授權合約、訂閱金流
- 封存原因：產品未達 PMF 前談內容授權與訂閱是顛倒因果
- 材料位置：`docs/m6-outreach/`（5 份文件保留）

### ~~M7 舊 · 客製收納箱~~
- `types/box.ts` / 訂單流程 / SVG outline / 雷雕工廠合作
- 封存原因：實體 SKU 需要供應鏈與庫存管理，遠離「app 是否好用」核心

### ~~M8 舊 · 雲端 + 上架 + 訂閱~~
- 拆分：
  - 雲端同步、Auth、EAS Build、商店上架 → v4 後選項（見現況 Snapshot 🟡 區）
  - 訂閱金流、Landing waitlist、埋點 → 整體下架

---

## ADR 決策日誌

### ADR-001 · 選 Expo + React Native
跨平台一份碼、Expo 內建拍照/列印/分享/storage、未來上架路徑清楚。

### ADR-002 · 先用 AsyncStorage 不上雲
MVP 階段 UX 驗證 > 多裝置同步。Repository 介面解耦，M8 換 Supabase 只改一層。

### ADR-003 · 標籤輸出選 HTML + expo-print 而非 SVG-only
HTML/CSS 開發迭代快、列印 + PDF 一條路徑兩用途。雷雕級 SVG outline 留到 M7。

### ADR-004 · ~~inventory 免費、AI 推薦付費~~ → v4 撤銷
- v3 原規劃：inventory 免費（資料壁壘），AI 推薦付費（hero hook）
- **v4 撤銷**：產品未達 PMF 前談付費鉤子是顛倒因果；v4 全部功能對使用者免費，先確認有人離不開

### ADR-005 · 方法論引擎保留、商業化下架（v4 修訂）
- v3 原規劃：邀請收納師授權 → 訂閱變現
- **v4 修訂**：方法論引擎本身（JSON 規則 + 切換 UI + 內建 2 套示範方法論）是讓建議「真的有用」的核心，**保留**
- 邀請外部收納師 / 簽授權合約 / 訂閱金流 = v4 範圍外
- 內建的 `amberstash-default` + `konmari-zh`（作為示範方法論）持續打磨內容品質
- 三方市場（使用者 / 收納師 / 工廠）= post-PMF 才有意義的飛輪，現在不追

### ADR-006 · 方法論用 JSON 結構化規則而非純 prompt
- 規則離線可跑（無 LLM 也穩定）
- 規則可單元測試 / 衝突檢查
- LLM 跟規則並存（`systemPrompt` 給 LLM、`rules` 給規則式）
- 收納師填表單比寫提示工程簡單

### ADR-007 · Session + Snapshot 而非累加模型
累加模型結構性無法避免重複計算。Snapshot 不可變、Session 提供「拍照 → 提案 → 確認」中介層。

### ADR-008 · ~~M5 / M6 並行而非串行~~ → v4 失效
- v3 假設：M5 工程 + M6 供應鏈並行省時段
- v4 撤銷：M6 舊（供應鏈 / 收納師授權）整體下架；v4 主線改為 M5 → M5.5 → M6 新（使用者煙霧測試）線性走

### ADR-009 · v4 收斂目標到「先做出一個好用的 app」
- 觸發：v3 的三條變現線在工程節奏上拖累「app 是否好用」的核心驗證
- 決策：產品目標收斂為單一指標 — 5-10 位真實使用者連用 2 週後願意推薦
- 連動下架：M6 舊（內容變現）、M7 舊（客製箱銷售）、M8 訂閱金流 / 埋點 / Landing waitlist
- 連動保留：M3 方法論引擎（讓建議真有用的核心）、M5 Claude Vision（壓低錄入摩擦的關鍵）
- 可逆：若 M6 使用者煙霧測試驗證 PMF，v5 可重新評估啟用任一變現線（材料 / code 都保留）

### ADR-010 · 多派內建 + lifecycle 切換、不採訂閱付費
- 觸發：使用者要求支援三派 KonMari / 斷捨離 / Home Edit，後續又加入台灣收納全景報告（廖心筠 / KC Davis / 心理機制證據）
- 決策：
  - **6 派全部內建免費**（amberstash-default、斷捨離、KonMari、廖心筠、Home Edit、寬容派）
  - 方法論加 `lifecyclePhase` 欄位，**單一活躍方法論 + lifecycle 切換**，不是同時啟用多派（聲音衝突）
  - 第一次開 app 強制 onboarding 5 卡片選 phase，可跳過用 default
  - 跨派引用學術 / 心理機制證據（損失規避 / 稟賦效應 / Chu & Shu 2023 / 20/20 法則）增強文字說服力
- 拒絕的設計：
  - 「同時啟用多派」— 聲音衝突無法解（KonMari 全部拿出來 vs 斷捨離每天一點）
  - 「方法論訂閱付費」— 違反 ADR-009 v4 目標
  - 「為每派加獨立資料欄位」— 違反第一性原理；萃取共用 primitive（6 Item + 1 Space 欄位 = 6 派全支援）
- 知識永久保存：`docs/methodology-knowledge.md`（10 章節 + 增派 checklist）— 未來增派時的單一參考點
- 可逆：lifecyclePhase 可隨時 toggle、方法論可隨時新增；訂閱金流 v5 可重新評估

---

## Onboarding 摘要

新加入專案的 AI 助手 / 設計師依序看：

1. `README.md` — 怎麼跑起來
2. `docs/competitive-analysis.md` — 為什麼這個產品有市場
3. `docs/pitch-brief.md` — 視覺方向（注意：pitch-brief 內的「四角飛輪 / 三變現線」屬 v3 vision，v4 已收斂到「先做出好用的 app」，pitch 內容僅供長期 vision 參考，不要當作 v4 工程目標）
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
