import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getPendingAlerts, claimAlert, resolveAlert } from '../../api/alerts'
import { getMyPatients } from '../../api/doctor'
import { getDoctorAppointments } from '../../api/appointments'
import type { EmergencyAlert } from '../../api/alerts'
import LoadingSpinner from '../../components/LoadingSpinner'
import TriageBadge from '../../components/TriageBadge'

function TimeAgo({ date }: { date: string }) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return <span>À l'instant</span>
  if (mins < 60) return <span>{mins} min</span>
  return <span>{Math.round(mins / 60)}h</span>
}

function AlertCard({ alert, onClaim, onResolve, claiming, onViewProfile }: {
  alert: EmergencyAlert
  onClaim: (id: string, patientId?: string) => void
  onResolve: (id: string) => void
  claiming: boolean
  onViewProfile: (patientId: string) => void
}) {
  return (
    <div className={['rounded-xl border p-4',
      alert.status === 'PENDING' ? 'border-[#D94F4F] bg-[#FDEAEA]' : 'border-sand-mid bg-white'].join(' ')}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            {alert.patientId ? (
              <button onClick={() => onViewProfile(alert.patientId!)}
                className="font-medium text-sm text-rose hover:underline text-left">
                {alert.patientFullName ?? alert.patientEmail ?? '—'}
              </button>
            ) : (
              <span className="font-medium text-sm text-ink">{alert.patientFullName ?? alert.patientEmail ?? '—'}</span>
            )}
          </div>
          <p className="text-xs text-ink-mid mt-0.5">
            {[alert.patientCity, alert.patientPregnancyWeek != null ? `SA ${alert.patientPregnancyWeek}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={['text-xs px-2 py-0.5 rounded-full font-medium',
            alert.source === 'MANUAL' ? 'bg-[#D94F4F] text-white' : 'bg-amber text-white'].join(' ')}>
            {alert.source === 'MANUAL' ? '🆘 Manuel' : '🤖 Chatbot'}
          </span>
          <p className="text-xs text-ink-light mt-1"><TimeAgo date={alert.createdAt} /></p>
        </div>
      </div>
      {alert.triggerMessage && (
        <p className="text-xs text-ink-mid italic bg-white rounded-lg px-3 py-2 mb-3 border border-sand-mid">
          "{alert.triggerMessage}"
        </p>
      )}
      <div className="flex gap-2">
        {alert.status === 'PENDING' && (
          <button onClick={() => onClaim(alert.id, alert.patientId)} disabled={claiming}
            className="flex-1 h-8 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-rose-dark disabled:opacity-60">
            {claiming && <LoadingSpinner size="sm" />}
            Prendre en charge
          </button>
        )}
        {alert.status === 'CLAIMED' && (
          <button onClick={() => onResolve(alert.id)}
            className="flex-1 h-8 rounded-full border border-sage text-sage text-xs font-medium hover:bg-sage-light">
            Marquer résolu
          </button>
        )}
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimingPatientId, setClaimingPatientId] = useState<string | undefined>(undefined)

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['pendingAlerts'],
    queryFn: getPendingAlerts,
    refetchInterval: 30_000,
  })
  const { data: patientsResp } = useQuery({ queryKey: ['myPatients'], queryFn: getMyPatients })
  const patients = patientsResp?.data ?? []
  const { data: appts = [] } = useQuery({ queryKey: ['doctorAppts'], queryFn: getDoctorAppointments })

  const { mutate: claim } = useMutation({
    mutationFn: (id: string) => claimAlert(id),
    onMutate: (id) => setClaimingId(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingAlerts'] })
      setClaimingId(null)
      navigate('/doctor/appointments', { state: { patientId: claimingPatientId } })
    },
    onError: () => { setClaimingId(null); setClaimingPatientId(undefined) },
  })

  function handleClaim(id: string, patientId?: string) {
    setClaimingPatientId(patientId)
    claim(id)
  }

  const { mutate: resolve } = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingAlerts'] }),
  })
  const pendingAppts = appts.filter((a) => a.status === 'PROPOSED')

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Summary */}
      <div>
        <h2 className="font-serif text-2xl text-ink mb-1">Tableau de bord</h2>
        <p className="text-xs text-ink-light mb-4">Espace médecin · Mama Salama</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🚨', value: alerts.filter((a) => a.status === 'PENDING').length, label: 'Alertes actives', color: 'bg-[#FDEAEA]' },
            { icon: '📅', value: pendingAppts.length, label: 'RDV en attente', color: 'bg-amber-light' },
            { icon: '👩', value: patients.length, label: 'Patients assignés', color: 'bg-rose-light' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-sand-mid p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-xl font-serif font-semibold text-ink">{s.value}</div>
              <div className="text-xs text-ink-mid">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency queue */}
      <div>
        <h3 className="font-serif text-base text-ink mb-3 flex items-center gap-2">
          🚨 Urgences
          {alerts.filter((a) => a.status === 'PENDING').length > 0 && (
            <span className="text-xs bg-[#D94F4F] text-white px-2 py-0.5 rounded-full">
              {alerts.filter((a) => a.status === 'PENDING').length}
            </span>
          )}
        </h3>
        {alertsLoading ? <LoadingSpinner /> : alerts.length === 0 ? (
          <p className="text-xs text-ink-light bg-white rounded-xl border border-sand-mid px-4 py-6 text-center">
            Aucune alerte dans votre zone
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a}
                onClaim={handleClaim}
                onResolve={(id) => resolve(id)}
                claiming={claimingId === a.id}
                onViewProfile={(pid) => navigate(`/doctor/patients/${pid}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base text-ink">Mes Patients récents</h3>
          <button onClick={() => navigate('/doctor/patients')} className="text-xs text-rose hover:underline">Voir tous →</button>
        </div>
        <div className="space-y-2">
          {patients.slice(0, 4).map((p) => (
            <button key={p.id} onClick={() => navigate(`/doctor/patients/${p.id}`)}
              className="w-full bg-white rounded-xl border border-sand-mid px-4 py-3 flex items-center justify-between hover:bg-blush transition-colors text-left">
              <div>
                <p className="text-xs font-medium text-ink">{p.fullName}</p>
                <p className="text-xs text-ink-mid">{p.pregnancyWeek ? `SA ${p.pregnancyWeek}` : '—'} · {p.city ?? '—'}</p>
              </div>
              {p.triageLevel && <TriageBadge level={p.triageLevel} />}
            </button>
          ))}
          {patients.length === 0 && (
            <p className="text-xs text-ink-light bg-white rounded-xl border border-sand-mid px-4 py-6 text-center">
              Aucun patient assigné
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
