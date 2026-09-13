import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useUILang } from '../context/UILanguageContext'
import Logo from '../components/Logo'
import LangToggle from '../components/LangToggle'
import LoadingSpinner from '../components/LoadingSpinner'
import type { OtpChannel } from '../types'

const step1Schema = z.object({
  email: z.email('Adresse email invalide'),
})
type Step1Data = z.infer<typeof step1Schema>

const step2Schema = z
  .object({
    newPassword: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Requis'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
type Step2Data = z.infer<typeof step2Schema>

const inputClass =
  'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent transition-shadow'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useUILang()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [channel, setChannel] = useState<OtpChannel>('EMAIL')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(600)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null))

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [step, timeLeft])

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const otpCode = otp.join('')

  const { register: reg1, handleSubmit: submit1, formState: { errors: err1 } } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const { register: reg2, handleSubmit: submit2, formState: { errors: err2 } } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const { mutate: sendOtp, isPending: isSending } = useMutation({
    mutationFn: (data: Step1Data) => forgotPassword({ email: data.email, otpChannel: channel }),
    onSuccess: (res, vars) => {
      if (res.success && res.data?.userId) {
        setEmail(vars.email); setUserId(res.data.userId); setApiError(null); setStep(2)
      } else {
        setApiError(res.message ?? 'Une erreur est survenue.')
      }
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setApiError(msg ?? 'Aucun compte trouvé avec cet email.')
    },
  })

  const { mutate: doReset, isPending: isResetting } = useMutation({
    mutationFn: (data: Step2Data) =>
      resetPassword({ userId, code: otpCode, newPassword: data.newPassword, confirmPassword: data.confirmPassword }),
    onSuccess: (res) => {
      if (res.success && res.data) {
        login(res.data.token, res.data.userId); navigate('/profile')
      } else {
        setApiError(res.message ?? 'Une erreur est survenue.')
      }
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setApiError(msg ?? 'Code invalide ou expiré.')
    },
  })

  function handleOtpChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]; next[idx] = value.slice(-1); setOtp(next); setApiError(null)
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  function handleOtpKeyDown(idx: number, e: { key: string }) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  function handleOtpPaste(e: { clipboardData: { getData(s: string): string }; preventDefault(): void }) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]; text.split('').forEach((ch, i) => { next[i] = ch }); setOtp(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  function onStep2Submit(data: Step2Data) {
    if (otpCode.length < 6) { setApiError('Veuillez saisir les 6 chiffres du code.'); return }
    setApiError(null); doReset(data)
  }

  return (
    <div className="min-h-screen bg-blush flex flex-col">
      <nav className="h-12 bg-white border-b border-sand-mid flex items-center justify-between px-8">
        <Logo size={28} showText={true} />
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link to="/login" className="text-xs text-ink-mid hover:text-ink flex items-center gap-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('forgotBackToLogin')}
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-sand-mid overflow-hidden shadow-sm bg-white">

          {/* Progress indicator */}
          <div className="bg-blush px-6 py-5 border-b border-rose-light">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${step >= 1 ? 'bg-rose text-white' : 'bg-sand-mid text-ink-light'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div className={`flex-1 h-0.5 rounded ${step > 1 ? 'bg-rose' : 'bg-sand-mid'}`} />
              <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${step === 2 ? 'bg-rose text-white' : 'bg-sand-mid text-ink-light'}`}>
                2
              </div>
            </div>
            <h2 className="font-serif text-lg text-ink text-center">
              {step === 1 ? t('forgotStep1Title') : t('forgotStep2Title')}
            </h2>
            <p className="text-xs text-ink-light text-center mt-0.5">
              {step === 1 ? t('forgotStep1Subtitle') : `${t('forgotStep2Subtitle')} ${email}`}
            </p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={submit1((d) => sendOtp(d))} className="px-6 py-6 space-y-4" noValidate>
              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">{t('forgotEmailLabel')}</label>
                <input type="email" {...reg1('email')} placeholder="votre@email.com" className={inputClass} autoFocus />
                {err1.email && <p className="text-rose text-xs mt-1">{err1.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-2">{t('forgotReceiveCode')}</label>
                <div className="flex gap-2">
                  {([{ value: 'EMAIL' as OtpChannel, label: '✉️ Email' }, { value: 'SMS' as OtpChannel, label: '📱 SMS' }]).map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setChannel(opt.value)}
                      className={['flex-1 h-9 rounded-lg border text-xs font-medium transition-colors',
                        channel === opt.value ? 'bg-rose-light border-rose-mid text-rose-dark' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {apiError && (
                <div className="rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">{apiError}</div>
              )}

              <button type="submit" disabled={isSending}
                className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60">
                {isSending && <LoadingSpinner size="sm" />}
                {isSending ? t('forgotSending') : t('forgotSendCode')}
              </button>

              <p className="text-center text-xs text-ink-mid">
                {t('forgotRemember')}{' '}
                <Link to="/login" className="text-rose font-medium hover:underline">{t('forgotLoginLink')}</Link>
              </p>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={submit2(onStep2Submit)} className="px-6 py-6 space-y-4" noValidate>
              <div>
                <label className="block text-xs font-medium text-ink-mid mb-2 text-center">{t('forgotOtpLabel')}</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={(el) => { inputRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={['w-10 h-12 rounded-xl text-center text-xl font-semibold border-2 focus:outline-none transition-colors',
                        digit ? 'border-rose bg-rose-light text-rose-dark'
                          : i === otp.findIndex((d) => !d) ? 'border-rose' : 'border-sand-mid bg-white text-ink'].join(' ')} />
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${timeLeft > 0 ? 'bg-rose-light text-rose-dark' : 'bg-[#FDEAEA] text-[#D94F4F]'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                      <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    {timeLeft > 0 ? `${t('otpExpiresIn')} ${mm}:${ss}` : t('forgotExpired')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">{t('forgotNewPassword')}</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} {...reg2('newPassword')}
                    placeholder={t('forgotPasswordPlaceholder')} className={`${inputClass} pr-9`} />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-ink-light hover:text-ink transition-colors">
                    <EyeIcon open={showNew} />
                  </button>
                </div>
                {err2.newPassword && <p className="text-rose text-xs mt-1">{err2.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">{t('forgotConfirmPassword')}</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} {...reg2('confirmPassword')}
                    placeholder="••••••••••" className={`${inputClass} pr-9`} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-ink-light hover:text-ink transition-colors">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {err2.confirmPassword && <p className="text-rose text-xs mt-1">{err2.confirmPassword.message}</p>}
              </div>

              {apiError && (
                <div className="rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">{apiError}</div>
              )}

              <button type="submit" disabled={isResetting || otpCode.length < 6 || timeLeft === 0}
                className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60">
                {isResetting && <LoadingSpinner size="sm" />}
                {isResetting ? t('forgotResetting') : t('forgotResetButton')}
              </button>

              <button type="button"
                onClick={() => { setStep(1); setOtp(Array(6).fill('')); setApiError(null); setTimeLeft(600) }}
                className="w-full text-center text-xs text-ink-light hover:text-ink transition-colors">
                {t('forgotBackStep')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
