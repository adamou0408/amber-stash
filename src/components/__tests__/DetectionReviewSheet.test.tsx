/**
 * Component-level tests for DetectionReviewSheet.
 *
 * Uses @testing-library/react-native with our in-process RN mock (see
 * jest.config moduleNameMapper). Verifies:
 *   - low-confidence rows render the 「需確認」 badge and warning banner
 *   - commit button is disabled until all low-conf rows are confirmed
 *   - swipe → delete triggers the onRemove callback
 *   - tapping a row expands the inline editor and patches propagate to parent
 *   - removing the only blocking row re-enables commit
 *
 * The pure gating logic lives in `src/services/reviewState.ts` and is
 * additionally smoke-tested here.
 */
import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DetectionReviewSheet } from '@/components/DetectionReviewSheet';
import {
  canCommitReview,
  pendingLowConfidence,
  isLowConfidence,
} from '@/services/reviewState';
import type { Detection } from '@/types/snapshot';

function det(overrides: Partial<Detection> & Pick<Detection, 'id'>): Detection {
  return {
    id: overrides.id,
    name: overrides.name ?? '物品',
    category: overrides.category ?? 'other',
    quantity: overrides.quantity ?? 1,
    confidence: overrides.confidence ?? 0.9,
    sourceType: overrides.sourceType ?? 'ai',
    bbox: overrides.bbox,
    photoUri: overrides.photoUri,
    note: overrides.note,
  };
}

describe('reviewState (gating logic)', () => {
  test('isLowConfidence threshold = 0.6', () => {
    expect(isLowConfidence({ confidence: 0.59 })).toBe(true);
    expect(isLowConfidence({ confidence: 0.6 })).toBe(false);
    expect(isLowConfidence({ confidence: 0.9 })).toBe(false);
  });

  test('pendingLowConfidence excludes confirmed ids', () => {
    const list = [
      det({ id: 'a', confidence: 0.5 }),
      det({ id: 'b', confidence: 0.9 }),
      det({ id: 'c', confidence: 0.3 }),
    ];
    expect(pendingLowConfidence(list, new Set())).toEqual(['a', 'c']);
    expect(pendingLowConfidence(list, new Set(['a']))).toEqual(['c']);
    expect(pendingLowConfidence(list, new Set(['a', 'c']))).toEqual([]);
  });

  test('canCommitReview gates on confirmation', () => {
    const list = [
      det({ id: 'a', confidence: 0.5 }),
      det({ id: 'b', confidence: 0.9 }),
    ];
    expect(canCommitReview([], new Set())).toBe(false);
    expect(canCommitReview(list, new Set())).toBe(false);
    expect(canCommitReview(list, new Set(['a']))).toBe(true);
  });
});

describe('DetectionReviewSheet — low-confidence gating', () => {
  test('shows pending banner and reports disabled commit when low-conf unconfirmed', () => {
    const { getByTestId, queryByTestId } = render(
      <DetectionReviewSheet
        detections={[
          det({ id: 'a', confidence: 0.5, name: '不確定的物品' }),
          det({ id: 'b', confidence: 0.9, name: '確定的物品' }),
        ]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onCommit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByTestId('pending-low-confidence-banner')).toBeTruthy();
    expect(getByTestId('row-needs-confirm-a')).toBeTruthy();
    expect(queryByTestId('row-needs-confirm-b')).toBeNull();

    // The commit button is rendered disabled (verified via accessibilityState
    // — same signal screen readers and gesture recogniser see in production).
    const commitBtn = getByTestId('review-commit');
    expect(commitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  test('confirming all low-conf rows enables commit', () => {
    const onCommit = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <DetectionReviewSheet
        detections={[
          det({ id: 'a', confidence: 0.5, name: '不確定 A' }),
          det({ id: 'b', confidence: 0.4, name: '不確定 B' }),
        ]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onCommit={onCommit}
        onCancel={jest.fn()}
      />,
    );

    // expand a row to expose the inline confirm button
    fireEvent.press(getByTestId('detection-row-a'));
    fireEvent.press(getByTestId('row-confirm-btn-a'));
    expect(getByTestId('row-confirmed-a')).toBeTruthy();

    fireEvent.press(getByTestId('detection-row-b'));
    fireEvent.press(getByTestId('row-confirm-btn-b'));

    // banner gone
    expect(queryByTestId('pending-low-confidence-banner')).toBeNull();

    fireEvent.press(getByTestId('review-commit'));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('high-confidence-only list allows commit immediately', () => {
    const onCommit = jest.fn();
    const { getByTestId } = render(
      <DetectionReviewSheet
        detections={[det({ id: 'a', confidence: 0.95, name: '高信心' })]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onCommit={onCommit}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId('review-commit'));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});

describe('DetectionReviewSheet — row interactions', () => {
  test('tapping a row expands the editor and patches propagate up', () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <DetectionReviewSheet
        detections={[det({ id: 'a', confidence: 0.95, name: '舊名稱' })]}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
        onCommit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('detection-row-a'));
    fireEvent.changeText(getByTestId('row-edit-name-a'), '新名稱');
    expect(onUpdate).toHaveBeenCalledWith('a', { name: '新名稱' });

    fireEvent.changeText(getByTestId('row-edit-qty-a'), '12');
    expect(onUpdate).toHaveBeenCalledWith('a', { quantity: 12 });

    fireEvent.press(getByTestId('row-edit-cat-a-clothing'));
    expect(onUpdate).toHaveBeenCalledWith('a', { category: 'clothing' });
  });

  test('swipe-right delete fires onRemove', () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      <DetectionReviewSheet
        detections={[det({ id: 'a', confidence: 0.95 })]}
        onUpdate={jest.fn()}
        onRemove={onRemove}
        onCommit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId('row-swipe-delete-a'));
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  test('removing the only blocking low-conf row re-enables commit', () => {
    const onCommit = jest.fn();
    const onRemove = jest.fn();

    // Use a controlled detections list so we can simulate removal across renders.
    function Harness() {
      const [list, setList] = React.useState<Detection[]>([
        det({ id: 'low', confidence: 0.3 }),
        det({ id: 'hi', confidence: 0.9 }),
      ]);
      return (
        <DetectionReviewSheet
          detections={list}
          onUpdate={jest.fn()}
          onRemove={(id) => {
            onRemove(id);
            setList((cur) => cur.filter((d) => d.id !== id));
          }}
          onCommit={onCommit}
          onCancel={jest.fn()}
        />
      );
    }

    const { getByTestId, queryByTestId } = render(<Harness />);
    expect(getByTestId('pending-low-confidence-banner')).toBeTruthy();

    fireEvent.press(getByTestId('row-swipe-delete-low'));
    expect(onRemove).toHaveBeenCalledWith('low');
    expect(queryByTestId('pending-low-confidence-banner')).toBeNull();

    fireEvent.press(getByTestId('review-commit'));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});

describe('DetectionReviewSheet — empty state', () => {
  test('empty list disables commit', () => {
    const { getByTestId, queryByText } = render(
      <DetectionReviewSheet
        detections={[]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onCommit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(queryByText('還沒有 detection — 回上一步加幾筆。')).toBeTruthy();
    expect(getByTestId('review-commit').props.accessibilityState?.disabled).toBe(true);
  });
});
