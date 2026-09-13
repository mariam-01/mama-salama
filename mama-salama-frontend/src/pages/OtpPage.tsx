import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { verifyOtp, resendOtp } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getRoleFromToken, getHomeForRole } from '../utils/auth'
import { useUILang } from '../context/UILanguageContext'
import LoadingSpinner from '../components/LoadingSpinner'
import LangToggle from '../components/LangToggle'

export default function OtpPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useUILang()
  const userId = localStorage.getItem('userId') ?? ''
  const otpChannel = (localStorage.getItem('otpChannel') ?? 'EMAIL') as 'EMAIL' | 'SMS'
  const isEmail = otpChannel === 'EMAIL'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(120)
  const [apiError, setApiError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null))

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const code = otp.join('')

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () => verifyOtp({ userId, code }),
    onSuccess: (res) => {
      if (res.success && res.data) {
        login(res.data.token, res.data.userId)
        navigate(getHomeForRole(getRoleFromToken(res.data.token)))
      } else {
        setApiError(res.message ?? 'Code invalide.')
      }
    },
    onError: () => setApiError('Code invalide ou expiré. Veuillez réessayer.'),
  })

  const { mutate: resend, isPending: isResending, isSuccess: resendOk } = useMutation({
    mutationFn: () => resendOtp(userId, otpChannel),
    onSuccess: () => setTimeLeft(120),
  })

  function handleChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[idx] = value.slice(-1)
    setOtp(next)
    setApiError(null)
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: { key: string }) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: { clipboardData: { getData(s: string): string }; preventDefault(): void }) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (code.length < 6) { setApiError('Veuillez saisir les 6 chiffres.'); return }
    verify()
  }

  return (
    <div className="min-h-screen bg-blush flex flex-col">
      <nav className="h-12 bg-white border-b border-sand-mid flex items-center justify-between px-8">
        <div className="font-serif text-lg text-rose">
          Mama Salama <span className="text-mauve italic">·</span>{' '}
          <span className="text-mauve">ماما سلامة</span>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <span className="text-xs text-ink-mid cursor-pointer hover:text-ink">{t('otpBack')}</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-sand-mid overflow-hidden shadow-sm bg-white">
          <div className="bg-blush px-6 py-5 text-center border-b border-rose-light">
            <h2 className="font-serif text-xl text-ink">
              {isEmail ? t('otpEmailTitle') : t('otpPhoneTitle')}
            </h2>
            <p className="text-xs text-ink-light mt-1">{t('otpSecureAccount')}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-light flex items-center justify-center text-2xl">
              {isEmail ? '✉️' : '📱'}
            </div>

            <h3 className="font-serif text-lg text-ink">{t('otpVerificationCode')}</h3>
            <p className="text-xs text-ink-mid text-center leading-relaxed max-w-[220px]">
              {isEmail ? t('otpEmailSent') : t('otpPhoneSent')}
            </p>
            {userId && (
              <p className="text-xs font-medium text-ink font-mono">
                ID: {userId.slice(0, 8)}…
              </p>
            )}

            <div className="flex gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={[
                    'w-10 h-12 rounded-xl text-center text-xl font-semibold border-2 focus:outline-none transition-colors',
                    digit
                      ? 'border-rose bg-rose-light text-rose-dark'
                      : i === otp.findIndex((d) => !d)
                        ? 'border-rose border-2'
                        : 'border-sand-mid bg-white text-ink',
                  ].join(' ')}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-rose-light text-rose-dark text-xs font-medium px-4 py-1.5 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="M12 6v6l4 2" />
              </svg>
              {t('otpExpiresIn')} {mm}:{ss}
            </div>

            {apiError && (
              <div className="w-full rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-2.5 text-xs text-[#D94F4F] text-center">
                {apiError}
              </div>
            )}
            {resendOk && (
              <div className="w-full rounded-lg bg-sage-light border border-sage px-4 py-2.5 text-xs text-sage text-center">
                {t('otpCodeSent')}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || code.length < 6}
              className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-50"
            >
              {isPending && <LoadingSpinner size="sm" />}
              {isPending ? t('otpVerifying') : t('otpVerifyButton')}
            </button>

            <p className="text-xs text-ink-mid">
              {t('otpNoCode')}{' '}
              <button
                type="button"
                onClick={() => resend()}
                disabled={isResending || timeLeft > 90}
                className="text-rose font-medium hover:underline disabled:opacity-40"
              >
                {isResending ? t('otpResending') : t('otpResend')}
              </button>
            </p>

            <div className="flex items-center gap-2 bg-sage-light rounded-lg px-4 py-2 text-xs text-sage max-w-[240px] text-center justify-center">
              🔒 {t('otpSecurityNote')}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
