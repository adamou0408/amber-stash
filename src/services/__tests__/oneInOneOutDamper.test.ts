import {
  ONE_IN_ONE_OUT_THRESHOLDS,
  defaultOneInOneOutState,
  nextOneInOneOutState,
  shouldShowOneInOneOutBanner,
} from '@/services/oneInOneOutDamper';

describe('oneInOneOutDamper', () => {
  test('defaultOneInOneOutState starts at zero', () => {
    const s = defaultOneInOneOutState();
    expect(s.totalShows).toBe(0);
    expect(s.commitsSinceLastShow).toBe(0);
  });

  describe('shouldShowOneInOneOutBanner', () => {
    test('learning phase: always shows for totalShows < 3', () => {
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 0, commitsSinceLastShow: 0 }),
      ).toBe(true);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 1, commitsSinceLastShow: 0 }),
      ).toBe(true);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 2, commitsSinceLastShow: 99 }),
      ).toBe(true);
    });

    test('reduced phase: shows only when commitsSinceLastShow >= 5', () => {
      // totalShows in [3, 7] = reduced phase
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 3, commitsSinceLastShow: 0 }),
      ).toBe(false);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 3, commitsSinceLastShow: 4 }),
      ).toBe(false);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 3, commitsSinceLastShow: 5 }),
      ).toBe(true);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 7, commitsSinceLastShow: 5 }),
      ).toBe(true);
    });

    test('silent phase: never shows when totalShows >= 8', () => {
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 8, commitsSinceLastShow: 0 }),
      ).toBe(false);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 8, commitsSinceLastShow: 100 }),
      ).toBe(false);
      expect(
        shouldShowOneInOneOutBanner({ totalShows: 999, commitsSinceLastShow: 999 }),
      ).toBe(false);
    });
  });

  describe('nextOneInOneOutState', () => {
    test('wasShown=true increments totalShows and resets commitsSinceLastShow', () => {
      const next = nextOneInOneOutState(
        { totalShows: 2, commitsSinceLastShow: 3 },
        true,
      );
      expect(next).toEqual({ totalShows: 3, commitsSinceLastShow: 0 });
    });

    test('wasShown=false keeps totalShows and increments commitsSinceLastShow', () => {
      const next = nextOneInOneOutState(
        { totalShows: 5, commitsSinceLastShow: 2 },
        false,
      );
      expect(next).toEqual({ totalShows: 5, commitsSinceLastShow: 3 });
    });
  });

  test('end-to-end progression: learning → reduced → silent', () => {
    let state = defaultOneInOneOutState();
    const showLog: boolean[] = [];

    // Simulate 30 commits, banner shown when shouldShow returns true
    for (let i = 0; i < 30; i++) {
      const shown = shouldShowOneInOneOutBanner(state);
      showLog.push(shown);
      state = nextOneInOneOutState(state, shown);
    }

    // First 3 commits → all shown (learning phase)
    expect(showLog.slice(0, 3)).toEqual([true, true, true]);

    // After 3 shows, state.totalShows=3, in reduced phase
    // Next show happens after 5 silent commits
    // Pattern: F F F F F T (= 5 false, 1 true)
    // commits 4-8 (indices 3-7): false; commit 9 (index 8): true
    expect(showLog[3]).toBe(false);
    expect(showLog[7]).toBe(false);
    expect(showLog[8]).toBe(true);

    // Total shows over 30 commits should be 3 (learning) + 5 (reduced) = 8 max
    const totalShown = showLog.filter(Boolean).length;
    expect(totalShown).toBeLessThanOrEqual(8);
    expect(totalShown).toBeGreaterThanOrEqual(7); // depends on timing
  });

  test('thresholds export correct constants for documentation', () => {
    expect(ONE_IN_ONE_OUT_THRESHOLDS.learningPhase).toBe(3);
    expect(ONE_IN_ONE_OUT_THRESHOLDS.silentPhase).toBe(8);
    expect(ONE_IN_ONE_OUT_THRESHOLDS.reducedFrequency).toBe(5);
  });
});
