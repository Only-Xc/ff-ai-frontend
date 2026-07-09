import { Button, Drawer, Form, Input, Space, Switch, message } from 'antd'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { User, UserCreateBody, UserUpdateBody } from '@/api/rbac'

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

  useEffect(() => {
    if (open && !isMountedRef.current) {
      isMountedRef.current = true
      form.setFieldsValue({
        email: initialValues?.email ?? '',
        full_name: initialValues?.full_name ?? '',
        is_active: initialValues?.is_active ?? true,
        password: '',
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
