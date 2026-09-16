import { publicClient } from './axios'
import type { ApiResponse } from '../types'

export async function completeInvite(data: {
  token: string
  password: string
  phone?: string
}): Promise<ApiResponse<void>> {
  const response = await publicClient.post<ApiResponse<void>>('/auth/complete-invite', data)
  return response.data
}
