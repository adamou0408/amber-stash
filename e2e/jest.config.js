/**
 * Detox-specific Jest config.
 *
 * Separate from the root `jest.config.js` because Detox needs:
 *   - jest-circus runner (default since Jest 27, made explicit here)
 *   - much longer timeouts (real device boot + app install)
 *   - Detox global setup / teardown hooks
 *   - a different rootDir so unit tests under src/ are not collected
 */

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  transform: {
    '\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
          isolatedModules: true,
          skipLibCheck: true,
          types: ['node', 'jest', 'detox'],
        },
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
};
