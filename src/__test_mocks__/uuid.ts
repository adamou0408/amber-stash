/**
 * Deterministic uuid mock for Jest. Returns sequential ids so tests are stable.
 * Matches the surface of react-native-uuid's default export: { v4() => string }.
 */
let counter = 0;

const uuid = {
  v4(): string {
    counter += 1;
    return `mock-uuid-${counter}`;
  },
  /** test helper — not part of real API */
  __reset(): void {
    counter = 0;
  },
};

export default uuid;
