module.exports = {
    testEnvironment: "node",
    // testResultsProcessor: "jest-sonar-reporter",
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/bin/",
      "/responseHandler",
      "/config/",
      "/middleware/",
      "/models/",
      "/routes/",
    ],
    maxWorkers: "50%",
    coverageThreshold: {
      global: {
        branches: 75,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    }
  };