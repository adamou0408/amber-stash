/**
 * 「一進一出」教育性 banner 的顯示頻率動態降低器
 *
 * 問題：commit review 出現的「一進一出」banner 如果每次都顯示，
 *      使用者連續無視 N 次後會變成噪音、產生 banner blindness。
 *
 * 解法：純 counter + threshold 的兩段衰減：
 *   - 學習階段 (totalShows < 3)：每次顯示
 *   - 淡出階段 (3 ≤ totalShows < 8)：每 5 次 commit 才顯示一次
 *   - 靜默階段 (totalShows ≥ 8)：完全停止顯示
 *
 * 累積結果：3 次密集學習 + 5 次稀疏提醒（橫跨 ~28 次 commit）後完全靜默。
 *
 * 為何不做使用者「響應追蹤」：
 *   - banner 沒有 explicit action button（純資訊），無法可靠知道使用者是否真的「響應」
 *   - 假設「commit 而不淘汰 = 沒響應」過於武斷
 *   - 改用「曝光次數」當代理指標 — 簡單可預測、純本機
 *
 * 為何不加重置機制：
 *   - 第一版簡化；如果未來想做「使用者主動要求再看到 → 重置」可在 settings 加按鈕
 */

export type OneInOneOutState = {
  /** 已顯示給使用者看過的總次數 */
  totalShows: number;
  /** 自上次顯示後又 commit 了幾次（用於淡出階段的「每 5 次」邏輯） */
  commitsSinceLastShow: number;
};

export const ONE_IN_ONE_OUT_THRESHOLDS = {
  /** < 此值：學習階段，每次顯示 */
  learningPhase: 3,
  /** ≥ 此值：靜默階段，完全不顯示 */
  silentPhase: 8,
  /** 淡出階段：每 N 次 commit 才顯示一次 */
  reducedFrequency: 5,
} as const;

export function defaultOneInOneOutState(): OneInOneOutState {
  return { totalShows: 0, commitsSinceLastShow: 0 };
}

/**
 * 純函式：依當前 state 決定該不該顯示 banner。
 */
export function shouldShowOneInOneOutBanner(state: OneInOneOutState): boolean {
  const { totalShows, commitsSinceLastShow } = state;
  if (totalShows >= ONE_IN_ONE_OUT_THRESHOLDS.silentPhase) return false;
  if (totalShows < ONE_IN_ONE_OUT_THRESHOLDS.learningPhase) return true;
  // 淡出階段
  return commitsSinceLastShow >= ONE_IN_ONE_OUT_THRESHOLDS.reducedFrequency;
}

/**
 * 純函式：在一次 commit 後計算下一個 state。
 *  - wasShown=true：使用者看過 banner 了 → totalShows+1、計數重置
 *  - wasShown=false：banner 沒顯示（淡出 / 靜默階段）→ totalShows 不變、commitsSinceLastShow+1
 */
export function nextOneInOneOutState(
  state: OneInOneOutState,
  wasShown: boolean,
): OneInOneOutState {
  if (wasShown) {
    return { totalShows: state.totalShows + 1, commitsSinceLastShow: 0 };
  }
  return {
    totalShows: state.totalShows,
    commitsSinceLastShow: state.commitsSinceLastShow + 1,
  };
}
