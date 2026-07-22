import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Empty, Input, Tag } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  listPlatformApps,
  workflowKeys,
  type CatalogApp,
} from '@/api/workflow'

const APP_TYPE_LABEL_KEYS: Record<string, string> = {
  workflow: 'pages.platformApps.types.workflow',
}

export default function PlatformAppsCatalog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: workflowKeys.catalog(),
    queryFn: () => listPlatformApps(),
  })

  const filteredItems = useMemo<CatalogApp[]>(() => {
    const items = data?.items ?? []
    if (!search.trim()) return items
    const needle = search.trim().toLowerCase()
    return items.filter((item) =>
      item.title?.toLowerCase().includes(needle),
    )
  }, [data?.items, search])

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={t('pages.platformApps.title')}
        extra={
          <Input
            placeholder={t('pages.platformApps.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
        }
      >
        {filteredItems.length === 0 && !isLoading ? (
          <Empty description={t('pages.platformApps.empty')} />
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
          >
            {filteredItems.map((app) => {
              const isWorkflow = app.app_type === 'workflow'
              return (
                <Card
                  key={app.id}
                  hoverable
                  loading={isLoading}
                  onClick={() => {
                    if (isWorkflow) {
                      void navigate(
                        `/platform-apps/workflows/${app.target_id}/chat`,
                      )
                    }
                  }}
                  style={{ cursor: isWorkflow ? 'pointer' : 'default' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: 'var(--ant-color-text)',
                      }}
                    >
                      {app.title}
                    </span>
                    <Tag color="blue">
                      {t(
                        APP_TYPE_LABEL_KEYS[app.app_type] ??
                          'pages.platformApps.types.unknown',
                        app.app_type,
                      )}
                    </Tag>
                  </div>
                  <div style={{ color: 'var(--ant-color-text-secondary)' }}>
                    {app.description ?? t('pages.platformApps.noDescription')}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
