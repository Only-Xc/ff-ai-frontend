import { Tag } from 'antd'

import type { BillingResourceType } from '@/api/billing-center'

const billingResourceTypeLabelMap: Record<BillingResourceType, string> = {
  compute_token: '大模型推理 Token',
  storage_gb: '存储空间',
  network_egress_gb: '网络出口流量',
  compute_hour: '计算核时',
}

const billingResourceTypeColorMap: Record<BillingResourceType, string> = {
  compute_token: 'blue',
  storage_gb: 'green',
  network_egress_gb: 'purple',
  compute_hour: 'orange',
}

export function ResourceTypeTag({ type }: { type: BillingResourceType }) {
  return (
    <Tag color={billingResourceTypeColorMap[type]}>
      {billingResourceTypeLabelMap[type]}
    </Tag>
  )
}
