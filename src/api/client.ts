import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common.Authorization
}
