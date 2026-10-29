import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import next from '@next/eslint-plugin-next';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

/**
 * TypeScript 7 ships the native compiler only; typescript-eslint (used by
 * eslint-config-next) still requires the TypeScript 6 JS API. We keep tsc 7
 * for type checking and use Babel's TypeScript parser for ESLint in the
 * meantime. Once typescript-eslint supports TS 7.1+, this can go back to
 * eslint-config-next's flat presets.
 */
const babelOptions = {
  babelrc: false,
  configFile: false,
  parserOpts: {
    plugins: [
      ['typescript', { disallowAmbiguousJSXLike: false }],
      'jsx',
    ],
  },
};

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'tsconfig.tsbuildinfo'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        ecmaVersion: 'latest',
        babelOptions,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  next.configs['core-web-vitals'],
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off',
    },
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Existing DaisyUI/React patterns that are intentionally not being
      // refactored as part of the dependency upgrade.
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
];
