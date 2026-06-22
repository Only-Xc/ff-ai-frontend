import {
  createRequest,
  path,
} from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

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

export const listAdminSkillsRequest = (params: AdminSkillListQuery) =>
  createRequest<AdminSkillList>('GET', '/api/admin/skills', { params })

export const getAdminSkillRequest = (skillId: string) =>
  createRequest<AdminSkillDetail>('GET', path`/api/admin/skills/${skillId}`)

export const createAdminSkillRequest = (data: AdminSkillCreateBody) =>
  createRequest<AdminSkillActionResponse>('POST', '/api/admin/skills', { data })

export const updateAdminSkillRequest = (
  skillId: string,
  data: AdminSkillUpdateBody,
) =>
  createRequest<AdminSkillActionResponse>(
    'PUT',
    path`/api/admin/skills/${skillId}`,
    { data },
  )

export const deleteAdminSkillRequest = (skillId: string) =>
  createRequest<AdminSkillActionResponse>(
    'DELETE',
    path`/api/admin/skills/${skillId}`,
  )
