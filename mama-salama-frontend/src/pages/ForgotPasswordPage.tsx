import { useEffect } from 'react'
import keycloak from '../keycloak'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ForgotPasswordPage() {
  useEffect(() => {
    keycloak.login({ action: 'RESET_CREDENTIALS' })
  }, [])

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
