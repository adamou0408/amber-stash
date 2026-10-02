## 變更摘要

<!-- 1-3 句：這個 PR 解決什麼問題、用什麼方法 -->

## 影響範圍

- [ ] 純後端 / 商業邏輯（不動 UI 可跳過 Tier 4）
- [ ] **動到 screen / component（Tier 4 必填，見下）**
- [ ] 文件 / 配置

## Tier 1-3 驗收（必跑）

- [ ] `npx tsc --noEmit` 通過
- [ ] `npm test` 通過
- [ ] `npx expo export --platform web` 通過

## Tier 4 — Chrome 手動點過清單（動到 screen 必填）

> 規則：開 dev server (`make up`) → 開 chrome `http://localhost:8081` → 對每個動到或新增的入口逐項點過。
> silent fail（按了沒反應 + console 沒 error）視同 bug，在這個 PR 內修掉，不延後。
> 為什麼是這個格式 → 見 [`docs/development-plan.md`](../docs/development-plan.md) 「驗收手法總則」。

| Screen | 入口（按鈕 / chip / 表單 / 長按） | 動作 | 預期 | 實際 |
|---|---|---|---|---|
| (e.g.) ItemsScreen | ＋新增物品 | click | navigate AddItem | ✅ |
|  |  |  |  |  |
|  |  |  |  |  |

## 文件更新

- [ ] `docs/development-plan.md` 對應條目從 `[ ]` 改成 `[x]`，寫上本 PR 的 commit hash
- [ ] 「最後同步」日期 + HEAD 更新
- [ ] N/A（純文件 PR）

## 對 reviewer 的提示

<!-- 重點要看什麼地方？有什麼是你猶豫不決想聽意見的？ -->
