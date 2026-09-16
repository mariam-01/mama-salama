import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { completeInvite } from '../api/auth'
import keycloak from '../keycloak'
import Logo from '../components/Logo'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CompleteRegistrationPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { mutate, isPending, data: apiResult, error } = useMutation({
    mutationFn: () => completeInvite({ token, password, phone: phone || undefined }),
    onSuccess: (res) => {
      if (res.success) {
        setDone(true)
        // Short delay then redirect to Keycloak login
        setTimeout(() => keycloak.login({ redirectUri: window.location.origin + '/doctor/dashboard' }), 2000)
      }
    },
  })

  const apiError = (!isPending && apiResult && !apiResult.success ? apiResult.message : null)
    ?? (error ? 'Lien invalide ou expiré. Veuillez demander un nouvel accès.' : null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    if (password.length < 8) { setValidationError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== confirm) { setValidationError('Les mots de passe ne correspondent pas.'); return }
    if (!token) { setValidationError("Lien d'invitation manquant ou invalide."); return }
    mutate()
  }

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-mauve focus:border-transparent transition-shadow'

  if (!token) {
    return (
      <div className="min-h-screen bg-blush flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-sand-mid p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <h2 className="font-serif text-lg text-ink">Lien invalide</h2>
          <p className="text-xs text-ink-light">Ce lien est manquant ou malformé. Contactez l'administrateur.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-blush flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-sand-mid p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="font-serif text-lg text-ink">Compte créé avec succès!</h2>
          <p className="text-xs text-ink-light">Redirection vers la page de connexion...</p>
        </div>
      </div>
    )
  }

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
                🩺
              </div>
              <h1 className="font-serif text-xl text-ink">Finaliser votre inscription</h1>
              <p className="text-xs text-ink-mid mt-1">Créez votre mot de passe pour accéder à votre espace médecin</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1.5">Mot de passe <span className="text-rose">*</span></label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className={`${inputCls} pr-10`}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-ink-light hover:text-ink">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPwd
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1.5">Confirmer le mot de passe <span className="text-rose">*</span></label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1.5">
                  Téléphone <span className="text-ink-light font-normal">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6XX XXX XXX"
                  className={inputCls}
                />
              </div>

              {(validationError ?? apiError) && (
                <div className="rounded-xl bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">
                  {validationError ?? apiError}
                </div>
              )}

              <button type="submit" disabled={isPending}
                className="w-full h-10 rounded-full bg-mauve text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                {isPending && <LoadingSpinner size="sm" />}
                {isPending ? 'Création du compte…' : 'Créer mon compte'}
              </button>

              <p className="text-center text-xs text-ink-light">
                Ce lien expire 48h après son envoi par l'administrateur.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
