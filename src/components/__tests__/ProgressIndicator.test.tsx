/**
 * ProgressIndicator + useStreamingProgress smoke tests.
 *
 * These ensure stage transitions are observable from the UI so AddItemScreen's
 * "vision-call progress bar" never silently regresses to a plain spinner.
 */
import * as React from 'react';
import { act, render } from '@testing-library/react-native';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useStreamingProgress } from '@/hooks/useStreamingProgress';

describe('ProgressIndicator', () => {
  test('all three stage labels are rendered', () => {
    const { getByTestId } = render(<ProgressIndicator stage={0} />);
    expect(getByTestId('progress-stage-0')).toBeTruthy();
    expect(getByTestId('progress-stage-1')).toBeTruthy();
    expect(getByTestId('progress-stage-2')).toBeTruthy();
  });

  test('stage 1 label shows "AI 分析中"', () => {
    const { getByTestId } = render(<ProgressIndicator stage={1} />);
    expect(getByTestId('progress-stage-1').props.children).toEqual(
      expect.arrayContaining(['… ', 'AI 分析中']),
    );
  });

  test('stage that is "done" hides the shimmer overlay', () => {
    const { queryByTestId } = render(<ProgressIndicator stage="done" />);
    expect(queryByTestId('progress-indicator-shimmer')).toBeNull();
  });

  test('non-done stage shows the shimmer overlay', () => {
    const { getByTestId } = render(<ProgressIndicator stage={0} />);
    expect(getByTestId('progress-indicator-shimmer')).toBeTruthy();
  });

  test('hint text renders when provided', () => {
    const { queryByText } = render(<ProgressIndicator stage={1} hint="這需要 5-10 秒" />);
    expect(queryByText('這需要 5-10 秒')).toBeTruthy();
  });
});

describe('useStreamingProgress', () => {
  test('start() moves to stage 0 immediately', () => {
    const ref: { current: ReturnType<typeof useStreamingProgress> | null } = { current: null };
    function Harness() {
      ref.current = useStreamingProgress({ uploadMs: 10_000, parseDelayMs: 30 });
      return null;
    }
    render(<Harness />);
    expect(ref.current?.stage).toBe('done');
    act(() => {
      ref.current?.start();
    });
    expect(ref.current?.stage).toBe(0);
  });

  test('finish() moves to stage 2 then "done"', () => {
    jest.useFakeTimers();
    const ref: { current: ReturnType<typeof useStreamingProgress> | null } = { current: null };
    function Harness() {
      ref.current = useStreamingProgress({ uploadMs: 10_000, parseDelayMs: 30 });
      return null;
    }
    render(<Harness />);
    act(() => {
      ref.current?.start();
      ref.current?.finish();
    });
    expect(ref.current?.stage).toBe(2);
    act(() => {
      jest.advanceTimersByTime(40);
    });
    expect(ref.current?.stage).toBe('done');
    jest.useRealTimers();
  });

  test('cancel() returns immediately to "done"', () => {
    const ref: { current: ReturnType<typeof useStreamingProgress> | null } = { current: null };
    function Harness() {
      ref.current = useStreamingProgress();
      return null;
    }
    render(<Harness />);
    act(() => {
      ref.current?.start();
    });
    expect(ref.current?.stage).toBe(0);
    act(() => {
      ref.current?.cancel();
    });
    expect(ref.current?.stage).toBe('done');
  });
});
