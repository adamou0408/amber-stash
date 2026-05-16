/**
 * Minimal in-memory React Native shim for component-level tests.
 *
 * Why not jest-expo: jest-expo requires babel-jest + a heavy setup that conflicts
 * with our existing ts-jest config. We render React trees with react-test-renderer
 * and need only "the component creates the right elements" — not a real layout pass.
 *
 * Coverage: only the primitives our DetectionReviewSheet / BboxOverlay /
 * ContainerAmbiguityDialog / ProgressIndicator use.
 */
import * as React from 'react';

type AnyExtra = { [key: string]: unknown };

function makeHost(displayName: string) {
  type Props = { children?: React.ReactNode } & AnyExtra;
  const Comp = React.forwardRef<unknown, Props>((props, ref) => {
    const { children, ...rest } = props as { children?: React.ReactNode } & AnyExtra;
    return React.createElement(
      displayName,
      { ...rest, ref },
      children as React.ReactNode,
    );
  });
  Comp.displayName = displayName;
  return Comp;
}

export const View = makeHost('View');
export const Text = makeHost('Text');
export const ScrollView = makeHost('ScrollView');
export const Image = makeHost('Image');
export const TextInput = makeHost('TextInput');

// Pressable / TouchableOpacity honor the `disabled` prop in real RN; mirror that
// so fireEvent.press(disabled-pressable) is a no-op like in production.
//
// Mechanics: testing-library detects "disabled" via `aria-disabled` or
// `accessibilityState.disabled`. We forward both, plus strip onPress entirely
// so a parent search doesn't accidentally find an alternate handler.
type PressableProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  onPress?: (...args: unknown[]) => void;
  style?: unknown;
  accessibilityState?: { disabled?: boolean } & Record<string, unknown>;
} & AnyExtra;

function makePressable(displayName: string) {
  const Comp = React.forwardRef<unknown, PressableProps>((props, ref) => {
    const { disabled, onPress, style, children, accessibilityState, ...rest } = props as PressableProps;
    const resolvedStyle =
      typeof style === 'function'
        ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false })
        : style;
    const isDisabled = !!disabled;
    const hostProps: Record<string, unknown> = {
      ...rest,
      ref,
      style: resolvedStyle,
      accessibilityState: { ...(accessibilityState ?? {}), disabled: isDisabled },
      'aria-disabled': isDisabled,
    };
    if (!isDisabled && onPress) {
      hostProps.onPress = onPress;
    }
    return React.createElement(displayName, hostProps, children as React.ReactNode);
  });
  Comp.displayName = displayName;
  return Comp;
}

export const Pressable = makePressable('Pressable');
export const TouchableOpacity = makePressable('TouchableOpacity');
export const Modal = makeHost('Modal');
export const ActivityIndicator = makeHost('ActivityIndicator');
export const SafeAreaView = makeHost('SafeAreaView');

// Animated stub — return a normal value with interpolate() pass-through.
class FakeAnimatedValue {
  _value: number;
  constructor(initial: number) {
    this._value = initial;
  }
  setValue(v: number) {
    this._value = v;
  }
  interpolate(_cfg: { inputRange: number[]; outputRange: (string | number)[] }) {
    return this as unknown as { interpolate: typeof FakeAnimatedValue.prototype.interpolate };
  }
  addListener() {
    return 'listener-id';
  }
  removeListener() {
    /* noop */
  }
  removeAllListeners() {
    /* noop */
  }
  stopAnimation() {
    /* noop */
  }
  resetAnimation() {
    /* noop */
  }
}

function fakeTiming() {
  return {
    start(cb?: () => void) {
      if (cb) cb();
    },
    stop() {
      /* noop */
    },
    reset() {
      /* noop */
    },
  };
}

function fakeLoop() {
  return {
    start() {
      /* noop */
    },
    stop() {
      /* noop */
    },
    reset() {
      /* noop */
    },
  };
}

function makeAnimatedHost(displayName: string) {
  return makeHost(`Animated.${displayName}`);
}

export const Animated = {
  View: makeAnimatedHost('View'),
  Text: makeAnimatedHost('Text'),
  Image: makeAnimatedHost('Image'),
  ScrollView: makeAnimatedHost('ScrollView'),
  Value: FakeAnimatedValue,
  timing: fakeTiming,
  loop: fakeLoop,
  parallel: () => fakeTiming(),
  sequence: () => fakeTiming(),
  delay: () => fakeTiming(),
  spring: fakeTiming,
};

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
  flatten<T>(style: T): T {
    return style;
  },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  hairlineWidth: 1,
};

export const Alert = {
  alert: jest.fn(),
};

export const Platform = {
  OS: 'ios' as const,
  Version: 17,
  select<T>(spec: { ios?: T; android?: T; default?: T }): T | undefined {
    return spec.ios ?? spec.default;
  },
};

export const Dimensions = {
  get(_dim: 'window' | 'screen') {
    return { width: 375, height: 812, scale: 2, fontScale: 1 };
  },
};

export const LayoutAnimation = {
  configureNext: () => undefined,
  Presets: {
    easeInEaseOut: {},
  },
};

export const UIManager = {
  setLayoutAnimationEnabledExperimental: () => undefined,
};
