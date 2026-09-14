import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const navItems = [
  { to: '/doctor/dashboard', label: 'Tableau de bord', icon: '🏠' },
  { to: '/doctor/patients', label: 'Mes Patients', icon: '👩' },
  { to: '/doctor/appointments', label: 'Rendez-vous', icon: '📅' },
  { to: '/doctor/profile', label: 'Mon profil', icon: '👤' },
]

export default function DoctorLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-blush overflow-hidden">
      <aside className="w-56 bg-white border-r border-sand-mid flex flex-col shrink-0">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sand-mid">
          <Logo size={26} showText />
        </div>
        <div className="px-3 py-2">
          <span className="text-xs font-medium text-mauve bg-mauve-light px-2 py-0.5 rounded-full">Médecin</span>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => [
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                isActive ? 'bg-rose-light text-rose-dark font-medium' : 'text-ink-mid hover:bg-sand',
              ].join(' ')}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-sand-mid">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-ink-mid hover:bg-sand transition-colors">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-sand-mid flex items-center px-6 shrink-0">
          <p className="text-xs text-ink-light">Espace médecin · Mama Salama</p>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
