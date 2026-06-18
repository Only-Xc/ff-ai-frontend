import { createTypeScriptEslintConfig } from '@ff-ai-frontend/tooling/eslint/typescript'

export default createTypeScriptEslintConfig({
  tsconfigRootDir: import.meta.dirname,
})
