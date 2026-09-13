export type OtpChannel = 'SMS' | 'EMAIL'
export type Language = 'FRENCH' | 'ARABIC' | 'DARIJA' | 'AMAZIGH'
export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'
export type TriageLevel = 'GREEN' | 'YELLOW' | 'RED'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  timestamp?: string
}

export interface RegisterRequest {
  email: string
  password: string
  phone?: string
  otpChannel: OtpChannel
}

export interface RegisterResponse {
  userId: string
  message: string
}

export interface OtpRequest {
  userId: string
  code: string
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  role: string
}

export interface LoginRequest {
  email: string
  password: string
}

export type FollowUpType = 'GYNECOLOGIST' | 'MIDWIFE' | 'GENERAL_PRACTITIONER' | 'NONE'
export type Supplement =
  | 'FOLIC_ACID' | 'IRON' | 'VITAMIN_D' | 'CALCIUM' | 'IODINE'
  | 'OMEGA_3' | 'MAGNESIUM' | 'VITAMIN_B12' | 'VITAMIN_C' | 'ZINC'

export interface PatientProfile {
  id: string
  fullName: string
  age: number
  language?: Language
  region?: string
  milieu?: string
  city?: string
  prefecture?: string
  pregnancyWeek?: number
  pregnancyWeekCalculated?: number
  lastMenstrualPeriod?: string
  dueDate?: string
  dueDateFromWeek?: string
  bloodType?: BloodType
  weight?: number
  height?: number
  numberOfPreviousPregnancies?: number
  numberOfChildren?: number
  followUpType?: FollowUpType
  supplements?: Supplement[]
  multiplePregnancy?: boolean
  medicalHistory?: string
  allergies?: string
  createdAt: string
  updatedAt: string
}

export interface ProfileRequest {
  fullName: string
  age: number
  language?: Language
  region?: string
  milieu?: string
  prefecture?: string
  city?: string
  pregnancyWeek?: number
  lastMenstrualPeriod?: string
  bloodType?: BloodType
  weight?: number
  height?: number
  numberOfPreviousPregnancies?: number
  numberOfChildren?: number
  followUpType?: FollowUpType
  supplements?: Supplement[]
  multiplePregnancy?: boolean
  medicalHistory?: string
  allergies?: string
}

export interface CheckupRequest {
  systolicBP?: number
  diastolicBP?: number
  bloodSugar?: number
  temperature?: number
  heartRate?: number
  symptoms?: string
  notes?: string
}

export interface CheckupResponse {
  id: string
  systolicBP?: number
  diastolicBP?: number
  bloodSugar?: number
  temperature?: number
  heartRate?: number
  symptoms?: string
  notes?: string
  triageLevel: TriageLevel
  riskLevel: RiskLevel
  createdAt: string
}

export interface ChatRequest {
  question: string
  language?: Language
}

export interface ChatResponse {
  answer: string
  source: string
}

export interface VoiceResponse {
  answer: string
  transcribedText?: string
  transcription?: string   // alternative field name some backends use
  question?: string        // some backends echo the transcription as 'question'
  source?: string
}

export interface ChatHistoryItem {
  id: string
  question: string
  answer: string
  source?: string
  createdAt: string
}
