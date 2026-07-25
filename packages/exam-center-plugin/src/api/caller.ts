import { createApiCaller } from '@ff-ai-frontend/api'
import type { ApiRequest } from '@ff-ai-frontend/api'

import { getExamCenterRuntime } from '../runtime'

export function request<TArgs extends unknown[], TResponse, TData = unknown>(
  requestFactory: (...args: TArgs) => ApiRequest<TResponse, TData>,
) {
  return (...args: TArgs): Promise<TResponse> => {
    const caller = createApiCaller(getExamCenterRuntime().requestClient)

    return caller(requestFactory)(...args)
  }
}
