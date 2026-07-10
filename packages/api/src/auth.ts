import { createRequest } from './client.js'

export interface AuthUser {
  email: string
  is_active: boolean
  is_superuser: boolean
  full_name: string | null
  id: string
  created_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token?: string
  token_type?: string
}

export interface LoginResult {
  accessToken?: string
  tokenType: string
}

export const loginWithPasswordRequest = (data: LoginCredentials) => {
  const formData = new URLSearchParams()
  formData.set('username', data.username)
  formData.set('password', data.password)
  return createRequest<LoginResult>(
    'POST',
    '/api/v1/login/access-token',
    {
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      skipAuth: true,
      skipDedupe: true,
    },
    (response: LoginResponse) => ({
      accessToken: response.access_token,
      tokenType: response.token_type ?? 'bearer',
    }),
  )
}

export const testAccessTokenRequest = (accessToken: string) =>
  createRequest<AuthUser>('POST', '/api/v1/login/test-token', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    skipAuth: true,
    skipDedupe: true,
  })
