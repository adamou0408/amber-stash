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

> ⚠️ 第一次 clone 後，`assets/` 內的 icon / splash PNG 還沒推上來，可以執行 `npx create-expo-app tmp --template blank-typescript` 然後把 `tmp/assets/*.png` 複製過來，或先把 `app.json` 內的 `icon` / `splash` / `favicon` 欄位移除。

## 用 Docker Desktop 啟動（含 HMR）

不想在本機裝 Node / Expo CLI，或想要一致的環境，可以直接用 Docker：

```bash
docker compose up --build      # 第一次：build image + 起 dev server
docker compose up              # 之後直接啟動
docker compose down            # 停掉
```

也可以用 `Makefile` 的縮寫（需要先安裝 GNU Make）：

```bash
make up         # 起 dev server (detached)
make logs       # 看即時 log
make shell      # 進 container shell
make test       # 在 container 內跑 jest
make down       # 停掉
make help       # 列出所有 target
```

啟動後打開瀏覽器到 **http://localhost:8081** 就會看到 Expo 的 dev menu，點 web 即可看到 App。
修改 `App.tsx` / `src/**` 任何檔案，Metro 會自動 Fast Refresh，瀏覽器即時更新。

### 在 Chrome 模擬手機排版開發（推薦的 dev 流程）

不用真機 / 不用 Expo Go，整個流程在 Chrome 就跑得起來：

1. 開 `http://localhost:8081`（直接 web 模式進 App）。
2. 按 `F12` 開 DevTools → 左上角點「Toggle device toolbar」（或 `Ctrl + Shift + M`）。
3. 上方下拉選 iPhone / Pixel 等裝置 → 立刻看到手機尺寸排版。
4. 改 source code，Metro 自動 reload，UI 即時更新。

**相機怎麼辦？** Web 上 `expo-camera` 走 `getUserMedia`，需要 HTTPS context；
而 `http://localhost` 雖然算 secure context 可以開相機，但 `http://192.168.x.x` 不算。
所以 dev 階段我們改用 **fixture 注入** 來模擬「拍照 → AI 辨識完」的結果：

- 新增物品頁 → 按「📋 載入測試 fixture」→ 選一份預設場景。
- 場景定義在 `src/services/fixtures/detectionFixtures.json`，可以自己加新的。
- 抽象層在 `src/services/detectionSource/`，之後接真實相機或別的來源都從這個介面切入。

這條 fixture 路徑跳過了 camera + AI API call，純前端流程，跑 e2e demo 也不會花配額。

### 真機 / Expo Go 連線

container 內的 dev server 預設只對 `localhost` 暴露。要讓手機掃 QR 連上 Metro：

1. 在 host 機器跑 `ipconfig`（Windows）或 `ifconfig` / `ip a`（mac/linux）查區網 IP。
2. 編輯 `docker-compose.yml`，把 `REACT_NATIVE_PACKAGER_HOSTNAME` 那行打開，填入該 IP。
3. `docker compose up` 後手機 Expo Go 掃 QR（注意手機跟電腦要在同一個 wifi）。

### HMR 失效時的排查

- image 已內建 **watchman**，Metro 會優先用它監聽檔案變動，比 fs.watch fallback 可靠很多。
- 但 Docker Desktop **對 Windows host filesystem 的 bind mount 不保證所有 fs event 都會傳達** — 如果改檔案後瀏覽器沒更新：
  - 在跑 dev server 的 terminal 按 `r` 手動 reload。
  - **推薦做法**：把專案放到 WSL2 內（例如 `\\wsl$\Ubuntu\home\<you>\amber-stash`），那邊是 Linux native filesystem，inotify event 不會掉。
- 改完套件（`package.json`）後要重 build：`docker compose up --build`。
- `node_modules` 是 named volume 隔離的，host 端看不到、也不會被污染；想完全清空（含快取）：`docker compose down -v`。

### 環境變數

`docker-compose.yml` 的 `env_file` 用了 `required: false` 語法，需要 **Docker Compose v2.24+ / Docker Desktop 4.27+**。
如果你的版本較舊報錯，先複製一份 `.env`：`copy .env.example .env`（Windows）/ `cp .env.example .env`（mac/linux），然後把 compose 的 env_file 改成簡單寫法 `- .env`。

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
