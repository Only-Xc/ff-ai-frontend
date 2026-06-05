import {
  LockOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { loginWithPassword } from '@/api/auth'
import { useAuthStore } from '@/store/useAuth'

import { globalMessage } from '@/utils/message'

interface LoginFormValues {
  username: string
  password: string
}

// 生产环境下请删除
const initialValues: LoginFormValues = {
  username: 'dev@example.com',
  password: 'password123',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<LoginFormValues>()

  const [submitting, setSubmitting] = useState(false)
  const setToken = useAuthStore((state) => state.setToken)
  const initialAccessToken = useAuthStore.getState().accessToken

  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)

    try {
      const result = await loginWithPassword(values)

      setToken(result.accessToken)
      void globalMessage.success('登录成功')
      void navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (initialAccessToken) {
    return <Navigate replace to="/" />
  }

  return (
    <main className="min-h-screen bg-(--bg) px-5 py-6 text-(--text)">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-(--border) bg-(--control-bg) px-3 py-2 text-sm text-(--muted)">
            <SafetyCertificateOutlined className="text-(--green)" />
            安全访问控制台
          </div>
          <Typography.Title
            level={1}
            className="m-0! max-w-155 text-[40px]! leading-[1.12]!"
          >
            FF AI Platform
          </Typography.Title>
          <Typography.Paragraph className="mt-5! max-w-140 text-base! leading-7! text-(--muted)!">
            统一管理 Agent
            工作台、应用配置与运行数据。登录后进入首页，继续处理当前平台任务。
          </Typography.Paragraph>
          <div className="mt-10 grid max-w-[560px] grid-cols-3 gap-3">
            {['Agent', 'Workspace', 'Schema'].map((item) => (
              <div
                key={item}
                className="rounded-md border border-(--border) bg-(--card) px-4 py-3"
              >
                <div className="text-sm font-semibold text-(--text-strong)">
                  {item}
                </div>
                <div className="mt-1 text-xs text-(--muted)">Ready</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-105 rounded-lg border border-(--border) bg-(--panel) p-6 sm:p-8">
          <Space className="w-full" direction="vertical" size={24}>
            <div>
              <Typography.Title level={2} className="mb-2! text-2xl!">
                账号登录
              </Typography.Title>
              <Typography.Text className="text-(--muted)">
                使用平台账号进入首页
              </Typography.Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={initialValues}
              requiredMark={false}
              disabled={submitting}
              onFinish={(values) => void handleSubmit(values)}
            >
              <Form.Item
                label="邮箱"
                name="username"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效邮箱' },
                ]}
              >
                <Input
                  autoComplete="username"
                  prefix={<UserOutlined />}
                  placeholder="admin@example.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  autoComplete="current-password"
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item className="mb-0! pt-2">
                <Button
                  block
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  loading={submitting}
                  size="large"
                  type="primary"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
