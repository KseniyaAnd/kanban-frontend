import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './protected-route'
import BoardsPage from './pages/BoardsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'boards', element: <BoardsPage /> }],
      },
    ],
  },
])
