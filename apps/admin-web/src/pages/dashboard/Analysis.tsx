import {
  ArrowUpOutlined,
  CloudServerOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const modelRows = [
  {
    key: 'gpt-5.5',
    model: 'GPT-5.5',
    calls: '128,430',
    latency: '620ms',
    statusKey: 'running',
  },
  {
    key: 'embedding',
    model: 'Embedding Pipeline',
    calls: '86,210',
    latency: '210ms',
    statusKey: 'running',
  },
  {
    key: 'agent',
    model: 'Agent Runtime',
    calls: '24,980',
    latency: '840ms',
    statusKey: 'observing',
  },
]

export function AnalysisPage() {
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      {
        title: t('pages.analysis.columns.model'),
        dataIndex: 'model',
      },
      {
        title: t('pages.analysis.columns.calls'),
        dataIndex: 'calls',
      },
      {
        title: t('pages.analysis.columns.latency'),
        dataIndex: 'latency',
      },
      {
        title: t('pages.analysis.columns.status'),
        dataIndex: 'statusKey',
        render: (value: string) => (
          <Tag color={value === 'running' ? 'green' : 'gold'}>
            {t(`pages.analysis.status.${value}`)}
          </Tag>
        ),
      },
    ],
    [t],
  )
  const renderOverviewSection = (index: number) => (
    <Row key={index} gutter={[16, 16]}>
      <Col lg={16} xs={24}>
        <Card title={t('pages.analysis.modelOverview')}>
          <Table pagination={false} dataSource={modelRows} columns={columns} />
        </Card>
      </Col>
      <Col lg={8} xs={24}>
        <Card title={t('pages.analysis.resourceLevel')}>
          <Space className="w-full" direction="vertical" size={20}>
            <div>
              <Typography.Text>
                {t('pages.analysis.resources.inferenceQueue')}
              </Typography.Text>
              <Progress percent={68} />
            </div>
            <div>
              <Typography.Text>
                {t('pages.analysis.resources.vectorIndex')}
              </Typography.Text>
              <Progress percent={42} status="active" />
            </div>
            <div>
              <Typography.Text>
                {t('pages.analysis.resources.taskScheduler')}
              </Typography.Text>
              <Progress percent={86} />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  )

  return (
    <Space className="w-full" direction="vertical" size={24}>
      <Row gutter={[16, 16]}>
        <Col lg={6} sm={12} xs={24}>
          <Card>
            <Statistic
              title={t('pages.analysis.stats.callsToday')}
              value={238620}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <Card>
            <Statistic
              title={t('pages.analysis.stats.successRate')}
              value={99.82}
              precision={2}
              suffix="%"
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <Card>
            <Statistic
              title={t('pages.analysis.stats.averageLatency')}
              value={648}
              suffix="ms"
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <Card>
            <Statistic
              title={t('pages.analysis.stats.activeServices')}
              value={18}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {Array.from({ length: 5 }, (_, index) => renderOverviewSection(index))}
    </Space>
  )
}
