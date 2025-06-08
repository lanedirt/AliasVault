module.exports = {
  root: true,
  ignorePatterns: ["dist/**", "node_modules/**", "utils/shared/**", "expo-env.d.ts", "*.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: ".",
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "react-native",
    "import",
    "jsdoc",
  ],
  extends: [
    "expo",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react-native/all",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  env: {
    browser: true,
    node: true,
    "react-native/react-native": true,
  },
  globals: {
    __DEV__: "readonly",
    chrome: "readonly",
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/ignore": ["node_modules/react-native/index\\.js"],
    'react-native/components': {
      Text: ['ThemedText'],
    },
  },
  rules: {
    // TypeScript
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/explicit-member-accessibility": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/typedef": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
        prefix: ["I"],
      },
      {
        selector: "class",
        format: ["PascalCase"],
      },
    ],

    // React
    "react/react-in-jsx-scope": "off",
    "react/no-unused-prop-types": "error",
    "react/jsx-no-constructed-context-values": "error",

    // React Hooks
    "react-hooks/exhaustive-deps": "warn",

    // React Native
    "react-native/no-unused-styles": "warn",
    "react-native/split-platform-components": "warn",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-single-element-style-arrays": "warn",

    // Import
    "import/no-unresolved": "error",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",    // Node "fs", "path", etc.
          "external",   // "react", "lodash", etc.
          "internal",   // Aliased paths like "@/utils"
          "parent",     // "../"
          "sibling",    // "./"
          "index",      // "./index"
          "object",     // import 'foo'
          "type"        // import type ...
        ],
        "pathGroups": [
          {
            pattern: "@/entrypoints/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/utils/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/hooks/**",
            group: "internal",
            position: "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always",
        "alphabetize": {
          order: "asc",
          caseInsensitive: true
        }
      }
    ],

    // JSDoc
    "jsdoc/require-jsdoc": [
      "error",
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
      },
    ],
    "jsdoc/require-description": [
      "error",
      {
        contexts: [
          "FunctionDeclaration",
          "MethodDefinition",
          "ClassDeclaration",
          "ArrowFunctionExpression",
          "FunctionExpression",
        ],
      },
    ],

    // Style
    curly: ["error", "all"],
    "brace-style": ["error", "1tbs", { allowSingleLine: false }],
    indent: [
      "error",
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false,
      },
    ],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],
    "no-console": ["error", { allow: ["warn", "error", "info", "debug"] }],
    "spaced-comment": ["error", "always"],
    "multiline-comment-style": ["error", "starred-block"],

    // TODO: this line is added to prevent "Raw text (×) cannot be used outside of a <Text> tag" errors.
    // When adding proper i18n multilingual enforcement checks, the following line should be removed
    'react-native/no-raw-text': 'off',

    // Disable prop-types rule because we're using TypeScript for type-checking
    'react/prop-types': 'off',
  },
};
