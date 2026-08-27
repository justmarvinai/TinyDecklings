import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Engine purity (CLAUDE.md rule 7): `src/engine` and `src/content` must never import
 * React/DOM or reach for ambient randomness/time. RNG and clocks are injected.
 */
const PURE_LAYER_FILES = ['src/engine/**/*.ts', 'src/content/**/*.ts'];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'src/ui/icons/generated'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: PURE_LAYER_FILES,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react/*',
                'react-dom/*',
                'motion',
                'motion/*',
                'howler',
                'zustand',
                'zustand/*',
                '@/ui',
                '@/ui/*',
                '@/state',
                '@/state/*',
                '@/services',
                '@/services/*',
              ],
              message:
                'Engine/content must stay pure: no React, DOM, stores or services (CLAUDE.md rule 7).',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use the injected seeded RNG (engine/rng.ts) — determinism is required.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Inject a Clock instead of reading ambient time (CLAUDE.md rule 7).',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Engine/content must not touch the DOM.' },
        { name: 'document', message: 'Engine/content must not touch the DOM.' },
        { name: 'localStorage', message: 'Persistence belongs in services/.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Inject a Clock instead of reading ambient time (CLAUDE.md rule 7).',
        },
      ],
    },
  },

  {
    files: ['src/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] },
  },

  {
    files: ['scripts/**/*.mjs', 'vite.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // The service worker template runs in a worker, not a page: `self`, `caches`
    // and `clients` are its globals, and there is no DOM in sight.
    files: ['scripts/sw-template.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        // Substituted with the real bundle by scripts/sw-plugin.mjs at build time.
        __PRECACHE__: 'readonly',
        __VERSION__: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },

  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    rules: { 'no-restricted-properties': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },
);
