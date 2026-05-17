# 收納方法論知識庫

> 用途：app 內所有方法論的設計依據與證據基礎。新增方法論前先讀本文件，避免重複造輪子或違反已知原則。
> 最後更新：2026-05-17（v4 三派 + 廖心筠 + KC Davis 完整 ship）
>
> 本文件來自 2026-05 台灣收納全景研究報告的濃縮 + 第一性原理萃取。

---

## 1. 方法論版圖

### 1.1 內建 10 派對照（M5.5-T1.9 後）

| 派別 | id | lifecyclePhase | 創始 | 核心問句 |
|---|---|---|---|---|
| Amber Stash 通用 | `amberstash-default` | maintenance | 系統 | 從結構推出最大公約數 |
| 斷捨離 | `danshari-zh` | mindset | 山下英子（日） | 現在的我需要嗎？ |
| 佐藤可士和超整理術 | `kashiwa-sato-zh` | mindset | 佐藤可士和（日） | 本質問題是什麼？ |
| 怦然心動 KonMari | `konmari-zh` | deep-clean | 近藤麻理惠（日） | 拿起來會心動嗎？ |
| 衣櫥醫生 | `wardrobe-doctor-zh` | deep-clean | 賴庭荷（台灣） | 穿得出去嗎？跟現有的能搭嗎？ |
| 廖心筠聯想收納 | `liaohsinyun-zh` | maintenance | 廖心筠（台灣） | 用的當下，下一個會用什麼？ |
| 小坪數 / 租屋 | `micro-rental-zh` | maintenance | 系統 + 多位收納師整合 | 不能釘牆 / 搬家能不能帶走？ |
| The Home Edit | `home-edit-zh` | aesthetic | Clea & Joanna（美） | 美觀＋功能能否並重？ |
| 寬容派 | `gentle-zh` | gentle-reset | KC Davis（美） | 家為你服務，不是你為家服務 |
| 銀髮 / 遺物 | `elder-zh` | gentle-reset | 廖心筠 + 何安蒔 + 銀髮人因工學整合 | 安全 + 傳承優先於減量 |

**每個 phase 的派數**：mindset 2 / deep-clean 2 / maintenance 3 / aesthetic 1 / gentle-reset 2 = 共 10 派。

### 1.2 未內建（候選 / 暫不做）

| 派別 | 創始 | 為何不內建（理由）|
|---|---|---|
| 無印良品哲學 | MUJI | 純風格哲學，已被多派吸收（家具 / 視覺由 Home Edit 處理）|
| 5S | 工業 | 偏 workspace，跟 kashiwa-sato 重疊度高 |
| Andrew Mellen 三角理論 | Andrew Mellen | 規則已被各派整合（一物一家 = 黃金區、一進一出 = 已有）|
| 20/20 法則 | The Minimalists | 不獨立成派，已寫進 KonMari + 斷捨離規則文字內 |
| FlyLady 15 分鐘 | Marla Cilley | 與 KC Davis 高度重疊，已整合到 gentle-zh |
| Phyllis 零雜物 | 陳虹樺 | 與斷捨離高度重疊（同源 NAPO + KonMari） |
| 何安蒔 | Sasha Ho | 「整理＝面對自我」與斷捨離 mindset 高度重疊；遺物相關已整合到 elder-zh |
| 兒童 / 蒙特梭利 | 多人 | v5 候選（kids constraint 已預備） |

### 1.3 ~~原本不做、M5.5-T1.9 改為內建~~

- ~~佐藤可士和超整理術~~ → 已內建 `kashiwa-sato-zh`（mindset 與斷捨離並列）
- ~~賴庭荷衣櫥醫生~~ → 已內建 `wardrobe-doctor-zh`（deep-clean，appliesTo 限 clothing）
- ~~遺物整理 / 銀髮~~ → 已內建 `elder-zh`（gentle-reset 與 KC Davis 並列）

---

## 2. 第一性原理萃取出的共用 primitive

| primitive | 解鎖的派 / 規則 |
|---|---|
| `Item.useFrequency` (daily/weekly/monthly/rarely) | 所有派（最基礎信號）|
| `Item.inGoldenZone` | Amber Stash 原則 5、廖心筠動線、銀髮黃金區重定義 |
| `Item.color` (12 色) | Home Edit 彩虹、KonMari 同色系、衣櫥醫生主色 70/30 |
| `Item.visibilityTier` (show/stored/shrine) | 斷捨離七五一 |
| `Item.placement` (vertical/flat/hanging/standing/rolled) | KonMari 直立摺、衣櫥醫生三種摺法、工具站立 |
| `Item.associationHint` (free text) | 廖心筠聯想收納 |
| `Item.isHeirloom` (bool) | 廖心筠華人文化、KonMari 紀念類、銀髮 / 遺物 |
| `Space.capacityEstimate` | Amber Stash 80% 原則、斷捨離七五一、小坪數 / 租屋警示 |
| `Space.constraints` (rental/micro/elder/kids) | 小坪數 / 租屋方法論、銀髮方法論 |

**7 個 Item 欄位 + 2 個 Space 欄位 = 完整支撐 10 派**。

設計原則：不為每條方法論加獨立欄位，而是萃取共用原語。新方法論加入時先檢查能否用既有 primitive 表達。

---

## 3. 跨派引用的科學與心理機制

App 文字撰寫時可引用，增加說服力。

### 3.1 損失規避（Loss Aversion）
- 來源：Kahneman & Tversky 1979
- 結論：失去的痛苦 ≈ 獲得快樂的 2 倍
- App 影響：UI 字眼避免「丟掉」「淘汰」，改用「感謝後放手」「轉送」「拍照留念」

### 3.2 稟賦效應（Endowment Effect）
- 來源：Thaler 1980；Knutson 2007 fMRI
- 結論：對自己擁有的物品估值高於同樣物品
- App 影響：適用於所有「捨不得」的物品

### 3.3 Chu & Shu 2023 — 拍照可降低稟賦效應
- 來源：Chu & Shu (2023) 拍照數位化保存 → 物品實體放手時情感負擔顯著降低
- App 影響：KonMari `photo-before-release` 規則直接引用；所有派的紀念品處理都建議「拍照再放手」

### 3.4 20/20 法則
- 來源：The Minimalists (Millburn & Nicodemus)
- 結論：若物品能用 20 美元、20 分鐘內購回 → 可安心放手
- App 影響：用 NT$ 600（台幣本地化）替代 20 美元，寫進 KonMari + 斷捨離 rarely 規則

### 3.5 選擇悖論（Paradox of Choice）
- 來源：Barry Schwartz 2004
- 結論：選項越多越難決定
- App 影響：4 箱法（Keep / Donate / Trash / Storage）強制收斂；onboarding 限 5 個 phase 卡片

### 3.6 決策疲勞 → 15 分鐘原則
- 來源：FlyLady / KC Davis
- 結論：人一天的決策能量有限，把整理切成「不負擔大小」是關鍵
- App 影響：寫進 `gentle-zh` 的 `fifteen-minutes` 規則

### 3.7 囤積症（Hoarding Disorder）= ACC + 腦島迴路異常
- 來源：Tolin et al., Arch Gen Psychiatry, 2012
- 結論：囤積本質是決策與情緒調節問題，不是強迫思考。**強制清除會反向強化症狀**。CBT 是金標準
- App 影響：UI 措辭絕對避免責備（如「未設頻率」改「待你定義頻率」）；不採用 paywall / 罪惡感觸發

### 3.8 雜亂 → 皮質醇 → 壓力（Saxbe & Repetti UCLA 2010）
- 結論：用「雜亂 / 未完成」詞彙描述家的妻子，整日皮質醇曲線平坦（健康不良指標）。雜亂環境延長入睡 20%、夜間擾動多 25%
- App 影響：「家很亂」不是矯情問題 — 是生理壓力源。給使用者使用 app 的合理性

---

## 4. 華人文化特殊包袱（8 大）

廖心筠派專門處理；其他派的台灣使用者也適用。

| # | 包袱 | 對應 app 處理 |
|---|---|---|
| 1 | 戰後物資匱乏的節儉內化 | 廖心筠 `point-collect-trap`（贈品免費 ≠ 需要）|
| 2 | 塑膠袋、紙箱、贈品的稟賦效應 | 同上 |
| 3 | 祖傳家具與遺物的孝道壓力 | 廖心筠 `heirloom-gentle` + `Item.isHeirloom` 欄位 |
| 4 | 風水雙面影響（明財位 / 開光物）| 廖心筠 `fengshui-balance` |
| 5 | 禮尚往來與面子文化 | 暫未處理（v5 候選）|
| 6 | 多代同堂的物品所有權衝突 | 廖心筠 `multi-gen-territory` |
| 7 | 集點 / 夾娃娃文化 | 廖心筠 `point-collect-trap` |
| 8 | 年節習俗的物品累積 | 暫未處理（v5 候選 — 春節大掃除 mode）|

---

## 5. 台灣本土環境特殊性

廖心筠派包含的台灣專屬規則：

- `taiwan-humidity`：亞熱帶氣候衣物防潮四要（洗淨曬乾 / 除濕劑 / 5cm 間距 / 除濕機）
- `kitchen-rice-bug`：米先冷凍 3 小時殺卵的根本解
- `entrance-bundle`：玄關出門組合（鑰匙 + 口罩 + 悠遊卡 + 傘）

未處理但應該知道的：
- 多雨需傘桶式架（已在 shopping rule）
- 浴室「離地收納」防潮鐵則
- 颱風季要囤的物品 vs 平時要減量

---

## 6. ADHD / 心理健康友善設計

KC Davis `gentle-zh` 派專門處理，但所有派的 UI 都應遵守：

### 6.1 UI 措辭規則
- ✅ 「待你定義」「等你決定」「先這樣就好」
- ❌ 「應該」「必須」「未設」「未完成」「錯過」

### 6.2 介面設計原則
- 視覺化收納（透明盒、開放架）— `Item.color` 與 swatch UI 已實作
- 減少決策（4 箱法強制收斂）— v5 候選功能
- 降低門檻（5 樣物品法）— gentle-zh `five-things` 規則
- Body doubling — gentle-zh `body-doubling` 規則

### 6.3 KC Davis 核心信條（寫進文字內）
- "Care tasks are morally neutral"（家務是道德中性的）
- "You don't serve your home; your home serves you"
- "No one ever shamed themselves into better mental health"

---

## 7. 超高齡社會與遺物整理（v5+ 範圍）

2026 台灣進超高齡社會：65 歲以上 ≥ 20%，獨居老人列冊 4.8 萬、實際估 40 萬。

- 廖心筠定位「華人第一位遺物整理師」
- 高雄獨居男子 31.58 公噸廢棄物案例催生孤獨死特殊清潔產業
- 台北市 2024 公告「囤積行為處理原則」，防火巷堆積可罰 4-20 萬

**v5 候選功能**：
- 「生前整理 mode」— 為長輩或自己預先做物品傳承標記
- 「遺物整理 mode」— 給家屬，含「不急著丟，給 3 個月情緒沉澱」工作流

---

## 8. 不採用的設計決策（含理由）

### 8.1 不做「同時啟用多派」
- 拒絕原因：聲音衝突。KonMari「全部拿出來」碰到斷捨離「每天一點」會打架。
- 替代：lifecycle 切換 — 使用者隨時換派，但同一時刻只活一派。

### 8.2 不做「方法論訂閱 / 付費」
- 拒絕原因：v4 ADR-009 已說明 — 變現會逼迫做付費鉤子的功能，傷害「先做出好用 app」的目標。
- 替代：6 派全免費內建。

### 8.3 不做「方法論作者授權邀請」
- 拒絕原因：同上 ADR-009。
- 替代：內建為示範移植，文字明確標明 `placeholder-*` author。v5 + PMF 後才考慮邀請。

### 8.4 不做「4 箱法獨立 screen」（暫緩）
- 暫緩原因：M5.5 第一輪先驗證 6 派引擎與 UX；4 箱法是 v2 候選。

### 8.5 不做「動線資料 onboarding」
- 暫緩原因：原則 1 完整版（usePointOfUseSpaceId）UX 太重，先用 `Item.associationHint` 字串簡化版（廖心筠派的核心已能跑）。

---

## 9. 增派 checklist（給未來想新增方法論的人）

1. [ ] 它的核心問句是什麼？跟既有 6 派有沒有重複（重複就不加）？
2. [ ] 它對應哪個 `lifecyclePhase`？可以共存還是該新增 phase？
3. [ ] 用既有 primitive 能完整表達嗎？不能的話新增哪個 primitive？
4. [ ] 寫 5-10 條 rules + 2-3 條 shopping rules
5. [ ] 加 expert（標 `placeholder-` 前綴）
6. [ ] 加 `methodologies/index.ts`
7. [ ] 加 onboarding 卡片（如果是新 phase）
8. [ ] 寫測試：至少測 empty rule + 1 個 unique rule
9. [ ] 更新本文件 §1.1 對照表
10. [ ] 若引用科學或文化機制，更新 §3 / §4 / §5

---

## 10. 參考文獻（學術 + 主要報導）

- Kahneman & Tversky (1979) — Prospect Theory: Loss Aversion
- Thaler (1980) — Endowment Effect
- Knutson et al. (2007) — Neural Basis of Endowment Effect (fMRI)
- Tolin et al. (2012, Arch Gen Psychiatry) — Hoarding Disorder neural correlates
- Saxbe & Repetti (UCLA CELF, 2010) — Clutter & cortisol in women
- Schwartz (2004) — The Paradox of Choice
- Chu & Shu (2023) — Photography reduces endowment effect
- Steketee & Frost — CBT for Compulsive Hoarding
- KC Davis (2022) — How to Keep House While Drowning
- 公視《獨立特派員》(2024) — 「收納整理成顯學」
- 居家整聊室、廖心筠、Phyllis、何安蒔、末羊子 — 各自著作與公開訪談
