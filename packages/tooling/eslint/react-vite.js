import js from '@eslint/js'
import oxlint from 'eslint-plugin-oxlint'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export function createReactViteEslintConfig({ tsconfigRootDir }) {
  return defineConfig([
    globalIgnores(['dist']),
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        tseslint.configs.stylisticTypeChecked,
        reactX.configs['recommended-typescript'],
        reactDom.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        globals: globals.browser,
        parserOptions: {
          project: ['./tsconfig.node.json', './tsconfig.app.json'],
          tsconfigRootDir,
        },
      },
      rules: {
        'react-hooks/set-state-in-effect': 'off',
        'react-x/set-state-in-effect': 'off',
      },
    },
    ...oxlint.configs['flat/recommended'],
  ])
}
