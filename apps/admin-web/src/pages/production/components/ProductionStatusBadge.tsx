import { Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import type { ProductionStatus } from '@/api/production'

const COLOR_MAP: Record<ProductionStatus, string> = {
  none: 'default',
  pre_production: 'gold',
  production: 'green',
  decommissioned: 'red',
}

export function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  const { t } = useTranslation()
  const color = COLOR_MAP[status] ?? 'default'
  return (
    <Tag color={color} data-testid={`production-status-${status}`}>
      {t(`pages.production.status.${status}`)}
    </Tag>
  )
}
