import type { Locale } from 'antd/es/locale'

export type LocaleCode = 'zh-CN' | 'en-US' | 'ar'

export type LocaleDirection = 'ltr' | 'rtl'

export interface LocaleConfig {
  code: LocaleCode
  label: string
  direction: LocaleDirection
  antdLocale: Locale
}

export type LocaleResource = Record<string, unknown>

export type LocaleResourceBundle = LocaleResource
