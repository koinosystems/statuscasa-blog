import type { Config } from "jest";

export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: ["src/index.ts", "src/environment.ts"],
} satisfies Config;
