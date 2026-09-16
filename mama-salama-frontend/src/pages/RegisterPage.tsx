import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import keycloak from '../keycloak'
import { useAuth } from '../context/AuthContext'
import { getHomeForRole } from '../utils/auth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function RegisterPage() {
  const { isAuthenticated, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getHomeForRole(role), { replace: true })
    } else {
      keycloak.register({ redirectUri: window.location.origin + '/otp' })
    }
  }, [isAuthenticated, navigate, role])

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
