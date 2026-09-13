import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerUser } from '../api/auth'
import type { RegisterRequest } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import Logo from '../components/Logo'
import LangToggle from '../components/LangToggle'
import { useUILang } from '../context/UILanguageContext'

const schema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  phone: z.string().optional(),
  otpChannel: z.enum(['SMS', 'EMAIL']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useUILang()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { otpChannel: 'EMAIL' },
  })

  const { mutate, isPending, data: apiResult, error } = useMutation({
    mutationFn: ({ confirmPassword: _, ...payload }: FormData) => registerUser(payload as RegisterRequest),
    onSuccess: (res, { otpChannel }) => {
      if (res.success && res.data) {
        localStorage.setItem('userId', res.data.userId)
        localStorage.setItem('otpChannel', otpChannel)
        navigate('/otp')
      }
    },
  })

  const apiError = !isPending && apiResult && !apiResult.success ? apiResult.message : null

  return (
    <div className="min-h-screen bg-blush flex flex-col">
      <nav className="h-12 bg-white border-b border-sand-mid flex items-center justify-between px-8">
        <Logo size={28} showText={true} />
        <div className="flex items-center gap-4 text-xs text-ink-mid">
          <span>{t('home')}</span>
          <span>{t('about')}</span>
          <LangToggle />
          <Link
            to="/login"
            className="h-7 px-4 rounded-full bg-rose text-white flex items-center text-xs font-medium hover:bg-rose-dark transition-colors"
          >
            {t('registerLoginLink')}
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 md:gap-10 items-center">
          {/* Left: hero */}
          <div>
            <p className="text-xs font-medium tracking-widest text-rose uppercase mb-3">
              {t('registerHeroLabel')}
            </p>
            <h1 className="font-serif text-3xl leading-tight text-ink mb-3">
              {t('registerHeroTitle').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}{i === 0 && <em className="text-rose"> </em>}</span>
              ))}
            </h1>
            <p className="text-sm text-ink-mid leading-relaxed mb-6">
              {t('registerHeroDesc')}
            </p>
            <div className="flex gap-5">
              {[
                { icon: '🔒', label: t('registerSecureData') },
                { icon: '🌐', label: 'FR · AR' },
                { icon: '🌐', label: t('registerWebApp') },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-ink-light">
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form card */}
          <div className="rounded-2xl border border-sand-mid overflow-hidden shadow-sm bg-white">
            <div className="bg-blush px-6 py-5 border-b border-rose-light">
              <h2 className="font-serif text-xl text-ink">{t('registerCardTitle')}</h2>
              <p className="text-xs text-ink-light mt-1">{t('registerCardSubtitle')}</p>
            </div>

            <form
              onSubmit={handleSubmit((d) => mutate(d))}
              className="px-6 py-5 space-y-4"
              noValidate
            >
              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">
                  {t('registerEmail')}
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder={t('registerEmailPlaceholder')}
                  className={inputClass}
                />
                {errors.email && (
                  <p className="text-rose text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">
                  {t('registerPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder={t('registerPasswordPlaceholder')}
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-ink-light hover:text-ink transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">
                  {t('registerConfirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder={t('registerConfirmPlaceholder')}
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-ink-light hover:text-ink transition-colors"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1">
                  {t('registerPhone')}{' '}
                  <span className="font-normal text-ink-light">{t('registerPhoneOptional')}</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="+212 6XX XXX XXX"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-2">
                  {t('registerReceiveCode')}
                </label>
                <div className="flex gap-3">
                  {(['EMAIL', 'SMS'] as const).map((ch) => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer text-xs text-ink-mid">
                      <input
                        type="radio"
                        value={ch}
                        {...register('otpChannel')}
                        className="accent-rose"
                      />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>

              {(apiError ?? error) && (
                <div className="rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">
                  {apiError ?? "Une erreur s'est produite. Veuillez réessayer."}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60"
              >
                {isPending && <LoadingSpinner size="sm" />}
                {isPending ? t('registerLoading') : t('registerButton')}
              </button>

              <p className="text-center text-xs text-ink-mid">
                {t('registerAlreadyAccount')}{' '}
                <Link to="/login" className="text-rose font-medium hover:underline">
                  {t('registerLoginLink')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
