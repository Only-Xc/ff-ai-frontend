import {
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
} from 'antd'
import type { FormListFieldData } from 'antd'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type {
  AdminExamQuestion,
  QuestionType,
} from '@/api/exam'

import type { QuestionFormValues, QuestionOptionFormValue } from '../types'

const defaultOptions: QuestionOptionFormValue[] = [
  { key: 'A', text: '', is_correct: true },
  { key: 'B', text: '', is_correct: false },
  { key: 'C', text: '', is_correct: false },
  { key: 'D', text: '', is_correct: false },
]

const formSectionCardClassName =
  'border-(--ant-color-border-secondary)! shadow-[0_1px_2px_rgb(15_23_42/4%)]'

interface QuestionFormProps {
  initialValues?: Partial<AdminExamQuestion>
  onSubmit: (values: QuestionFormValues) => void
}

interface QuestionOptionsListProps {
  errors: ReactNode[]
  fields: FormListFieldData[]
  options: QuestionOptionFormValue[]
  t: TFunction
  type: QuestionType
  onRemove: (name: number) => void
  onSingleCorrectChange: (name: number) => void
}

export function QuestionForm({ initialValues, onSubmit }: QuestionFormProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<QuestionFormValues>()
  const type = Form.useWatch('type', form) ?? 'single'
  const text = Form.useWatch('text', form)
  const watchedOptions = Form.useWatch('options', form)
  const options = normalizeQuestionOptions(watchedOptions)

  useEffect(() => {
    form.setFieldsValue({
      type: initialValues?.type ?? 'single',
      text: initialValues?.text ?? '',
      options: normalizeQuestionOptions(initialValues?.options, defaultOptions),
      explanation: initialValues?.explanation ?? undefined,
      score: initialValues?.score ?? 5,
      difficulty: initialValues?.difficulty ?? 'medium',
      order: initialValues?.order ?? 0,
    })
  }, [form, initialValues])

  const handleTypeChange = (nextType: QuestionType) => {
    if (nextType === 'true_false') {
      form.setFieldValue('options', getTrueFalseOptions(t))
      return
    }

    const currentOptions = normalizeQuestionOptions(
      form.getFieldValue('options'),
    )
    if (!currentOptions?.length || type === 'true_false') {
      form.setFieldValue('options', defaultOptions)
      return
    }

    if (nextType === 'single') {
      const firstCorrectIndex = currentOptions.findIndex(
        (option) => option.is_correct,
      )
      form.setFieldValue(
        'options',
        currentOptions.map((option, index) => ({
          ...option,
          is_correct: index === Math.max(firstCorrectIndex, 0),
        })),
      )
    }
  }

  const handleSingleCorrectChange = (fieldName: number) => {
    const currentOptions = normalizeQuestionOptions(
      form.getFieldValue('options'),
    )

    form.setFieldValue(
      'options',
      currentOptions.map((option, index) => ({
        ...option,
        is_correct: index === fieldName,
      })),
    )
  }

  return (
    <Form<QuestionFormValues>
      className="h-full"
      form={form}
      id="admin-question-form"
      layout="vertical"
      onFinish={onSubmit}
    >
      <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <Card
            className={formSectionCardClassName}
            size="small"
            title={t('pages.examManagement.questionForm.sections.questionText')}
          >
            <Form.Item
              className="mb-0!"
              extra={t('pages.examManagement.questionForm.textLength', {
                count: (text ?? '').trim().length,
              })}
              label={t('pages.examManagement.columns.questionText')}
              name="text"
              rules={[{ required: true, message: t('pages.examManagement.questionForm.textRequired') }]}
            >
              <Input.TextArea
                autoSize={{ minRows: 5, maxRows: 10 }}
                placeholder={t('pages.examManagement.questionForm.textPlaceholder')}
              />
            </Form.Item>
          </Card>

          <Form.List
            name="options"
            rules={[
              {
                validator: async (_, currentOptions: unknown) => {
                  validateOptions(type, normalizeQuestionOptions(currentOptions), t)
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Card
                className={`${formSectionCardClassName} mt-5!`}
                extra={
                  type !== 'true_false' ? (
                    <Button
                      icon={<PlusOutlined />}
                      size="small"
                      type="primary"
                      onClick={() =>
                        add({ key: '', text: '', is_correct: false })
                      }
                    >
                      {t('pages.examManagement.questionForm.addOption')}
                    </Button>
                  ) : null
                }
                size="small"
                title={t('pages.examManagement.questionForm.sections.options')}
              >
                <QuestionOptionsList
                  errors={errors}
                  fields={fields}
                  options={options}
                  t={t}
                  type={type}
                  onRemove={remove}
                  onSingleCorrectChange={handleSingleCorrectChange}
                />
              </Card>
            )}
          </Form.List>

          <Card
            className={`${formSectionCardClassName} mt-5!`}
            size="small"
            title={t('pages.examManagement.questionForm.sections.explanation')}
          >
            <Form.Item className="mb-0!" name="explanation">
              <Input.TextArea
                autoSize={{ minRows: 4, maxRows: 8 }}
                placeholder={t('pages.examManagement.questionForm.explanationPlaceholder')}
              />
            </Form.Item>
          </Card>
        </div>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-0 lg:self-start">
          <Card
            className={formSectionCardClassName}
            size="small"
            title={t('pages.examManagement.questionForm.sections.basic')}
          >
            <QuestionMetaFields onTypeChange={handleTypeChange} />
          </Card>
        </aside>
      </div>
    </Form>
  )
}

function QuestionOptionsList({
  errors,
  fields,
  options,
  t,
  type,
  onRemove,
  onSingleCorrectChange,
}: QuestionOptionsListProps) {
  return (
    <Form.Item
      className="mb-0!"
      help={errors.length ? <Form.ErrorList errors={errors} /> : undefined}
      required
      validateStatus={errors.length ? 'error' : undefined}
    >
      <Space className="w-full" direction="vertical" size={10}>
        <div className="hidden grid-cols-[72px_minmax(0,1fr)_112px_36px] gap-3 px-3 text-xs text-(--ant-color-text-secondary) md:grid">
          <span>Key</span>
          <span>{t('pages.examManagement.questionForm.optionText')}</span>
          <span>{t('pages.examManagement.questionForm.correctAnswer')}</span>
          <span />
        </div>

        {fields.map((field) => {
          const option = options[field.name]
          const isCorrect = option?.is_correct === true

          return (
            <div
              className={
                isCorrect
                  ? 'rounded-md border border-(--ant-color-success-border) bg-(--ant-color-success-bg) p-3'
                  : 'rounded-md border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3'
              }
              key={field.key}
            >
              <div className="grid grid-cols-[72px_minmax(0,1fr)_112px_36px] items-start gap-3 max-md:grid-cols-1">
                <Form.Item
                  className="mb-0!"
                  name={[field.name, 'key']}
                  rules={[{ required: true, message: t('pages.examManagement.validation.required') }]}
                >
                  <Input
                    disabled={type === 'true_false'}
                    maxLength={8}
                    placeholder="A"
                  />
                </Form.Item>

                <Form.Item
                  className="mb-0!"
                  name={[field.name, 'text']}
                  rules={[{ required: true, message: t('pages.examManagement.questionForm.optionTextRequired') }]}
                >
                  <Input
                    disabled={type === 'true_false'}
                    placeholder={t('pages.examManagement.questionForm.optionTextPlaceholder')}
                  />
                </Form.Item>

                <Form.Item
                  className="mb-0!"
                  name={[field.name, 'is_correct']}
                  valuePropName="checked"
                >
                  {type === 'single' || type === 'true_false' ? (
                    <Radio onChange={() => onSingleCorrectChange(field.name)}>
                      {t('pages.examManagement.questionForm.correct')}
                    </Radio>
                  ) : (
                    <Checkbox>{t('pages.examManagement.questionForm.correct')}</Checkbox>
                  )}
                </Form.Item>

                <Button
                  danger
                  aria-label={t('pages.examManagement.questionForm.deleteOption')}
                  disabled={type === 'true_false'}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => onRemove(field.name)}
                />
              </div>
            </div>
          )
        })}
      </Space>
    </Form.Item>
  )
}

function QuestionMetaFields({
  onTypeChange,
}: {
  onTypeChange: (type: QuestionType) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <Form.Item
        label={t('pages.examManagement.columns.questionType')}
        name="type"
        rules={[{ required: true, message: t('pages.examManagement.questionForm.typeRequired') }]}
      >
        <Radio.Group
          buttonStyle="solid"
          optionType="button"
          options={[
            { label: t('pages.examManagement.questionType.single'), value: 'single' },
            { label: t('pages.examManagement.questionType.multiple'), value: 'multiple' },
            { label: t('pages.examManagement.questionType.true_false'), value: 'true_false' },
          ]}
          onChange={(event) =>
            onTypeChange(event.target.value as QuestionType)
          }
        />
      </Form.Item>

      <Form.Item
        label={t('pages.examManagement.columns.scoreValue')}
        name="score"
        rules={[{ required: true, message: t('pages.examManagement.questionForm.scoreRequired') }]}
      >
        <InputNumber className="w-full" min={0.5} precision={1} />
      </Form.Item>

      <Form.Item
        label={t('pages.examManagement.columns.difficulty')}
        name="difficulty"
        rules={[{ required: true, message: t('pages.examManagement.questionForm.difficultyRequired') }]}
      >
        <Select
          options={[
            { label: t('pages.examManagement.difficulty.easy'), value: 'easy' },
            { label: t('pages.examManagement.difficulty.medium'), value: 'medium' },
            { label: t('pages.examManagement.difficulty.hard'), value: 'hard' },
          ]}
          placeholder={t('pages.examManagement.questionForm.difficultyRequired')}
        />
      </Form.Item>

      <Form.Item className="mb-0!" label={t('pages.examManagement.columns.order')} name="order">
        <InputNumber className="w-full" min={0} precision={0} />
      </Form.Item>
    </>
  )
}

function validateOptions(
  type: QuestionType,
  options: QuestionFormValues['options'],
  t: TFunction,
) {
  if (!options.length) throw new Error(t('pages.examManagement.questionForm.errors.optionRequired'))

  const keys = options.map((option) => option.key?.trim()).filter(Boolean)
  if (keys.length !== options.length) {
    throw new Error(t('pages.examManagement.questionForm.errors.optionKeyRequired'))
  }
  if (new Set(keys).size !== keys.length) {
    throw new Error(t('pages.examManagement.questionForm.errors.optionKeyDuplicate'))
  }

  const correctCount = options.filter((option) => option.is_correct).length
  if (type === 'multiple' && correctCount < 2) {
    throw new Error(t('pages.examManagement.questionForm.errors.multipleCorrectRequired'))
  }
  if (type !== 'multiple' && correctCount !== 1) {
    throw new Error(t('pages.examManagement.questionForm.errors.singleCorrectRequired'))
  }
}

function getTrueFalseOptions(t: TFunction): QuestionOptionFormValue[] {
  return [
    { key: 'T', text: t('pages.examManagement.questionForm.trueOption'), is_correct: true },
    { key: 'F', text: t('pages.examManagement.questionForm.falseOption'), is_correct: false },
  ]
}

function normalizeQuestionOptions(
  value: unknown,
  fallback: QuestionOptionFormValue[] = [],
): QuestionOptionFormValue[] {
  const source = Array.isArray(value) ? value : fallback

  return source.map((option) => {
    const optionRecord = isRecord(option) ? option : {}
    const key = optionRecord.key
    const text = optionRecord.text

    return {
      key: typeof key === 'string' ? key : '',
      text: typeof text === 'string' ? text : '',
      is_correct: optionRecord.is_correct === true,
    }
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
