import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './shared/components/ErrorBoundary'
import './i18n'

// Итого:
// 1. Использовать MUI библиотеку для UI (настроить theme со всеми цветами и типографией)
// 2. Добавить переводы на русский и английский языки (подгружать переводы асинхронно в компоненте. Используй i18next-resources-to-backend)
// 3. Добавить интерсепторы для axios (для авторизации и обновления токенов)
// 4. Добавить lazy loading для компонентов с Suspense и ErrorBoundary
// 5. Добавить zod схемы для форм и валидацию форм (zodResolver). Тип можно получить из схемы z.infer<typeof schema>
// 6. .env  файл должен быть в gitignore!!! Создай также .env.example файл с описанием всех переменных
// 7. Используй flat config для eslint (не забудь включить flat config в настройках vscode!!!) Ошибки prettier также показывать как errors

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}
