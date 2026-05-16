/**
 * Smoke tests for ContainerAmbiguityDialog. The branch logic (which detection
 * is a container) lives in `services/containerHeuristic.ts` and is covered in
 * its own suite — these tests focus on dialog wiring.
 */
import * as React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ContainerAmbiguityDialog } from '@/components/ContainerAmbiguityDialog';
import type { Detection } from '@/types/snapshot';

function det(overrides: Partial<Detection> & Pick<Detection, 'id'>): Detection {
  return {
    id: overrides.id,
    name: overrides.name ?? '工具收納盒',
    category: overrides.category ?? 'tools',
    quantity: overrides.quantity ?? 1,
    confidence: overrides.confidence ?? 0.7,
    sourceType: overrides.sourceType ?? 'ai',
    bbox: overrides.bbox,
    photoUri: overrides.photoUri,
    note: overrides.note,
  };
}

test('renders nothing when detection is null', () => {
  const { queryByTestId } = render(
    <ContainerAmbiguityDialog
      visible
      detection={null}
      onExpand={jest.fn()}
      onKeepAsContainer={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  expect(queryByTestId('container-ambiguity-modal')).toBeNull();
});

test('expand button fires onExpand with the detection', () => {
  const onExpand = jest.fn();
  const d = det({ id: 'x' });
  const { getByTestId } = render(
    <ContainerAmbiguityDialog
      visible
      detection={d}
      onExpand={onExpand}
      onKeepAsContainer={jest.fn()}
      onDismiss={jest.fn()}
    />,
  );
  fireEvent.press(getByTestId('container-ambiguity-expand'));
  expect(onExpand).toHaveBeenCalledWith(d);
});

test('keep-as-container button fires onKeepAsContainer with the detection', () => {
  const onKeep = jest.fn();
  const d = det({ id: 'y', name: '塑膠收納籃', category: 'other' });
  const { getByTestId } = render(
    <ContainerAmbiguityDialog
      visible
      detection={d}
      onExpand={jest.fn()}
      onKeepAsContainer={onKeep}
      onDismiss={jest.fn()}
    />,
  );
  fireEvent.press(getByTestId('container-ambiguity-keep'));
  expect(onKeep).toHaveBeenCalledWith(d);
});

test('dismiss button fires onDismiss', () => {
  const onDismiss = jest.fn();
  const { getByTestId } = render(
    <ContainerAmbiguityDialog
      visible
      detection={det({ id: 'z' })}
      onExpand={jest.fn()}
      onKeepAsContainer={jest.fn()}
      onDismiss={onDismiss}
    />,
  );
  fireEvent.press(getByTestId('container-ambiguity-dismiss'));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
