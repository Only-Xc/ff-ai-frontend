import { PlayCircleOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Drawer, Input, message, Space, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { createDebugRun } from '@/api/workflow'

const { Text, Paragraph } = Typography

interface DebugDrawerProps {
  open: boolean
  onClose: () => void
  appId: string
}

export function DebugDrawer({ open, onClose, appId }: DebugDrawerProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{
    run_id: string
    status: string
  } | null>(null)

  const debugMutation = useMutation({
    mutationFn: () =>
      createDebugRun(appId, {
        input_payload: { 'sys.query': input },
      }),
    onSuccess: (res: Awaited<ReturnType<typeof createDebugRun>>) => {
      setResult(res)
      message.success(t('pages.workflow.debugStarted'))
    },
    onError: () => {
      message.error(t('pages.workflow.debugFailed'))
    },
  })

  return (
    <Drawer
      title={t('pages.workflow.debugTitle')}
      open={open}
      onClose={onClose}
      width={420}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>{t('pages.workflow.debugInput')}</Text>
          <Input.TextArea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('pages.workflow.debugInputPlaceholder')}
            style={{ marginTop: 8 }}
          />
        </div>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => debugMutation.mutate()}
          loading={debugMutation.isPending}
          disabled={!input.trim()}
          block
        >
          {t('pages.workflow.runDebug')}
        </Button>

        {result && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: '#f6f6f6',
            }}
          >
            <Text type="secondary">{t('pages.workflow.debugResult')}</Text>
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              <Text strong>Run ID: </Text>
              {result.run_id}
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <Text strong>{t('pages.workflow.columns.status')}: </Text>
              {result.status}
            </Paragraph>
          </div>
        )}
      </Space>
    </Drawer>
  )
}
