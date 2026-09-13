import apiClient from './axios'
import type { ApiResponse, ChatRequest, ChatResponse, VoiceResponse, ChatHistoryItem, Language } from '../types'

export async function askQuestion(data: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  const response = await apiClient.post<ApiResponse<ChatResponse>>('/ai/ask', data)
  return response.data
}

export async function getChatHistory(): Promise<ApiResponse<ChatHistoryItem[]>> {
  const response = await apiClient.get<ApiResponse<ChatHistoryItem[]>>('/ai/history')
  return response.data
}

export async function askVoice(file: Blob, language?: Language): Promise<ApiResponse<VoiceResponse>> {
  const form = new FormData()
  form.append('file', file, 'recording.webm')
  const params = language ? `?language=${language}` : ''
  const response = await apiClient.post<ApiResponse<VoiceResponse>>(`/ai/voice-ask${params}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
