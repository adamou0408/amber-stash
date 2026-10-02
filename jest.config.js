/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-uuid$': '<rootDir>/src/__test_mocks__/uuid.ts',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/src/__test_mocks__/asyncStorage.ts',
    '^expo-constants$': '<rootDir>/src/__test_mocks__/expoConstants.ts',
    // 把 binary asset require (圖片等) stub 掉 — Metro 真實環境會回 module id (number)
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__test_mocks__/imageAsset.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
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
