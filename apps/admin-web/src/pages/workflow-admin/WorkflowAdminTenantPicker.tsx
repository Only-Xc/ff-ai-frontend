import { Select } from 'antd'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
  workflowAdminKeys,
  workflowAdminTenants_list,
} from '@/api/workflow-admin'

interface Props {
  /** 'global' = 跨租户；'tenant' = 单租户。system_admin 进入时为 global。 */
  scope: 'global' | 'tenant'
  /** 当前选中的 org_id，undefined 代表“全部租户” */
  value: string | undefined
  /** 租户变更回调，undefined 代表“全部租户” */
  onChange: (orgId: string | undefined) => void
}

/**
 * 租户筛选下拉（受控组件）
 *
 * - system_admin：可看到所有租户，可选 `all`（不传 org_id）
 * - tenant_admin：只看到自己一个租户，下拉禁用
 */
export function WorkflowAdminTenantPicker({ scope, value, onChange }: Props) {
  const { t } = useTranslation()

  const { data, isFetching } = useQuery({
    queryKey: workflowAdminKeys.tenants(),
    queryFn: () => workflowAdminTenants_list(),
    placeholderData: keepPreviousData,
  })

  // tenant_admin 时，下拉值固定为列表第一个；不需要操作。
  if (scope === 'tenant') {
    return (
      <Select
        size="small"
        value={data?.items?.[0]?.id}
        options={data?.items?.map((it) => ({ label: it.name, value: it.id })) ?? []}
        disabled
        style={{ minWidth: 160 }}
        placeholder={t('pages.workflowAdmin.tenantPicker.tenantOnly', '当前租户')}
      />
    )
  }

  return (
    <Select
      size="small"
      value={value ?? 'all'}
      loading={isFetching}
      style={{ minWidth: 220 }}
      placeholder={t('pages.workflowAdmin.tenantPicker.placeholder', '选择租户')}
      options={[
        {
          label: t('pages.workflowAdmin.tenantPicker.all', '全部租户'),
          value: 'all',
        },
        ...(data?.items?.map((it) => ({
          label: `${it.name}${it.code ? `（${it.code}）` : ''}`,
          value: it.id,
        })) ?? []),
      ]}
      onChange={(selected) => {
        onChange(selected === 'all' ? undefined : selected)
      }}
    />
  )
}
