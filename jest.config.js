module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  coveragePathIgnorePatterns: [
    'tests/MockUrlFetcher.ts',
    'tests/test-functions.ts'
  ]
}
