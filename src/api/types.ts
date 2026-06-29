export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  message: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}
