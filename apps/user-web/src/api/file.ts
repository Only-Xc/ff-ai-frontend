import { requestClient } from '@/utils/request'
import type { AxiosProgressEvent } from 'axios'

export interface FileUploadParams {
  file: File
  conversation_id?: string
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
}

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

export function fileUpload(
  params: FileUploadParams,
): Promise<FileUploadResponse> {
  const formData = new FormData()

  formData.append('file', params.file)

  if (params.conversation_id) {
    formData.append('conversation_id', params.conversation_id)
  }

  return requestClient({
    url: '/api/v1/attachments/upload',
    method: 'POST',
    data: formData,
    onUploadProgress: params.onUploadProgress,
    meta: {
      skipGlobalErrorToast: true
    }
  })
}
