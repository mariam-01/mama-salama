import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminAlerts } from '../../api/admin'
import type { AlertStatus } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_LABELS: Record<AlertStatus, string> = {
  PENDING: 'En attente',
  CLAIMED: 'Prise en charge',
  RESOLVED: 'Résolue',
  CANCELLED: 'Annulée',
}

const STATUS_COLORS: Record<AlertStatus, string> = {
  PENDING: 'bg-[#FDEAEA] text-[#D94F4F]',
  CLAIMED: 'bg-amber-light text-amber',
  RESOLVED: 'bg-sage-light text-sage',
  CANCELLED: 'bg-sand text-ink-light',
}

const SOURCE_LABELS = { CHATBOT: 'Chatbot', MANUAL: 'Manuel' }

const FILTERS: { label: string; value: AlertStatus | undefined }[] = [
  { label: 'Toutes', value: undefined },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Prise en charge', value: 'CLAIMED' },
  { label: 'Résolue', value: 'RESOLVED' },
  { label: 'Annulée', value: 'CANCELLED' },
]

export default function AdminAlerts() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>(undefined)

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['adminAlerts', statusFilter],
    queryFn: () => getAdminAlerts(statusFilter),
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-semibold">Alertes d'urgence</h1>
        <p className="text-xs text-ink-light mt-1">{alerts.length} alerte(s) trouvée(s)</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className={[
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              statusFilter === f.value
                ? 'bg-rose text-white border-rose'
                : 'border-sand-mid text-ink-mid hover:border-rose hover:text-rose bg-white',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-mid px-6 py-16 text-center text-ink-light text-sm">
          Aucune alerte trouvée
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-2xl border border-sand-mid p-4 sm:p-5 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={['text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[alert.status]].join(' ')}>
                    {STATUS_LABELS[alert.status]}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-mauve-light text-ink-mid font-medium">
                    {SOURCE_LABELS[alert.source]}
                  </span>
                </div>
                <span className="text-[11px] text-ink-light">
                  {new Date(alert.createdAt).toLocaleString('fr-MA')}
                </span>
              </div>

              {/* Patient info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                <InfoRow label="Patiente" value={alert.patientFullName} />
                <InfoRow label="Email" value={alert.patientEmail} />
                <InfoRow label="Ville" value={alert.patientCity} />
                <InfoRow label="Province" value={alert.patientProvince} />
                <InfoRow label="Semaine grossesse" value={alert.patientPregnancyWeek != null ? `SA ${alert.patientPregnancyWeek}` : undefined} />
                <InfoRow label="Médecins notifiés" value={alert.matchedDoctorsCount != null ? String(alert.matchedDoctorsCount) : undefined} />
              </div>

              {/* Trigger message */}
              {alert.triggerMessage && (
                <div className="bg-[#FDEAEA] rounded-xl px-3 py-2 text-xs text-ink-mid italic">
                  « {alert.triggerMessage} »
                </div>
              )}

              {/* Claimed by */}
              {alert.claimedByEmail && (
                <p className="text-[11px] text-ink-light">
                  Prise en charge par <span className="font-medium text-ink-mid">{alert.claimedByEmail}</span>
                  {alert.claimedAt && <> · {new Date(alert.claimedAt).toLocaleString('fr-MA')}</>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-ink-light shrink-0">{label} :</span>
      <span className="text-ink font-medium">{value || '—'}</span>
    </div>
  )
}
