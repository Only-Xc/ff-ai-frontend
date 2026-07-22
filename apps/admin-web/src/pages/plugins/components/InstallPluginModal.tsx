import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Steps,
  Tag,
} from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  plugins_installPreflight,
  type PluginDefinitionDetail,
  type PluginInstallBody,
} from '@/api/plugins'
import { adminOrganizations_list, rbacKeys } from '@/api/rbac'

interface InstallFormValues {
  organization_id: string
  version: string
  config_json: string
  secrets_json: string
}

function parseJsonObject(
  value: string,
  field: string,
): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value.trim() ? value : '{}')
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${field} must be a JSON object`)
  }
  return parsed as Record<string, unknown>
}

export interface InstallPluginModalProps {
  plugin: PluginDefinitionDetail | undefined
  open: boolean
  submitting: boolean
  onCancel: () => void
  onSubmit: (body: PluginInstallBody) => void
}

export function InstallPluginModal({
  plugin,
  open,
  submitting,
  onCancel,
  onSubmit,
}: InstallPluginModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<InstallFormValues>()
  const [phase, setPhase] = useState<'configure' | 'confirm'>('configure')
  const [pendingBody, setPendingBody] = useState<PluginInstallBody>()
  const organizationsQuery = useQuery({
    queryKey: rbacKeys.organizationList({ skip: 0, limit: 100 }),
    queryFn: () => adminOrganizations_list({ skip: 0, limit: 100 }),
    enabled: open,
  })
  const preflightMutation = useMutation({
    mutationFn: (body: PluginInstallBody) =>
      plugins_installPreflight(plugin!.plugin_id, body),
    onSuccess: (_, body) => {
      setPendingBody(body)
      setPhase('confirm')
    },
  })

  useEffect(() => {
    if (!open) return
    setPhase('configure')
    setPendingBody(undefined)
    form.setFieldsValue({
      version: plugin?.versions[0]?.version,
      config_json: '{}',
      secrets_json: '{}',
    })
  }, [form, open, plugin])

  const buildBody = async (): Promise<PluginInstallBody> => {
    const values = await form.validateFields()
    const config = parseJsonObject(values.config_json, 'config')
    const rawSecrets = parseJsonObject(values.secrets_json, 'secrets')
    return {
      organization_id: values.organization_id,
      version: values.version,
      config,
      secrets: Object.fromEntries(
        Object.entries(rawSecrets).map(([key, value]) => [key, String(value)]),
      ),
      execute_async: true,
    }
  }

  return (
    <Modal
      destroyOnHidden
      confirmLoading={submitting || preflightMutation.isPending}
      okButtonProps={{
        disabled: phase === 'confirm' && !preflightMutation.data?.ready,
      }}
      okText={
        phase === 'configure'
          ? '运行安装预检'
          : t('pages.pluginCenter.install.submit')
      }
      open={open}
      title={t('pages.pluginCenter.install.title', {
        name: plugin?.name ?? '',
      })}
      width={680}
      onCancel={onCancel}
      onOk={() => {
        if (phase === 'confirm' && pendingBody) {
          onSubmit(pendingBody)
          return
        }
        void buildBody()
          .then((body) => preflightMutation.mutate(body))
          .catch(() => undefined)
      }}
    >
      <Steps
        className="mb-5"
        current={phase === 'configure' ? 0 : 1}
        items={[
          { title: '配置与预检' },
          { title: '确认并安装' },
          { title: '作业执行' },
        ]}
        size="small"
      />
      {phase === 'confirm' ? (
        <div className="flex flex-col gap-4">
          <Alert
            showIcon
            title={
              preflightMutation.data?.ready
                ? '预检通过，可以提交安装'
                : '预检未通过'
            }
            type={preflightMutation.data?.ready ? 'success' : 'error'}
          />
          <Descriptions
            bordered
            column={1}
            items={[
              {
                key: 'runtime_app_name',
                label: '平台分配的运行名称',
                children: preflightMutation.data?.runtime_app_name ?? '-',
              },
            ]}
            size="small"
          />
          <List
            bordered
            dataSource={preflightMutation.data?.checks ?? []}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta description={item.message} title={item.label} />
                <Tag
                  color={
                    item.status === 'passed'
                      ? 'green'
                      : item.status === 'warning'
                        ? 'orange'
                        : 'red'
                  }
                >
                  {item.status}
                </Tag>
              </List.Item>
            )}
          />
          {Object.keys(preflightMutation.data?.compatibility ?? {}).length ? (
            <pre className="max-h-40 overflow-auto rounded border border-(--border) p-3 text-xs">
              {JSON.stringify(preflightMutation.data?.compatibility, null, 2)}
            </pre>
          ) : null}
          <Space>
            <Button onClick={() => setPhase('configure')}>返回修改</Button>
            <span className="text-sm text-(--muted-foreground)">
              提交后可在作业中心查看步骤、错误和重试。
            </span>
          </Space>
        </div>
      ) : (
        <>
          {organizationsQuery.isError ? (
            <Alert
              className="mb-4"
              title={t('pages.pluginCenter.install.organizationsFailed')}
              showIcon
              type="error"
            />
          ) : null}
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item
              label={t('pages.pluginCenter.install.organization')}
              name="organization_id"
              rules={[
                {
                  required: true,
                  message: t('pages.pluginCenter.install.organizationRequired'),
                },
              ]}
            >
              <Select
                loading={organizationsQuery.isPending}
                options={(organizationsQuery.data?.data ?? []).map((item) => ({
                  label: `${item.name} (${item.code})`,
                  value: item.id,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              label={t('pages.pluginCenter.install.version')}
              name="version"
              rules={[{ required: true }]}
            >
              <Select
                options={(plugin?.versions ?? []).map((item) => ({
                  label: item.version,
                  value: item.version,
                }))}
              />
            </Form.Item>
            <Form.Item
              label={t('pages.pluginCenter.install.config')}
              name="config_json"
              rules={[
                {
                  validator: async (_, value: string) => {
                    try {
                      parseJsonObject(value, 'config')
                    } catch {
                      throw new Error(
                        t('pages.pluginCenter.install.jsonInvalid'),
                      )
                    }
                  },
                },
              ]}
            >
              <Input.TextArea className="font-mono" rows={5} />
            </Form.Item>
            <Form.Item
              extra={t('pages.pluginCenter.install.secretsHint')}
              label={t('pages.pluginCenter.install.secrets')}
              name="secrets_json"
              rules={[
                {
                  validator: async (_, value: string) => {
                    try {
                      parseJsonObject(value, 'secrets')
                    } catch {
                      throw new Error(
                        t('pages.pluginCenter.install.jsonInvalid'),
                      )
                    }
                  },
                },
              ]}
            >
              <Input.TextArea className="font-mono" rows={4} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  )
}
