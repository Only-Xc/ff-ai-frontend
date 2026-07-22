import { Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import { PLUGIN_STATUS_META } from '../constants'

export function PluginStatusTag({ status }: { status: string }) {
  const { t } = useTranslation()
  const meta = PLUGIN_STATUS_META[status]
  return <Tag color={meta?.color}>{meta ? t(meta.labelKey) : status}</Tag>
}
