import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { type RetryableRequestConfig, type RefreshSubscriber, type AuthStoreState } from './types'

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

let isRefreshing = false
let refreshSubscribers: RefreshSubscriber[] = []

const subscribeTokenRefresh = (): Promise<string> =>
  new Promise((resolve, reject) => {
    refreshSubscribers.push({ resolve, reject })
  })

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach(({ resolve }) => {
    resolve(token)
  })
  refreshSubscribers = []
}

const onRefreshFailed = (reason: unknown): void => {
  refreshSubscribers.forEach(({ reject }) => {
    reject(reason)
  })
  refreshSubscribers = []
}

const isAuthRetryExcluded = (url?: string): boolean => {
  if (!url) return false
  return url.includes('refresh-token') || url.includes('logout')
}

const forceLogout = (): void => {
  const store = useAuthStore.getState() as unknown as AuthStoreState
  store.logout?.()
}

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error))),
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<unknown> => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      isAuthRetryExcluded(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      onRefreshFailed(error)
      forceLogout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      try {
        const newToken = await subscribeTokenRefresh()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return await apiClient(originalRequest)
      } catch (refreshError) {
        forceLogout()
        const parsedError =
          refreshError instanceof Error ? refreshError : new Error(String(refreshError))
        return Promise.reject(parsedError)
      }
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const store = useAuthStore.getState() as unknown as AuthStoreState
      const newToken = await store.refreshToken()

      if (!newToken) {
        throw new Error('No token received from refresh method')
      }

      onRefreshed(newToken)

      originalRequest.headers.Authorization = `Bearer ${newToken}`

      return await apiClient(originalRequest)
    } catch (refreshError) {
      onRefreshFailed(refreshError)
      forceLogout()
      const parsedError =
        refreshError instanceof Error ? refreshError : new Error(String(refreshError))
      return await Promise.reject(parsedError)
    } finally {
      isRefreshing = false
    }
  },
)

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common.Authorization
}
