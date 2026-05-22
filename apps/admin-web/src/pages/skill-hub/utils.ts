import { format, isValid, parseISO } from 'date-fns'
import compact from 'lodash-es/compact'
import isPlainObject from 'lodash-es/isPlainObject'
import trim from 'lodash-es/trim'

import type {
  AdminSkillCodeSnippet,
  AdminSkillCreateBody,
  AdminSkillDetail,
  AdminSkillStatus,
} from '@/api/adminSkills'

import type { SkillFormValues } from './types'

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = parseISO(value)

  if (!isValid(date)) return '-'

  return format(date, 'yyyy/MM/dd HH:mm')
}

export function formatCount(value?: number) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0)
}

export function formatSuccessRate(value: number | null) {
  if (value === null) return '-'

  return `${(value * 100).toFixed(1)}%`
}

export function formatNullableText(value?: string) {
  const text = trim(value)

  if (text) return text

  return '-'
}

export function compactText(value?: string) {
  const text = trim(value)

  if (text) return text

  return undefined
}

function normalizeTags(tags?: string[]) {
  return compact((tags ?? []).map((tag) => trim(tag)))
}

function normalizeCodeSnippets(snippets?: AdminSkillCodeSnippet[]) {
  return (snippets ?? [])
    .map((snippet) => ({
      language: trim(snippet.language),
      filename: trim(snippet.filename),
      content: trim(snippet.content),
    }))
    .filter(
      (snippet) => snippet.language || snippet.filename || snippet.content,
    )
}

function parseMetadata(value?: string) {
  const text = trim(value)

  if (!text) return {}

  const parsed = JSON.parse(text) as unknown

  if (!isPlainObject(parsed)) {
    throw new Error('metadata 必须是合法 JSON 对象')
  }

  return parsed as Record<string, unknown>
}

export function stringifyMetadata(value?: Record<string, unknown>) {
  return JSON.stringify(value ?? {}, null, 2)
}

function getCreateStatus(
  status?: AdminSkillStatus,
): Exclude<AdminSkillStatus, 'deprecated'> {
  if (status === 'cold') return 'cold'

  return 'hot'
}

export function buildSubmitBody(values: SkillFormValues): AdminSkillCreateBody {
  return {
    name: trim(values.name),
    category: trim(values.category),
    description: compactText(values.description),
    prompt: trim(values.prompt),
    environment: values.environment ?? 'PROD',
    status: getCreateStatus(values.status),
    code_snippets: normalizeCodeSnippets(values.code_snippets),
    embedding_tags: normalizeTags(values.embedding_tags),
    metadata: parseMetadata(values.metadata),
  }
}

export function getSkillFormValues(skill: AdminSkillDetail): SkillFormValues {
  return {
    name: skill.name,
    category: skill.category,
    description: skill.description,
    prompt: skill.prompt,
    environment: skill.environment,
    status: skill.status,
    code_snippets: skill.code_snippets,
    embedding_tags: skill.embedding_tags,
    metadata: stringifyMetadata(skill.metadata),
  }
}
