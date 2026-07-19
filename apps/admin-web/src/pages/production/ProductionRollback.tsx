import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Card, Form, Input, Space, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import { productionAgents_rollback, type ProductionRollbackCreatePayload } from '@/api/production'

interface RollbackFormValues {
  agent_id: string
  reason: string
}

export function ProductionRollback() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const initialAgentId = searchParams.get('agentId') ?? ''
  const [form] = Form.useForm<RollbackFormValues>()

  const mutation = useMutation({
    mutationFn: (data: ProductionRollbackCreatePayload) =>
      productionAgents_rollback(data.agent_id, { reason: data.reason }),
    onSuccess: (data) => {
      message.success(t('pages.production.rollback.success', { agent: data.agent_id }))
      form.resetFields()
    },
    onError: (err: Error) => {
      message.error(err.message || t('common.errors.unknown'))
    },
  })

  const handleSubmit = async () => {
    const values = await form.validateFields()
    mutation.mutate(values)
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.production.rollback.title')}
        subtitle={t('pages.production.rollback.subtitle')}
      />
      <Card>
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message={t('pages.production.rollback.warning')}
        />
        <Form<RollbackFormValues>
          form={form}
          layout="vertical"
          initialValues={{ agent_id: initialAgentId }}
          onFinish={() => void handleSubmit()}
        >
          <Form.Item
            label={t('pages.production.rollback.agentIdLabel')}
            name="agent_id"
            rules={[{ required: true, max: 128 }]}
          >
            <Input placeholder="agent-xxx" />
          </Form.Item>
          <Form.Item
            label={t('pages.production.rollback.reasonLabel')}
            name="reason"
            rules={[{ required: true, max: 2000 }]}
          >
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                danger
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
              >
                {t('pages.production.rollback.submit')}
              </Button>
              <Button onClick={() => form.resetFields()}>
                {t('common.actions.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  )
}

export default ProductionRollback
