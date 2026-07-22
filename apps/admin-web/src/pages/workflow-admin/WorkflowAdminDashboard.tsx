import { NodeIndexOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Space, Typography } from 'antd'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  workflowAdminDashboard_get,
  workflowAdminKeys,
} from '@/api/workflow-admin'
import { WorkflowAdminTenantPicker } from './WorkflowAdminTenantPicker'

const { Text } = Typography

export function WorkflowAdminDashboard() {
  const { t } = useTranslation()
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined)

  const query = useMemo(
    () => (selectedOrgId ? { org_id: selectedOrgId } : {}),
    [selectedOrgId],
  )

  const { data, isLoading } = useQuery({
    queryKey: workflowAdminKeys.dashboard(query),
    queryFn: () => workflowAdminDashboard_get(query),
    placeholderData: keepPreviousData,
  })

  const metrics = data?.metrics ?? []
  const metricMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const m of metrics) map[m.label] = m.value
    return map
  }, [metrics])

  const scope = data?.scope ?? 'tenant'

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.workflowAdmin.dashboard.title', 'Workflow 管理台')}
        subtitle={t(
          'pages.workflowAdmin.dashboard.subtitle',
          '跨租户 / 同租户 Workflow 运维指标聚合',
        )}
      >
        <WorkflowAdminTenantPicker
          scope={scope}
          value={selectedOrgId}
          onChange={setSelectedOrgId}
        />
      </PageHeader>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : metrics.length === 0 ? (
        <Empty description={t('common.empty', '暂无数据')} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Space>
                <NodeIndexOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                <Text type="secondary">
                  {t('pages.workflowAdmin.metrics.total_workflows', 'Workflow 总数')}
                </Text>
              </Space>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {metricMap.total_workflows ?? 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                apps
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Space>
                <NodeIndexOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Text type="secondary">
                  {t(
                    'pages.workflowAdmin.metrics.published_workflows',
                    '已发布 Workflow',
                  )}
                </Text>
              </Space>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {metricMap.published_workflows ?? 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                apps
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Space>
                <NodeIndexOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <Text type="secondary">
                  {t('pages.workflowAdmin.metrics.total_runs', '累计运行次数')}
                </Text>
              </Space>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {metricMap.total_runs ?? 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                runs
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Space>
                <NodeIndexOutlined style={{ fontSize: 24, color: '#fa541c' }} />
                <Text type="secondary">
                  {t('pages.workflowAdmin.metrics.failed_runs', '失败运行数')}
                </Text>
              </Space>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {metricMap.failed_runs ?? 0}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                runs
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Space>
                <NodeIndexOutlined style={{ fontSize: 24, color: '#cf1322' }} />
                <Text type="secondary">
                  {t('pages.workflowAdmin.metrics.error_rate', '运行错误率')}
                </Text>
              </Space>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                {(metricMap.error_rate ?? 0).toFixed(2)}
                <span style={{ fontSize: 14, marginLeft: 4 }}>%</span>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </PageContainer>
  )
}

export default WorkflowAdminDashboard
