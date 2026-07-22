import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import uniq from 'lodash-es/uniq'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import {
  pluginKeys,
  plugins_get,
  plugins_createVersion,
  plugins_hardUninstall,
  plugins_install,
  plugins_installations,
  plugins_lifecycle,
  plugins_routes,
  plugins_rollback,
  plugins_runtimeResources,
  plugins_services,
  plugins_upgrade,
  plugins_verify,
  plugins_openapi,
  type PluginInstallBody,
  type PluginInstallation,
  type PluginRegistrationBody,
  type PluginVersion,
} from '@/api/plugins'

import { InstallPluginModal } from './components/InstallPluginModal'
import { PluginPermissionsPanel } from './components/PluginPermissionsPanel'
import { PluginInstancePanel } from './components/PluginInstancePanel'
import { PluginRegistrationModal } from './components/PluginRegistrationModal'
import { PluginStatusTag } from './components/PluginStatusTag'
import { INSTALLABLE_SOURCE_TYPES } from './constants'

type LifecycleAction = 'enable' | 'disable' | 'restart' | 'uninstall-soft'

export default function PluginDetail() {
  const { message, modal } = App.useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pluginId = '' } = useParams()
  const queryClient = useQueryClient()
  const [installOpen, setInstallOpen] = useState(false)
  const [runtimeInstallationId, setRuntimeInstallationId] = useState<string>()
  const [upgradeInstallation, setUpgradeInstallation] =
    useState<PluginInstallation>()
  const [upgradeVersion, setUpgradeVersion] = useState<string>()
  const [hardUninstallInstallation, setHardUninstallInstallation] =
    useState<PluginInstallation>()
  const [hardConfirm, setHardConfirm] = useState('')
  const [backupAcknowledged, setBackupAcknowledged] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PluginVersion>()
  const [versionOpen, setVersionOpen] = useState(false)
  const [organizationFilter, setOrganizationFilter] = useState<string>()

  const detailQuery = useQuery({
    queryKey: pluginKeys.detail(pluginId),
    queryFn: () => plugins_get(pluginId),
    enabled: Boolean(pluginId),
  })
  const installationsQuery = useQuery({
    queryKey: pluginKeys.installations(pluginId),
    queryFn: () => plugins_installations(pluginId),
    enabled: Boolean(pluginId),
  })
  const resourcesQuery = useQuery({
    queryKey: [
      ...pluginKeys.runtime(pluginId, runtimeInstallationId),
      'resources',
    ],
    queryFn: () => plugins_runtimeResources(pluginId, runtimeInstallationId!),
    enabled: Boolean(runtimeInstallationId),
  })
  const servicesQuery = useQuery({
    queryKey: [
      ...pluginKeys.runtime(pluginId, runtimeInstallationId),
      'services',
    ],
    queryFn: () => plugins_services(pluginId, runtimeInstallationId!),
    enabled: Boolean(runtimeInstallationId),
  })
  const routesQuery = useQuery({
    queryKey: [
      ...pluginKeys.runtime(pluginId, runtimeInstallationId),
      'routes',
    ],
    queryFn: () => plugins_routes(pluginId, runtimeInstallationId!),
    enabled: Boolean(runtimeInstallationId),
  })
  const selectedInstallation = installationsQuery.data?.data.find(
    (item) => item.id === runtimeInstallationId,
  )
  const openapiQuery = useQuery({
    queryKey: [
      ...pluginKeys.detail(pluginId),
      'openapi',
      selectedInstallation?.organization_id,
    ],
    queryFn: () =>
      plugins_openapi(pluginId, selectedInstallation!.organization_id),
    enabled: Boolean(selectedVersion && selectedInstallation),
    retry: false,
  })

  useEffect(() => {
    if (!runtimeInstallationId && installationsQuery.data?.data[0]) {
      setRuntimeInstallationId(installationsQuery.data.data[0].id)
    }
  }, [installationsQuery.data, runtimeInstallationId])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
  }
  const installMutation = useMutation({
    mutationFn: (body: PluginInstallBody) => plugins_install(pluginId, body),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.messages.installQueued'))
      setInstallOpen(false)
      await invalidate()
    },
  })
  const lifecycleMutation = useMutation({
    mutationFn: ({
      action,
      installationId,
    }: {
      action: LifecycleAction
      installationId: string
    }) => plugins_lifecycle(pluginId, action, installationId),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.messages.operationQueued'))
      await invalidate()
    },
  })
  const upgradeMutation = useMutation({
    mutationFn: () =>
      plugins_upgrade(pluginId, upgradeInstallation!.id, upgradeVersion!),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.messages.operationQueued'))
      setUpgradeInstallation(undefined)
      setUpgradeVersion(undefined)
      await invalidate()
    },
  })
  const hardUninstallMutation = useMutation({
    mutationFn: () =>
      plugins_hardUninstall(
        pluginId,
        hardUninstallInstallation!.id,
        hardConfirm,
      ),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.messages.operationQueued'))
      setHardUninstallInstallation(undefined)
      setHardConfirm('')
      setBackupAcknowledged(false)
      await invalidate()
    },
  })
  const rollbackMutation = useMutation({
    mutationFn: (installationId: string) =>
      plugins_rollback(pluginId, installationId),
    onSuccess: async () => {
      message.success('回滚作业已提交')
      await invalidate()
    },
  })
  const verifyMutation = useMutation({
    mutationFn: () => plugins_verify(pluginId, runtimeInstallationId),
    onSuccess: async () => {
      message.success('插件契约验证完成')
      await invalidate()
    },
  })
  const versionMutation = useMutation({
    mutationFn: (body: PluginRegistrationBody) =>
      plugins_createVersion(pluginId, {
        manifest: body.manifest,
        image: body.image,
        image_digest: body.image_digest,
      }),
    onSuccess: async () => {
      message.success('新版本已发布')
      setVersionOpen(false)
      await invalidate()
    },
  })

  const queueLifecycle = (
    installation: PluginInstallation,
    action: LifecycleAction,
  ) => {
    const isRestore =
      action === 'enable' && installation.status === 'uninstalled'
    modal.confirm({
      title: isRestore
        ? '恢复插件实例'
        : t(`pages.pluginCenter.lifecycle.${action}.title`),
      content: isRestore
        ? `确认恢复 ${installation.instance_id} 并重新发布其服务与路由？`
        : t(`pages.pluginCenter.lifecycle.${action}.confirm`, {
            instance: installation.instance_id,
          }),
      okButtonProps: action === 'uninstall-soft' ? { danger: true } : undefined,
      onOk: async () => {
        await lifecycleMutation.mutateAsync({
          action,
          installationId: installation.id,
        })
      },
    })
  }

  const installationColumns: TableProps<PluginInstallation>['columns'] = [
    {
      title: t('pages.pluginCenter.installations.instance'),
      dataIndex: 'instance_id',
      width: 210,
      render: (value: string) => (
        <Typography.Text copyable code>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: t('pages.pluginCenter.installations.organization'),
      dataIndex: 'organization_id',
      width: 210,
      render: (value: string) => (
        <Typography.Text copyable>{value}</Typography.Text>
      ),
    },
    {
      title: t('pages.pluginCenter.columns.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: string) => <PluginStatusTag status={value} />,
    },
    {
      title: t('pages.pluginCenter.installations.runtime'),
      dataIndex: 'runtime_app_name',
      width: 210,
    },
    {
      title: t('pages.pluginCenter.installations.updatedAt'),
      dataIndex: 'updated_at',
      width: 160,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      fixed: 'right',
      title: t('pages.pluginCenter.columns.actions'),
      width: 310,
      render: (_, installation) => {
        const isEnabled = ['enabled', 'healthy'].includes(installation.status)
        const isRemoved = ['uninstalled', 'uninstalling'].includes(
          installation.status,
        )
        const isRestorable = installation.status === 'uninstalled'
        return (
          <Space size={2}>
            <Tooltip
              title={
                isRestorable
                  ? '恢复插件实例'
                  : t(
                      `pages.pluginCenter.lifecycle.${isEnabled ? 'disable' : 'enable'}.action`,
                    )
              }
            >
              <Button
                disabled={installation.status === 'uninstalling'}
                icon={
                  isEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                }
                type="text"
                onClick={() =>
                  queueLifecycle(installation, isEnabled ? 'disable' : 'enable')
                }
              />
            </Tooltip>
            <Tooltip title={t('pages.pluginCenter.lifecycle.restart.action')}>
              <Button
                disabled={isRemoved}
                icon={<ReloadOutlined />}
                type="text"
                onClick={() => queueLifecycle(installation, 'restart')}
              />
            </Tooltip>
            <Tooltip title={t('pages.pluginCenter.lifecycle.upgrade.action')}>
              <Button
                disabled={
                  isRemoved || (detailQuery.data?.versions.length ?? 0) < 2
                }
                icon={<SyncOutlined />}
                type="text"
                onClick={() => setUpgradeInstallation(installation)}
              />
            </Tooltip>
            <Tooltip title="回滚至上一版本">
              <Button
                disabled={isRemoved || !installation.previous_plugin_version_id}
                icon={<UndoOutlined />}
                loading={rollbackMutation.isPending}
                type="text"
                onClick={() => {
                  modal.confirm({
                    title: '回滚插件实例',
                    content: `确认将 ${installation.instance_id} 回滚到上一有效版本？`,
                    onOk: () => rollbackMutation.mutateAsync(installation.id),
                  })
                }}
              />
            </Tooltip>
            <Tooltip
              title={t('pages.pluginCenter.lifecycle.uninstall-soft.action')}
            >
              <Button
                danger
                disabled={isRemoved}
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => queueLifecycle(installation, 'uninstall-soft')}
              />
            </Tooltip>
            <Button
              danger
              size="small"
              onClick={() => setHardUninstallInstallation(installation)}
            >
              {t('pages.pluginCenter.lifecycle.hard.action')}
            </Button>
          </Space>
        )
      },
    },
  ]

  if (detailQuery.isError) {
    return (
      <PageContainer className="p-5">
        <Alert
          title={t('pages.pluginCenter.detailLoadFailed')}
          showIcon
          type="error"
        />
      </PageContainer>
    )
  }
  if (!detailQuery.data) return <PageContainer className="p-5" />

  const plugin = detailQuery.data
  const installations = installationsQuery.data?.data ?? []
  const organizationOptions = uniq(
    installations.map((item) => item.organization_id),
  ).map((value) => ({ label: value, value }))
  const filteredInstallations = organizationFilter
    ? installations.filter(
        (item) => item.organization_id === organizationFilter,
      )
    : installations
  const runtimeError =
    resourcesQuery.isError || servicesQuery.isError || routesQuery.isError
  const installable = INSTALLABLE_SOURCE_TYPES.has(plugin.source_type)
  const selectedVersionIndex = selectedVersion
    ? plugin.versions.findIndex((item) => item.id === selectedVersion.id)
    : -1
  const previousVersion =
    selectedVersionIndex >= 0
      ? plugin.versions[selectedVersionIndex + 1]
      : undefined
  const changedManifestFields =
    selectedVersion && previousVersion
      ? Array.from(
          new Set([
            ...Object.keys(selectedVersion.manifest),
            ...Object.keys(previousVersion.manifest),
          ]),
        ).filter(
          (key) =>
            JSON.stringify(
              selectedVersion.manifest[
                key as keyof typeof selectedVersion.manifest
              ],
            ) !==
            JSON.stringify(
              previousVersion.manifest[
                key as keyof typeof previousVersion.manifest
              ],
            ),
        )
      : []

  return (
    <PageContainer className="p-5">
      <PageHeader title={plugin.name} subtitle={plugin.plugin_id}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => void navigate('/plugins')}
          >
            {t('common.actions.back')}
          </Button>
          <Button onClick={() => void navigate('/plugins/operations')}>
            作业中心
          </Button>
          <Button
            disabled={!installable}
            icon={<PlusOutlined />}
            onClick={() => setVersionOpen(true)}
          >
            发布新版本
          </Button>
          <Button
            disabled={!installable}
            icon={<DownloadOutlined />}
            title={
              !installable
                ? t('pages.pluginCenter.install.managedExternally')
                : undefined
            }
            type="primary"
            onClick={() => setInstallOpen(true)}
          >
            {t('pages.pluginCenter.actions.install')}
          </Button>
        </Space>
      </PageHeader>

      <Tabs
        items={[
          {
            key: 'overview',
            label: t('pages.pluginCenter.tabs.overview'),
            children: (
              <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
                <Descriptions.Item
                  label={t('pages.pluginCenter.columns.status')}
                >
                  <PluginStatusTag status={plugin.status} />
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.columns.source')}
                >
                  <Tag>{plugin.source_type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.description')}
                  span="filled"
                >
                  {plugin.description ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.delivery')}
                >
                  {plugin.manifest.delivery.type}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.runtime')}
                >
                  {plugin.manifest.runtime.type}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.uninstallPolicy')}
                >
                  {plugin.manifest.uninstall_policy}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.updatedAt')}
                >
                  {dayjs(plugin.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="兼容性摘要" span="filled">
                  <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                    {Object.keys(plugin.manifest.compatibility ?? {}).length
                      ? JSON.stringify(plugin.manifest.compatibility, null, 2)
                      : '未声明兼容性约束'}
                  </pre>
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('pages.pluginCenter.overview.manifest')}
                  span="filled"
                >
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-(--border) bg-(--background) p-3 text-xs">
                    {JSON.stringify(plugin.manifest, null, 2)}
                  </pre>
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'versions',
            label: `${t('pages.pluginCenter.tabs.versions')} (${plugin.versions.length})`,
            children: (
              <Table
                dataSource={plugin.versions}
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  {
                    title: t('pages.pluginCenter.install.version'),
                    dataIndex: 'version',
                  },
                  {
                    title: t('pages.pluginCenter.versions.image'),
                    dataIndex: 'image',
                  },
                  {
                    title: t('pages.pluginCenter.versions.verified'),
                    dataIndex: 'verified_at',
                    render: (value: string | null) =>
                      value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
                  },
                  {
                    title: t('pages.pluginCenter.versions.createdAt'),
                    dataIndex: 'created_at',
                    render: (value: string) =>
                      dayjs(value).format('YYYY-MM-DD HH:mm'),
                  },
                  {
                    title: '操作',
                    render: (_: unknown, version: PluginVersion) => (
                      <Button
                        size="small"
                        onClick={() => setSelectedVersion(version)}
                      >
                        查看契约
                      </Button>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'installations',
            label: `${t('pages.pluginCenter.tabs.installations')} (${installationsQuery.data?.count ?? 0})`,
            children: (
              <div className="flex flex-col gap-3">
                <Select
                  allowClear
                  className="w-full max-w-md"
                  options={organizationOptions}
                  placeholder="按组织筛选安装实例"
                  value={organizationFilter}
                  onChange={setOrganizationFilter}
                />
                <Table<PluginInstallation>
                  columns={installationColumns}
                  dataSource={filteredInstallations}
                  loading={installationsQuery.isPending}
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 1150 }}
                  size="small"
                />
              </div>
            ),
          },
          {
            key: 'runtime',
            label: t('pages.pluginCenter.tabs.runtime'),
            children: installationsQuery.data?.data.length ? (
              <div className="flex flex-col gap-4">
                <Select
                  className="w-full max-w-xl"
                  options={installationsQuery.data.data.map((item) => ({
                    label: `${item.instance_id} · ${item.runtime_app_name}`,
                    value: item.id,
                  }))}
                  value={runtimeInstallationId}
                  onChange={setRuntimeInstallationId}
                />
                {runtimeError ? (
                  <Alert
                    title={t('pages.pluginCenter.runtime.loadFailed')}
                    showIcon
                    type="error"
                  />
                ) : null}
                <Descriptions bordered column={{ xs: 1, md: 3 }} size="small">
                  <Descriptions.Item
                    label={t('pages.pluginCenter.runtime.resources')}
                  >
                    {(resourcesQuery.data?.data ?? []).map((item) => (
                      <div
                        className="mb-1 flex justify-between gap-2"
                        key={item.id}
                      >
                        <span>{item.resource_name}</span>
                        <PluginStatusTag status={item.status} />
                      </div>
                    ))}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('pages.pluginCenter.runtime.services')}
                  >
                    {(servicesQuery.data?.data ?? []).map((item) => (
                      <div
                        className="mb-1 flex justify-between gap-2"
                        key={item.id}
                      >
                        <span>{item.service_name}</span>
                        <PluginStatusTag status={item.status} />
                      </div>
                    ))}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('pages.pluginCenter.runtime.routes')}
                  >
                    {(routesQuery.data?.data ?? []).map((item) => (
                      <div
                        className="mb-1 flex justify-between gap-2"
                        key={item.id}
                      >
                        <span className="truncate">{item.path_prefix}</span>
                        <PluginStatusTag status={item.status} />
                      </div>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
                <PluginInstancePanel
                  installation={selectedInstallation}
                  manifest={plugin.manifest}
                  pluginId={pluginId}
                  resourceNames={(resourcesQuery.data?.data ?? [])
                    .filter((item) => item.resource_type === 'app')
                    .map((item) => item.resource_name)}
                />
              </div>
            ) : (
              <Empty description={t('pages.pluginCenter.runtime.empty')} />
            ),
          },
          {
            key: 'permissions',
            label: t('pages.pluginCenter.tabs.permissions'),
            children: <PluginPermissionsPanel pluginId={pluginId} />,
          },
        ]}
      />

      <InstallPluginModal
        open={installOpen}
        plugin={plugin}
        submitting={installMutation.isPending}
        onCancel={() => setInstallOpen(false)}
        onSubmit={(body) => installMutation.mutate(body)}
      />
      <PluginRegistrationModal
        initialManifest={plugin.manifest}
        open={versionOpen}
        pluginId={pluginId}
        submitting={versionMutation.isPending}
        onCancel={() => setVersionOpen(false)}
        onSubmit={(body) => versionMutation.mutate(body)}
      />

      <Drawer
        open={Boolean(selectedVersion)}
        title={`版本契约 ${selectedVersion?.version ?? ''}`}
        size={860}
        onClose={() => setSelectedVersion(undefined)}
      >
        {selectedVersion ? (
          <Tabs
            items={[
              {
                key: 'manifest',
                label: '完整 Manifest',
                children: (
                  <pre className="max-h-[680px] overflow-auto rounded border border-(--border) p-3 text-xs">
                    {JSON.stringify(selectedVersion.manifest, null, 2)}
                  </pre>
                ),
              },
              {
                key: 'diff',
                label: `版本差异 (${changedManifestFields.length})`,
                children: previousVersion ? (
                  <div className="flex flex-col gap-3">
                    <Alert
                      showIcon
                      title={`与 ${previousVersion.version} 对比，变更字段：${changedManifestFields.join('、') || '无'}`}
                      type={changedManifestFields.length ? 'info' : 'success'}
                    />
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div>
                        <Typography.Title level={5}>
                          {previousVersion.version}
                        </Typography.Title>
                        <pre className="max-h-[560px] overflow-auto rounded border border-(--border) p-3 text-xs">
                          {JSON.stringify(previousVersion.manifest, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <Typography.Title level={5}>
                          {selectedVersion.version}
                        </Typography.Title>
                        <pre className="max-h-[560px] overflow-auto rounded border border-(--border) p-3 text-xs">
                          {JSON.stringify(selectedVersion.manifest, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Empty description="这是最早版本，没有可对比版本" />
                ),
              },
              {
                key: 'verification',
                label: '验证证据',
                children: (
                  <div className="flex flex-col gap-3">
                    <Button
                      loading={verifyMutation.isPending}
                      type="primary"
                      onClick={() => verifyMutation.mutate()}
                    >
                      重新验证全部版本
                    </Button>
                    <Alert
                      showIcon
                      title={
                        selectedVersion.verified_at
                          ? `已验证：${dayjs(selectedVersion.verified_at).format('YYYY-MM-DD HH:mm:ss')}`
                          : '该版本尚未验证'
                      }
                      type={selectedVersion.verified_at ? 'success' : 'warning'}
                    />
                    {verifyMutation.data ? (
                      <pre className="max-h-96 overflow-auto rounded border border-(--border) p-3 text-xs">
                        {JSON.stringify(
                          verifyMutation.data.checks.filter(
                            (item) => item.version === selectedVersion.version,
                          ),
                          null,
                          2,
                        )}
                      </pre>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'openapi',
                label: 'OpenAPI',
                children: openapiQuery.isError ? (
                  <Alert
                    showIcon
                    title="该安装实例尚无已验证 OpenAPI，或当前角色无插件访问 Scope"
                    type="warning"
                  />
                ) : (
                  <pre className="max-h-[680px] overflow-auto rounded border border-(--border) p-3 text-xs">
                    {openapiQuery.data
                      ? JSON.stringify(openapiQuery.data, null, 2)
                      : '正在加载 OpenAPI...'}
                  </pre>
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>

      <Modal
        confirmLoading={upgradeMutation.isPending}
        okButtonProps={{ disabled: !upgradeVersion }}
        open={Boolean(upgradeInstallation)}
        title={t('pages.pluginCenter.lifecycle.upgrade.title')}
        onCancel={() => setUpgradeInstallation(undefined)}
        onOk={() => upgradeMutation.mutate()}
      >
        <Select
          className="w-full"
          options={plugin.versions
            .filter(
              (version) =>
                version.id !== upgradeInstallation?.plugin_version_id,
            )
            .map((version) => ({
              label: version.version,
              value: version.version,
            }))}
          placeholder={t('pages.pluginCenter.lifecycle.upgrade.select')}
          value={upgradeVersion}
          onChange={setUpgradeVersion}
        />
        {upgradeVersion ? (
          <Alert
            className="mt-4"
            description={
              <pre className="m-0 whitespace-pre-wrap text-xs">
                {JSON.stringify(
                  plugin.versions.find(
                    (item) => item.version === upgradeVersion,
                  )?.manifest.compatibility ?? {},
                  null,
                  2,
                )}
              </pre>
            }
            message="目标版本兼容性摘要"
            showIcon
            type="info"
          />
        ) : null}
      </Modal>

      <Modal
        confirmLoading={hardUninstallMutation.isPending}
        okButtonProps={{
          danger: true,
          disabled:
            !backupAcknowledged ||
            hardConfirm !== hardUninstallInstallation?.instance_id,
        }}
        open={Boolean(hardUninstallInstallation)}
        title={t('pages.pluginCenter.lifecycle.hard.title')}
        onCancel={() => setHardUninstallInstallation(undefined)}
        onOk={() => hardUninstallMutation.mutate()}
      >
        <Alert
          className="mb-4"
          title={t('pages.pluginCenter.lifecycle.hard.warning')}
          showIcon
          type="error"
        />
        <Typography.Paragraph>
          {t('pages.pluginCenter.lifecycle.hard.inputHint', {
            instance: hardUninstallInstallation?.instance_id,
          })}
        </Typography.Paragraph>
        <Input
          value={hardConfirm}
          onChange={(event) => setHardConfirm(event.target.value)}
        />
        <Checkbox
          className="mt-4"
          checked={backupAcknowledged}
          onChange={(event) => setBackupAcknowledged(event.target.checked)}
        >
          {t('pages.pluginCenter.lifecycle.hard.backup')}
        </Checkbox>
      </Modal>
    </PageContainer>
  )
}
