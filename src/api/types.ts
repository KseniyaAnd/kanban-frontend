import { type InternalAxiosRequestConfig } from 'axios'

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export interface RefreshSubscriber {
  resolve: (token: string) => void
  reject: (reason: unknown) => void
}

export interface AuthStoreState {
  token: string | null
  refreshToken: () => Promise<string>
  logout?: () => void
}
