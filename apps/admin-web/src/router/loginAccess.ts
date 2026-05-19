import type { AuthStatus } from '@/store/useAuth'

interface LoginAccessInput {
  accessToken: string
  status: AuthStatus
}

type LoginAccessState =
  | { type: 'redirect'; to: '/' }
  | { type: 'verify' }
  | { type: 'show-login' }

export function getLoginAccessState({
  accessToken,
  status,
}: LoginAccessInput): LoginAccessState {
  if (!accessToken) {
    return { type: 'show-login' }
  }

  if (status === 'authenticated') {
    return { type: 'redirect', to: '/' }
  }

  return { type: 'verify' }
}
