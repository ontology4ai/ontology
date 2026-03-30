import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    resources: {
      'zh-CN': {
        translation: zhCN
      },
      'en-US': {
        translation: enUS
      }
    },
    interpolation: {
      escapeValue: false
    },
   // 添加白名单
   supportedLngs: ['zh-CN', 'en-US'],
   // 添加语言解析
   detection: {
     lookupLocalStorage: 'app_language',
     caches: ['localStorage']
   }
  });

export default i18n;