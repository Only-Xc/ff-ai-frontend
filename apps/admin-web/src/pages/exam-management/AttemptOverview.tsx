import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Pagination, Select, Space, Typography } from 'antd'
import { createStyles } from 'antd-style'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminExamAttempts_get,
  adminExamAttempts_listAll,
  adminExamKeys,
  adminExams_list,
  type AdminExamAttemptDetail,
  type AdminGlobalAttemptListQuery,
  type AttemptStatus,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { PageContainer, PageHeader, TableScrollYWrapper } from '@ff-ai-frontend/components'

import { AttemptHistory } from './components/AttemptHistory'
import { AttemptResultModal } from './components/AttemptResultModal'

interface AttemptOverviewFilterValues {
  paper_id?: string
  status?: AttemptStatus
}

const useAttemptOverviewAntdStyles = createStyles(({ css }) => ({
  toolbar: css`
    .ant-form-item {
      margin-bottom: 0;
    }
  `,
}))

export function AttemptOverview() {
  const { t } = useTranslation()
  const { styles: antdStyles } = useAttemptOverviewAntdStyles()
  const [form] = Form.useForm<AttemptOverviewFilterValues>()
  const pagination = usePaginationParams()
  const [filters, setFilters] = useState<AttemptOverviewFilterValues>({})
  const [attemptDetail, setAttemptDetail] = useState<AdminExamAttemptDetail>()

  const queryParams = useMemo<AdminGlobalAttemptListQuery>(
    () => ({ ...filters, ...pagination.query }),
    [filters, pagination.query],
  )

  const attemptsQuery = useQuery({
    queryKey: adminExamKeys.globalAttempts(queryParams),
    queryFn: () => adminExamAttempts_listAll(queryParams),
    placeholderData: keepPreviousData,
  })

  const papersQuery = useQuery({
    queryKey: adminExamKeys.list({ skip: 0, limit: 100, sort: 'created_at:desc' }),
    queryFn: () => adminExams_list({ skip: 0, limit: 100, sort: 'created_at:desc' }),
  })

  const detailMutation = useMutation({
    mutationFn: adminExamAttempts_get,
    onSuccess: setAttemptDetail,
  })

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={t('pages.examManagement.attemptOverview.title')}
        subtitle={t('pages.examManagement.attemptOverview.subtitle')}
      >
        <Button icon={<ReloadOutlined />} loading={attemptsQuery.isFetching} onClick={() => void attemptsQuery.refetch()}>
          {t('common.actions.refresh')}
        </Button>
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/4%)] [contain:paint]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
          <Form<AttemptOverviewFilterValues>
            className={`${antdStyles.toolbar} flex-1`}
            form={form}
            layout="inline"
            onFinish={(values) => {
              setFilters(values)
              pagination.reset()
            }}
          >
            <Form.Item name="paper_id">
              <Select
                allowClear
                className="w-72"
                loading={papersQuery.isFetching}
                options={(papersQuery.data?.data ?? []).map((paper) => ({
                  label: paper.title,
                  value: paper.id,
                }))}
                placeholder={t('pages.examManagement.filters.paper')}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item name="status">
              <Select
                allowClear
                className="w-36"
                options={[
                  { label: t('pages.examManagement.status.inProgress'), value: 'in_progress' },
                  { label: t('pages.examManagement.status.submitted'), value: 'submitted' },
                ]}
                placeholder={t('pages.examManagement.filters.status')}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button htmlType="submit" type="primary">
                  {t('common.actions.search')}
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    setFilters({})
                    pagination.reset()
                  }}
                >
                  {t('common.actions.reset')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {attemptsQuery.isError ? (
          <Alert showIcon className="m-5" title={t('pages.examManagement.errors.attemptOverviewLoadFailed')} type="error" />
        ) : null}

        <TableScrollYWrapper className="min-h-0 flex-1">
          {() => (
            <AttemptHistory
              data={attemptsQuery.data?.data ?? []}
              loading={attemptsQuery.isFetching || detailMutation.isPending}
              onOpenDetail={(attemptId) => detailMutation.mutate(attemptId)}
            />
          )}
        </TableScrollYWrapper>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text type="secondary">
            {t('common.labels.totalCount', { total: attemptsQuery.data?.count ?? 0 })}
          </Typography.Text>
          <Pagination {...pagination.props} total={attemptsQuery.data?.count ?? 0} />
        </div>
      </PageContainer>

      <AttemptResultModal
        attempt={attemptDetail}
        onClose={() => setAttemptDetail(undefined)}
      />
    </div>
  )
}

export default AttemptOverview
