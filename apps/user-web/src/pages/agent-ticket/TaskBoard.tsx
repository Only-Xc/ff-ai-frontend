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
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'

import type { TaskStatus } from '@/api/agentTicket'

const DEFAULT_TASK_STEP = 2

const taskStepIndexMap: Record<TaskStatus, number> = {
  CREATED: 0,
  ANALYZING: 0,
  ROUTING: 1,
  CODING: 2,
  TESTING: 2,
  DEPLOYING: 2,
  COMPLETED: 3,
  PENDING_APPROVAL: 2,
  FAILED: 2,
}

function getTaskStepCurrent(status?: TaskStatus) {
  if (!status) return DEFAULT_TASK_STEP

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

function DetailPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

export function TaskBoard() {
  const { styles } = useStyles()
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const currentStep = getTaskStepCurrent()

  if (!taskId) {
    return (
      <DetailPageShell>
        <Result status="warning" title="缺少工单 ID" />
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
                  动态看板
                </Typography.Title>
                <Typography.Text type="secondary">
                  查看工单从需求分析到交付应用的流转进度。
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
              返回工单列表
            </Button>
          </div>
        </section>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>流转进度</div>
            <div className={styles.sectionSubtitle}>
              展示需求分析、任务编排、构建交付与完成交付节点。
            </div>
          </div>
          <Steps
            current={currentStep}
            direction={screens.md ? 'horizontal' : 'vertical'}
            items={[
              {
                title: '需求分析',
                description: '解析用户目标和交付形态',
                icon: <FileSearchOutlined />,
              },
              {
                title: '任务编排',
                description: '匹配执行策略与资源',
                icon: <BuildOutlined />,
              },
              {
                title: '构建交付',
                description: '生成、测试并部署智能体',
                icon: <CodeOutlined />,
              },
              {
                title: '完成交付',
                description: '提供应用入口和 API 文档',
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </section>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>工单信息</div>
          </div>
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="工单 ID" span={2}>
              {taskId}
            </Descriptions.Item>
          </Descriptions>
        </section>
      </Space>
    </DetailPageShell>
  )
}

export default TaskBoard
