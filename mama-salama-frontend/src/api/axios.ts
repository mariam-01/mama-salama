import axios from 'axios'
import type { AxiosError } from 'axios'

const BASE_URL = '/api/core'

const baseHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

// Public client — no auth header, no 401 redirect (used for register/login/OTP)
export const publicClient = axios.create({
  baseURL: BASE_URL,
  headers: baseHeaders,
})

// Authenticated client — attaches JWT and redirects on 401
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: baseHeaders,
})

function redirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (!token) {
    redirectToLogin()
    return Promise.reject(new Error('No token'))
  }
  config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 = expired/invalid token, 403 = forbidden (some backends use this for bad JWTs)
    if (error.response?.status === 401 || error.response?.status === 403) {
      redirectToLogin()
    }
    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
