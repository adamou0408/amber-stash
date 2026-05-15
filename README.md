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
