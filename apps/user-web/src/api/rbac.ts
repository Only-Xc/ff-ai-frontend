import {
  getCurrentRbacProfileRequest,
  listCurrentMenusRequest,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type { CurrentRbacProfile, MenuNode } from '@ff-ai-frontend/api'

export const rbacProfile_get = request(getCurrentRbacProfileRequest)
export const currentMenus_list = request(listCurrentMenusRequest)
