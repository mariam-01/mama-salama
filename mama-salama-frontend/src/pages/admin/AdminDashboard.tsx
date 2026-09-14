import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getAdminStats } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  bg: string
  iconBg: string
  trend?: string
}

function StatCard({ icon, label, value, bg, iconBg, trend }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${bg}`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-medium text-ink-mid bg-white/60 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-serif font-bold text-ink leading-none">{value}</div>
        <div className="text-xs text-ink-mid mt-1">{label}</div>
      </div>
    </div>
  )
}

interface QuickLinkProps {
  href: string
  label: string
  desc: string
  icon: string
}

function QuickLink({ href, label, desc, icon }: QuickLinkProps) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(href)}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-sand-mid hover:border-rose hover:shadow-sm transition-all text-left group w-full">
      <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center text-xl shrink-0 group-hover:bg-rose group-hover:scale-105 transition-all">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink group-hover:text-rose transition-colors">{label}</p>
        <p className="text-[11px] text-ink-light mt-0.5 truncate">{desc}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-ink-light ml-auto shrink-0 group-hover:text-rose transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats })

  const statCards = [
    { icon: '👩', label: 'Patients enregistrés', value: stats?.patientCount ?? 0, bg: 'bg-rose-light', iconBg: 'bg-white' },
    { icon: '🩺', label: 'Médecins actifs', value: stats?.doctorCount ?? 0, bg: 'bg-mauve-light', iconBg: 'bg-white' },
    { icon: '🚨', label: 'Alertes en attente', value: stats?.pendingAlertCount ?? 0, bg: 'bg-[#FDEAEA]', iconBg: 'bg-white' },
    { icon: '📅', label: 'RDV en attente', value: stats?.proposedAppointmentCount ?? 0, bg: 'bg-amber-light', iconBg: 'bg-white' },
    { icon: '📚', label: 'Documents KB indexés', value: stats?.documentCount ?? 0, bg: 'bg-sage-light', iconBg: 'bg-white' },
  ]

  const quickLinks = [
    { href: '/admin/patients', label: 'Gérer les patients', desc: 'Activer, désactiver, assigner un médecin', icon: '👩' },
    { href: '/admin/doctors', label: 'Gérer les médecins', desc: 'Codes d\'invitation, créer des comptes', icon: '🩺' },
    { href: '/admin/knowledge-base', label: 'Base de connaissances', desc: 'Importer des documents PDF / TXT', icon: '📚' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-semibold">Tableau de bord</h1>
        <p className="text-xs text-ink-light mt-1">Vue d'ensemble de la plateforme Mama Salama</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="font-serif text-base text-ink font-semibold mb-3">Accès rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((l) => (
            <QuickLink key={l.href} {...l} />
          ))}
        </div>
      </div>

      {/* Alert if pending alerts */}
      {(stats?.pendingAlertCount ?? 0) > 0 && (
        <div className="rounded-2xl border border-[#D94F4F] bg-[#FDEAEA] px-5 py-4 flex items-center gap-4">
          <div className="text-2xl shrink-0">🚨</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#D94F4F]">
              {stats!.pendingAlertCount} alerte{stats!.pendingAlertCount > 1 ? 's' : ''} d'urgence en attente
            </p>
            <p className="text-xs text-[#D94F4F]/80 mt-0.5">
              Des médecins sont notifiés mais vous devriez vérifier l'état du système.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
