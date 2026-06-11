import { Button, Form, Input, Select, Space, Typography } from 'antd'
import { useEffect, useImperativeHandle } from 'react'
import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
          label={t('pages.skillHub.form.skillName')}
          name="name"
          rules={[
            {
              required: true,
              message: t('pages.skillHub.form.skillNameRequired'),
            },
          ]}
        >
          <Input placeholder={t('pages.skillHub.form.skillNamePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('pages.skillHub.form.category')}
          name="category"
          rules={[
            {
              required: true,
              message: t('pages.skillHub.form.categoryRequired'),
            },
          ]}
        >
          <Input placeholder={t('pages.skillHub.form.categoryPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('pages.skillHub.form.environment')}
          name="environment"
          rules={[
            {
              required: true,
              message: t('pages.skillHub.form.environmentRequired'),
            },
          ]}
        >
          <DictSelect<AdminSkillEnvironment> type="admin_skill_environment" />
        </Form.Item>
        <Form.Item
          label={t('pages.skillHub.form.status')}
          name="status"
          rules={[
            {
              required: true,
              message: t('pages.skillHub.form.statusRequired'),
            },
          ]}
        >
          <DictSelect<AdminSkillStatus>
            excludeValues={mode === 'edit' ? undefined : ['deprecated']}
            type="admin_skill_status"
          />
        </Form.Item>
      </div>

      <Form.Item
        label={t('pages.skillHub.form.description')}
        name="description"
      >
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder={t('pages.skillHub.form.descriptionPlaceholder')}
        />
      </Form.Item>

      <Form.Item
        label="Prompt"
        name="prompt"
        rules={[
          {
            required: true,
            message: t('pages.skillHub.form.promptRequired'),
          },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 10 }}
          placeholder={t('pages.skillHub.form.promptPlaceholder')}
        />
      </Form.Item>

      <Form.Item
        label={t('pages.skillHub.form.embeddingTags')}
        name="embedding_tags"
      >
        <Select
          mode="tags"
          tokenSeparators={[',', '，']}
          placeholder={t('pages.skillHub.form.embeddingTagsPlaceholder')}
        />
      </Form.Item>

      <Form.List name="code_snippets">
        {(fields, { add, remove }) => (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Typography.Text strong>
                {t('pages.skillHub.form.codeSnippets')}
              </Typography.Text>
              <Button size="small" onClick={() => add()}>
                {t('pages.skillHub.form.addSnippet')}
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
                      label={t('pages.skillHub.form.language')}
                      name={[field.name, 'language']}
                      rules={[
                        {
                          required: true,
                          message: t('pages.skillHub.form.languageRequired'),
                        },
                      ]}
                    >
                      <Input placeholder="python" />
                    </Form.Item>
                    <Form.Item
                      label={t('pages.skillHub.form.filename')}
                      name={[field.name, 'filename']}
                      rules={[
                        {
                          required: true,
                          message: t('pages.skillHub.form.filenameRequired'),
                        },
                      ]}
                    >
                      <Input placeholder="etl_pipeline.py" />
                    </Form.Item>
                    <Form.Item label=" " className="mb-0">
                      <Button danger onClick={() => remove(field.name)}>
                        {t('common.actions.delete')}
                      </Button>
                    </Form.Item>
                  </div>
                  <Form.Item
                    label={t('pages.skillHub.form.codeContent')}
                    name={[field.name, 'content']}
                    rules={[
                      {
                        required: true,
                        message: t('pages.skillHub.form.codeContentRequired'),
                      },
                    ]}
                  >
                    <Input.TextArea
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder={t(
                        'pages.skillHub.form.codeContentPlaceholder',
                      )}
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
