import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { publicClient } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { getHomeForRole } from '../utils/auth'
import keycloak from '../keycloak'
import Logo from '../components/Logo'
import LoadingSpinner from '../components/LoadingSpinner'

export default function OtpPage() {
  const { isAuthenticated, role, email } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [resent, setResent] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      keycloak.register()
    }
  }, [isAuthenticated])

  const verifyMutation = useMutation({
    mutationFn: () => publicClient.post('/auth/verify-otp', { email, code }),
    onSuccess: () => {
      setVerified(true)
      setTimeout(() => navigate(getHomeForRole(role), { replace: true }), 1500)
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => publicClient.post('/auth/resend-otp', { email, channel: 'EMAIL' }),
    onSuccess: () => {
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length === 6) verifyMutation.mutate()
  }

  const inputCls =
    'w-full h-10 px-3 rounded-xl border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-mauve focus:border-transparent transition-shadow'

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blush flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-blush flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-sand-mid p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="font-serif text-lg text-ink">Compte vérifié !</h2>
          <p className="text-xs text-ink-light">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  const errorMsg = verifyMutation.isError
    ? ((verifyMutation.error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? 'Code invalide ou expiré.')
    : null

  return (
    <div className="min-h-screen bg-blush flex flex-col">
      <nav className="h-14 bg-white border-b border-sand-mid flex items-center px-6">
        <Logo size={28} showText />
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-sand-mid overflow-hidden shadow-sm">
            <div className="bg-mauve-light px-6 py-6 border-b border-sand-mid text-center">
              <div className="w-14 h-14 rounded-2xl bg-mauve flex items-center justify-center text-2xl text-white mx-auto mb-3">
                📧
              </div>
              <h1 className="font-serif text-xl text-ink">Vérification du compte</h1>
              <p className="text-xs text-ink-mid mt-1">
                Un code à 6 chiffres a été envoyé à{' '}
                <span className="font-medium text-ink">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1.5">
                  Code de vérification
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className={`${inputCls} tracking-[0.4em] text-center text-lg font-mono`}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">
                  {errorMsg}
                </div>
              )}

              {resent && (
                <div className="rounded-xl bg-[#EAF5EA] border border-[#4CAF50] px-4 py-3 text-xs text-[#2E7D32]">
                  Nouveau code envoyé à {email}
                </div>
              )}

              <button
                type="submit"
                disabled={verifyMutation.isPending || code.length !== 6}
                className="w-full h-10 rounded-full bg-mauve text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {verifyMutation.isPending && <LoadingSpinner size="sm" />}
                {verifyMutation.isPending ? 'Vérification...' : 'Vérifier le compte'}
              </button>

              <p className="text-center text-xs text-ink-light">
                Vous n&apos;avez pas reçu le code ?{' '}
                <button
                  type="button"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  className="text-mauve hover:underline disabled:opacity-60"
                >
                  {resendMutation.isPending ? 'Envoi...' : 'Renvoyer'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
