import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminAccessEndpointKeys,
  adminAccessEndpoints_create,
  adminAccessEndpoints_delete,
  adminAccessEndpoints_deprecate,
  adminAccessEndpoints_list,
  adminAccessEndpoints_publish,
  adminAccessEndpoints_update,
  adminFieldPolicyKeys,
} from '@/api/data-access'
import type { AdminAccessEndpointUpdateBody } from '@/api/data-access'

const ACCESS_ENDPOINT_LIST_QUERY = { limit: 100 } as const

interface UpdateEndpointInput {
  endpointId: string
  data: AdminAccessEndpointUpdateBody
}

export function useAccessEndpoints() {
  const queryClient = useQueryClient()
  const listQuery = useQuery({
    queryKey: adminAccessEndpointKeys.list(ACCESS_ENDPOINT_LIST_QUERY),
    queryFn: () => adminAccessEndpoints_list(ACCESS_ENDPOINT_LIST_QUERY),
  })

  const invalidateLists = () => {
    void queryClient.invalidateQueries({
      queryKey: adminAccessEndpointKeys.lists(),
    })
    void queryClient.invalidateQueries({ queryKey: adminFieldPolicyKeys.lists() })
  }

  const createMutation = useMutation({
    mutationFn: adminAccessEndpoints_create,
    onSuccess: invalidateLists,
  })
  const updateMutation = useMutation({
    mutationFn: ({ endpointId, data }: UpdateEndpointInput) =>
      adminAccessEndpoints_update(endpointId, data),
    onSuccess: invalidateLists,
  })
  const deleteMutation = useMutation({
    mutationFn: adminAccessEndpoints_delete,
    onSuccess: invalidateLists,
  })
  const publishMutation = useMutation({
    mutationFn: adminAccessEndpoints_publish,
    onSuccess: invalidateLists,
  })
  const deprecateMutation = useMutation({
    mutationFn: adminAccessEndpoints_deprecate,
    onSuccess: invalidateLists,
  })

  return {
    endpoints: listQuery.data?.data ?? [],
    total: listQuery.data?.count ?? 0,
    listQuery,
    createEndpoint: createMutation.mutateAsync,
    createPending: createMutation.isPending,
    updateEndpoint: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,
    deleteEndpoint: deleteMutation.mutateAsync,
    deletingEndpointId: deleteMutation.isPending
      ? deleteMutation.variables
      : undefined,
    publishEndpoint: publishMutation.mutateAsync,
    publishingEndpointId: publishMutation.isPending
      ? publishMutation.variables
      : undefined,
    deprecateEndpoint: deprecateMutation.mutateAsync,
    deprecatingEndpointId: deprecateMutation.isPending
      ? deprecateMutation.variables
      : undefined,
  }
}
