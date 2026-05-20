import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Descriptions,
  Form,
  InputNumber,
  Result,
  Space,
  Spin,
  Statistic,
  Typography,
} from 'antd'
import { createStyles } from 'antd-style'
import { type ReactNode, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'

import {
  tenantAgents_detail,
  tenantAgents_updateBudget,
} from '@/api/agentTicket'
import { globalMessage } from '@/utils/message'

import { formatDateTime, formatNullableText } from './components/format'
import { AgentStatusTag } from './components/status'

function openEndpointUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const useStyles = createStyles(() => ({
  header: {
    padding: 20,
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: 'var(--panel)',

    '@media (max-width: 768px)': {
      padding: 16,
    },
  },
  appIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    flex: '0 0 44px',
    borderRadius: 12,
    color: 'var(--admin-primary)',
    background: 'color-mix(in srgb, var(--admin-primary) 12%, transparent)',
    fontSize: 20,
  },
  metricPanel: {
    padding: 16,
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: 'color-mix(in srgb, var(--panel) 94%, var(--bg))',

    '.ant-statistic-title': {
      color: 'var(--muted)',
      fontSize: 13,
    },

    '.ant-statistic-content': {
      color: 'var(--text-strong)',
      fontSize: 22,
      lineHeight: 1.18,
    },
  },
  sectionPanel: {
    padding: 20,
    border: '1px solid var(--border)',
    borderRadius: 12,
    background: 'var(--panel)',

    '@media (max-width: 768px)': {
      padding: 16,
    },
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'var(--text-strong)',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  sectionSubtitle: {
    color: 'var(--muted)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  budgetForm: {
    gap: 12,

    '@media (max-width: 640px)': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',

      '.ant-form-item': {
        marginInlineEnd: 0,
      },

      '.ant-input-number': {
        width: '100% !important',
      },
    },
  },
}))

function DetailPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

export function AgentDetail() {
  const { styles } = useStyles()
  const navigate = useNavigate()
  const { agentId } = useParams()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<{ runtimeTokenBudget: number | null }>()

  const query = useQuery({
    queryKey: ['tenant-agent-detail', agentId],
    queryFn: () => tenantAgents_detail(agentId ?? ''),
    enabled: Boolean(agentId),
  })

  const mutation = useMutation({
    mutationFn: (runtimeTokenBudget: number | null) =>
      tenantAgents_updateBudget(agentId ?? '', runtimeTokenBudget),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['tenant-agent-detail', agentId],
      })
      globalMessage.success('预算阈值已保存')
    },
  })

  useEffect(() => {
    form.setFieldsValue({
      runtimeTokenBudget: query.data?.runtime_token_budget ?? null,
    })
  }, [form, query.data?.runtime_token_budget])

  if (!agentId) {
    return (
      <DetailPageShell>
        <Result status="warning" title="缺少智能体 ID" />
      </DetailPageShell>
    )
  }

  if (query.isLoading) {
    return (
      <DetailPageShell>
        <div className="flex min-h-80 items-center justify-center">
          <Spin description="正在加载智能体详情" />
        </div>
      </DetailPageShell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <DetailPageShell>
        <Result
          status="error"
          title="智能体详情加载失败"
          extra={
            <Button type="primary" onClick={() => void query.refetch()}>
              重试
            </Button>
          }
        />
      </DetailPageShell>
    )
  }

  const detail = query.data

  return (
    <DetailPageShell>
      <Space className="w-full" direction="vertical" size={16}>
        <section className={styles.header}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Space align="start" size={14}>
              <span className={styles.appIcon}>
                <AppstoreOutlined />
              </span>
              <Space direction="vertical" size={8}>
                <Space wrap size={8}>
                  <Typography.Title className="!mb-0" level={4}>
                    {formatNullableText(detail.name)}
                  </Typography.Title>
                  <AgentStatusTag status={detail.status} />
                </Space>
                <Typography.Text type="secondary">
                  {formatNullableText(detail.description)}
                </Typography.Text>
                <Typography.Text copyable type="secondary">
                  {detail.agent_id}
                </Typography.Text>
              </Space>
            </Space>
            <Space wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => void navigate('/agent-ticket/agents')}
              >
                返回列表
              </Button>
              <Button
                disabled={!detail.endpoint_url}
                icon={<ApiOutlined />}
                type="primary"
                onClick={() => {
                  if (detail.endpoint_url) openEndpointUrl(detail.endpoint_url)
                }}
              >
                API 文档
              </Button>
            </Space>
          </div>
        </section>

        {mutation.isError ? (
          <Alert showIcon message="预算阈值保存失败" type="error" />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={styles.metricPanel}>
            <Statistic
              precision={2}
              prefix="¥"
              title="本月已消耗"
              value={detail.current_usage}
            />
          </div>
          <div className={styles.metricPanel}>
            {detail.runtime_token_budget === null ? (
              <Statistic title="运行时预算上限" value="无上限" />
            ) : (
              <Statistic
                precision={2}
                prefix="¥"
                title="运行时预算上限"
                value={detail.runtime_token_budget}
              />
            )}
          </div>
          <div className={styles.metricPanel}>
            <Statistic
              prefix={<FieldTimeOutlined />}
              title="最近一次调用"
              value={formatDateTime(detail.last_invoked_at)}
            />
          </div>
        </div>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>应用信息</div>
            <div className={styles.sectionSubtitle}>
              查看智能体来源、运行状态和外发服务地址。
            </div>
          </div>
          <Descriptions column={{ xs: 1, md: 2 }} bordered>
            <Descriptions.Item label="应用 ID">
              {detail.agent_id}
            </Descriptions.Item>
            <Descriptions.Item label="运行状态">
              <AgentStatusTag status={detail.status} />
            </Descriptions.Item>
            <Descriptions.Item label="来源工单">
              {formatNullableText(detail.task_id)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              <Space>
                <CalendarOutlined />
                {formatDateTime(detail.created_at)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="外发 API 地址" span={2}>
              {formatNullableText(detail.endpoint_url)}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>预算阈值</div>
            <div className={styles.sectionSubtitle}>
              配置智能体运行时每月 Token 费用上限。
            </div>
          </div>
          <Form
            form={form}
            className={styles.budgetForm}
            initialValues={{
              runtimeTokenBudget: detail.runtime_token_budget,
            }}
            layout="inline"
            onFinish={(values) =>
              mutation.mutate(values.runtimeTokenBudget ?? null)
            }
          >
            <Form.Item label="每月预算上限" name="runtimeTokenBudget">
              <InputNumber<number>
                min={0}
                precision={2}
                prefix="¥"
                style={{ width: 220 }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={mutation.isPending}
                type="primary"
              >
                保存
              </Button>
            </Form.Item>
          </Form>
        </section>
      </Space>
    </DetailPageShell>
  )
}

export default AgentDetail
