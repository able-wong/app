const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/integration_tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration_tests/setup.ts'],
};
