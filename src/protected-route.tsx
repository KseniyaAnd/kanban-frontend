import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" replace />
  }
  return <Outlet />
}
