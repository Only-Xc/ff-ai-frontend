import {
  AppstoreAddOutlined,
  CodeOutlined,
  FileProtectOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Form,
  Input,
  Modal,
  Segmented,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import { createStyles } from 'antd-style'
import { useEffect, useMemo, useState } from 'react'

import type {
  ComposeImportErrorDetail,
  PluginManifest,
  PluginRegistrationBody,
} from '@/api/plugins'

import { ComposeManifestWizard } from './ComposeManifestWizard'

interface FormValues {
  manifest_json: string
  image?: string
  image_digest?: string
  description?: string
}

const useRegistrationStyles = createStyles(({ css, token }) => ({
  title: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
  `,
  titleIcon: css`
    display: inline-grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  modeBar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${token.margin}px;
    margin-bottom: ${token.marginLG}px;
    padding: ${token.padding}px ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillQuaternary};
  `,
  modeText: css`
    display: grid;
    gap: 2px;
  `,
  jsonGrid: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: ${token.marginLG}px;

    @media (max-width: 980px) {
      grid-template-columns: 1fr;
    }
  `,
  panel: css`
    min-width: 0;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  sidePanel: css`
    align-self: start;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillQuaternary};
  `,
  upload: css`
    margin-bottom: ${token.marginLG}px;

    .ant-upload-wrapper .ant-upload-drag {
      background: ${token.colorBgLayout};
    }
  `,
  checklist: css`
    display: grid;
    gap: ${token.marginSM}px;
    margin: ${token.margin}px 0 0;
    padding: 0;
    list-style: none;
    color: ${token.colorTextSecondary};
  `,
  checklistItem: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: flex-start;
  `,
}))

function parseManifest(
  value: string,
  expectedPluginId?: string,
): PluginManifest {
  const parsed: unknown = JSON.parse(value)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Manifest 必须是 JSON 对象')
  }
  const manifest = parsed as PluginManifest
  for (const field of [
    'plugin_id',
    'name',
    'version',
    'delivery',
    'services',
    'runtime',
  ]) {
    if (!(field in manifest)) throw new Error(`Manifest 缺少字段：${field}`)
  }
  if (expectedPluginId && manifest.plugin_id !== expectedPluginId) {
    throw new Error(`plugin_id 必须为 ${expectedPluginId}`)
  }
  return manifest
}

function optionalText(value?: string): string | null {
  const normalized = value?.trim()
  if (!normalized) return null
  return normalized
}

export interface PluginRegistrationModalProps {
  open: boolean
  submitting: boolean
  pluginId?: string
  initialManifest?: PluginManifest
  composeError?: ComposeImportErrorDetail
  onCancel: () => void
  onComposeImport?: (file: File) => Promise<void>
  onSubmit: (body: PluginRegistrationBody) => void
}

export function PluginRegistrationModal({
  open,
  submitting,
  pluginId,
  initialManifest,
  composeError,
  onCancel,
  onComposeImport,
  onSubmit,
}: PluginRegistrationModalProps) {
  const { styles } = useRegistrationStyles()
  const [form] = Form.useForm<FormValues>()
  const [parseError, setParseError] = useState<string>()
  const [mode, setMode] = useState<'compose' | 'json'>('compose')
  const manifestJson = Form.useWatch('manifest_json', form)
  const resources = useMemo(() => {
    try {
      return parseManifest(manifestJson ?? '').runtime.resources ?? []
    } catch {
      return []
    }
  }, [manifestJson])

  useEffect(() => {
    if (!open) return
    form.resetFields()
    setParseError(undefined)
    setMode(initialManifest ? 'json' : 'compose')
    if (initialManifest) {
      form.setFieldValue(
        'manifest_json',
        JSON.stringify(initialManifest, null, 2),
      )
    }
  }, [form, initialManifest, open])

  return (
    <Modal
      destroyOnHidden
      confirmLoading={submitting}
      footer={mode === 'compose' ? null : undefined}
      okText={pluginId ? '发布新版本' : '添加插件'}
      open={open}
      title={
        <span className={styles.title}>
          <span className={styles.titleIcon}>
            <AppstoreAddOutlined />
          </span>
          <span>{pluginId ? `发布 ${pluginId} 新版本` : '添加插件'}</span>
        </span>
      }
      width={1120}
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then((values) => {
          try {
            const manifest = parseManifest(values.manifest_json, pluginId)
            setParseError(undefined)
            onSubmit({
              manifest,
              image: optionalText(values.image),
              image_digest: optionalText(values.image_digest),
              description: optionalText(values.description),
            })
          } catch (error) {
            setParseError(
              error instanceof Error ? error.message : 'Manifest 解析失败',
            )
          }
        })
      }}
    >
      <div className={styles.modeBar}>
        <span className={styles.modeText}>
          <Typography.Text strong>
            {mode === 'compose' ? 'Compose 导入' : 'Manifest JSON'}
          </Typography.Text>
          <Typography.Text type="secondary">
            {mode === 'compose'
              ? '从正在运行的 Compose 项目识别插件资源'
              : '直接提交完整 ff-plugin Manifest'}
          </Typography.Text>
        </span>
        <Segmented
          options={
            pluginId
              ? [{ icon: <CodeOutlined />, label: '手工 JSON', value: 'json' }]
              : [
                  {
                    icon: <FileProtectOutlined />,
                    label: 'Compose 导入',
                    value: 'compose',
                  },
                  { icon: <CodeOutlined />, label: '手工 JSON', value: 'json' },
                ]
          }
          value={mode}
          onChange={(key) => setMode(key as 'compose' | 'json')}
        />
      </div>
      {mode === 'compose' ? (
        <ComposeManifestWizard
          error={composeError}
          submitting={submitting}
          onImport={async (file) => {
            if (!onComposeImport) return
            await onComposeImport(file)
          }}
        />
      ) : (
        <>
          {parseError ? (
            <Alert className="mb-4" showIcon title={parseError} type="error" />
          ) : null}
          <Form form={form} layout="vertical" requiredMark="optional">
            <div className={styles.jsonGrid}>
              <div className={styles.panel}>
                <div className={styles.upload}>
                  <Upload.Dragger
                    accept="application/json,.json"
                    beforeUpload={(file) => {
                      void file.text().then((content) => {
                        form.setFieldValue('manifest_json', content)
                        setParseError(undefined)
                      })
                      return Upload.LIST_IGNORE
                    }}
                    maxCount={1}
                    showUploadList={false}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p>点击或拖入 Manifest JSON</p>
                  </Upload.Dragger>
                </div>
                <Form.Item
                  label="Manifest JSON"
                  name="manifest_json"
                  rules={[{ required: true, message: '请输入或导入 Manifest' }]}
                >
                  <Input.TextArea className="font-mono" rows={14} />
                </Form.Item>
                {resources.length ? (
                  <div className="mt-4">
                    <Typography.Title level={5}>资源与镜像清单</Typography.Title>
                    <Table
                      columns={[
                        { dataIndex: 'name', title: '资源' },
                        {
                          key: 'management',
                          title: '管理方式',
                          render: (_, row) => {
                            const external =
                              row.type === 'external' ||
                              row.management === 'external'
                            return (
                              <Tag color={external ? 'blue' : 'green'}>
                                {external ? '外部托管' : '平台托管'}
                              </Tag>
                            )
                          },
                        },
                        {
                          dataIndex: 'image',
                          ellipsis: true,
                          title: '镜像',
                          render: (value: string | null | undefined) =>
                            value ?? '-',
                        },
                        {
                          dataIndex: 'upstream_url',
                          ellipsis: true,
                          title: '服务地址',
                          render: (value: string | null | undefined) =>
                            value ?? '-',
                        },
                        {
                          dataIndex: 'browser_url',
                          ellipsis: true,
                          title: '浏览器地址',
                          render: (value: string | null | undefined) =>
                            value ?? '-',
                        },
                        {
                          dataIndex: 'depends_on',
                          title: '依赖',
                          render: (value: string[] | undefined) =>
                            value?.join(', ') ?? '-',
                        },
                      ]}
                      dataSource={resources}
                      pagination={false}
                      rowKey="name"
                      scroll={{ x: 760 }}
                      size="small"
                    />
                  </div>
                ) : null}
              </div>
              <div className={styles.sidePanel}>
                <Typography.Text strong>发布信息</Typography.Text>
                <ul className={styles.checklist}>
                  <li className={styles.checklistItem}>
                    <FileProtectOutlined />
                    Manifest 必须包含 plugin_id、delivery、services、runtime。
                  </li>
                  <li className={styles.checklistItem}>
                    <CodeOutlined />
                    多资源插件优先使用 Manifest 中的资源镜像。
                  </li>
                </ul>
                <Form.Item
                  className="mt-5"
                  extra="单镜像插件可在此填写；多镜像插件直接使用 Manifest 中每个资源的 image。"
                  label="顶层镜像或源码交付引用（可选）"
                  name="image"
                >
                  <Input placeholder="registry.example.com/team/plugin:1.0.0" />
                </Form.Item>
                <Form.Item label="镜像 Digest（可选）" name="image_digest">
                  <Input placeholder="sha256:..." />
                </Form.Item>
                {!pluginId ? (
                  <Form.Item label="插件说明" name="description">
                    <Input.TextArea rows={4} />
                  </Form.Item>
                ) : null}
              </div>
            </div>
          </Form>
        </>
      )}
    </Modal>
  )
}
