import { uploadAttachmentRequest } from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  FileUploadParams,
  FileUploadResponse,
} from '@ff-ai-frontend/api'

export const fileUpload = request(uploadAttachmentRequest)
