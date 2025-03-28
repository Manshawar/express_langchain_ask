module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    moduleFileExtensions: [
        "ts",
        "js",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    testMatch: [
        "**/test/**/*.spec.ts",
    ],
    testEnvironment: "node",
    testPathIgnorePatterns: [
      // 忽略根目录下的 Manshawar-cyber 文件夹
      `/Manshawar-cyber/`
  ]
};
