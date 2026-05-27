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

function getAgentDisplay(record: TenantBillingRecordDetail): string {
  if (record.agent_name) return record.agent_name
  if (record.agent_id) return record.agent_id

  return '租户级消费'
}

export function BillingRecordDetailDrawer({
  open,
  recordId,
  onClose,
  formatDateTime,
}: BillingRecordDetailDrawerProps) {
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
      title="消费记录详情"
      width={520}
      onClose={onClose}
    >
      {!recordId ? (
        <Empty
          description="请选择消费记录"
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
              重试
            </Button>
          }
          message="消费记录详情加载失败"
          type="error"
        />
      ) : null}

      {detail ? (
        <Space className="w-full" direction="vertical" size={18}>
          <div className="rounded-2xl border border-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] p-4">
            <Typography.Text className="text-xs text-(--muted)!">
              折算费用
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
                label: '记录 ID',
                children: (
                  <Typography.Text copyable>{detail.record_id}</Typography.Text>
                ),
              },
              {
                key: 'created_at',
                label: '创建时间',
                children: formatDateTime(detail.created_at),
              },
              {
                key: 'agent',
                label: '智能体',
                children: getAgentDisplay(detail),
              },
              {
                key: 'agent_id',
                label: '智能体 ID',
                children: detail.agent_id ? (
                  <Typography.Text copyable>{detail.agent_id}</Typography.Text>
                ) : (
                  '-'
                ),
              },
              {
                key: 'task_id',
                label: '工单 ID',
                children: detail.task_id ? (
                  <Typography.Text copyable>{detail.task_id}</Typography.Text>
                ) : (
                  '-'
                ),
              },
              {
                key: 'description',
                label: '描述',
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
