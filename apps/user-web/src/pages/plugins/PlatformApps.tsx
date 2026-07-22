import {
  AppstoreOutlined,
  CheckOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Empty,
  Input,
  Skeleton,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  pluginCatalogKeys,
  plugins_addFavorite,
  plugins_catalog,
  plugins_removeFavorite,
  type PluginCatalogItem,
} from '@/api/plugins'
import { useMenuStore } from '@/store/useMenu'

export default function PlatformApps() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const refreshMenu = useMenuStore((state) => state.refreshPluginCatalog)
  const catalogQuery = useQuery({
    queryKey: pluginCatalogKeys.list(false, keyword),
    queryFn: () => plugins_catalog({ keyword: keyword || undefined }),
    placeholderData: keepPreviousData,
  })
  const favoriteMutation = useMutation({
    mutationFn: async (item: PluginCatalogItem) => {
      if (item.is_favorite) await plugins_removeFavorite(item)
      else await plugins_addFavorite(item)
      return item
    },
    onSuccess: async (item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pluginCatalogKeys.all }),
        refreshMenu(),
      ])
      message.success(
        t(
          item.is_favorite
            ? 'pages.platformApps.removed'
            : 'pages.platformApps.added',
        ),
      )
    },
  })

  return (
    <PageContainer>
      <PageHeader
        subtitle={t('pages.platformApps.subtitle')}
        title={t('pages.platformApps.title')}
      >
        <Button
          aria-label={t('common.actions.refresh')}
          icon={<ReloadOutlined />}
          loading={catalogQuery.isFetching}
          onClick={() => void catalogQuery.refetch()}
        />
      </PageHeader>

      <div className="mb-4 flex max-w-xl items-center gap-2">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('pages.platformApps.search')}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      {catalogQuery.isError ? (
        <Alert
          action={
            <Button size="small" onClick={() => void catalogQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
          title={t('pages.platformApps.loadFailed')}
          showIcon
          type="error"
        />
      ) : null}

      {catalogQuery.isPending ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : catalogQuery.data?.data.length ? (
        <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
          {catalogQuery.data.data.map((item) => (
            <article
              className="flex min-h-40 flex-col rounded-lg border border-(--border) bg-(--panel) p-4"
              key={item.installation_id}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--admin-primary)_10%,transparent)] text-(--admin-primary)">
                    <AppstoreOutlined />
                  </span>
                  <div className="min-w-0">
                    <Typography.Title
                      className="mb-0! truncate text-base!"
                      level={3}
                    >
                      {item.name}
                    </Typography.Title>
                    <Typography.Text className="text-xs" type="secondary">
                      {item.version}
                    </Typography.Text>
                  </div>
                </div>
                <Button
                  aria-label={
                    item.is_favorite
                      ? t('pages.platformApps.remove')
                      : t('pages.platformApps.add')
                  }
                  icon={item.is_favorite ? <CheckOutlined /> : <PlusOutlined />}
                  loading={
                    favoriteMutation.isPending &&
                    favoriteMutation.variables?.installation_id ===
                      item.installation_id
                  }
                  type={item.is_favorite ? 'default' : 'primary'}
                  onClick={() => favoriteMutation.mutate(item)}
                />
              </div>
              <Typography.Paragraph className="mt-3 mb-4! line-clamp-2 flex-1 text-sm text-(--muted)!">
                {item.description ?? t('pages.platformApps.noDescription')}
              </Typography.Paragraph>
              <div className="flex items-center justify-between gap-2">
                <Tag>
                  {item.source_type === 'platform_workflow'
                    ? 'Workflow'
                    : item.source_type}
                </Tag>
                <Button
                  type="link"
                  onClick={() => void navigate(item.entry_path)}
                >
                  {t('pages.platformApps.open')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty description={t('pages.platformApps.empty')} />
      )}
    </PageContainer>
  )
}
