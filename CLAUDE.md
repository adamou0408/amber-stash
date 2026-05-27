# Amber Stash — Claude Code 指南

居家收納推薦 App（React Native + Expo SDK 54）。完整背景見 [README.md](README.md) 與 [docs/development-plan.md](docs/development-plan.md)。

---

## 🚦 動工前必看

### 1. 「現況 Snapshot」是唯一真相來源

不要靠 grep git log 推斷現況。打開 [`docs/development-plan.md`](docs/development-plan.md) 的「現況 Snapshot」section — 那是已 ship / 已延後 / 未啟動的權威紀錄。動完工要更新對應 `[ ]` → `[x]` 並寫上 commit hash。

### 2. 「驗收手法總則」是強制路徑，不是 optional

每個 milestone / PR 都跑 tier 1-3（tsc + bundle + jest）。
**動到 screen / component 就必須加跑 tier 4（Chrome 手動點過清單）**，並把表格貼進 commit message 或 PR description。沒跑 tier 4 = 沒驗收完。

格式見 plan 內「驗收手法總則」section。

---

## ⛔ 已踩過的雷（不要再踩）

- **「bundle 編得過 = 完成」**：錯。M1-M5 累積 10+ 個 UI silent failure 就是因為這個誤判。bundle 編得過 ≠ app 跑得起來。
- **「unit test pass = 完成」**：52 個 jest test 全測純函數，0 個測「按鈕按下去有反應」。pure-function 測試擋不了使用者層 bug。
- **「猜 root cause 替代驗證」**：在 chrome 內點一下 10 秒搞定的事，不要先靠推論「版本不對 / library bug / framework 限制」。Empirical > 推測。
- **「之後再做 CI / E2E」**：plan M0.5 內 CI / Detox / Maestro 已 `[ ]` 超過半年。infra 項目延後本身就是失敗模式，不要再開新的 `[ ]`，要做就現在做。

---

## 🧪 跨平台 API 注意事項

某些 React Native API 在 web (`react-native-web`) 上跟 native 行為不一樣，**不會 throw error 但會 silent fail**：

| API | Native | Web | 怎麼處理 |
|---|---|---|---|
| `Alert.alert` | OK | 預設 no-op | `App.tsx` 已 polyfill 走 `window.alert / confirm`，直接用 |
| `onLongPress` | OK | 桌機鼠標不可靠 | 列表刪除請加 inline ✕ button（已在 4 個 screen 補完） |
| `expo-camera` `getUserMedia` | OK | 需 HTTPS 或 localhost | `192.168.x.x` 上會被拒 → 用 fixture 路徑 (見 README) |
| `expo-print.printAsync` | OK | 無 web 實作 | `LabelsScreen` 已用 `window.open + print()` fallback |
| `expo-sharing` | OK | 無 web 實作 | 顯式 Alert 告知用戶 |
| `AsyncStorage` | OK | 走 `localStorage` | OK，但記得清資料用 `docker compose down -v` |

新增跨平台 API 用法時，先在 web 上實測，不要假設。

---

## 📂 重要檔案速查

- `docs/development-plan.md` — 計畫 / 現況 / 驗收手法（**動工前必讀**）
- `App.tsx` — 入口 + Alert polyfill
- `src/screens/` — 5 個 screen（Items / Spaces / Labels / Suggestions / Shopping）+ AddItem
- `src/services/` — 商業邏輯（dedup / anomaly / methodology / ai vision）
- `src/types/` — 共用型別
- `Makefile` — docker dev workflow 縮寫

## 🛠 常用命令

```bash
make up                                            # docker dev server → http://localhost:8081
make logs                                          # follow Metro log
make test                                          # jest
make shell                                         # 進 container
docker exec amber-stash-dev npx tsc --noEmit       # typecheck
docker exec amber-stash-dev npx expo install --check  # SDK 套件版本健檢
```
