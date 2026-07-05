import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  stylistic.configs.recommended,
  {
    ignores: [
      '**/build/**',
      '**/node_modules/**',
      '**/.react-router/**',
      '**/public/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        { groups: [['^react', '^@?\\w'], ['^\\u0000']] },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
]
