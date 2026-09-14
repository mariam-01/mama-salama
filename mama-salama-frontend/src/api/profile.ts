import apiClient from './axios'
import type { ApiResponse, PatientProfile, ProfileRequest } from '../types'

export async function getProfile(): Promise<ApiResponse<PatientProfile>> {
  const response = await apiClient.get<ApiResponse<PatientProfile>>('/patient/profile')
  return response.data
}

export async function createProfile(data: ProfileRequest): Promise<ApiResponse<PatientProfile>> {
  const response = await apiClient.post<ApiResponse<PatientProfile>>('/patient/profile', data)
  return response.data
}

export async function updateProfile(data: ProfileRequest): Promise<ApiResponse<PatientProfile>> {
  const response = await apiClient.put<ApiResponse<PatientProfile>>('/patient/profile', data)
  return response.data
}
