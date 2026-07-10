import { Button, Drawer, Form, Input, Select, Space, Switch, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { RoleDetail, RoleFormValues, OrganizationNode } from '../types'

const { TextArea } = Input

export interface RoleFormDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<RoleFormValues>
  organizations: OrganizationNode[]
  onSubmit: (values: RoleFormValues) => Promise<void>
  onClose: () => void
  submitting?: boolean
}

export function RoleFormDrawer({
  open,
  mode,
  initialValues,
  organizations,
  onSubmit,
  onClose,
  submitting = false,
}: RoleFormDrawerProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<RoleFormValues>()
  const scopeType = Form.useWatch('scope_type', form)

  const isMountedRef = useRef(false)

  useEffect(() => {
    if (open && !isMountedRef.current) {
      isMountedRef.current = true
      form.setFieldsValue({
        name: initialValues?.name ?? '',
        code: initialValues?.code ?? '',
        description: initialValues?.description ?? '',
        scope_type: initialValues?.scope_type ?? 'system',
        organization_id: initialValues?.organization_id ?? undefined,
        is_active: initialValues?.is_active ?? true,
      })
    }
    if (!open) {
      isMountedRef.current = false
    }
  }, [open, initialValues])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await onSubmit(values)
    } catch {
      // validation failed
    }
  }

  const flatOrgOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []

    function walk(nodes: OrganizationNode[]) {
      for (const node of nodes) {
        opts.push({ value: node.id, label: node.name })
        if (node.children?.length) walk(node.children)
      }
    }

    walk(organizations)
    return opts
  }, [organizations])

  return (
    <Drawer
      title={mode === 'create' ? t('pages.rbac.drawers.createRole') : t('pages.rbac.drawers.editRole')}
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose} disabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('pages.rbac.form.name')}
          name="name"
          rules={[
            { required: true, message: t('pages.rbac.form.nameRequired') },
          ]}
        >
          <Input placeholder={t('pages.rbac.form.namePlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('pages.rbac.form.code')}
          name="code"
          rules={[
            { required: true, message: t('pages.rbac.form.codeRequired') },
            {
              pattern: /^[a-z][a-z0-9_.-]*$/,
              message: t('pages.rbac.form.codePattern'),
            },
          ]}
          extra={
            mode === 'edit' && initialValues?.is_system
              ? t('pages.rbac.form.codeSystemNote')
              : undefined
          }
        >
          <Input disabled={mode === 'edit' && initialValues?.is_system} />
        </Form.Item>

        <Form.Item label={t('pages.rbac.form.description')} name="description">
          <TextArea
            rows={3}
            placeholder={t('pages.rbac.form.descriptionPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          label={t('pages.rbac.form.scope')}
          name="scope_type"
          rules={[
            { required: true, message: t('pages.rbac.form.scopeRequired') },
          ]}
        >
          <Select
            options={[
              { value: 'system', label: t('pages.rbac.scope.system') },
              { value: 'organization', label: t('pages.rbac.scope.organization') },
            ]}
            disabled={mode === 'edit' && initialValues?.is_system}
          />
        </Form.Item>

        {scopeType === 'organization' && (
          <Form.Item
            label={t('pages.rbac.form.organization')}
            name="organization_id"
            rules={[
              {
                required: true,
                message: t('pages.rbac.form.organizationRequired'),
              },
            ]}
          >
            <Select
              placeholder={t('pages.rbac.form.organizationPlaceholder')}
              options={flatOrgOptions}
            />
          </Form.Item>
        )}

        <Form.Item
          label={t('pages.rbac.form.status')}
          name="is_active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item className="mt-6">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
          >
            {mode === 'create'
              ? t('pages.rbac.actions.create')
              : t('pages.rbac.actions.save')}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
