import { Button, Drawer, Form, Input, Select, Space, Switch } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminRoles_list,
  rbacKeys,
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
  onSubmit: (values: UserCreateBody | UserUpdateBody) => Promise<void>
  onClose: () => void
  submitting?: boolean
}

export function UserFormDrawer({
  open,
  mode,
  initialValues,
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

  useEffect(() => {
    if (open && !isMountedRef.current) {
      isMountedRef.current = true
      form.setFieldsValue({
        email: initialValues?.email ?? '',
        full_name: initialValues?.full_name ?? '',
        is_active: initialValues?.is_active ?? true,
        password: '',
        role_ids: [],
      })
    }
    if (!open) {
      isMountedRef.current = false
    }
  }, [open, initialValues, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload: UserCreateBody | UserUpdateBody = {
        email: values.email,
        full_name: values.full_name,
        is_active: values.is_active,
        ...(values.password ? { password: values.password } : {}),
        ...(mode === 'create' && values.role_ids?.length
          ? { role_ids: values.role_ids }
          : {}),
      }
      await onSubmit(payload)
    } catch {
      // validation failed
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
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
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
