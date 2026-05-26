import { Descriptions, Divider, Space, Tag, Typography } from 'antd'

import type { AdminSkillDetail } from '@/api/skill-hub'
import { numberUtils } from '@ff-ai-frontend/utils'

import {
  formatDateTime,
  stringifyMetadata,
} from '../utils'
import { CodeBlock } from './CodeBlock'
import { EnvironmentTag, SkillStatusTag } from './SkillTags'

export function SkillDetailContent({ skill }: { skill: AdminSkillDetail }) {
  return (
    <div className="space-y-5">
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'skill_id',
            label: 'Skill ID',
            children: <Typography.Text copyable>{skill.skill_id}</Typography.Text>,
          },
          {
            key: 'category',
            label: '分类',
            children: skill.category,
          },
          {
            key: 'environment',
            label: '环境',
            children: <EnvironmentTag environment={skill.environment} />,
          },
          {
            key: 'status',
            label: '状态',
            children: <SkillStatusTag status={skill.status} />,
          },
          {
            key: 'version',
            label: '版本',
            children: skill.version,
          },
          {
            key: 'call_count',
            label: '调用次数',
            children: numberUtils.formatNumber(skill.call_count),
          },
          {
            key: 'success_rate',
            label: '成功率',
            children: numberUtils.formatPercent(skill.success_rate, { decimals: 1 }),
          },
          {
            key: 'created_at',
            label: '创建时间',
            children: formatDateTime(skill.created_at),
          },
          {
            key: 'updated_at',
            label: '更新时间',
            children: formatDateTime(skill.updated_at),
          },
        ]}
      />

      <Divider className="my-4!" />

      <section>
        <Typography.Title className="mb-3!" level={5}>
          描述
        </Typography.Title>
        <Typography.Paragraph className="mb-0! text-(--text)">
          {skill.description}
        </Typography.Paragraph>
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          Prompt
        </Typography.Title>
        <CodeBlock>{skill.prompt}</CodeBlock>
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          代码片段
        </Typography.Title>
        {skill.code_snippets.length > 0 ? (
          <Space className="w-full" orientation="vertical" size={12}>
            {skill.code_snippets.map((snippet) => (
              <div
                key={`${snippet.filename}-${snippet.language}-${snippet.content}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Typography.Text strong>
                    {snippet.filename}
                  </Typography.Text>
                  <Tag>{snippet.language}</Tag>
                </div>
                <CodeBlock language={snippet.language}>{snippet.content}</CodeBlock>
              </div>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )}
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          向量标签
        </Typography.Title>
        {skill.embedding_tags.length > 0 ? (
          <Space wrap size={[6, 6]}>
            {skill.embedding_tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )}
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          Metadata
        </Typography.Title>
        <CodeBlock>{stringifyMetadata(skill.metadata)}</CodeBlock>
      </section>
    </div>
  )
}
