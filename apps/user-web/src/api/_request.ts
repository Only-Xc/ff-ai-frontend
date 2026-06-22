import { createApiCaller } from '@ff-ai-frontend/api'

import { requestClient } from '@/utils/request'

export const request = createApiCaller(requestClient)
