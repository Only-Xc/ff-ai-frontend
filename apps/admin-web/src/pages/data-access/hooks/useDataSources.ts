import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminDataSourceKeys,
  adminDataSources_create,
  adminDataSources_delete,
  adminDataSources_discoverMetadata,
  adminDataSources_list,
  adminDataSources_test,
  adminDataSources_update,
} from '@/api/data-access'
import type { AdminDataSourceUpdateBody } from '@/api/data-access'

const DATA_SOURCE_LIST_QUERY = { limit: 100 } as const
interface UpdateSourceInput {
  sourceId: string
  data: AdminDataSourceUpdateBody
}

export function useDataSources() {
  const queryClient = useQueryClient()
  const listQuery = useQuery({
    queryKey: adminDataSourceKeys.list(DATA_SOURCE_LIST_QUERY),
    queryFn: () => adminDataSources_list(DATA_SOURCE_LIST_QUERY),
  })

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: adminDataSourceKeys.lists() })

  const createMutation = useMutation({
    mutationFn: adminDataSources_create,
    onSuccess: invalidateLists,
  })
  const updateMutation = useMutation({
    mutationFn: ({ sourceId, data }: UpdateSourceInput) =>
      adminDataSources_update(sourceId, data),
    onSuccess: invalidateLists,
  })
  const deleteMutation = useMutation({
    mutationFn: adminDataSources_delete,
    onSuccess: invalidateLists,
  })
  const testMutation = useMutation({
    mutationFn: adminDataSources_test,
    onSuccess: invalidateLists,
  })
  const metadataMutation = useMutation({
    mutationFn: adminDataSources_discoverMetadata,
  })

  return {
    sources: listQuery.data?.data ?? [],
    total: listQuery.data?.count ?? 0,
    listQuery,
    createSource: createMutation.mutateAsync,
    createPending: createMutation.isPending,
    updateSource: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,
    deleteSource: deleteMutation.mutateAsync,
    deletePendingId: deleteMutation.isPending
      ? deleteMutation.variables
      : undefined,
    testSource: testMutation.mutateAsync,
    testingSourceId: testMutation.isPending
      ? testMutation.variables
      : undefined,
    discoverMetadata: metadataMutation.mutateAsync,
    metadataMutation,
  }
}
