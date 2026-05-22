import { Statistic, theme } from 'antd'

import type { MetricStatisticProps } from '../types'

interface MetricStatisticComponentProps {
  props: MetricStatisticProps
}

export function MetricStatistic({ props }: MetricStatisticComponentProps) {
  const { token } = theme.useToken()
  const colorMap: Record<Required<MetricStatisticProps>['status'], string> = {
    success: token.colorSuccess,
    warning: token.colorWarning,
    error: token.colorError,
    default: token.colorText,
  }

  return (
    <div className="min-h-20 flex items-center">
      <Statistic
        title={props.title}
        value={props.value}
        prefix={props.prefix}
        suffix={props.suffix}
        precision={
          typeof props.value === 'number' ? props.precision : undefined
        }
        styles={{
          content: {
            color: colorMap[props.status ?? 'default'],
            fontSize: 28,
            fontWeight: 650,
            lineHeight: 1.2,
          },
        }}
      />
    </div>
  )
}
