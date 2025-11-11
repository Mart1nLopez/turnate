import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './', //ruta raíz del proyecto
});

const customJestConfig = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  testMatch: ['**/tests/**/*.test.(ts|tsx)'],
};

export default createJestConfig(customJestConfig);
