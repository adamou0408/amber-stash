# Fixture Photo Library

Fixture 展示照片改用 **URL pool** 而非本機 binary（避免 repo 膨脹）。

每個 scenario 在 `src/services/fixtures/detectionFixtures.json` 內帶一個 `photos: string[]` 陣列，每張是 Unsplash CDN 的 base URL。`fixtureSource.buildPhotoUrl()` 動態補上尺寸 / 品質 query string。

每次打開 fixture picker 時 `listFixtures()` 會從各 pool 隨機抽一張，所以同一場景每次看到不同的代表照片。

## 數量

| Scenario | 變化池張數 |
|---|---|
| wardrobe-clothing | 89 |
| desk-stationery | 100 |
| drawer-electronics | 109 |
| kitchen-storage | 107 |
| low-confidence-mix | 120 |
| **共計** | **525** |

## 來源

全部從 [Unsplash](https://unsplash.com) 公開搜尋頁面抓取（CDN base URL，無 query string）。Unsplash License 允許商業用途、不強制 attribution。

## 怎麼擴充

1. 編輯 `scripts/buildPhotoLibrary.js`，在對應 scenario 的 `RAW_PHOTOS` here-string 內加入新的 base URL
2. 跑 `node scripts/buildPhotoLibrary.js`
3. 確認 `src/services/fixtures/detectionFixtures.json` 更新後 commit

加新 scenario 也是改這個 script 的 `SCENARIOS_META`。
