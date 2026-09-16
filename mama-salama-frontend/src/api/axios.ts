import axios from 'axios'
import type { AxiosError } from 'axios'
import keycloak from '../keycloak'

const BASE_URL = '/api/core'

const baseHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

// Public client — no auth (used for /auth/complete-invite)
export const publicClient = axios.create({
  baseURL: BASE_URL,
  headers: baseHeaders,
})

// Authenticated client — attaches Keycloak token, refreshes if needed
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: baseHeaders,
})

apiClient.interceptors.request.use(async (config) => {
  // Refresh token proactively if it expires within 30 seconds
  try {
    await keycloak.updateToken(30)
  } catch {
    keycloak.login()
    return Promise.reject(new Error('Session expired'))
  }

  if (!keycloak.token) {
    keycloak.login()
    return Promise.reject(new Error('Not authenticated'))
  }

  config.headers.Authorization = `Bearer ${keycloak.token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      keycloak.login()
    } else if (error.response?.status === 403) {
      const msg = (error.response.data as { message?: string })?.message ?? ''
      if (msg.includes('Compte non vérifié') && window.location.pathname !== '/otp') {
        window.location.replace('/otp')
      }
    }
    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
