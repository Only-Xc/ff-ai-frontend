#!/usr/bin/env node
/**
 * Post-change verification script.
 *
 * Catches the four recurring bug categories from this project:
 *   1. Missing antd imports  →  "ReferenceError: Space is not defined"
 *   2. Missing i18n keys     →  menu titles showing raw English fallback
 *   3. TypeScript errors     →  compile-time type mismatches
 *
 * Usage:
 *   node scripts/verify.mjs              # full scan
 *   node scripts/verify.mjs --changed    # only git-changed files (vs HEAD)
 *   node scripts/verify.mjs --staged     # only staged files
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PROJECT_ROOT = join(import.meta.dirname, '..')
const SRC_DIR = join(PROJECT_ROOT, 'src')
let exitCode = 0

function log(msg) {
  console.log(`\n  ${msg}`)
}

function check(label, fn) {
  try {
    fn()
    log(`\x1b[32m✓\x1b[0m ${label}`)
  } catch (err) {
    log(`\x1b[31m✗ ${label}\x1b[0m`)
    console.error(`  ${err.message}`)
    exitCode = 1
  }
}

function collectTargetFiles() {
  const args = process.argv.slice(2)
  const mode = args[0]

  if (mode === '--changed') {
    return execSync('git diff --name-only HEAD', {
      cwd: PROJECT_ROOT, encoding: 'utf8',
    }).trim().split('\n').filter(Boolean)
  }
  if (mode === '--staged') {
    return execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT, encoding: 'utf8',
    }).trim().split('\n').filter(Boolean)
  }
  // Full scan
  return execSync(
    'find src/ -name "*.tsx" -o -name "*.ts" | grep -v node_modules',
    { cwd: PROJECT_ROOT, encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean)
}

// ─── Step 1: TypeScript ───
check('TypeScript compilation (tsc --noEmit)', () => {
  execSync('npx tsc --noEmit', { cwd: PROJECT_ROOT, stdio: 'pipe' })
})

// ─── Step 2: Missing antd imports in JSX ───
check('No undefined antd components in JSX', () => {
  const files = collectTargetFiles().filter(f => f.endsWith('.tsx'))
  const errors = []
  const candidates = [
    'Space', 'Select', 'Drawer', 'Table', 'Form', 'Switch', 'Tag', 'Card',
    'Popconfirm', 'Spin', 'Tooltip', 'Typography', 'ConfigProvider',
    'Tree', 'Radio', 'Button',
  ]

  for (const file of files) {
    const content = execSync(`cat "${join(PROJECT_ROOT, file)}"`, {
      cwd: PROJECT_ROOT, encoding: 'utf8',
    })

    const importMatches = [...content.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]antd['"]/g)]
    const importedNames = new Set(
      importMatches.flatMap(m =>
        m[1].split(',').map(s => s.trim()).filter(Boolean)
      )
    )

    const used = candidates.filter(c => new RegExp(`<${c}[\\s/>]`).test(content))
    const missing = used.filter(c => !importedNames.has(c))

    if (missing.length > 0) {
      errors.push(`${file}: uses <${missing.join(', ')}> but not imported from 'antd'`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n  '))
  }
})

// ─── Step 3: Missing i18n route keys ───
// Only check menu-visible routes; hideInMenu routes (403/404/login) don't need menu translations
check('All menu-visible route titleKeys exist in i18n files', () => {
  const routesContent = execSync(`cat "${join(SRC_DIR, 'router', 'routes.tsx')}"`, {
    cwd: PROJECT_ROOT, encoding: 'utf8',
  })

  // Split into individual route objects and filter menu-visible ones
  const routeBlocks = routesContent.split(/(?=\{[\s\n]*path:)/)
  const titleKeys = []

  for (const block of routeBlocks) {
    if (/hideInMenu:\s*true/.test(block)) continue
    const m = block.match(/titleKey:\s*'([^']+)'/)
    if (m) titleKeys.push(m[1])
  }

  const locales = ['zh-CN', 'en-US', 'ar']
  const errors = []

  for (const locale of locales) {
    const i18nPath = join(SRC_DIR, 'i18n', 'resources', locale, 'routes.ts')
    if (!existsSync(i18nPath)) {
      errors.push(`${locale}/routes.ts: FILE NOT FOUND`)
      continue
    }
    const i18nContent = execSync(`cat "${i18nPath}"`, {
      cwd: PROJECT_ROOT, encoding: 'utf8',
    })

    for (const key of titleKeys) {
      if (!i18nContent.includes(`'${key}'`)) {
        errors.push(`${locale}: missing key "${key}"`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n  '))
  }
})

// ─── Result ───
console.log('')
if (exitCode === 0) {
  console.log('\x1b[32m  ✓ All checks passed\x1b[0m')
} else {
  console.log('\x1b[31m  ✗ Some checks failed\x1b[0m')
}
process.exit(exitCode)
