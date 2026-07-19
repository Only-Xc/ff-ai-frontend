import { useQuery } from '@tanstack/react-query'

import {
  adminAccessLogKeys,
  adminAccessLogs_list,
  type DataAccessAccessLog,
  type DataAccessAccessLogList,
} from '@/api/data-access'

const ACCESS_LOG_LIST_QUERY = { limit: 50 } as const

export function useDataAccessLogs() {
  const query = useQuery<
    DataAccessAccessLogList,
    Error,
    { records: DataAccessAccessLog[]; count: number }
  >({
    queryKey: adminAccessLogKeys.list(ACCESS_LOG_LIST_QUERY),
    queryFn: () => adminAccessLogs_list(ACCESS_LOG_LIST_QUERY),
    // 暂无访问流量时也允许返回空列表；不要因为空数据就一直 refetch
    refetchInterval: 30_000,
    select: (response) => ({ records: response.data, count: response.count }),
  })

  return {
    listQuery: query,
    records: query.data?.records ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
    },
  }
}
