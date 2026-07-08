import { createRequest } from '../client.js'

const AI_GENERATION_PREFIX = '/api/v1/ai-generation'

export interface AiRuntimeStatus {
  runtime?: string
  model?: string
  hermes?: {
    healthy?: boolean
    status_code?: number
    [key: string]: unknown
  }
  openai_proxy_configured?: boolean
  ragflow_configured?: boolean
  ragflow_api_key_configured?: boolean
  ragflow_dataset_ids?: string[]
  [key: string]: unknown
}

export const getAiRuntimeStatusRequest = () =>
  createRequest<AiRuntimeStatus>('GET', `${AI_GENERATION_PREFIX}/runtime/status`, {
    meta: { skipGlobalErrorToast: true },
  })
