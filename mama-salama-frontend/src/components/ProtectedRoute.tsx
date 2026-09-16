import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../utils/auth'
import { getHomeForRole } from '../utils/auth'
import keycloak from '../keycloak'

interface Props {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      keycloak.login()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  if (allowedRoles && !allowedRoles.includes(role)) {
    window.location.replace(getHomeForRole(role))
    return null
  }

  return <Outlet />
}
