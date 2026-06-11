import { Descriptions, Divider, Space, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { AdminSkillDetail } from '@/api/skill-hub'
import { numberUtils } from '@ff-ai-frontend/utils'

import { formatDateTime, stringifyMetadata } from '../utils'
import { CodeBlock } from './CodeBlock'
import { EnvironmentTag, SkillStatusTag } from './SkillTags'

export function SkillDetailContent({ skill }: { skill: AdminSkillDetail }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'skill_id',
            label: 'Skill ID',
            children: (
              <Typography.Text copyable>{skill.skill_id}</Typography.Text>
            ),
          },
          {
            key: 'category',
            label: t('pages.skillHub.columns.category'),
            children: skill.category,
          },
          {
            key: 'environment',
            label: t('pages.skillHub.columns.environment'),
            children: <EnvironmentTag environment={skill.environment} />,
          },
          {
            key: 'status',
            label: t('pages.skillHub.columns.status'),
            children: <SkillStatusTag status={skill.status} />,
          },
          {
            key: 'version',
            label: t('pages.skillHub.columns.version'),
            children: skill.version,
          },
          {
            key: 'call_count',
            label: t('pages.skillHub.columns.callCount'),
            children: numberUtils.formatNumber(skill.call_count),
          },
          {
            key: 'success_rate',
            label: t('pages.skillHub.columns.successRate'),
            children: numberUtils.formatPercent(skill.success_rate, {
              decimals: 1,
            }),
          },
          {
            key: 'created_at',
            label: t('pages.skillHub.columns.createdAt'),
            children: formatDateTime(skill.created_at),
          },
          {
            key: 'updated_at',
            label: t('pages.skillHub.columns.updatedAt'),
            children: formatDateTime(skill.updated_at),
          },
        ]}
      />

      <Divider className="my-4!" />

      <section>
        <Typography.Title className="mb-3!" level={5}>
          {t('pages.skillHub.detail.description')}
        </Typography.Title>
        <Typography.Paragraph className="mb-0! text-(--text)">
          {skill.description}
        </Typography.Paragraph>
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          {t('pages.skillHub.detail.prompt')}
        </Typography.Title>
        <CodeBlock>{skill.prompt}</CodeBlock>
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          {t('pages.skillHub.detail.codeSnippets')}
        </Typography.Title>
        {skill.code_snippets.length > 0 ? (
          <Space className="w-full" orientation="vertical" size={12}>
            {skill.code_snippets.map((snippet) => (
              <div
                key={`${snippet.filename}-${snippet.language}-${snippet.content}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Typography.Text strong>{snippet.filename}</Typography.Text>
                  <Tag>{snippet.language}</Tag>
                </div>
                <CodeBlock language={snippet.language}>
                  {snippet.content}
                </CodeBlock>
              </div>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )}
      </section>

      <section>
        <Typography.Title className="mb-3!" level={5}>
          {t('pages.skillHub.detail.embeddingTags')}
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
