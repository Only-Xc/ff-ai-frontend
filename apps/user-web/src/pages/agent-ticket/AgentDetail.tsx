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
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'

import {
  tenantAgentKeys,
  tenantAgents_detail,
  tenantAgents_updateBudget,
} from '@/api/agent-ticket'
import { globalMessage } from '@/utils/message'

import { DetailPageShell } from './components/DetailPageShell'
import { AgentStatusTag } from './components/status'
import { formatDateTime } from './utils/format'
import { openEndpointUrl } from './utils/openEndpointUrl'

const useStyles = createStyles(() => ({
  page: {
    padding: '4px 0 20px',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    padding: 24,
    border: '1px solid color-mix(in srgb, var(--border) 78%, transparent)',
    borderRadius: 16,
    background: 'color-mix(in srgb, var(--panel) 96%, var(--bg))',
    boxShadow: '0 1px 0 rgb(15 23 42 / 0.03)',

    '&::before': {
      content: '""',
      position: 'absolute',
      insetInline: 20,
      top: 0,
      height: 1,
      background:
        'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-primary) 22%, transparent), transparent)',
      pointerEvents: 'none',
    },

    '@media (max-width: 768px)': {
      padding: 16,
    },
  },
  appIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    flex: '0 0 48px',
    borderRadius: 14,
    color: 'var(--admin-primary)',
    background: 'color-mix(in srgb, var(--admin-primary) 10%, var(--panel))',
    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--admin-primary) 12%, transparent)',
    fontSize: 20,
  },
  metaLabel: {
    color: 'var(--muted)',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 !important',
    color: 'var(--text-strong) !important',
    fontSize: '28px !important',
    lineHeight: '1.15 !important',
    fontWeight: '600 !important',

    '@media (max-width: 768px)': {
      fontSize: '24px !important',
    },
  },
  description: {
    maxWidth: 720,
    color: 'var(--muted) !important',
    lineHeight: '1.7 !important',
  },
  idText: {
    color: 'var(--muted) !important',

    '.ant-typography-copy': {
      color: 'var(--muted)',
    },
  },
  actionGroup: {
    alignSelf: 'stretch',

    '@media (max-width: 768px)': {
      width: '100%',

      '.ant-space-item, .ant-btn': {
        flex: 1,
      },
    },
  },
  metricPanel: {
    position: 'relative',
    minHeight: 108,
    padding: 16,
    border: '1px solid color-mix(in srgb, var(--border) 78%, transparent)',
    borderRadius: 16,
    background: 'color-mix(in srgb, var(--panel) 96%, var(--bg))',
    boxShadow: '0 1px 0 rgb(15 23 42 / 0.03)',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',

    '&::before': {
      content: '""',
      position: 'absolute',
      insetInline: 16,
      top: 0,
      height: 1,
      background:
        'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-primary) 24%, transparent), transparent)',
      pointerEvents: 'none',
    },

    '.ant-statistic-title': {
      color: 'var(--muted)',
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 10,
    },

    '.ant-statistic-content': {
      color: 'var(--text-strong)',
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: 0,
    },

    '.ant-statistic-content-prefix': {
      marginInlineEnd: 6,
      color: 'var(--admin-primary)',
      fontSize: 18,
    },

    '@media (hover: hover)': {
      '&:hover': {
        borderColor:
          'color-mix(in srgb, var(--admin-primary) 22%, var(--border))',
        boxShadow: '0 8px 20px rgb(15 23 42 / 0.04)',
      },
    },
  },
  sectionPanel: {
    padding: 20,
    border: '1px solid color-mix(in srgb, var(--border) 78%, transparent)',
    borderRadius: 16,
    background: 'color-mix(in srgb, var(--panel) 98%, var(--bg))',
    boxShadow: '0 1px 0 rgb(15 23 42 / 0.03)',

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
  descriptions: {
    overflow: 'hidden',
    borderRadius: 14,

    '.ant-descriptions-view': {
      borderRadius: 14,
      overflow: 'hidden',
      borderColor: 'color-mix(in srgb, var(--border) 68%, transparent)',
    },

    '.ant-descriptions-item-label': {
      width: '16%',
      minWidth: 96,
      color: 'var(--muted)',
      fontWeight: 500,
      background: 'color-mix(in srgb, var(--panel) 92%, var(--bg))',
    },

    '.ant-descriptions-item-content': {
      color: 'var(--text-strong)',
      background: 'color-mix(in srgb, var(--panel) 98%, var(--bg))',
    },

    '.ant-descriptions-row > th, .ant-descriptions-row > td': {
      borderColor: 'color-mix(in srgb, var(--border) 68%, transparent)',
    },
  },
  budgetPanel: {
    position: 'relative',
    overflow: 'hidden',

    '&::before': {
      content: '""',
      position: 'absolute',
      insetInline: 20,
      top: 0,
      height: 1,
      background:
        'linear-gradient(90deg, transparent, color-mix(in srgb, var(--admin-primary) 24%, transparent), transparent)',
      pointerEvents: 'none',
    },
  },
  budgetForm: {
    display: 'flex',
    alignItems: 'end',
    flexWrap: 'wrap',
    gap: 12,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-form-item-label > label': {
      color: 'var(--muted)',
      fontSize: 13,
      fontWeight: 500,
    },

    '.ant-input-number': {
      borderRadius: 12,
    },

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

export function AgentDetail() {
  const { t } = useTranslation()
  const { styles } = useStyles()
  const navigate = useNavigate()
  const { agentId } = useParams()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<{ runtimeTokenBudget: number | null }>()

  const query = useQuery({
    queryKey: tenantAgentKeys.detail(agentId),
    queryFn: () => tenantAgents_detail(agentId ?? ''),
    enabled: Boolean(agentId),
  })

  const mutation = useMutation({
    mutationFn: (runtimeTokenBudget: number | null) =>
      tenantAgents_updateBudget(agentId ?? '', runtimeTokenBudget),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tenantAgentKeys.detail(agentId),
      })
      globalMessage.success(t('pages.agentTicket.detail.budgetSaved'))
    },
  })

  useEffect(() => {
    if (!query.data) return

    form.setFieldsValue({
      runtimeTokenBudget: query.data.runtime_token_budget ?? null,
    })
  }, [form, query.data])

  if (!agentId) {
    return (
      <DetailPageShell>
        <Result
          status="warning"
          title={t('pages.agentTicket.detail.missingAgentId')}
        />
      </DetailPageShell>
    )
  }

  if (query.isLoading) {
    return (
      <DetailPageShell>
        <div className="flex min-h-80 items-center justify-center">
          <Spin description={t('pages.agentTicket.detail.loading')} />
        </div>
      </DetailPageShell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <DetailPageShell>
        <Result
          status="error"
          title={t('pages.agentTicket.detail.loadFailed')}
          extra={
            <Button type="primary" onClick={() => void query.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
        />
      </DetailPageShell>
    )
  }

  const detail = query.data

  return (
    <DetailPageShell>
      <Space className={`${styles.page} w-full`} orientation="vertical" size={16}>
        <section className={styles.header}>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <Space align="start" size={14}>
              <span className={styles.appIcon}>
                <AppstoreOutlined />
              </span>
              <Space orientation="vertical" size={10}>
                <span className={styles.metaLabel}>Agent</span>
                <Space wrap size={8}>
                  <Typography.Title className={styles.title} level={4}>
                    {detail.name}
                  </Typography.Title>
                  <AgentStatusTag status={detail.status} />
                </Space>
                <Typography.Text className={styles.description}>
                  {detail.description}
                </Typography.Text>
                <Typography.Text className={styles.idText} copyable>
                  {detail.agent_id}
                </Typography.Text>
              </Space>
            </Space>
            <Space className={styles.actionGroup} wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => void navigate('/agent-ticket/agents')}
              >
                {t('pages.agentTicket.detail.back')}
              </Button>
              <Button
                disabled={!detail.endpoint_url}
                icon={<ApiOutlined />}
                type="primary"
                onClick={() => {
                  if (detail.endpoint_url) openEndpointUrl(detail.endpoint_url)
                }}
              >
                {t('pages.agentTicket.detail.apiDocs')}
              </Button>
            </Space>
          </div>
        </section>

        {mutation.isError ? (
          <Alert
            showIcon
            title={t('pages.agentTicket.detail.budgetSaveFailed')}
            type="error"
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={styles.metricPanel}>
            <Statistic
              precision={2}
              prefix="¥"
              title={t('pages.agentTicket.detail.currentMonthUsage')}
              value={detail.current_usage}
            />
          </div>
          <div className={styles.metricPanel}>
            {detail.runtime_token_budget === null ? (
              <Statistic
                title={t('pages.agentTicket.detail.runtimeBudgetLimit')}
                value={t('pages.agentTicket.detail.unlimited')}
              />
            ) : (
              <Statistic
                precision={2}
                prefix="¥"
                title={t('pages.agentTicket.detail.runtimeBudgetLimit')}
                value={detail.runtime_token_budget}
              />
            )}
          </div>
          <div className={styles.metricPanel}>
            <Statistic
              prefix={<FieldTimeOutlined />}
              title={t('pages.agentTicket.detail.lastInvokedAt')}
              value={formatDateTime(detail.last_invoked_at)}
            />
          </div>
        </div>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              {t('pages.agentTicket.detail.appInfo')}
            </div>
            <div className={styles.sectionSubtitle}>
              {t('pages.agentTicket.detail.appInfoDescription')}
            </div>
          </div>
          <Descriptions
            bordered
            className={styles.descriptions}
            column={{ xs: 1, md: 2 }}
          >
            <Descriptions.Item label={t('pages.agentTicket.detail.appId')}>
              {detail.agent_id}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('pages.agentTicket.columns.runStatus')}
            >
              <AgentStatusTag status={detail.status} />
            </Descriptions.Item>
            <Descriptions.Item
              label={t('pages.agentTicket.detail.sourceTask')}
            >
              {detail.task_id}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('pages.agentTicket.columns.createdAt')}
            >
              <Space>
                <CalendarOutlined />
                {formatDateTime(detail.created_at)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={t('pages.agentTicket.detail.endpointUrl')}
              span={2}
            >
              {detail.endpoint_url}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <section className={`${styles.sectionPanel} ${styles.budgetPanel}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              {t('pages.agentTicket.detail.budget')}
            </div>
            <div className={styles.sectionSubtitle}>
              {t('pages.agentTicket.detail.budgetDescription')}
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
            <Form.Item
              label={t('pages.agentTicket.detail.monthlyBudgetLimit')}
              name="runtimeTokenBudget"
            >
              <InputNumber<number>
                min={0}
                precision={2}
                prefix="¥"
                placeholder={t(
                  'pages.agentTicket.detail.monthlyBudgetPlaceholder',
                )}
                style={{ width: 240 }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={mutation.isPending}
                type="primary"
              >
                {t('common.actions.save')}
              </Button>
            </Form.Item>
          </Form>
        </section>
      </Space>
    </DetailPageShell>
  )
}

export default AgentDetail
