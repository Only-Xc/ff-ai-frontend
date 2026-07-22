import { InboxOutlined } from '@ant-design/icons'
import { Alert, Form, Input, Modal, Table, Tag, Typography, Upload } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import type { PluginManifest, PluginRegistrationBody } from '@/api/plugins'

interface FormValues {
  manifest_json: string
  image?: string
  image_digest?: string
  description?: string
}

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
  onCancel: () => void
  onSubmit: (body: PluginRegistrationBody) => void
}

export function PluginRegistrationModal({
  open,
  submitting,
  pluginId,
  initialManifest,
  onCancel,
  onSubmit,
}: PluginRegistrationModalProps) {
  const [form] = Form.useForm<FormValues>()
  const [parseError, setParseError] = useState<string>()
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
      okText={pluginId ? '发布新版本' : '添加插件'}
      open={open}
      title={pluginId ? `发布 ${pluginId} 新版本` : '添加插件'}
      width={760}
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
      {parseError ? (
        <Alert className="mb-4" showIcon title={parseError} type="error" />
      ) : null}
      <Form form={form} layout="vertical" requiredMark="optional">
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
        <Form.Item
          className="mt-4"
          label="Manifest JSON"
          name="manifest_json"
          rules={[{ required: true, message: '请输入或导入 Manifest' }]}
        >
          <Input.TextArea className="font-mono" rows={14} />
        </Form.Item>
        <Form.Item
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
            <Input.TextArea rows={3} />
          </Form.Item>
        ) : null}
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
                      row.type === 'external' || row.management === 'external'
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
                  render: (value: string | null | undefined) => value ?? '-',
                },
                {
                  dataIndex: 'upstream_url',
                  ellipsis: true,
                  title: '服务地址',
                  render: (value: string | null | undefined) => value ?? '-',
                },
                {
                  dataIndex: 'browser_url',
                  ellipsis: true,
                  title: '浏览器地址',
                  render: (value: string | null | undefined) => value ?? '-',
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
      </Form>
    </Modal>
  )
}
