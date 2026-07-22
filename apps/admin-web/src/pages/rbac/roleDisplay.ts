import type { TFunction } from 'i18next'

import type { Role } from '@/api/rbac'
import type { LocaleCode } from '@/i18n/types'

const CJK_PATTERN = /[\u3400-\u9fff]/
const LATIN_PATTERN = /[A-Za-z]/

function getTranslatedRoleName(role: Role, t: TFunction): string {
  const translated = t(`pages.rbac.roleNames.${role.code}`, {
    defaultValue: '',
  })

  return typeof translated === 'string' ? translated.trim() : ''
}

function classifyLocalizedPart(value: string): 'zh' | 'en' | null {
  const hasCjk = CJK_PATTERN.test(value)
  const hasLatin = LATIN_PATTERN.test(value)

  if (hasCjk && !hasLatin) return 'zh'
  if (hasLatin && !hasCjk) return 'en'
  return null
}

function pickLocalizedName(name: string, locale: LocaleCode): string {
  const normalized = name.trim()
  if (!normalized) return normalized

  const candidates: string[] = []
  const parenthesized = /^(.+?)\s*[(（]\s*([^)）]+)\s*[)）]\s*$/.exec(normalized)
  if (parenthesized) {
    candidates.push(parenthesized[1], parenthesized[2])
  } else {
    candidates.push(
      ...normalized.split(/\s*(?:\/|／|\||｜|;|；|\s+-\s+|\s+–\s+|\s+—\s+)\s*/),
    )
  }

  const cleanCandidates = candidates.map((candidate) => candidate.trim()).filter(Boolean)
  const zh = cleanCandidates.find((candidate) => classifyLocalizedPart(candidate) === 'zh')
  const en = cleanCandidates.find((candidate) => classifyLocalizedPart(candidate) === 'en')

  if (locale === 'zh-CN') return zh ?? en ?? normalized
  return en ?? zh ?? normalized
}

export function getRoleDisplayName(role: Role, locale: LocaleCode, t: TFunction): string {
  return getTranslatedRoleName(role, t) || pickLocalizedName(role.name, locale)
}
