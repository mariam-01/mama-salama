import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const navItems = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: '📊' },
  { to: '/admin/patients', label: 'Patients', icon: '👩' },
  { to: '/admin/doctors', label: 'Médecins', icon: '🩺' },
  { to: '/admin/alerts', label: 'Alertes d\'urgence', icon: '🚨' },
  { to: '/admin/knowledge-base', label: 'Base de connaissances', icon: '📚' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'flex flex-col h-full' : 'flex flex-col h-full'}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sand-mid shrink-0">
        <Logo size={28} showText />
      </div>

      {/* Admin badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-rose-light rounded-xl px-3 py-2">
          <div className="w-7 h-7 rounded-lg bg-rose flex items-center justify-center text-white text-xs font-bold">A</div>
          <div>
            <p className="text-xs font-semibold text-rose-dark leading-none">Administrateur</p>
            <p className="text-[10px] text-rose mt-0.5">Accès complet</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-ink-light uppercase tracking-widest px-2 mb-2">Navigation</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150',
              isActive
                ? 'bg-rose text-white font-semibold shadow-sm'
                : 'text-ink-mid hover:bg-sand hover:text-ink',
            ].join(' ')}>
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sand-mid space-y-1 shrink-0">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-ink-mid hover:bg-[#FDEAEA] hover:text-[#D94F4F] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#F7F3F0] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <aside className={[
        'fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-sand-mid flex flex-col shrink-0 transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}>
        <Sidebar />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-sand-mid flex items-center px-4 sm:px-6 gap-3 shrink-0">
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand text-ink-mid transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <p className="text-xs font-medium text-ink">Interface d'administration</p>
            <p className="text-[10px] text-ink-light hidden sm:block">Mama Salama · Gestion centralisée</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
