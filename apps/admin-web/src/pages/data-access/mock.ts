import type { FieldPolicyRecord, UsageRecord } from './types'

export const initialPolicies: FieldPolicyRecord[] = []

export const initialUsageRecords: UsageRecord[] = [
  {
    id: 'usage-20260716-143218',
    userName: 'i18n:pages.dataAccess.mock.user.zhangWei',
    userAccount: 'zhang.wei@example.com',
    targetType: 'endpoint',
    targetName: 'i18n:pages.dataAccess.mock.target.customerProfile',
    targetCode: 'customer-profile',
    usedAt: '2026-07-16 14:32:18',
  },
  {
    id: 'usage-20260716-140506',
    userName: 'i18n:pages.dataAccess.mock.user.orderOperationsService',
    userAccount: 'order-ops-service',
    targetType: 'database',
    targetName: 'i18n:pages.dataAccess.mock.target.orderAnalyticsDatabase',
    targetCode: 'order-ro.internal:5432',
    usedAt: '2026-07-16 14:05:06',
  },
  {
    id: 'usage-20260716-132451',
    userName: 'i18n:pages.dataAccess.mock.user.liNa',
    userAccount: 'li.na@example.com',
    targetType: 'endpoint',
    targetName: 'i18n:pages.dataAccess.mock.target.orderSearch',
    targetCode: 'order-search',
    usedAt: '2026-07-16 13:24:51',
  },
  {
    id: 'usage-20260716-115903',
    userName: 'i18n:pages.dataAccess.mock.user.customerServiceWorkspace',
    userAccount: 'customer-service-app',
    targetType: 'database',
    targetName: 'i18n:pages.dataAccess.mock.target.crmPrimaryDatabase',
    targetCode: 'crm-pg.internal:5432',
    usedAt: '2026-07-16 11:59:03',
  },
  {
    id: 'usage-20260716-104726',
    userName: 'i18n:pages.dataAccess.mock.user.wangQiang',
    userAccount: 'wang.qiang@example.com',
    targetType: 'endpoint',
    targetName: 'i18n:pages.dataAccess.mock.target.customerProfile',
    targetCode: 'customer-profile',
    usedAt: '2026-07-16 10:47:26',
  },
  {
    id: 'usage-20260715-181442',
    userName: 'i18n:pages.dataAccess.mock.user.analyticsService',
    userAccount: 'analytics-service',
    targetType: 'database',
    targetName: 'i18n:pages.dataAccess.mock.target.orderAnalyticsDatabase',
    targetCode: 'order-ro.internal:5432',
    usedAt: '2026-07-15 18:14:42',
  },
]
