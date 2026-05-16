/**
 * Jest setup — runs before every test file.
 *
 * 1. Silence the known `react-test-renderer is deprecated` warning. We're using
 *    @testing-library/react-native@13 with react-test-renderer 19.x; React 19
 *    flags the renderer as deprecated for production but it's still the only
 *    supported route for component tests. Until callstack migrates we mute.
 */
const originalError = console.error.bind(console);

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('react-test-renderer is deprecated')) {
      return;
    }
    originalError(...(args as Parameters<typeof console.error>));
  };
});

afterAll(() => {
  console.error = originalError;
});
