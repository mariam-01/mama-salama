import { publicClient } from './axios'
import type { ApiResponse, RegisterRequest, RegisterResponse, OtpRequest, AuthResponse, LoginRequest, OtpChannel } from '../types'

export async function completeInvite(data: { token: string; password: string; phone?: string }): Promise<ApiResponse<AuthResponse>> {
  const response = await publicClient.post<ApiResponse<AuthResponse>>('/auth/complete-invite', data)
  return response.data
}

export async function register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
  const response = await publicClient.post<ApiResponse<RegisterResponse>>('/auth/register', data)
  return response.data
}

export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  const response = await publicClient.post<ApiResponse<AuthResponse>>('/auth/login', data)
  return response.data
}

export async function verifyOtp(data: OtpRequest): Promise<ApiResponse<AuthResponse>> {
  const response = await publicClient.post<ApiResponse<AuthResponse>>('/auth/verify-otp', data)
  return response.data
}

export async function resendOtp(userId: string, channel: string): Promise<ApiResponse<unknown>> {
  const response = await publicClient.post<ApiResponse<unknown>>(
    `/auth/resend-otp/${userId}?channel=${channel}`
  )
  return response.data
}

export async function forgotPassword(data: { email: string; otpChannel: OtpChannel }): Promise<ApiResponse<{ userId: string }>> {
  const response = await publicClient.post<ApiResponse<{ userId: string }>>('/auth/forgot-password', data)
  return response.data
}

export async function resetPassword(data: {
  userId: string
  code: string
  newPassword: string
  confirmPassword: string
}): Promise<ApiResponse<AuthResponse>> {
  const response = await publicClient.post<ApiResponse<AuthResponse>>('/auth/reset-password', data)
  return response.data
}
