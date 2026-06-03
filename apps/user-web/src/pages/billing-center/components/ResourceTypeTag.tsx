import type { BillingResourceType } from '@/api/billing-center'
import { DictTag } from '@ff-ai-frontend/dictionaries'

export function ResourceTypeTag({ type }: { type: BillingResourceType }) {
  return <DictTag type="billing_resource_type" value={type} />
}
