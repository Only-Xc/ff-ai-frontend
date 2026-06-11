import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import { numberUtils } from '@ff-ai-frontend/utils'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import {
  tenantBillingKeys,
  tenantBilling_record,
  type TenantBillingRecordDetail,
} from '@/api/billing-center'

import { ResourceTypeTag } from './ResourceTypeTag'

interface BillingRecordDetailDrawerProps {
  open: boolean
  recordId?: string
  onClose: () => void
  formatDateTime: (value: string | null | undefined) => string
}

function getAgentDisplay(
  record: TenantBillingRecordDetail,
  t: TFunction,
): string {
  if (record.agent_name) return record.agent_name
  if (record.agent_id) return record.agent_id

  return t('pages.billing.tenantLevelCost')
}

export function BillingRecordDetailDrawer({
  open,
  recordId,
  onClose,
  formatDateTime,
}: BillingRecordDetailDrawerProps) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: tenantBillingKeys.detail(recordId),
    queryFn: () => tenantBilling_record(recordId ?? ''),
    enabled: open && Boolean(recordId),
  })

  const detail = query.data

  return (
    <Drawer
      destroyOnHidden
      open={open}
      placement="right"
      title={t('pages.billing.drawer.title')}
      width={520}
      onClose={onClose}
    >
      {!recordId ? (
        <Empty
          description={t('pages.billing.drawer.empty')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : null}

      {recordId && query.isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : null}

      {recordId && query.isError ? (
        <Alert
          showIcon
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
          message={t('pages.billing.drawer.loadFailed')}
          type="error"
        />
      ) : null}

      {detail ? (
        <Space className="w-full" direction="vertical" size={18}>
          <div className="rounded-2xl border border-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] p-4">
            <Typography.Text className="text-xs text-(--muted)!">
              {t('pages.billing.columns.cost')}
            </Typography.Text>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-(--foreground)">
              {numberUtils.formatCurrency(detail.cost, {
                decimals: 2,
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ResourceTypeTag type={detail.resource_type} />
              <Typography.Text type="secondary">
                {numberUtils.formatNumber(detail.amount, {
                  decimals: 4,
                  suffix: ' ' + detail.unit,
                })}
              </Typography.Text>
            </div>
          </div>

          <Descriptions
            bordered
            column={1}
            items={[
              {
                key: 'record_id',
                label: t('pages.billing.drawer.recordId'),
                children: (
                  <Typography.Text copyable>{detail.record_id}</Typography.Text>
                ),
              },
              {
                key: 'created_at',
                label: t('pages.billing.drawer.createdAt'),
                children: formatDateTime(detail.created_at),
              },
              {
                key: 'agent',
                label: t('pages.billing.columns.agent'),
                children: getAgentDisplay(detail, t),
              },
              {
                key: 'agent_id',
                label: t('pages.billing.drawer.agentId'),
                children: detail.agent_id ? (
                  <Typography.Text copyable>{detail.agent_id}</Typography.Text>
                ) : (
                  '-'
                ),
              },
              {
                key: 'task_id',
                label: t('pages.billing.drawer.taskId'),
                children: detail.task_id ? (
                  <Typography.Text copyable>{detail.task_id}</Typography.Text>
                ) : (
                  '-'
                ),
              },
              {
                key: 'description',
                label: t('pages.billing.columns.description'),
                children: detail.description,
              },
            ]}
            styles={{
              label: { width: 112, whiteSpace: 'nowrap' }
            }}
            size="small"
          />
        </Space>
      ) : null}
    </Drawer>
  )
}
