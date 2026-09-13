import { apiClient } from './axios'

export type AlertSource = 'CHATBOT' | 'MANUAL'
export type AlertStatus = 'PENDING' | 'CLAIMED' | 'RESOLVED' | 'CANCELLED'

export interface EmergencyAlert {
  id: string
  source: AlertSource
  status: AlertStatus
  patientId?: string
  patientFullName?: string
  patientEmail?: string
  patientCity?: string
  patientProvince?: string
  patientPregnancyWeek?: number
  triggerMessage?: string
  claimedByEmail?: string
  matchedDoctorsCount?: number
  createdAt: string
  claimedAt?: string
}

export interface EmergencyAlertRequest {
  source: AlertSource
  triggerMessage?: string
}

// PATIENT: create alert
export const createAlert = (source: AlertSource, triggerMessage?: string) =>
  apiClient.post<EmergencyAlert>('/emergency', { source, triggerMessage }).then((r) => r.data)

// DOCTOR: get pending alerts in their area
export const getPendingAlerts = () =>
  apiClient.get<EmergencyAlert[]>('/emergency/pending').then((r) => r.data)

// DOCTOR: claim a pending alert
export const claimAlert = (id: string) =>
  apiClient.put<EmergencyAlert>(`/emergency/${id}/claim`).then((r) => r.data)

// PATIENT: cancel their own alert
export const cancelAlert = (id: string) =>
  apiClient.put<EmergencyAlert>(`/emergency/${id}/cancel`).then((r) => r.data)

// DOCTOR: resolve a claimed alert
export const resolveAlert = (id: string) =>
  apiClient.put<EmergencyAlert>(`/emergency/${id}/resolve`).then((r) => r.data)
