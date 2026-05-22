import { SearchOutlined } from '@ant-design/icons'
import { Button, Form, InputNumber, Space } from 'antd'
import type { FormInstance } from 'antd'

import { DEFAULT_FILTER_VALUES } from '../constants'
import type { FilterValues } from '../types'

interface LifecycleFilterBarProps {
  className?: string
  form: FormInstance<FilterValues>
  onReset: () => void
  onSubmit: (values: FilterValues) => void
}

export function LifecycleFilterBar({
  className,
  form,
  onReset,
  onSubmit,
}: LifecycleFilterBarProps) {
  return (
    <Form
      form={form}
      layout="inline"
      className={className}
      initialValues={DEFAULT_FILTER_VALUES}
      onFinish={onSubmit}
    >
      <Form.Item
        name="idle_days"
        label="沉寂天数"
        rules={[{ required: true, message: '请输入沉寂天数' }]}
      >
        <InputNumber min={1} precision={0} className="w-32" />
      </Form.Item>
      <Form.Item
        name="min_daily_invocations"
        label="日均调用"
        rules={[{ required: true, message: '请输入日均调用阈值' }]}
      >
        <InputNumber min={1} precision={0} className="w-40" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onReset}>重置</Button>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            查询
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
