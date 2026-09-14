import apiClient from './axios'
import type { ApiResponse, CheckupRequest, CheckupResponse } from '../types'

export async function submitCheckup(data: CheckupRequest): Promise<ApiResponse<CheckupResponse>> {
  const response = await apiClient.post<ApiResponse<CheckupResponse>>('/pregnancy/checkup', data)
  return response.data
}

export async function getCheckupHistory(): Promise<ApiResponse<CheckupResponse[]>> {
  const response = await apiClient.get<ApiResponse<CheckupResponse[]>>('/pregnancy/checkup/history')
  return response.data
}

export async function getLatestCheckup(): Promise<ApiResponse<CheckupResponse>> {
  const response = await apiClient.get<ApiResponse<CheckupResponse>>('/pregnancy/checkup/latest')
  return response.data
}
