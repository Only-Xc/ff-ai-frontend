import { Form, Input, InputNumber, Radio, Select } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { AdminExamPaper, KnowledgeDataset } from '@/api/exam'

import type { ExamFormValues } from '../types'

interface ExamFormProps {
  initialValues?: Partial<AdminExamPaper>
  knowledgeDatasets?: KnowledgeDataset[]
  knowledgeDatasetsLoading?: boolean
  showKnowledgeDataset?: boolean
  onSubmit: (values: ExamFormValues) => void
}

export function ExamForm({
  initialValues,
  knowledgeDatasets = [],
  knowledgeDatasetsLoading = false,
  showKnowledgeDataset = false,
  onSubmit,
}: ExamFormProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<ExamFormValues>()
  const mode = Form.useWatch('mode', form)

  useEffect(() => {
    form.setFieldsValue({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? undefined,
      time_limit_minutes: initialValues?.time_limit_minutes ?? null,
      mode: initialValues?.mode ?? 'fixed',
      random_count: initialValues?.random_count ?? null,
      passing_score: initialValues?.passing_score ?? 60,
      allowed_user_ids_text: initialValues?.allowed_user_ids?.join('\n') ?? '',
      max_attempts_per_user: initialValues?.max_attempts_per_user ?? null,
      knowledge_dataset_id: initialValues?.knowledge_dataset_id ?? null,
    })
  }, [form, initialValues])

  return (
    <Form<ExamFormValues>
      form={form}
      id="admin-exam-form"
      layout="vertical"
      onFinish={onSubmit}
    >
      <Form.Item
        label={t('pages.examManagement.form.examTitle')}
        name="title"
        rules={[{ required: true, message: t('pages.examManagement.form.examTitleRequired') }]}
      >
        <Input
          maxLength={255}
          placeholder={t('pages.examManagement.form.examTitlePlaceholder')}
        />
      </Form.Item>

      <Form.Item label={t('pages.examManagement.columns.description')} name="description">
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 6 }}
          placeholder={t('pages.examManagement.form.descriptionPlaceholder')}
        />
      </Form.Item>

      <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-1">
        <Form.Item label={t('pages.examManagement.form.timeLimitMinutes')} name="time_limit_minutes">
          <InputNumber
            className="w-full"
            min={1}
            placeholder={t('pages.examManagement.time.unlimited')}
          />
        </Form.Item>
        <Form.Item
          label={t('pages.examManagement.columns.mode')}
          name="mode"
          rules={[{ required: true, message: t('pages.examManagement.form.modeRequired') }]}
        >
          <Radio.Group
            optionType="button"
            options={[
              { label: t('pages.examManagement.mode.fixed'), value: 'fixed' },
              { label: t('pages.examManagement.mode.random'), value: 'random' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t('pages.examManagement.metrics.passingScore')}
          name="passing_score"
          rules={[{ required: true, message: t('pages.examManagement.form.passingScoreRequired') }]}
        >
          <InputNumber className="w-full" max={100} min={0} precision={1} />
        </Form.Item>
      </div>

      {showKnowledgeDataset ? (
        <Form.Item
          label={t('pages.examManagement.form.knowledgeDataset')}
          name="knowledge_dataset_id"
          tooltip={t('pages.examManagement.form.knowledgeDatasetTooltip')}
        >
          <Select
            allowClear
            loading={knowledgeDatasetsLoading}
            optionFilterProp="label"
            options={knowledgeDatasets.map((dataset) => ({
              label: dataset.name || dataset.id,
              value: dataset.id,
            }))}
            placeholder={t('pages.examManagement.form.knowledgeDatasetPlaceholder')}
            showSearch
          />
        </Form.Item>
      ) : null}

      {mode === 'random' ? (
        <Form.Item
          label={t('pages.examManagement.form.randomCount')}
          name="random_count"
          rules={[{ required: true, message: t('pages.examManagement.form.randomCountRequired') }]}
        >
          <InputNumber className="w-full" min={1} precision={0} />
        </Form.Item>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-4 max-[760px]:grid-cols-1">
        <Form.Item
          label={t('pages.examManagement.form.allowedUserIds')}
          name="allowed_user_ids_text"
          tooltip={t('pages.examManagement.form.allowedUserIdsTooltip')}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="user-id-1&#10;user-id-2"
          />
        </Form.Item>
        <Form.Item label={t('pages.examManagement.columns.maxAttempts')} name="max_attempts_per_user">
          <InputNumber
            className="w-full"
            min={1}
            placeholder={t('pages.examManagement.attemptLimit.unlimited')}
            precision={0}
          />
        </Form.Item>
      </div>
    </Form>
  )
}
