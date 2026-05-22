import { Tag } from 'antd'

import type { AdminSkillEnvironment, AdminSkillStatus } from '@/api/adminSkills'

import { statusColorMap, statusLabelMap } from '../constants'

export function SkillStatusTag({ status }: { status: AdminSkillStatus }) {
  return <Tag color={statusColorMap[status]}>{statusLabelMap[status]}</Tag>
}

export function EnvironmentTag({
  environment,
}: {
  environment: AdminSkillEnvironment
}) {
  return <Tag color={environment === 'PROD' ? 'blue' : 'cyan'}>{environment}</Tag>
}
