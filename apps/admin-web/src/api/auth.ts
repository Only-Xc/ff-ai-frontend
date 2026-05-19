import { requestClient } from '@/utils/request'

import type { AuthUser } from '@/store/useAuth'

interface LoginCredentials {
  username: string
  password: string
}

interface LoginResponse {
  access_token?: string
  token_type?: string
}

export interface LoginResult {
  accessToken: string
  tokenType: string
}

export async function loginWithPassword(
  data: LoginCredentials,
): Promise<LoginResult> {
  const response = await requestClient<LoginResponse, LoginCredentials>({
    url: '/api/v1/login/access-token',
    method: 'POST',
    data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    skipAuth: true,
    skipDedupe: true,
  })

  if (!response.access_token) {
    throw new Error('登录响应缺少 access_token')
  }

  return {
    accessToken: response.access_token,
    tokenType: response.token_type ?? 'bearer',
  }
}

export async function testAccessToken(accessToken: string): Promise<AuthUser> {
  return requestClient<AuthUser>({
    url: '/api/v1/login/test-token',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    skipAuth: true,
    skipDedupe: true,
  })
}
