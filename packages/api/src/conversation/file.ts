import type { RequestConfig } from '@ff-ai-frontend/utils'

import { createRequest } from '../client.js'

export interface FileUploadResponse {
  id: string
  conversation_key: string | null
  file_name: string
  file_extension: string
  content_type: string
  size_bytes: number
  bucket_name: string
  object_name: string
  parse_status: 'pending' | 'processing' | 'succeeded' | 'failed'
  parsed_text: string | null
  parse_error: string | null
  parser_name: string | null
  parsed_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface FileUploadParams {
  file: File
  conversation_id?: string
  onUploadProgress?: RequestConfig<FormData>['onUploadProgress']
}

export const uploadAttachmentRequest = (params: FileUploadParams) => {
  const formData = new FormData()

  formData.append('file', params.file)

  if (params.conversation_id) {
    formData.append('conversation_id', params.conversation_id)
  }

  return createRequest<FileUploadResponse, FormData>(
    'POST',
    '/api/v1/attachments/upload',
    {
      data: formData,
      onUploadProgress: params.onUploadProgress,
      meta: {
        skipGlobalErrorToast: true,
      },
    },
  )
}

export const uploadConversationFileRequest = (data: FormData) =>
  createRequest<FileUploadResponse>('POST', '/api/conversation/files/upload', {
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
