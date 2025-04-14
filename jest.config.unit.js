const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  testMatch: ['**/tests/unit_tests/**/*.test.ts'],
};
