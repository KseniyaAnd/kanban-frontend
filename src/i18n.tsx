import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

void i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      async (language: string, namespace: string): Promise<{ default: unknown }> =>
        (await import(`./public/locales/${language}/${namespace}.json`)) as { default: unknown },
    ),
  )
  .init({
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en'],
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
