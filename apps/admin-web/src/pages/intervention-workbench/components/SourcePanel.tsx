import { BranchesOutlined } from '@ant-design/icons'
import { Card, Empty, Space, Typography } from 'antd'

import type { AdminTaskSourceCode } from '@/api/adminTasks'

import { CodeBlock } from './CodeBlock'

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
  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <BranchesOutlined />
          源码定位
        </Space>
      }
    >
      {sourceCode ? (
        <Space className="w-full" direction="vertical" size={12}>
          <SourceField
            breakAll
            className={fieldClassName}
            label="仓库"
            value={sourceCode.repo_url}
          />
          <div className="grid grid-cols-2 gap-3 max-[620px]:grid-cols-1">
            <SourceField
              className={fieldClassName}
              label="分支"
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
                <span className="text-[12px] text-(--muted)">Clone 命令</span>
              </div>
              <CodeBlock text={cloneCommand} />
            </div>
          ) : null}
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无源码信息"
        />
      )}
    </Card>
  )
}
