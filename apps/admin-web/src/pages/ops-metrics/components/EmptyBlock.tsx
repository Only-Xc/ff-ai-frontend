import { Empty } from 'antd'

export function EmptyBlock({ description }: { description: string }) {
  return (
    <div className="grid h-75 place-items-center">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
  )
}
