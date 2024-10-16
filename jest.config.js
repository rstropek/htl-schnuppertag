/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+.tsx?$": ["ts-jest",{ useESM: true}],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};