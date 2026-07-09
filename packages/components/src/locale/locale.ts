import type {
  ComponentsI18nMessages,
  ComponentsLocale,
  ComponentsLocaleCode,
} from './types.js'

const taskCardMessages = {
  ar: {
    'TaskPreview.backToWorkspace': 'العودة إلى مساحة العمل',
    'TaskPreview.missingAppId': 'معرف التطبيق مفقود',
    'TaskCard.enterIntervention': 'معالجة',
    'TaskCard.executionError': 'خطأ في التنفيذ',
    'TaskCard.logs': 'السجلات {{count}}',
    'TaskCard.node': 'العقدة',
    'TaskCard.preview': 'معاينة',
    'TaskCard.process.completed': 'اكتملت معالجة الوكيل.',
    'TaskCard.process.created': 'تم إنشاء التذكرة وتنتظر استلام الوكيل.',
    'TaskCard.process.failed': 'توقف التنفيذ بسبب خطأ.',
    'TaskCard.process.latest': 'آخر عقدة معالجة: {{node}}',
    'TaskCard.process.live': 'يتم التحديث مع حالة التذكرة',
    'TaskCard.process.pendingApproval': 'يتطلب التنفيذ موافقة أو إدخالًا يدويًا.',
    'TaskCard.process.previewReady': 'اكتمل التنفيذ وأصبح رابط المعاينة جاهزًا.',
    'TaskCard.process.running': 'الوكيل يعمل الآن على: {{node}}',
    'TaskCard.process.snapshot': 'لقطة من آخر حالة معالجة',
    'TaskCard.process.title': 'سير عمل الوكيل',
    'TaskCard.redFlag': 'علامة حمراء',
    'TaskCard.retry': 'إعادة محاولة {{count}}',
    'TaskCard.tenant': 'المستأجر',
    'TaskCard.updated': 'آخر تحديث',
  },
  'en-US': {
    'TaskPreview.backToWorkspace': 'Back to workspace',
    'TaskPreview.missingAppId': 'Missing app ID',
    'TaskCard.enterIntervention': 'Handle',
    'TaskCard.executionError': 'Execution error',
    'TaskCard.logs': 'Logs {{count}}',
    'TaskCard.node': 'Node',
    'TaskCard.preview': 'Preview',
    'TaskCard.process.completed': 'Agent processing completed.',
    'TaskCard.process.created': 'Task created and waiting for the agent.',
    'TaskCard.process.failed': 'Execution stopped because of an error.',
    'TaskCard.process.latest': 'Latest processing node: {{node}}',
    'TaskCard.process.live': 'Updates with the task status',
    'TaskCard.process.pendingApproval': 'Execution needs approval or manual input.',
    'TaskCard.process.previewReady': 'Execution completed and the preview link is ready.',
    'TaskCard.process.running': 'Agent is working on: {{node}}',
    'TaskCard.process.snapshot': 'Snapshot of the latest processing state',
    'TaskCard.process.title': 'Agent Process',
    'TaskCard.redFlag': 'Red flag',
    'TaskCard.retry': 'Retry {{count}}',
    'TaskCard.tenant': 'Tenant',
    'TaskCard.updated': 'Updated',
  },
  'zh-CN': {
    'TaskPreview.backToWorkspace': '返回工作台',
    'TaskPreview.missingAppId': '缺少应用 ID',
    'TaskCard.enterIntervention': '进入处理',
    'TaskCard.executionError': '执行异常',
    'TaskCard.logs': '历史日志 {{count}} 条',
    'TaskCard.node': '节点',
    'TaskCard.preview': '点击预览',
    'TaskCard.process.completed': 'Agent 处理已完成。',
    'TaskCard.process.created': '工单已创建，等待 Agent 接手。',
    'TaskCard.process.failed': '执行遇到错误，流程已停止。',
    'TaskCard.process.latest': '最近处理节点：{{node}}',
    'TaskCard.process.live': '随工单状态实时更新',
    'TaskCard.process.pendingApproval': '执行需要审批或人工输入。',
    'TaskCard.process.previewReady': '执行完成，预览链接已就绪。',
    'TaskCard.process.running': 'Agent 正在处理：{{node}}',
    'TaskCard.process.snapshot': '最近处理状态快照',
    'TaskCard.process.title': 'Agent 处理进程',
    'TaskCard.redFlag': '红牌',
    'TaskCard.retry': '重试 {{count}}',
    'TaskCard.tenant': '租户',
    'TaskCard.updated': '更新',
  },
} satisfies Record<ComponentsLocaleCode, ComponentsI18nMessages>

const localeMap: Record<ComponentsLocaleCode, ComponentsLocale> = {
  ar: {
    locale: 'ar',
    messages: taskCardMessages.ar,
  },
  'en-US': {
    locale: 'en-US',
    messages: taskCardMessages['en-US'],
  },
  'zh-CN': {
    locale: 'zh-CN',
    messages: taskCardMessages['zh-CN'],
  },
}

const DEFAULT_COMPONENTS_LOCALE_CODE: ComponentsLocaleCode = 'zh-CN'
const localePrefixRules: readonly (readonly [string, ComponentsLocaleCode])[] = [
  ['zh', 'zh-CN'],
  ['en', 'en-US'],
  ['ar', 'ar'],
]

function isComponentsLocaleCode(
  locale: string,
): locale is ComponentsLocaleCode {
  return locale in localeMap
}

function matchesLocalePrefix(locale: string, prefix: string) {
  return locale === prefix || locale.startsWith(`${prefix}-`)
}

export function getDefaultComponentsLocale() {
  return localeMap[DEFAULT_COMPONENTS_LOCALE_CODE]
}

export function resolveComponentsLocale(locale?: string) {
  if (!locale) return getDefaultComponentsLocale()
  if (isComponentsLocaleCode(locale)) return localeMap[locale]

  const normalizedLocale = locale.toLowerCase()
  const matchedRule = localePrefixRules.find(([prefix]) =>
    matchesLocalePrefix(normalizedLocale, prefix),
  )

  if (matchedRule) return localeMap[matchedRule[1]]

  return getDefaultComponentsLocale()
}
