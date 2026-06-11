import { ReloadOutlined } from '@ant-design/icons'
import { Button, Form, InputNumber, Space } from 'antd'
import type { FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

import { DEFAULT_FILTER_VALUES } from '../constants'
import type { FilterValues } from '../types'

interface LifecycleFilterBarProps {
  className?: string
  form: FormInstance<FilterValues>
  isRefreshing: boolean
  onChange: (values: FilterValues) => void
  onRefresh: () => void
  onReset: () => void
}

export function LifecycleFilterBar({
  className,
  form,
  isRefreshing,
  onChange,
  onRefresh,
  onReset,
}: LifecycleFilterBarProps) {
  const { t } = useTranslation()

  return (
    <Form
      form={form}
      layout="inline"
      className={className}
      initialValues={DEFAULT_FILTER_VALUES}
      onValuesChange={(_, values: FilterValues) => {
        if (
          typeof values.idle_days === 'number' &&
          typeof values.min_daily_invocations === 'number'
        ) {
          onChange(values)
        }
      }}
    >
      <Form.Item
        name="idle_days"
        label={t('pages.lifecycle.filters.idleDays')}
        rules={[
          {
            required: true,
            message: t('pages.lifecycle.filters.idleDaysRequired'),
          },
        ]}
      >
        <InputNumber min={1} precision={0} className="w-32" />
      </Form.Item>
      <Form.Item
        name="min_daily_invocations"
        label={t('pages.lifecycle.filters.minDailyInvocations')}
        rules={[
          {
            required: true,
            message: t('pages.lifecycle.filters.minDailyInvocationsRequired'),
          },
        ]}
      >
        <InputNumber min={1} precision={0} className="w-40" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onReset}>{t('common.actions.reset')}</Button>
          <Button
            icon={<ReloadOutlined />}
            loading={isRefreshing}
            type="primary"
            onClick={onRefresh}
          >
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
