import js from '@eslint/js'
import oxlint from 'eslint-plugin-oxlint'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export function createTypeScriptEslintConfig({ tsconfigRootDir }) {
  return defineConfig([
    globalIgnores(['dist']),
    {
      files: ['**/*.ts'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        globals: globals.browser,
        parserOptions: {
          project: ['./tsconfig.json'],
          tsconfigRootDir,
        },
      },
    },
    ...oxlint.configs['flat/recommended'],
  ])
}
