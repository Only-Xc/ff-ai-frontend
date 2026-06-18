import type {
  ComponentsI18nMessages,
  ComponentsLocale,
  ComponentsLocaleCode,
} from './types.js'

const taskCardMessages = {
  ar: {
    'TaskCard.enterIntervention': 'معالجة',
    'TaskCard.executionError': 'خطأ في التنفيذ',
    'TaskCard.node': 'العقدة',
    'TaskCard.preview': 'معاينة',
    'TaskCard.redFlag': 'علامة حمراء',
    'TaskCard.retry': 'إعادة محاولة {{count}}',
    'TaskCard.tenant': 'المستأجر',
    'TaskCard.updated': 'آخر تحديث',
  },
  'en-US': {
    'TaskCard.enterIntervention': 'Handle',
    'TaskCard.executionError': 'Execution error',
    'TaskCard.node': 'Node',
    'TaskCard.preview': 'Preview',
    'TaskCard.redFlag': 'Red flag',
    'TaskCard.retry': 'Retry {{count}}',
    'TaskCard.tenant': 'Tenant',
    'TaskCard.updated': 'Updated',
  },
  'zh-CN': {
    'TaskCard.enterIntervention': '进入处理',
    'TaskCard.executionError': '执行异常',
    'TaskCard.node': '节点',
    'TaskCard.preview': '点击预览',
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
