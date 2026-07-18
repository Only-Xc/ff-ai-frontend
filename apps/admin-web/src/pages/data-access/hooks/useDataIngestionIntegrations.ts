import { useQuery } from '@tanstack/react-query'

import {
  adminDataIngestionIntegrationKeys,
  adminDataIngestionIntegrations_get,
} from '@/api/data-access'

export function useDataIngestionIntegrations() {
  return useQuery({
    queryKey: adminDataIngestionIntegrationKeys.all,
    queryFn: adminDataIngestionIntegrations_get,
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}
