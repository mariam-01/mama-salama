export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT'

export function getRoleFromToken(token: string | null): UserRole {
  if (!token) return 'PATIENT'
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    console.debug('[auth] JWT payload:', payload)

    // Collect all possible role strings from the payload
    const candidates: string[] = [
      payload.role,
      payload.roles,
      payload.authority,
      ...(Array.isArray(payload.authorities) ? payload.authorities : [payload.authorities]),
      ...(Array.isArray(payload.roles) ? payload.roles : []),
    ].filter(Boolean).map(String)

    const combined = candidates.join(' ').toUpperCase()
    if (combined.includes('ADMIN')) return 'ADMIN'
    if (combined.includes('DOCTOR')) return 'DOCTOR'
    return 'PATIENT'
  } catch {
    return 'PATIENT'
  }
}

export function getHomeForRole(role: string): string {
  if (role?.includes('ADMIN')) return '/admin/dashboard'
  if (role?.includes('DOCTOR')) return '/doctor/dashboard'
  return '/profile'
}
