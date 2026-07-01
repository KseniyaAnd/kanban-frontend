import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './layout'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './protected-route'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const BoardsPage = lazy(() => import('./pages/BoardsPage'))

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<div>Загрузка...</div>}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'auth/login', element: withSuspense(LoginPage) },
      { path: 'auth/register', element: withSuspense(RegisterPage) },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: 'boards', element: withSuspense(BoardsPage) },
              // { path: 'profile', element: withSuspense(ProfilePage)},
            ],
          },
        ],
      },
    ],
  },
])
