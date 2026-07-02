import axios from 'axios'

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const setAuthToken = (token: string) => {
  // давай хранить токет в сторе Zustand
  // и в интерсепторс можно получить токен из стора (в Zustand store доступен и вне компонентов) и использовать его
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

// также в интесепторс нужно будет настроить логику получения нового токена
// когда access token истекает, все упавшие запросы в это время с 401 ошибкой нужно поместить
// в очередь и продолжить выполнение запросов после получения нового токена

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common.Authorization
}
