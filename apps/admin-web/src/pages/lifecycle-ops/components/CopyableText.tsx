import { Typography } from 'antd'

import { formatText } from '../utils/lifecycleFormatters'

interface CopyableTextProps {
  value?: string | null
}

export function CopyableText({ value }: CopyableTextProps) {
  const text = formatText(value)

  return (
    <Typography.Text copyable={text === '-' ? false : { text }}>
      {text}
    </Typography.Text>
  )
}
