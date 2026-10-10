import type { Config } from 'jest';
import { defaults } from 'jest-config';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          esModuleInterop: true,
          allowJs: true,
          strict: false,
          noImplicitAny: false,
          jsx: "react-jsx",
          types: ["jest", "node", "testing-library__jest-dom"],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  collectCoverageFrom: [
    'src/engine/**/*.ts',
    'src/store/**/*.ts',
    'src/validation/**/*.ts',
  ],
};

export default config;
