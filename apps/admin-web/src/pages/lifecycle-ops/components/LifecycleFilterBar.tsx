import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, Select, Space } from 'antd'
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
  const statusOptions = [
    {
      label: t('pages.lifecycle.filters.statusAll'),
      value: '',
    },
    {
      label: t('pages.lifecycle.status.running'),
      value: 'running',
    },
    {
      label: t('pages.lifecycle.status.sandbox'),
      value: 'sandbox',
    },
  ]

  return (
    <Form
      form={form}
      layout="inline"
      className={className}
      initialValues={DEFAULT_FILTER_VALUES}
      onFinish={(values: FilterValues) => {
        onChange({
          ...DEFAULT_FILTER_VALUES,
          ...values,
          runtime_status: values.runtime_status || undefined,
        })
      }}
    >
      <Form.Item
        hidden
        name="idle_days"
      >
        <Input />
      </Form.Item>
      <Form.Item
        hidden
        name="min_daily_invocations"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="tenant_keyword"
        label={t('pages.lifecycle.filters.tenant')}
      >
        <Input
          allowClear
          className="w-52"
          placeholder={t('pages.lifecycle.filters.tenantPlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name="invoked_range"
        label={t('pages.lifecycle.filters.invokedRange')}
      >
        <DatePicker.RangePicker allowClear className="w-64" />
      </Form.Item>
      <Form.Item
        name="runtime_status"
        label={t('pages.lifecycle.filters.currentStatus')}
      >
        <Select
          allowClear
          className="w-40"
          options={statusOptions}
          placeholder={t('pages.lifecycle.filters.statusAll')}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button
            icon={<SearchOutlined />}
            loading={isRefreshing}
            type="primary"
            htmlType="submit"
          >
            {t('pages.lifecycle.actions.query')}
          </Button>
          <Button onClick={onReset}>{t('common.actions.reset')}</Button>
          <Button
            icon={<ReloadOutlined />}
            loading={isRefreshing}
            onClick={onRefresh}
          >
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
