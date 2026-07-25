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
  Segmented,
  Space,
  Skeleton,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import { createStyles } from 'antd-style'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  isDirectlyIntegratedPlugin,
  pluginCatalogKeys,
  plugins_addFavorite,
  plugins_catalog,
  plugins_removeFavorite,
  type PluginCatalogItem,
} from '@/api/plugins'
import { useMenuStore } from '@/store/useMenu'

type CatalogFilter = 'all' | 'favorite' | 'available'

const usePlatformAppsStyles = createStyles(({ css, token }) => ({
  page: css`
    min-height: 100%;
    padding: ${token.paddingLG}px;

    @media (max-width: 760px) {
      padding: ${token.padding}px;
    }
  `,
  shell: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  surface: css`
    padding: ${token.paddingLG}px;
  `,
  toolbar: css`
    display: grid;
    grid-template-columns: minmax(280px, 520px) auto;
    gap: ${token.margin}px;
    align-items: center;
    justify-content: space-between;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};

    @media (max-width: 860px) {
      grid-template-columns: 1fr;
    }
  `,
  stats: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    gap: ${token.margin}px;

    @media (max-width: 760px) {
      grid-template-columns: 1fr;
    }
  `,
  stat: css`
    min-width: 0;
    padding: ${token.padding}px ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillQuaternary};
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${token.margin}px;
  `,
  card: css`
    position: relative;
    display: grid;
    min-height: 206px;
    grid-template-rows: auto 1fr auto;
    gap: ${token.margin}px;
    padding: ${token.paddingLG}px;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    transition:
      border-color ${token.motionDurationMid},
      box-shadow ${token.motionDurationMid},
      transform ${token.motionDurationMid};
  `,
  activeCard: css`
    border-color: ${token.colorPrimaryBorder};
    box-shadow: inset 3px 0 0 ${token.colorPrimary};
  `,
  cardHeader: css`
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: ${token.margin}px;
    align-items: start;
  `,
  icon: css`
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    font-size: 20px;
  `,
  titleBlock: css`
    min-width: 0;
  `,
  titleLine: css`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  pluginId: css`
    display: block;
    margin-top: 2px;
    font-family: ${token.fontFamilyCode};
    font-size: 12px;
  `,
  description: css`
    min-height: 44px;
    margin: 0 !important;
    color: ${token.colorTextSecondary} !important;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  footer: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    align-items: center;
    justify-content: space-between;
    padding-top: ${token.paddingSM}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  actions: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: center;
  `,
}))

export default function PlatformApps() {
  const { styles, cx } = usePlatformAppsStyles()
  const { message } = App.useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')
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
  const items = useMemo(
    () =>
      (catalogQuery.data?.data ?? []).filter(
        (item) => !isDirectlyIntegratedPlugin(item),
      ),
    [catalogQuery.data?.data],
  )
  const favoriteCount = useMemo(
    () => items.filter((item) => item.is_favorite).length,
    [items],
  )
  const filteredItems = useMemo(() => {
    if (filter === 'favorite') return items.filter((item) => item.is_favorite)
    if (filter === 'available') return items.filter((item) => !item.is_favorite)
    return items
  }, [filter, items])

  return (
    <div className={styles.page}>
      <PageContainer className={cx(styles.surface, styles.shell)}>
        <PageHeader
          subtitle={t('pages.platformApps.subtitle')}
          title={t('pages.platformApps.title')}
        >
          <Tooltip title={t('common.actions.refresh')}>
            <Button
              aria-label={t('common.actions.refresh')}
              icon={<ReloadOutlined />}
              loading={catalogQuery.isFetching}
              onClick={() => void catalogQuery.refetch()}
            />
          </Tooltip>
        </PageHeader>

        <div className={styles.toolbar}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('pages.platformApps.search')}
            size="large"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Segmented<CatalogFilter>
            options={[
              { label: t('pages.platformApps.filters.all'), value: 'all' },
              {
                label: t('pages.platformApps.filters.favorite'),
                value: 'favorite',
              },
              {
                label: t('pages.platformApps.filters.available'),
                value: 'available',
              },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <Statistic
              title={t('pages.platformApps.stats.total')}
              value={items.length}
            />
          </div>
          <div className={styles.stat}>
            <Statistic
              title={t('pages.platformApps.stats.sidebar')}
              value={favoriteCount}
            />
          </div>
          <div className={styles.stat}>
            <Statistic
              title={t('pages.platformApps.stats.available')}
              value={Math.max(items.length - favoriteCount, 0)}
            />
          </div>
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
        ) : filteredItems.length ? (
          <div className={styles.grid}>
            {filteredItems.map((item) => (
              <article
                className={cx(styles.card, item.is_favorite && styles.activeCard)}
                key={item.installation_id}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.icon}>
                    <AppstoreOutlined />
                  </span>
                  <div className={styles.titleBlock}>
                    <div className={styles.titleLine}>
                      <Typography.Title
                        className="mb-0! truncate text-base!"
                        level={3}
                      >
                        {item.name}
                      </Typography.Title>
                      {item.is_favorite ? (
                        <Tag color="success">
                          {t('pages.platformApps.sidebar')}
                        </Tag>
                      ) : null}
                    </div>
                    <Typography.Text className={styles.pluginId} type="secondary">
                      {item.plugin_id}
                    </Typography.Text>
                  </div>
                  <Tooltip
                    title={
                      item.is_favorite
                        ? t('pages.platformApps.remove')
                        : t('pages.platformApps.add')
                    }
                  >
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
                  </Tooltip>
                </div>

                <Typography.Paragraph
                  className={styles.description}
                  ellipsis={{ rows: 2, tooltip: item.description ?? undefined }}
                >
                  {item.description ?? t('pages.platformApps.noDescription')}
                </Typography.Paragraph>

                <div className={styles.footer}>
                  <div className={styles.meta}>
                    <Tag color={sourceColor(item.source_type)}>
                      {formatSourceType(item.source_type)}
                    </Tag>
                    <Tag>{item.version}</Tag>
                    <Tag color={statusColor(item.status)}>{item.status}</Tag>
                  </div>
                  <Space className={styles.actions} size={4}>
                    <Button
                      size="small"
                      type={item.is_favorite ? 'primary' : 'default'}
                      onClick={() => void navigate(item.entry_path)}
                    >
                      {t('pages.platformApps.open')}
                    </Button>
                  </Space>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description={t('pages.platformApps.empty')} />
        )}
      </PageContainer>
    </div>
  )
}

function formatSourceType(sourceType: string) {
  if (sourceType === 'platform_workflow') return 'Workflow'
  if (sourceType === 'external_image') return 'External image'
  if (sourceType === 'oci_image') return 'OCI image'
  return sourceType
}

function sourceColor(sourceType: string) {
  if (sourceType === 'platform_workflow') return 'blue'
  if (sourceType === 'external_image') return 'orange'
  if (sourceType === 'oci_image') return 'cyan'
  return 'default'
}

function statusColor(status: string) {
  if (['enabled', 'healthy', 'active'].includes(status)) return 'success'
  if (['pending', 'installing', 'starting'].includes(status)) return 'processing'
  if (['failed', 'unhealthy'].includes(status)) return 'error'
  return 'default'
}
