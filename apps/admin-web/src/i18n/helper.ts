import { match } from '@formatjs/intl-localematcher'
import { local } from '@ff-ai-frontend/utils'
import {
  DEFAULT_LOCALE,
  localeConfigs,
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEY,
} from './constants'
import type { LocaleCode, LocaleResourceBundle } from './types'

export function isLocaleCode(value: unknown): value is LocaleCode {
  return (
    typeof value === 'string' && SUPPORTED_LOCALES.includes(value as LocaleCode)
  )
}

export function getSafeLocale(value: unknown): LocaleCode {
  return isLocaleCode(value) ? value : DEFAULT_LOCALE
}

function getBrowserLocales() {
  if (typeof navigator === 'undefined') return []

  if (navigator.languages?.length) return navigator.languages

  return navigator.language ? [navigator.language] : []
}

export function getInitialLocale() {
  const storedLocale = local.get<LocaleCode>(LOCALE_STORAGE_KEY)

  if (isLocaleCode(storedLocale)) return storedLocale

  return match(
    getBrowserLocales(),
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
  ) as LocaleCode
}

export function getLocaleConfig(locale: LocaleCode) {
  return localeConfigs[locale]
}

interface LocaleResourceModule {
  default: LocaleResourceBundle
}

const resourceModules = import.meta.glob<LocaleResourceModule>(
  './resources/*.ts',
)

export function loadLocaleResources(locale: LocaleCode) {
  const modulePath = `./resources/${locale}.ts`
  const loader = resourceModules[modulePath]

  if (!loader) {
    throw new Error(`Missing locale resource: ${modulePath}`)
  }

  return loader().then((resourceModule) => resourceModule.default)
}

export async function loadLangResources(locale: LocaleCode, namespace: string) {
  if (namespace !== 'translation') {
    throw new Error(`Unsupported locale namespace: ${namespace}`)
  }

  return loadLocaleResources(locale)
}
