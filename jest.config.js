/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  // Picks up both .test.ts (pure functions) and .test.tsx (component-level)
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/__test_mocks__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-uuid$': '<rootDir>/src/__test_mocks__/uuid.ts',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/src/__test_mocks__/asyncStorage.ts',
    '^expo-constants$': '<rootDir>/src/__test_mocks__/expoConstants.ts',
    // Mock heavy RN dependencies so component trees render with react-test-renderer.
    '^react-native$': '<rootDir>/src/__test_mocks__/reactNative.tsx',
    '^react-native-gesture-handler$':
      '<rootDir>/src/__test_mocks__/gestureHandler.tsx',
    '^react-native-safe-area-context$':
      '<rootDir>/src/__test_mocks__/safeAreaContext.tsx',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          strict: true,
          isolatedModules: true,
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
        },
        diagnostics: false,
      },
    ],
  },
};
