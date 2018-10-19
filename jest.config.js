module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/tests/**/*.test.ts"
  ],
  coveragePathIgnorePatterns: [
    "tests/fixture.ts"
  ]
};