import type {
  FieldPolicy,
  FieldPolicyCreateBody,
  FieldPolicyUpdateBody,
  FieldPolicyStatus,
} from '@/api/data-access'
import type {
  FieldPolicyRecord,
  PolicyFormValues,
  PolicyStatus,
} from '../types'

function splitAllowedDenied(
  policy: Pick<FieldPolicy, 'effect' | 'fields'>,
): { allowedFields: string[]; deniedFields: string[] } {
  if (policy.effect === 'DENY') {
    return { allowedFields: [], deniedFields: [...policy.fields] }
  }
  return { allowedFields: [...policy.fields], deniedFields: [] }
}

const STATUS_TO_FRONTEND: Record<FieldPolicyStatus, PolicyStatus> = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
}

// Backend FieldPolicyPublic (gateway_permissions) currently exposes
// endpoint_id only; the endpoint_code join lives in the access_endpoints table.
// Pass an endpointCodeById map (built from useAccessEndpoints) so cells stay
// human-readable; otherwise we fall back to the first 8 chars of the UUID so
// the row is never blank during the very first render.
export function fieldPolicyToRecord(
  policy: FieldPolicy,
  endpointCodeById?: Record<string, string>,
  subjectDisplayName?: string,
): FieldPolicyRecord {
  const { allowedFields, deniedFields } = splitAllowedDenied(policy)
  const resolvedCode =
    endpointCodeById?.[policy.endpoint_id] ??
    (policy.endpoint_id ? policy.endpoint_id.slice(0, 8) : '')
  return {
    id: policy.id,
    name: policy.name,
    endpointCode: resolvedCode,
    endpointVersion: policy.endpoint_version,
    subject: subjectDisplayName ?? policy.subject_id,
    subjectType: policy.subject_type,
    subjectId: policy.subject_id,
    allowedFields,
    deniedFields,
    status: STATUS_TO_FRONTEND[policy.status] ?? 'draft',
    version: policy.version,
    updatedAt: policy.updated_at,
  }
}

export interface BuildFieldPolicyPayloadInput {
  endpointCode: string
  endpointVersion: number
  form: PolicyFormValues
}

export function buildFieldPolicyCreateBody({
  endpointCode,
  endpointVersion,
  form,
}: BuildFieldPolicyPayloadInput): FieldPolicyCreateBody {
  return {
    endpoint_code: endpointCode,
    name: form.name.trim(),
    endpoint_version: endpointVersion,
    subject_type: 'user',
    subject_id: form.subject.trim(),
    effect: 'ALLOW',
    fields: form.allowedFields,
  }
}

export function buildFieldPolicyUpdateBody({
  endpointVersion,
  form,
  expectedVersion,
}: BuildFieldPolicyPayloadInput & {
  expectedVersion: number
}): FieldPolicyUpdateBody {
  return {
    expected_version: expectedVersion,
    name: form.name.trim(),
    endpoint_version: endpointVersion,
    subject_type: 'user',
    subject_id: form.subject.trim(),
    effect: 'ALLOW',
    fields: form.allowedFields,
  }
}
