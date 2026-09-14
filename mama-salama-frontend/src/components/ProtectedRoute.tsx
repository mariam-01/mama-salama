import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../utils/auth'
import { getHomeForRole } from '../utils/auth'

interface Props {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getHomeForRole(role)} replace />
  }

  return <Outlet />
}
