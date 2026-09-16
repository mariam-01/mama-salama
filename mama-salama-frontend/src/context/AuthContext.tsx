import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import keycloak from '../keycloak'
import type { UserRole } from '../utils/auth'
import { getHomeForRole } from '../utils/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole
  email: string | null
  token: string | null
  login: () => void
  logout: () => void
  register: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(keycloak.authenticated ?? false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const onAuthSuccess = () => setIsAuthenticated(true)
    const onAuthLogout = () => setIsAuthenticated(false)
    const onAuthRefreshError = () => {
      setIsAuthenticated(false)
      keycloak.login()
    }

    keycloak.onAuthSuccess = onAuthSuccess
    keycloak.onAuthLogout = onAuthLogout
    keycloak.onAuthRefreshError = onAuthRefreshError

    return () => {
      keycloak.onAuthSuccess = undefined
      keycloak.onAuthLogout = undefined
      keycloak.onAuthRefreshError = undefined
    }
  }, [])

  const role = getRoleFromKeycloak()
  const email = (keycloak.tokenParsed as ExtendedTokenParsed | undefined)?.email ?? null
  const token = keycloak.token ?? null

  const login = useCallback(() => {
    setIsLoading(true)
    keycloak.login({ redirectUri: window.location.origin + getHomeForRole(role) })
  }, [role])

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin })
  }, [])

  const register = useCallback(() => {
    keycloak.register({ redirectUri: window.location.origin + '/profile' })
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, role, email, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

interface ExtendedTokenParsed {
  realm_access?: { roles?: string[] }
  email?: string
}

function getRoleFromKeycloak(): UserRole {
  const parsed = keycloak.tokenParsed as ExtendedTokenParsed | undefined
  const roles = parsed?.realm_access?.roles ?? []
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('DOCTOR')) return 'DOCTOR'
  return 'PATIENT'
}
