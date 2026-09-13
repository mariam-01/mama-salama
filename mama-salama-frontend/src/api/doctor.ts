import { apiClient } from './axios'
import type { ApiResponse, PatientProfile, CheckupResponse } from '../types'

export interface DoctorProfile {
  id: string
  fullName: string
  email: string
  specialty?: string
  hospital?: string
  region?: string
  prefecture?: string
  city?: string
}

export interface DoctorProfileRequest {
  fullName: string
  specialty?: string
  hospital?: string
  region?: string
  prefecture?: string
  city?: string
}

export const getDoctorProfile = () =>
  apiClient.get<ApiResponse<DoctorProfile>>('/doctors/me').then((r) => r.data)

export const updateDoctorProfile = (data: DoctorProfileRequest) =>
  apiClient.put<ApiResponse<DoctorProfile>>('/doctors/me', data).then((r) => r.data)

export interface DoctorPatient {
  id: string
  fullName: string
  email?: string
  city?: string
  prefecture?: string
  region?: string
  pregnancyWeek?: number
  lastCheckupDate?: string
  triageLevel?: 'GREEN' | 'YELLOW' | 'RED'
  assignedAt: string
}

export interface PatientDetail {
  profile: PatientProfile
  checkupHistory: CheckupResponse[]
}

export const getMyPatients = () =>
  apiClient.get<ApiResponse<DoctorPatient[]>>('/doctors/patients').then((r) => r.data)

export const searchPatients = (query: string) =>
  apiClient.get<ApiResponse<DoctorPatient[]>>('/doctors/patients/search', { params: { query } }).then((r) => r.data)

export const getPatientDetail = (patientId: string) =>
  apiClient.get<ApiResponse<PatientDetail>>(`/doctors/patients/${patientId}`).then((r) => r.data)

export const assignPatientToSelf = (patientId: string) =>
  apiClient.post<ApiResponse<void>>(`/doctors/patients/${patientId}/assign`).then((r) => r.data)
