import type { TFunction } from 'i18next'

import type {
  StageSwitchApprovalStatus,
  StageSwitchDecision,
  StageSwitchDirection,
  StageSwitchExecutionStatus,
  StageSwitchNodeStatus,
  StageSwitchTemplateStatus,
} from '@/api/stage-switch'

type TagColor = string

interface StatusMeta<T extends string> {
  value: T
  color: TagColor
  labelKey: string
}

/** Single source of truth for approval-status display metadata. */
export const APPROVAL_STATUS_META: Record<
  StageSwitchApprovalStatus,
  StatusMeta<StageSwitchApprovalStatus>
> = {
  DRAFT: { value: 'DRAFT', color: 'default', labelKey: 'pages.stageSwitch.approvalStatus.draft' },
  PRECHECK_BLOCKED: {
    value: 'PRECHECK_BLOCKED',
    color: 'volcano',
    labelKey: 'pages.stageSwitch.approvalStatus.precheckBlocked',
  },
  PENDING: { value: 'PENDING', color: 'blue', labelKey: 'pages.stageSwitch.approvalStatus.pending' },
  IN_REVIEW: {
    value: 'IN_REVIEW',
    color: 'processing',
    labelKey: 'pages.stageSwitch.approvalStatus.inReview',
  },
  APPROVED: { value: 'APPROVED', color: 'green', labelKey: 'pages.stageSwitch.approvalStatus.approved' },
  REJECTED: { value: 'REJECTED', color: 'red', labelKey: 'pages.stageSwitch.approvalStatus.rejected' },
  CANCELLED: {
    value: 'CANCELLED',
    color: 'default',
    labelKey: 'pages.stageSwitch.approvalStatus.cancelled',
  },
  STALE: { value: 'STALE', color: 'gold', labelKey: 'pages.stageSwitch.approvalStatus.stale' },
}

/** Single source of truth for execution-status display metadata. */
export const EXECUTION_STATUS_META: Record<
  StageSwitchExecutionStatus,
  StatusMeta<StageSwitchExecutionStatus>
> = {
  NOT_READY: {
    value: 'NOT_READY',
    color: 'default',
    labelKey: 'pages.stageSwitch.executionStatus.notReady',
  },
  READY: { value: 'READY', color: 'blue', labelKey: 'pages.stageSwitch.executionStatus.ready' },
  EXECUTING: {
    value: 'EXECUTING',
    color: 'processing',
    labelKey: 'pages.stageSwitch.executionStatus.executing',
  },
  SUCCEEDED: {
    value: 'SUCCEEDED',
    color: 'green',
    labelKey: 'pages.stageSwitch.executionStatus.succeeded',
  },
  FAILED: { value: 'FAILED', color: 'red', labelKey: 'pages.stageSwitch.executionStatus.failed' },
  CONFLICT: {
    value: 'CONFLICT',
    color: 'volcano',
    labelKey: 'pages.stageSwitch.executionStatus.conflict',
  },
}

/** Single source of truth for node-status display metadata. */
export const NODE_STATUS_META: Record<
  StageSwitchNodeStatus,
  StatusMeta<StageSwitchNodeStatus>
> = {
  WAITING: { value: 'WAITING', color: 'default', labelKey: 'pages.stageSwitch.nodeStatus.waiting' },
  PENDING: { value: 'PENDING', color: 'blue', labelKey: 'pages.stageSwitch.nodeStatus.pending' },
  OVERDUE: { value: 'OVERDUE', color: 'red', labelKey: 'pages.stageSwitch.nodeStatus.overdue' },
  APPROVED: { value: 'APPROVED', color: 'green', labelKey: 'pages.stageSwitch.nodeStatus.approved' },
  REJECTED: { value: 'REJECTED', color: 'red', labelKey: 'pages.stageSwitch.nodeStatus.rejected' },
  SKIPPED: { value: 'SKIPPED', color: 'default', labelKey: 'pages.stageSwitch.nodeStatus.skipped' },
  CANCELLED: {
    value: 'CANCELLED',
    color: 'default',
    labelKey: 'pages.stageSwitch.nodeStatus.cancelled',
  },
}

export const TEMPLATE_STATUS_META: Record<
  StageSwitchTemplateStatus,
  StatusMeta<StageSwitchTemplateStatus>
> = {
  DRAFT: {
    value: 'DRAFT',
    color: 'default',
    labelKey: 'pages.stageSwitch.templateStatus.draft',
  },
  PUBLISHED: {
    value: 'PUBLISHED',
    color: 'green',
    labelKey: 'pages.stageSwitch.templateStatus.published',
  },
  RETIRED: {
    value: 'RETIRED',
    color: 'orange',
    labelKey: 'pages.stageSwitch.templateStatus.retired',
  },
}

export const DIRECTION_META: Record<
  StageSwitchDirection,
  StatusMeta<StageSwitchDirection>
> = {
  PROMOTE: { value: 'PROMOTE', color: 'green', labelKey: 'pages.stageSwitch.direction.promote' },
  DEMOTE: { value: 'DEMOTE', color: 'orange', labelKey: 'pages.stageSwitch.direction.demote' },
}

export const DECISION_META: Record<
  StageSwitchDecision,
  StatusMeta<StageSwitchDecision>
> = {
  APPROVED: { value: 'APPROVED', color: 'green', labelKey: 'pages.stageSwitch.decision.approved' },
  REJECTED: { value: 'REJECTED', color: 'red', labelKey: 'pages.stageSwitch.decision.rejected' },
}

export const APPROVAL_STATUS_OPTIONS = Object.values(APPROVAL_STATUS_META)
export const EXECUTION_STATUS_OPTIONS = Object.values(EXECUTION_STATUS_META)
export const DIRECTION_OPTIONS = Object.values(DIRECTION_META)
export const TEMPLATE_STATUS_OPTIONS = Object.values(TEMPLATE_STATUS_META)

export function templateStatusLabel(
  status: StageSwitchTemplateStatus,
  t: TFunction,
): string {
  return t(TEMPLATE_STATUS_META[status]?.labelKey ?? '', status)
}

export function templateStatusColor(
  status: StageSwitchTemplateStatus,
): TagColor {
  return TEMPLATE_STATUS_META[status]?.color ?? 'default'
}

export function approvalStatusLabel(
  status: StageSwitchApprovalStatus,
  t: TFunction,
): string {
  return t(APPROVAL_STATUS_META[status]?.labelKey ?? '', status)
}

export function approvalStatusColor(status: StageSwitchApprovalStatus): TagColor {
  return APPROVAL_STATUS_META[status]?.color ?? 'default'
}

export function executionStatusLabel(
  status: StageSwitchExecutionStatus,
  t: TFunction,
): string {
  return t(EXECUTION_STATUS_META[status]?.labelKey ?? '', status)
}

export function executionStatusColor(status: StageSwitchExecutionStatus): TagColor {
  return EXECUTION_STATUS_META[status]?.color ?? 'default'
}

export function nodeStatusLabel(status: StageSwitchNodeStatus, t: TFunction): string {
  return t(NODE_STATUS_META[status]?.labelKey ?? '', status)
}

export function nodeStatusColor(status: StageSwitchNodeStatus): TagColor {
  return NODE_STATUS_META[status]?.color ?? 'default'
}

export function directionLabel(direction: StageSwitchDirection, t: TFunction): string {
  return t(DIRECTION_META[direction]?.labelKey ?? '', direction)
}

export function directionColor(direction: StageSwitchDirection): TagColor {
  return DIRECTION_META[direction]?.color ?? 'default'
}

export function decisionLabel(decision: StageSwitchDecision, t: TFunction): string {
  return t(DECISION_META[decision]?.labelKey ?? '', decision)
}

export function decisionColor(decision: StageSwitchDecision): TagColor {
  return DECISION_META[decision]?.color ?? 'default'
}

/** Statuses from which a request can still be cancelled. */
const CANCELLABLE_STATUSES: StageSwitchApprovalStatus[] = [
  'DRAFT',
  'PENDING',
  'IN_REVIEW',
]

export function canCancelRequest(status: StageSwitchApprovalStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status)
}

/** Execution can be retried only when it previously failed or hit a conflict. */
const RETRYABLE_EXECUTION_STATUSES: StageSwitchExecutionStatus[] = [
  'FAILED',
  'CONFLICT',
]

export function canRetryExecution(status: StageSwitchExecutionStatus): boolean {
  return RETRYABLE_EXECUTION_STATUSES.includes(status)
}
