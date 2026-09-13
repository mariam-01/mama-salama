import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getRoleFromToken, type UserRole } from '../utils/auth'

interface AuthContextType {
  token: string | null
  userId: string | null
  role: UserRole
  isAuthenticated: boolean
  login: (token: string, userId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'))

  const role = getRoleFromToken(token)

  const login = useCallback((newToken: string, newUserId: string) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userId', newUserId)
    setToken(newToken)
    setUserId(newUserId)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setToken(null)
    setUserId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, userId, role, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
