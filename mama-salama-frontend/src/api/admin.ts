import { apiClient } from './axios'
import type { ApiResponse } from '../types'

export interface AdminStats {
  patientCount: number
  doctorCount: number
  pendingAlertCount: number
  proposedAppointmentCount: number
  documentCount: number
}

export interface ActivityItem {
  id: string
  type: 'REGISTRATION' | 'ALERT' | 'APPOINTMENT'
  description: string
  createdAt: string
}

export interface AdminPatient {
  id: string
  email: string
  phone?: string
  fullName?: string
  enabled: boolean
  createdAt: string
}

export interface AdminDoctor {
  id: string
  fullName?: string
  email: string
  city?: string
  prefecture?: string
  region?: string
  specialty?: string
  enabled: boolean
  patientCount: number
  createdAt: string
}

export interface DoctorInvite {
  id: string
  email: string
  firstName?: string
  lastName?: string
  city?: string
  province?: string
  hospital?: string
  status: 'PENDING' | 'ACCEPTED'
  createdByEmail?: string
  usedByEmail?: string
  expiresAt: string
  createdAt: string
  usedAt?: string
}

export interface SendInviteRequest {
  email: string
  firstName?: string
  lastName?: string
  city?: string
  prefecture?: string
  region?: string
  hospital?: string
  specialty?: string
}

export interface KBDocument {
  id: string
  filename: string
  language: 'FRENCH' | 'ARABIC' | 'ENGLISH'
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  chunkCount?: number
  uploadedAt: string
}

export type AlertStatus = 'PENDING' | 'CLAIMED' | 'RESOLVED' | 'CANCELLED'

export interface AdminAlert {
  id: string
  patientId?: string
  patientFullName?: string
  patientEmail?: string
  patientCity?: string
  patientPrefecture?: string
  patientRegion?: string
  patientPregnancyWeek?: number
  source: 'CHATBOT' | 'MANUAL'
  status: AlertStatus
  triggerMessage?: string
  claimedByEmail?: string
  matchedDoctorsCount?: number
  createdAt: string
  claimedAt?: string
}

export interface CreateDoctorRequest {
  fullName: string
  email: string
  city?: string
  prefecture?: string
  region?: string
  specialty?: string
}

export const getAdminStats = () =>
  apiClient.get<AdminStats>('/admin/stats').then((r) => r.data)

export const getAdminPatients = (search?: string) =>
  apiClient.get<AdminPatient[]>('/admin/patients', { params: { search } }).then((r) => r.data)

export const setPatientStatus = (id: string, enabled: boolean) =>
  apiClient.put<ApiResponse<void>>(`/admin/patients/${id}/status`, { active: enabled }).then((r) => r.data)

export const assignDoctorToPatient = (patientId: string, doctorId: string) =>
  apiClient.put<ApiResponse<void>>(`/admin/patients/${patientId}/assign-doctor`, { doctorId }).then((r) => r.data)

export const getAdminDoctors = (search?: string) =>
  apiClient.get<AdminDoctor[]>('/admin/doctors', { params: { search } }).then((r) => r.data)

export const createDoctor = (data: CreateDoctorRequest) =>
  apiClient.post<ApiResponse<AdminDoctor>>('/admin/doctors', data).then((r) => r.data)

export const setDoctorStatus = (id: string, active: boolean) =>
  apiClient.put<ApiResponse<void>>(`/admin/doctors/${id}/status`, { active }).then((r) => r.data)

export const sendDoctorInvite = (data: SendInviteRequest) =>
  apiClient.post<ApiResponse<DoctorInvite>>('/admin/invite-codes', data).then((r) => r.data)

export const getDoctorInvites = () =>
  apiClient.get<DoctorInvite[]>('/admin/invite-codes').then((r) => r.data)

export const getKBDocuments = () =>
  apiClient.get<KBDocument[]>('/admin/knowledge-base').then((r) => r.data)

export const uploadKBDocument = (file: File, language: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('language', language)
  return apiClient.post<ApiResponse<KBDocument>>('/admin/knowledge-base', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const deleteKBDocument = (id: string) =>
  apiClient.delete<ApiResponse<void>>(`/admin/knowledge-base/${id}`).then((r) => r.data)

export const getAdminAlerts = (status?: AlertStatus) =>
  apiClient.get<AdminAlert[]>('/admin/alerts', { params: { status } }).then((r) => r.data)
