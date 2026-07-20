import { Alert, Button, Drawer, Form, Input, Select, Space, Switch } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminAssignableTenants_list,
  adminRoles_list,
  rbacKeys,
  type AssignableTenant,
  type Role,
  type User,
  type UserCreateBody,
  type UserUpdateBody,
} from '@/api/rbac'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const { Password } = Input

export interface UserFormDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<User>
  /**
   * Whether the caller is a platform administrator (superuser or system_admin).
   * Platform administrators can pick any assignable tenant; tenant admins are
   * locked to their own tenant.
   */
  isPlatformAdmin?: boolean
  onSubmit: (values: UserCreateBody | UserUpdateBody) => Promise<void>
  onClose: () => void
  submitting?: boolean
}

export function UserFormDrawer({
  open,
  mode,
  initialValues,
  isPlatformAdmin = false,
  onSubmit,
  onClose,
  submitting = false,
}: UserFormDrawerProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const isMountedRef = useRef(false)

  // Fetch all roles for the role selection field
  const rolesQuery = useQuery({
    queryKey: rbacKeys.roles({ keyword: '', skip: 0, limit: 200 }),
    queryFn: () => adminRoles_list({ keyword: '', skip: 0, limit: 200 }),
    placeholderData: keepPreviousData,
  })

  const roleOptions = useMemo(
    () =>
      (rolesQuery.data?.data ?? []).map((r: Role) => ({
        value: r.id,
        label: `${r.name} (${r.code})`,
      })),
    [rolesQuery.data],
  )

  // Fetch assignable tenants for the tenant selection field.
  const tenantsQuery = useQuery({
    queryKey: rbacKeys.assignableTenants(),
    queryFn: adminAssignableTenants_list,
    placeholderData: keepPreviousData,
  })

  const tenantOptions = useMemo(
    () =>
      (tenantsQuery.data ?? []).map((t: AssignableTenant) => ({
        value: t.id,
        label: `${t.name} (${t.code})`,
      })),
    [tenantsQuery.data],
  )

  useEffect(() => {
    if (open && !isMountedRef.current) {
      isMountedRef.current = true
      form.setFieldsValue({
        email: initialValues?.email ?? '',
        full_name: initialValues?.full_name ?? '',
        is_active: initialValues?.is_active ?? true,
        password: '',
        role_ids: [],
        organization_id:
          initialValues?.primary_organization?.id ??
          (tenantOptions[0]?.value as string | undefined),
      })
    }
    if (!open) {
      isMountedRef.current = false
    }
  }, [open, initialValues, form, tenantOptions])

  // Tenant admins only have their own tenant; lock the picker.
  const tenantLocked = mode === 'edit' && !isPlatformAdmin
  const tenantHintKey = tenantLocked
    ? 'pages.rbac.form.tenantLockedHint'
    : mode === 'create'
    ? 'pages.rbac.form.tenantHint'
    : 'pages.rbac.form.tenantMigrateHint'

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const basePayload: UserCreateBody | UserUpdateBody = {
        email: values.email,
        full_name: values.full_name,
        is_active: values.is_active,
        ...(values.password ? { password: values.password } : {}),
        ...(mode === 'create'
          ? {
              organization_id: values.organization_id,
              ...(values.role_ids?.length ? { role_ids: values.role_ids } : {}),
            }
          : isPlatformAdmin && values.organization_id
          ? { organization_id: values.organization_id }
          : {}),
      }
      await onSubmit(basePayload)
    } catch {
      // validation failed - antd already surfaces field-level errors
    }
  }

  return (
    <Drawer
      title={
        mode === 'create'
          ? t('pages.rbac.drawers.createUser')
          : t('pages.rbac.drawers.editUser')
      }
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
      {tenantsQuery.isError && (
        <Alert
          type="error"
          showIcon
          className="mb-3"
          message={t('pages.rbac.messages.tenantLoadFailed')}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        requiredMark
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('pages.rbac.form.email')}
          name="email"
          rules={[
            { required: true, message: t('pages.rbac.form.emailRequired') },
            { type: 'email', message: t('pages.rbac.form.emailInvalid') },
          ]}
        >
          <Input
            placeholder={t('pages.rbac.form.emailPlaceholder')}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label={t('pages.rbac.form.fullName')}
          name="full_name"
          rules={[
            { required: true, message: t('pages.rbac.form.fullNameRequired') },
          ]}
        >
          <Input placeholder={t('pages.rbac.form.fullNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('pages.rbac.form.password')}
          name="password"
          rules={[
            ...(mode === 'create'
              ? [
                  {
                    required: true,
                    message: t('pages.rbac.form.passwordRequired'),
                  },
                ]
              : []),
            { min: 8, message: t('pages.rbac.form.passwordMin') },
          ]}
          extra={
            mode === 'edit'
              ? t('pages.rbac.form.passwordOptional')
              : undefined
          }
        >
          <Password placeholder={t('pages.rbac.form.passwordPlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('pages.rbac.form.tenant')}
          name="organization_id"
          rules={[
            {
              required: true,
              message: t('pages.rbac.form.tenantRequired'),
            },
          ]}
          extra={t(tenantHintKey)}
        >
          {mode === 'create' ? (
            <Select
              placeholder={t('pages.rbac.form.tenantPlaceholder')}
              options={tenantOptions}
              showSearch
              optionFilterProp="label"
              className="w-full"
              loading={tenantsQuery.isLoading}
              disabled={tenantOptions.length === 0}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={
                tenantsQuery.isLoading
                  ? undefined
                  : t('pages.rbac.form.tenantEmpty')
              }
            />
          ) : (
            <Select
              placeholder={t('pages.rbac.form.tenantPlaceholder')}
              options={tenantOptions}
              showSearch
              optionFilterProp="label"
              className="w-full"
              loading={tenantsQuery.isLoading}
              disabled={tenantLocked}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          )}
        </Form.Item>

        {mode === 'create' && (
          <Form.Item
            label={t('pages.rbac.form.roles')}
            name="role_ids"
            rules={[
              {
                required: true,
                message: t('pages.rbac.form.rolesRequired'),
                type: 'array',
              },
            ]}
            extra={t('pages.rbac.form.rolesHint')}
          >
            <Select
              placeholder={t('pages.rbac.form.selectRole')}
              mode="multiple"
              options={roleOptions}
              showSearch
              optionFilterProp="label"
              className="w-full"
              loading={rolesQuery.isLoading}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
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
