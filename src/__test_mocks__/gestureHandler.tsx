/**
 * Minimal shim for react-native-gesture-handler. Only the surface we use.
 */
import * as React from 'react';

type AnyExtra = { [key: string]: unknown };

type WrapperProps = { children?: React.ReactNode } & AnyExtra;

function makeWrapper(displayName: string) {
  const Comp = React.forwardRef<unknown, WrapperProps>((props, ref) => {
    const { children, ...rest } = props as WrapperProps;
    return React.createElement(displayName, { ...rest, ref }, children as React.ReactNode);
  });
  Comp.displayName = displayName;
  return Comp;
}

export const GestureHandlerRootView = makeWrapper('GestureHandlerRootView');
export const PanGestureHandler = makeWrapper('PanGestureHandler');

type SwipeableProps = {
  children?: React.ReactNode;
  renderRightActions?: () => React.ReactNode;
} & AnyExtra;

export const Swipeable = React.forwardRef<unknown, SwipeableProps>((props, ref) => {
  const { children, renderRightActions, ...rest } = props as SwipeableProps;
  const renderFn = renderRightActions as (() => React.ReactNode) | undefined;
  return React.createElement(
    'Swipeable',
    { ...rest, ref, renderRightActions },
    children as React.ReactNode,
    // Always render the right-actions panel so tests can interact with it.
    renderFn ? renderFn() : null,
  );
});
Swipeable.displayName = 'Swipeable';

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};
