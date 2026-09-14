import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Logo, { LogoMark } from '../components/Logo'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useUILang } from '../context/UILanguageContext'
import { getRoleFromToken, getHomeForRole } from '../utils/auth'
import type { LoginRequest } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import LangToggle from '../components/LangToggle'

const schema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

const inputClass =
  'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent transition-shadow'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useUILang()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, data: apiResult, error } = useMutation({
    mutationFn: (payload: LoginRequest) => loginUser(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        login(res.data.token, res.data.userId)
        navigate(getHomeForRole(getRoleFromToken(res.data.token)))
      }
    },
  })

  const apiError =
    (!isPending && apiResult && !apiResult.success ? apiResult.message : null) ??
    (error ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('loginError')) : null)

  return (
    <div className="min-h-screen bg-blush flex flex-col">
      <nav className="h-12 bg-white border-b border-sand-mid flex items-center justify-between px-8">
        <Logo size={28} showText={true} />
        <div className="flex items-center gap-4 text-xs text-ink-mid">
          <span>{t('home')}</span>
          <span>{t('about')}</span>
          <LangToggle />
          <Link
            to="/register"
            className="h-7 px-4 rounded-full bg-rose text-white flex items-center text-xs font-medium hover:bg-rose-dark transition-colors"
          >
            {t('loginRegisterButton')}
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-sand-mid overflow-hidden shadow-sm bg-white">
          <div className="bg-blush px-6 py-6 text-center border-b border-rose-light flex flex-col items-center gap-3">
            <LogoMark size={64} variant="light" />
            <div>
              <div className="font-serif text-base text-ink">{t('loginWelcome')}</div>
              <div className="text-xs text-ink-light mt-0.5">{t('loginSubtitle')}</div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit((d) => mutate(d))}
            className="px-6 py-5 space-y-4"
            noValidate
          >
            <div>
              <label className="block text-xs font-medium text-ink-mid mb-1">
                {t('loginEmail')}
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder={t('loginEmailPlaceholder')}
                className={inputClass}
              />
              {errors.email && (
                <p className="text-rose text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-mid mb-1">
                {t('loginPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••"
                  className={`${inputClass} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-ink-light hover:text-ink transition-colors"
                  aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose text-xs mt-1">{errors.password.message}</p>
              )}
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-xs text-rose hover:underline">
                  {t('loginForgotPassword')}
                </Link>
              </div>
            </div>

            {apiError && (
              <div className="rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60"
            >
              {isPending && <LoadingSpinner size="sm" />}
              {isPending ? t('loginLoading') : t('loginButton')}
            </button>

            <p className="text-center text-xs text-ink-mid">
              {t('loginNoAccount')}{' '}
              <Link to="/register" className="text-rose font-medium hover:underline">
                {t('loginCreateAccount')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
