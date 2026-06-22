import {
  loginWithPasswordRequest,
  testAccessTokenRequest,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AuthUser,
  LoginCredentials,
  LoginResult,
} from '@ff-ai-frontend/api'

export const loginWithPassword = request(loginWithPasswordRequest)
export const testAccessToken = request(testAccessTokenRequest)
