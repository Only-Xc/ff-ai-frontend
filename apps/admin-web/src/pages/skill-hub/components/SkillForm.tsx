import { Button, Form, Input, Select, Space, Typography } from 'antd'
import { useEffect, useImperativeHandle } from 'react'
import type { Ref } from 'react'

import type { AdminSkillEnvironment, AdminSkillStatus } from '@/api/skill-hub'
import { DictSelect } from '@ff-ai-frontend/dictionaries'

import { skillFormInitialValues } from '../constants'
import type { SkillDrawerMode, SkillFormValues } from '../types'

export interface SkillFormRef {
  getValues: () => SkillFormValues
  reset: () => void
  setFields: (
    fields: {
      name: keyof SkillFormValues
      errors: string[]
    }[],
  ) => void
  setValues: (values: Partial<SkillFormValues>) => void
  validate: () => Promise<SkillFormValues>
}

interface SkillFormProps {
  initialValues: Partial<SkillFormValues>
  open: boolean
  mode?: SkillDrawerMode
  ref?: Ref<SkillFormRef>
}

export function SkillForm({ initialValues, open, mode, ref }: SkillFormProps) {
  const [form] = Form.useForm<SkillFormValues>()

  useImperativeHandle(
    ref,
    () => ({
      getValues: () => form.getFieldsValue(),
      reset: () => {
        form.resetFields()
      },
      setFields: (fields) => {
        form.setFields(fields)
      },
      setValues: (values) => {
        form.setFieldsValue(values)
      },
      validate: () => form.validateFields(),
    }),
    [form],
  )

  useEffect(() => {
    if (!open) return

    form.resetFields()
    form.setFieldsValue({
      ...skillFormInitialValues,
      ...initialValues,
    })
  }, [form, initialValues, open])

  return (
    <Form<SkillFormValues>
      form={form}
      layout="vertical"
      className="pt-2"
      initialValues={skillFormInitialValues}
    >
      <div className="grid grid-cols-2 gap-x-4 max-[760px]:grid-cols-1">
        <Form.Item
          label="Skill 名称"
          name="name"
          rules={[{ required: true, message: '请输入 Skill 名称' }]}
        >
          <Input placeholder="Python ETL 技能" />
        </Form.Item>
        <Form.Item
          label="技能分类"
          name="category"
          rules={[{ required: true, message: '请输入技能分类' }]}
        >
          <Input placeholder="python-etl" />
        </Form.Item>
        <Form.Item
          label="环境"
          name="environment"
          rules={[{ required: true, message: '请选择环境' }]}
        >
          <DictSelect<AdminSkillEnvironment> type="admin_skill_environment" />
        </Form.Item>
        <Form.Item
          label="状态"
          name="status"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <DictSelect<AdminSkillStatus>
            excludeValues={mode === 'edit' ? undefined : ['deprecated']}
            type="admin_skill_status"
          />
        </Form.Item>
      </div>

      <Form.Item label="描述" name="description">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="描述该 Skill 的适用场景"
        />
      </Form.Item>

      <Form.Item
        label="Prompt"
        name="prompt"
        rules={[{ required: true, message: '请输入 Prompt' }]}
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 10 }}
          placeholder="描述 Skill 的能力边界、调用方式和最佳实践"
        />
      </Form.Item>

      <Form.Item label="向量标签" name="embedding_tags">
        <Select
          mode="tags"
          tokenSeparators={[',', '，']}
          placeholder="输入标签后回车"
        />
      </Form.Item>

      <Form.List name="code_snippets">
        {(fields, { add, remove }) => (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Typography.Text strong>代码片段</Typography.Text>
              <Button size="small" onClick={() => add()}>
                添加片段
              </Button>
            </div>
            <Space className="w-full" orientation="vertical" size={12}>
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="rounded-lg border border-(--ant-color-border-secondary) p-3"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 max-[760px]:grid-cols-1">
                    <Form.Item
                      label="语言"
                      name={[field.name, 'language']}
                      rules={[{ required: true, message: '请输入代码语言' }]}
                    >
                      <Input placeholder="python" />
                    </Form.Item>
                    <Form.Item
                      label="文件名"
                      name={[field.name, 'filename']}
                      rules={[{ required: true, message: '请输入文件名' }]}
                    >
                      <Input placeholder="etl_pipeline.py" />
                    </Form.Item>
                    <Form.Item label=" " className="mb-0">
                      <Button danger onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="代码内容"
                    name={[field.name, 'content']}
                    rules={[{ required: true, message: '请输入代码内容' }]}
                  >
                    <Input.TextArea
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder="输入参考代码"
                    />
                  </Form.Item>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Form.List>

      <Form.Item label="Metadata" name="metadata" className="mt-5">
        <Input.TextArea
          autoSize={{ minRows: 4, maxRows: 8 }}
          placeholder='{"owner":"platform"}'
        />
      </Form.Item>
    </Form>
  )
}
