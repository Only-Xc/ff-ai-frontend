import {
  createAdminSkillRequest,
  deleteAdminSkillRequest,
  getAdminSkillRequest,
  listAdminSkillsRequest,
  updateAdminSkillRequest,
  type AdminSkillListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AdminSkill,
  AdminSkillActionResponse,
  AdminSkillCodeSnippet,
  AdminSkillCreateBody,
  AdminSkillDetail,
  AdminSkillEnvironment,
  AdminSkillList,
  AdminSkillListQuery,
  AdminSkillStatus,
  AdminSkillUpdateBody,
} from '@ff-ai-frontend/api'

export const adminSkillsKeys = {
  all: ['admin-skills'] as const,
  lists: () => [...adminSkillsKeys.all, 'list'] as const,
  list: (query: AdminSkillListQuery) =>
    [...adminSkillsKeys.lists(), query] as const,
  details: () => [...adminSkillsKeys.all, 'detail'] as const,
  detail: (skillId: string) => [...adminSkillsKeys.details(), skillId] as const,
}

export const adminSkills_list = request(listAdminSkillsRequest)
export const adminSkills_get = request(getAdminSkillRequest)
export const adminSkills_create = request(createAdminSkillRequest)
export const adminSkills_update = request(updateAdminSkillRequest)
export const adminSkills_delete = request(deleteAdminSkillRequest)
