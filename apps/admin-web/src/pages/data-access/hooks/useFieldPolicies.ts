import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminFieldPolicies_create,
  adminFieldPolicies_delete,
  adminFieldPolicies_publish,
  adminFieldPolicies_simulate,
  adminFieldPolicies_update,
  adminFieldPolicies_list,
  adminFieldPolicyKeys,
  type FieldPolicy,
  type FieldPolicyCreateBody,
  type FieldPolicyList,
  type FieldPolicyPublishBody,
  type FieldPolicySimulateBody,
  type FieldPolicyUpdateBody,
} from '@/api/data-access'

const FIELD_POLICY_LIST_QUERY = { limit: 100 } as const

interface UpdatePolicyInput {
  policyId: string
  data: FieldPolicyUpdateBody
}

interface PublishPolicyInput {
  policyId: string
  data: FieldPolicyPublishBody
}

export function useFieldPolicies() {
  const queryClient = useQueryClient()

  const listQuery = useQuery<
    FieldPolicyList,
    Error,
    { records: FieldPolicy[]; count: number }
  >({
    queryKey: adminFieldPolicyKeys.list(FIELD_POLICY_LIST_QUERY),
    queryFn: () => adminFieldPolicies_list(FIELD_POLICY_LIST_QUERY),
    select: (response) => ({ records: response.data, count: response.count }),
  })

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: adminFieldPolicyKeys.lists() })

  const createMutation = useMutation({
    mutationFn: (data: FieldPolicyCreateBody) =>
      adminFieldPolicies_create(data),
    onSuccess: invalidateLists,
  })
  const updateMutation = useMutation({
    mutationFn: ({ policyId, data }: UpdatePolicyInput) =>
      adminFieldPolicies_update(policyId, data),
    onSuccess: invalidateLists,
  })
  const publishMutation = useMutation({
    mutationFn: ({ policyId, data }: PublishPolicyInput) =>
      adminFieldPolicies_publish(policyId, data),
    onSuccess: invalidateLists,
  })
  const deleteMutation = useMutation({
    mutationFn: adminFieldPolicies_delete,
    onSuccess: invalidateLists,
  })
  const simulateMutation = useMutation({
    mutationFn: (data: FieldPolicySimulateBody) =>
      adminFieldPolicies_simulate(data),
  })

  return {
    listQuery,
    records: listQuery.data?.records ?? [],
    policiesCount: listQuery.data?.count ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: () => {
      void listQuery.refetch()
    },
    createPolicy: createMutation.mutateAsync,
    createPending: createMutation.isPending,
    updatePolicy: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,
    updatingPolicyId: updateMutation.isPending
      ? updateMutation.variables?.policyId
      : undefined,
    publishPolicy: publishMutation.mutate,
    publishingPolicyId: publishMutation.isPending
      ? publishMutation.variables?.policyId
      : undefined,
    publishPolicyAsync: publishMutation.mutateAsync,
    deletePolicy: deleteMutation.mutateAsync,
    deletingPolicyId: deleteMutation.isPending
      ? deleteMutation.variables
      : undefined,
    simulatePolicy: simulateMutation.mutateAsync,
    simulating: simulateMutation.isPending,
  }
}
