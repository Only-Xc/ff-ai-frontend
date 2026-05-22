import { Typography } from 'antd'

import type { HeaderProps } from '../types'

interface HeaderComponentProps {
  props: HeaderProps
}

export function Header({ props }: HeaderComponentProps) {
  return (
    <header className="min-w-0">
      <Typography.Title level={props.level ?? 4} className="mb-1">
        {props.title}
      </Typography.Title>
      {props.description ? (
        <Typography.Paragraph type="secondary" className="mb-0">
          {props.description}
        </Typography.Paragraph>
      ) : null}
    </header>
  )
}
