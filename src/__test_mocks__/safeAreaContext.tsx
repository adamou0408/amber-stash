import * as React from 'react';

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };

export const SafeAreaView = React.forwardRef<unknown, AnyProps>((props, ref) =>
  React.createElement('SafeAreaView', { ...props, ref }),
);
SafeAreaView.displayName = 'SafeAreaView';

export const SafeAreaProvider = ({ children }: AnyProps) =>
  React.createElement('SafeAreaProvider', null, children);

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}
