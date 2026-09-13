import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatientAppointments, confirmAppointment, rejectAppointment, cancelAppointment } from '../../api/appointments'
import type { AppointmentStatus, Appointment } from '../../api/appointments'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROPOSED: 'Proposition reçue', CONFIRMED: 'Confirmé', REJECTED: 'Refusé',
  COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROPOSED: 'bg-amber-light text-amber', CONFIRMED: 'bg-sage-light text-sage',
  REJECTED: 'bg-[#FDEAEA] text-[#D94F4F]', COMPLETED: 'bg-sand text-ink-mid',
  CANCELLED: 'bg-sand text-ink-light',
}
const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation médicale', SUIVI: 'Suivi de grossesse', URGENCE: 'Urgence / Inquiétude',
}

function formatSlot(dateTime: string) {
  const d = new Date(dateTime)
  return d.toLocaleDateString('fr-MA', { dateStyle: 'long' }) + ' · ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
}

function AppointmentCard({ appt, onConfirm, onReject, onCancel }: {
  appt: Appointment
  onConfirm: (id: string, slotId: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
}) {
  const [selectedSlot, setSelectedSlot] = useState(appt.slots[0]?.id ?? '')
  const displaySlot = appt.confirmedSlot ?? appt.slots.find((s) => s.id === selectedSlot) ?? appt.slots[0]
  const isTerminal = appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'REJECTED'

  return (
    <div className="bg-white rounded-xl border border-sand-mid p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink">{TYPE_LABELS[appt.type] ?? appt.type}</p>
          <p className="text-xs text-ink-mid mt-0.5">
            {displaySlot ? formatSlot(displaySlot.dateTime) : '—'}
            {appt.location && ` · ${appt.location}`}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[appt.status]}`}>
          {STATUS_LABELS[appt.status]}
        </span>
      </div>

      {/* Doctor info */}
      {(appt.doctorName || appt.doctorFullName) && (
        <div className="flex items-start gap-2 bg-mauve-light rounded-lg px-3 py-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-mauve flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink">Dr. {appt.doctorFullName ?? appt.doctorName}</p>
            {appt.doctorEmail && (
              <a href={`mailto:${appt.doctorEmail}`} className="text-[10px] text-mauve hover:underline block truncate">
                {appt.doctorEmail}
              </a>
            )}
            {appt.doctorPhone && (
              <a href={`tel:${appt.doctorPhone}`} className="text-[10px] text-ink-mid hover:underline block">
                {appt.doctorPhone}
              </a>
            )}
            {!appt.doctorEmail && !appt.doctorPhone && (
              <p className="text-[10px] text-ink-light">Médecin traitant</p>
            )}
          </div>
        </div>
      )}

      {appt.notes && (
        <p className="text-xs text-ink-mid italic bg-sand rounded-lg px-3 py-2 mb-3">"{appt.notes}"</p>
      )}

      {appt.status === 'PROPOSED' && (
        <div className="space-y-2 mt-3">
          {appt.slots.length > 1 && (
            <div>
              <label className="block text-xs text-ink-mid mb-1">Choisir un créneau</label>
              <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-sand-mid text-xs text-ink bg-white">
                {appt.slots.map((s) => (
                  <option key={s.id} value={s.id}>{formatSlot(s.dateTime)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => onConfirm(appt.id, selectedSlot)} disabled={!selectedSlot}
              className="flex-1 h-8 rounded-full bg-sage text-white text-xs font-medium hover:opacity-90 disabled:opacity-50">
              Confirmer ce créneau
            </button>
            <button onClick={() => onReject(appt.id)}
              className="flex-1 h-8 rounded-full border border-[#D94F4F] text-[#D94F4F] text-xs hover:bg-[#FDEAEA]">
              Refuser
            </button>
          </div>
        </div>
      )}

      {(appt.status === 'PROPOSED' || appt.status === 'CONFIRMED') && !isTerminal && appt.status !== 'PROPOSED' && (
        <button onClick={() => onCancel(appt.id)}
          className="mt-2 text-xs text-ink-light hover:text-rose hover:underline">
          Annuler ce rendez-vous
        </button>
      )}
      {appt.status === 'CONFIRMED' && (
        <button onClick={() => onCancel(appt.id)}
          className="mt-2 text-xs text-ink-light hover:text-rose hover:underline block">
          Annuler ce rendez-vous
        </button>
      )}
    </div>
  )
}

export default function PatientAppointments() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL')

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ['patientAppts'],
    queryFn: getPatientAppointments,
  })

  const mutOpts = { onSuccess: () => qc.invalidateQueries({ queryKey: ['patientAppts'] }) }
  const { mutate: confirm } = useMutation({
    mutationFn: ({ id, slotId }: { id: string; slotId: string }) => confirmAppointment(id, slotId),
    ...mutOpts,
  })
  const { mutate: reject } = useMutation({ mutationFn: rejectAppointment, ...mutOpts })
  const { mutate: cancel } = useMutation({ mutationFn: cancelAppointment, ...mutOpts })

  const filtered = filter === 'ALL' ? appts : appts.filter((a) => a.status === filter)
  const proposed = appts.filter((a) => a.status === 'PROPOSED').length

  const filters: { id: AppointmentStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tous' },
    { id: 'PROPOSED', label: `À confirmer${proposed ? ` (${proposed})` : ''}` },
    { id: 'CONFIRMED', label: 'Confirmés' },
    { id: 'COMPLETED', label: 'Terminés' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <h2 className="font-serif text-2xl text-ink mb-1">Rendez-vous</h2>
      <p className="text-xs text-ink-light mb-4">{appts.length} rendez-vous</p>

      {proposed > 0 && (
        <div className="mb-5 rounded-xl border border-amber bg-amber-light px-4 py-3 flex items-center gap-3">
          <span className="text-lg">📅</span>
          <p className="text-xs text-amber font-medium">
            {proposed} proposition{proposed > 1 ? 's' : ''} de rendez-vous en attente de votre confirmation
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={['px-4 py-1.5 rounded-full text-xs border transition-colors',
              filter === f.id ? 'bg-rose text-white border-rose' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <AppointmentCard key={a.id} appt={a}
              onConfirm={(id, slotId) => confirm({ id, slotId })}
              onReject={reject}
              onCancel={cancel} />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-ink-light bg-white rounded-xl border border-sand-mid px-4 py-10 text-center">
              {filter === 'PROPOSED'
                ? 'Aucune proposition en attente'
                : 'Aucun rendez-vous dans cette catégorie'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
