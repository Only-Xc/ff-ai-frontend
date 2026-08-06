import {
  listAdminAccessEndpointsRequest,
  type AdminAccessEndpoint,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type { AdminAccessEndpoint } from '@ff-ai-frontend/api'

const listAccessEndpoints = request(listAdminAccessEndpointsRequest)

export async function listPublishedDataEndpoints(): Promise<
  AdminAccessEndpoint[]
> {
  const result = await listAccessEndpoints({
    limit: 100,
    skip: 0,
    status: 'published',
  })
  return result.data
}
