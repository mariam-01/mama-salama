import { apiClient } from './axios'

export type AppointmentStatus = 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
export type AppointmentType = 'CONSULTATION' | 'SUIVI' | 'URGENCE'

export interface AppointmentSlot {
  id: string
  dateTime: string
  selected: boolean
}

export interface Appointment {
  id: string
  patientId: string
  patientName?: string
  patientFullName?: string
  doctorId?: string
  doctorName?: string
  doctorFullName?: string
  doctorEmail?: string
  doctorPhone?: string
  alertId?: string
  slots: AppointmentSlot[]
  confirmedSlot?: AppointmentSlot
  type: AppointmentType
  location: string
  notes?: string
  status: AppointmentStatus
  createdAt: string
}

export interface ProposeAppointmentRequest {
  patientId: string
  slots: string[]
  type: AppointmentType
  location: string
  notes?: string
}

// Doctor proposes to a patient
export const proposeAppointment = (data: ProposeAppointmentRequest) =>
  apiClient.post<Appointment>('/appointments', data).then((r) => r.data)

// Unwrapped list responses
export const getDoctorAppointments = () =>
  apiClient.get<Appointment[]>('/appointments/doctor').then((r) => r.data)

export const getPatientAppointments = () =>
  apiClient.get<Appointment[]>('/appointments/patient').then((r) => r.data)

// Patient-side actions
export const confirmAppointment = (id: string, slotId: string) =>
  apiClient.put<Appointment>(`/appointments/${id}/confirm`, { slotId }).then((r) => r.data)

export const rejectAppointment = (id: string) =>
  apiClient.put<Appointment>(`/appointments/${id}/reject`).then((r) => r.data)

// Doctor-side action
export const completeAppointment = (id: string) =>
  apiClient.put<Appointment>(`/appointments/${id}/complete`).then((r) => r.data)

// Both roles
export const cancelAppointment = (id: string) =>
  apiClient.put<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data)
