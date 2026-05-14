import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Card, Col, List, Row, Space, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const taskGroups = [
  {
    titleKey: 'pages.workspace.pendingTitle',
    statusKey: 'pages.workspace.processing',
    statusColor: 'processing',
    items: [
      'pages.workspace.pendingItems.reviewKnowledgeSync',
      'pages.workspace.pendingItems.confirmGatewayLimit',
      'pages.workspace.pendingItems.handleAgentAlert',
    ],
  },
  {
    titleKey: 'pages.workspace.completedTitle',
    statusKey: 'pages.workspace.synced',
    statusColor: 'success',
    items: [
      'pages.workspace.completedItems.publishRouting',
      'pages.workspace.completedItems.updateDashboard',
      'pages.workspace.completedItems.cleanupCache',
    ],
  },
]

export function WorkspacePage() {
  const { t } = useTranslation()

  return (
    <Space className="w-full" direction="vertical" size={24}>
      <Card>
        <Typography.Title className="!mb-2" level={4}>
          {t('pages.workspace.title')}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0" type="secondary">
          {t('pages.workspace.description')}
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {taskGroups.map((group) => (
          <Col key={group.titleKey} lg={12} xs={24}>
            <Card title={t(group.titleKey)}>
              <List
                dataSource={group.items}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        index === 0 ? (
                          <ClockCircleOutlined className="text-orange-500" />
                        ) : (
                          <CheckCircleOutlined className="text-green-600" />
                        )
                      }
                      title={t(item)}
                      description={
                        <Tag
                          color={index === 0 ? group.statusColor : 'success'}
                        >
                          {index === 0
                            ? t(group.statusKey)
                            : t('pages.workspace.synced')}
                        </Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}
