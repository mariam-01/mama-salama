import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUILang } from '../context/UILanguageContext'
import Logo from './Logo'
import LangToggle from './LangToggle'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'text-xs font-medium transition-colors',
    isActive ? 'text-rose' : 'text-ink-mid hover:text-ink',
  ].join(' ')
}

function bottomTabClass({ isActive }: { isActive: boolean }) {
  return [
    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
    isActive ? 'text-rose' : 'text-ink-light',
  ].join(' ')
}

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useUILang()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex flex-col bg-sand overflow-hidden">
      {/* Top navbar */}
      <nav className="h-12 bg-white border-b border-sand-mid flex items-center justify-between px-4 sm:px-8 shrink-0 z-50">
        <Logo size={28} showText={true} />

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <NavLink to="/profile" className={navLinkClass}>{t('navProfile')}</NavLink>
          <NavLink to="/checkup" className={navLinkClass}>{t('navCheckup')}</NavLink>
          <NavLink to="/appointments" className={navLinkClass}>{t('navAppointments')}</NavLink>
          <NavLink to="/chat" className={navLinkClass}>{t('navAssistant')}</NavLink>

          <LangToggle />

          <button className="text-ink-light hover:text-ink transition-colors" aria-label="Notifications">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <button
            onClick={handleLogout}
            title={t('navLogout')}
            className="w-7 h-7 rounded-full bg-rose-light flex items-center justify-center text-xs font-medium text-rose hover:bg-rose hover:text-white transition-colors"
          >
            M
          </button>
        </div>

        {/* Mobile: lang toggle + bell + logout */}
        <div className="flex sm:hidden items-center gap-2">
          <LangToggle />
          <button className="text-ink-light" aria-label="Notifications">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            title={t('navLogout')}
            className="w-7 h-7 rounded-full bg-rose-light flex items-center justify-center text-xs font-medium text-rose hover:bg-rose hover:text-white transition-colors"
          >
            M
          </button>
        </div>
      </nav>

      {/* Page content — bottom padding on mobile for tab bar */}
      <main className="flex-1 overflow-hidden flex flex-col pb-16 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sand-mid flex z-50 safe-area-pb">
        <NavLink to="/profile" className={bottomTabClass}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t('navProfile')}
        </NavLink>
        <NavLink to="/checkup" className={bottomTabClass}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {t('navCheckup')}
        </NavLink>
        <NavLink to="/appointments" className={bottomTabClass}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t('navAppointments')}
        </NavLink>
        <NavLink to="/chat" className={bottomTabClass}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {t('navAssistant')}
        </NavLink>
      </nav>
    </div>
  )
}
