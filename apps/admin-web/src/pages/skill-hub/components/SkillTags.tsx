import type { AdminSkillEnvironment, AdminSkillStatus } from '@/api/skill-hub'
import { DictTag } from '@ff-ai-frontend/dictionaries'

export function SkillStatusTag({ status }: { status: AdminSkillStatus }) {
  return <DictTag type="admin_skill_status" value={status} />
}

export function EnvironmentTag({
  environment,
}: {
  environment: AdminSkillEnvironment
}) {
  return <DictTag type="admin_skill_environment" value={environment} />
}
