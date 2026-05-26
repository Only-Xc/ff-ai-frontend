import { requestClient } from '@/utils/request'

import type { ListResult, PaginationQuery } from './types'

export type AdminSkillEnvironment = 'UAT' | 'PROD'
export type AdminSkillStatus = 'hot' | 'cold' | 'deprecated'

export interface AdminSkillCodeSnippet {
  language: string
  filename: string
  content: string
}

export interface AdminSkill {
  skill_id: string
  name: string
  category: string
  description?: string
  environment: AdminSkillEnvironment
  status: AdminSkillStatus
  version: string
  call_count: number
  success_rate: number | null
  created_at: string
  updated_at: string
}

export interface AdminSkillDetail extends AdminSkill {
  prompt: string
  code_snippets: AdminSkillCodeSnippet[]
  embedding_tags: string[]
  metadata: Record<string, unknown>
}

export type AdminSkillList = ListResult<AdminSkill>

export type AdminSkillListQuery = {
  category?: string
  environment?: AdminSkillEnvironment
  status?: AdminSkillStatus
  keyword?: string
} & PaginationQuery

export interface AdminSkillCreateBody {
  name: string
  category: string
  description?: string
  prompt: string
  code_snippets?: AdminSkillCodeSnippet[]
  environment?: AdminSkillEnvironment
  status?: Exclude<AdminSkillStatus, 'deprecated'>
  embedding_tags?: string[]
  metadata?: Record<string, unknown>
}

export type AdminSkillUpdateBody = Partial<
  Omit<AdminSkillCreateBody, 'status'> & {
    status: AdminSkillStatus
  }
>

export interface AdminSkillActionResponse {
  message: string
  skill_id?: string
}

export const adminSkillsKeys = {
  all: ['admin-skills'] as const,
  lists: () => [...adminSkillsKeys.all, 'list'] as const,
  list: (query: AdminSkillListQuery) =>
    [...adminSkillsKeys.lists(), query] as const,
  details: () => [...adminSkillsKeys.all, 'detail'] as const,
  detail: (skillId: string) => [...adminSkillsKeys.details(), skillId] as const,
}

export function adminSkills_list(
  params: AdminSkillListQuery,
): Promise<AdminSkillList> {
  return requestClient({
    url: '/api/admin/skills',
    method: 'GET',
    params,
  })
}

export function adminSkills_get(skillId: string): Promise<AdminSkillDetail> {
  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'GET',
  })
}

export function adminSkills_create(
  data: AdminSkillCreateBody,
): Promise<AdminSkillActionResponse> {
  return requestClient({
    url: '/api/admin/skills',
    method: 'POST',
    data,
  })
}

export function adminSkills_update(
  skillId: string,
  data: AdminSkillUpdateBody,
): Promise<AdminSkillActionResponse> {
  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'PUT',
    data,
  })
}

export function adminSkills_delete(
  skillId: string,
): Promise<AdminSkillActionResponse> {
  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'DELETE',
  })
}
