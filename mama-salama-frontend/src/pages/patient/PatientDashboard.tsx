import { useNavigate } from 'react-router-dom'

export default function PatientDashboard() {
  const navigate = useNavigate()

  const shortcuts = [
    { path: '/checkup', label: 'Bilan de santé', icon: '🩺', desc: 'Enregistrez vos mesures du jour' },
    { path: '/chat', label: 'Assistant IA', icon: '💬', desc: 'Posez vos questions prénatales' },
    { path: '/appointments', label: 'Rendez-vous', icon: '📅', desc: 'Gérez vos RDV médicaux' },
    { path: '/profile', label: 'Mon profil', icon: '👩', desc: 'Mettez à jour votre profil' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <h2 className="font-serif text-2xl text-ink mb-1">Bonjour 👋</h2>
      <p className="text-xs text-ink-light mb-8">Votre espace santé prénatale · Mama Salama</p>

      <div className="grid grid-cols-2 gap-4">
        {shortcuts.map((s) => (
          <button key={s.path} onClick={() => navigate(s.path)}
            className="bg-white rounded-2xl border border-sand-mid p-5 text-left hover:bg-blush transition-colors group">
            <span className="text-3xl">{s.icon}</span>
            <p className="font-serif text-sm text-ink mt-3 group-hover:text-rose transition-colors">{s.label}</p>
            <p className="text-xs text-ink-light mt-1 leading-snug">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
