import { Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import type { Role } from '@/api/rbac'

export function RoleStatusTag({ record }: { record: Role }) {
  const { t } = useTranslation()

  if (record.is_system) {
    return <Tag color="blue">{t('pages.rbac.status.system')}</Tag>
  }

  return record.is_active ? (
    <Tag color="green">{t('pages.rbac.status.active')}</Tag>
  ) : (
    <Tag>{t('pages.rbac.status.disabled')}</Tag>
  )
}
