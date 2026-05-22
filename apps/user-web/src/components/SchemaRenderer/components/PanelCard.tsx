import type { ReactNode } from 'react'

import { Card } from 'antd'

import type { PanelCardProps } from '../types'

interface PanelCardComponentProps {
  props: PanelCardProps
  children?: ReactNode
}

export function PanelCard({ props, children }: PanelCardComponentProps) {
  const size = props.size === 'small' ? 'small' : 'medium'

  return (
    <Card
      title={props.title}
      variant={props.bordered === false ? 'borderless' : 'outlined'}
      size={size}
      className="h-full overflow-hidden [&_.ant-card-body]:p-4 [&_.ant-card-head]:min-h-11 [&_.ant-card-head-title]:py-2 [&_.ant-card-head-title]:text-sm [&_.ant-card-head-title]:font-medium"
    >
      {children}
    </Card>
  )
}
