import { useAppStore } from '@/store/useApp'
import { localeOptions } from './constants'
import { getLocaleConfig } from './helper'

export function useLocale() {
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)
  const localeConfig = getLocaleConfig(locale)

  return {
    locale,
    direction: localeConfig.direction,
    antdLocale: localeConfig.antdLocale,
    setLocale,
    localeOptions,
  }
}
