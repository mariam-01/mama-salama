import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { UILanguageProvider } from './context/UILanguageContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import DoctorLayout from './components/DoctorLayout'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import OtpPage from './pages/OtpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import CompleteRegistrationPage from './pages/CompleteRegistrationPage'
import ProfilePage from './pages/ProfilePage'
import CheckupPage from './pages/CheckupPage'
import ChatPage from './pages/ChatPage'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientAppointments from './pages/patient/PatientAppointments'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPatients from './pages/admin/AdminPatients'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminKnowledgeBase from './pages/admin/AdminKnowledgeBase'
import AdminAlerts from './pages/admin/AdminAlerts'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorPatients from './pages/doctor/DoctorPatients'
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <UILanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/otp" element={<OtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/complete-registration" element={<CompleteRegistrationPage />} />

              {/* Patient routes */}
              <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                <Route element={<Layout />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/checkup" element={<CheckupPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/dashboard" element={<PatientDashboard />} />
                  <Route path="/appointments" element={<PatientAppointments />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/patients" element={<AdminPatients />} />
                  <Route path="/admin/doctors" element={<AdminDoctors />} />
                  <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
                  <Route path="/admin/alerts" element={<AdminAlerts />} />
                </Route>
              </Route>

              {/* Doctor routes */}
              <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                <Route element={<DoctorLayout />}>
                  <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                  <Route path="/doctor/patients" element={<DoctorPatients />} />
                  <Route path="/doctor/patients/:id" element={<DoctorPatientDetail />} />
                  <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                  <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </UILanguageProvider>
  )
}
