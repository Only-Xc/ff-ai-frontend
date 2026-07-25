import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import adminCommonZhCN from './admin-common.zh-CN'
import adminPagesZhCN from './admin-pages.zh-CN'
import userCommonZhCN from './user-common.zh-CN'
import userPagesZhCN from './user-pages.zh-CN'

export const i18n = createInstance()

export const i18nReady = i18n.use(initReactI18next).init({
  lng: 'zh-CN',
  fallbackLng: false,
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'zh-CN': {
      translation: {
        ...adminCommonZhCN,
        ...userCommonZhCN,
        ...adminPagesZhCN,
        ...userPagesZhCN,
      },
    },
  },
  react: {
    useSuspense: false,
  },
})
