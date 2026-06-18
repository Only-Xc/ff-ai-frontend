import { BranchesOutlined } from '@ant-design/icons'
import { Card, Empty, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { AdminTaskSourceCode } from '@/api/ticket-kanban'
import { CodeBlock } from '@ff-ai-frontend/components'

interface SourcePanelProps {
  cardClassName?: string
  cloneCommand: string
  fieldClassName?: string
  sourceCode?: AdminTaskSourceCode | null
}

interface SourceFieldProps {
  breakAll?: boolean
  className?: string
  label: string
  value?: string
}

function SourceField({ breakAll, className, label, value }: SourceFieldProps) {
  return (
    <div className={className}>
      <div className="mb-1 text-[12px] text-(--muted)">{label}</div>
      <Typography.Text
        copyable={{ text: value ?? '' }}
        className={`text-[13px]! ${breakAll ? 'break-all' : ''}`}
      >
        {value ?? '-'}
      </Typography.Text>
    </div>
  )
}

export function SourcePanel({
  cardClassName,
  cloneCommand,
  fieldClassName,
  sourceCode,
}: SourcePanelProps) {
  const { t } = useTranslation()

  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <BranchesOutlined />
          {t('pages.intervention.panels.source')}
        </Space>
      }
    >
      {sourceCode ? (
        <Space className="w-full" orientation="vertical" size={12}>
          <SourceField
            breakAll
            className={fieldClassName}
            label={t('pages.intervention.source.repo')}
            value={sourceCode.repo_url}
          />
          <div className="grid grid-cols-2 gap-3 max-[620px]:grid-cols-1">
            <SourceField
              className={fieldClassName}
              label={t('pages.intervention.source.branch')}
              value={sourceCode.branch}
            />
            <SourceField
              breakAll
              className={fieldClassName}
              label="Commit"
              value={sourceCode.commit_sha}
            />
          </div>
          {cloneCommand ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[12px] text-(--muted)">
                  {t('pages.intervention.source.cloneCommand')}
                </span>
              </div>
              <CodeBlock text={cloneCommand} />
            </div>
          ) : null}
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.intervention.empty.source')}
        />
      )}
    </Card>
  )
}
