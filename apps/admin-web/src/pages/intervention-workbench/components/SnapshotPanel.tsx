import { Card, Descriptions } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useTranslation } from 'react-i18next'

export function SnapshotPanel({
  cardClassName,
  items,
}: {
  cardClassName?: string
  items: DescriptionsProps['items']
}) {
  const { t } = useTranslation()

  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={t('pages.intervention.panels.snapshot')}
    >
      <Descriptions column={{ md: 2, xs: 1 }} items={items} size="small" />
    </Card>
  )
}
