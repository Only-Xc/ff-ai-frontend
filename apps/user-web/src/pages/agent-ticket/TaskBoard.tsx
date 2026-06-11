import {
  ArrowLeftOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DeploymentUnitOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'
import {
  Button,
  Descriptions,
  Grid,
  Result,
  Space,
  Steps,
  Typography,
} from 'antd'
import { createStyles } from 'antd-style'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import type { TaskStatus } from '@/api/agent-ticket'
import { DetailPageShell } from './components/DetailPageShell'
import { defaultTaskStep, taskStepIndexMap } from './constants'

function getTaskStepCurrent(status?: TaskStatus) {
  if (!status) return defaultTaskStep

  return taskStepIndexMap[status]
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
  boardIcon: {
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
}))

export function TaskBoard() {
  const { t } = useTranslation()
  const { styles } = useStyles()
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const currentStep = getTaskStepCurrent()

  if (!taskId) {
    return (
      <DetailPageShell>
        <Result
          status="warning"
          title={t('pages.agentTicket.board.missingTaskId')}
        />
      </DetailPageShell>
    )
  }

  return (
    <DetailPageShell>
      <Space className="w-full" direction="vertical" size={16}>
        <section className={styles.header}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Space align="start" size={14}>
              <span className={styles.boardIcon}>
                <DeploymentUnitOutlined />
              </span>
              <Space direction="vertical" size={8}>
                <Typography.Title className="!mb-0" level={4}>
                  {t('pages.agentTicket.board.title')}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {t('pages.agentTicket.board.subtitle')}
                </Typography.Text>
                <Typography.Text copyable type="secondary">
                  {taskId}
                </Typography.Text>
              </Space>
            </Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => void navigate('/agent-ticket/tickets')}
            >
              {t('pages.agentTicket.board.back')}
            </Button>
          </div>
        </section>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              {t('pages.agentTicket.board.progress')}
            </div>
            <div className={styles.sectionSubtitle}>
              {t('pages.agentTicket.board.progressDescription')}
            </div>
          </div>
          <Steps
            current={currentStep}
            direction={screens.md ? 'horizontal' : 'vertical'}
            items={[
              {
                title: t('pages.agentTicket.board.steps.analysis.title'),
                description: t(
                  'pages.agentTicket.board.steps.analysis.description',
                ),
                icon: <FileSearchOutlined />,
              },
              {
                title: t(
                  'pages.agentTicket.board.steps.orchestration.title',
                ),
                description: t(
                  'pages.agentTicket.board.steps.orchestration.description',
                ),
                icon: <BuildOutlined />,
              },
              {
                title: t('pages.agentTicket.board.steps.delivery.title'),
                description: t(
                  'pages.agentTicket.board.steps.delivery.description',
                ),
                icon: <CodeOutlined />,
              },
              {
                title: t('pages.agentTicket.board.steps.complete.title'),
                description: t(
                  'pages.agentTicket.board.steps.complete.description',
                ),
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </section>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              {t('pages.agentTicket.board.info')}
            </div>
          </div>
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item
              label={t('pages.agentTicket.board.taskId')}
              span={2}
            >
              {taskId}
            </Descriptions.Item>
          </Descriptions>
        </section>
      </Space>
    </DetailPageShell>
  )
}

export default TaskBoard
