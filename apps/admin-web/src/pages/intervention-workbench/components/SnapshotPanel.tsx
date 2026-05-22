import { Card, Descriptions } from 'antd'
import type { DescriptionsProps } from 'antd'

export function SnapshotPanel({
  cardClassName,
  items,
}: {
  cardClassName?: string
  items: DescriptionsProps['items']
}) {
  return (
    <Card className={`rounded-lg! ${cardClassName ?? ''}`} title="工单快照">
      <Descriptions column={{ md: 2, xs: 1 }} items={items} size="small" />
    </Card>
  )
}
