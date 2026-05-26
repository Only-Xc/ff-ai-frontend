import { Typography } from 'antd'

interface CopyableTextProps {
  value?: string | null
}

export function CopyableText({ value }: CopyableTextProps) {
  return (
    <Typography.Text copyable={!!value}>
      {value}
    </Typography.Text>
  )
}
