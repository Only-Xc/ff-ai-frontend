import { Skeleton, Tag, Typography } from 'antd'

import type { OpsMetricsHotSkill } from '@/api/adminMetrics'

import { formatNumber, formatPercent } from '../utils'
import { EmptyBlock } from './EmptyBlock'

interface HotSkillsListProps {
  loading: boolean
  skills?: OpsMetricsHotSkill[]
}

export function HotSkillsList({ loading, skills }: HotSkillsListProps) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} title={false} />
  }

  if (!skills?.length) {
    return <EmptyBlock description="暂无热门 Skill" />
  }

  return (
    <div className="space-y-2.5">
      {skills.slice(0, 10).map((skill) => (
        <div
          key={skill.skill_id}
          className="flex items-center gap-3 rounded-lg border border-(--ops-border) bg-(--control-bg) px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-160 hover:border-[color-mix(in_srgb,var(--admin-primary)_22%,var(--border))] hover:bg-[color-mix(in_srgb,var(--admin-primary)_4%,var(--panel))]"
        >
          <span
            className={`grid h-6.5 w-6.5 shrink-0 place-items-center rounded-[9px] border border-(--ops-border) bg-(--control-bg) text-[12px] font-bold text-(--muted) ${
              skill.rank <= 3
                ? 'border-[color-mix(in_srgb,var(--admin-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--admin-primary)_14%,transparent)] text-(--admin-primary)'
                : ''
            }`}
          >
            {skill.rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-[13px] font-semibold text-(--text-strong)">
                {skill.name}
              </span>
              <Tag className="m-0! rounded-md! text-[11px]!" color="blue">
                {skill.category}
              </Tag>
            </div>
            <Typography.Text
              copyable={{ text: skill.skill_id }}
              className="mt-1 block max-w-full text-[11px]! text-(--muted)!"
            >
              {skill.skill_id}
            </Typography.Text>
          </div>
          <div className="min-w-27 text-right">
            <div className="font-semibold text-(--text-strong) tabular-nums">
              {formatNumber(skill.call_count)}
            </div>
            <div className="text-[12px] text-(--muted)">
              成功率 {formatPercent(skill.success_rate)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
