import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getDoctorAppointments, proposeAppointment, completeAppointment, cancelAppointment } from '../../api/appointments'
import type { Appointment, AppointmentStatus } from '../../api/appointments'
import { getMyPatients } from '../../api/doctor'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROPOSED: 'En attente patient', CONFIRMED: 'Confirmé', REJECTED: 'Refusé',
  COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROPOSED: 'bg-amber-light text-amber', CONFIRMED: 'bg-sage-light text-sage',
  REJECTED: 'bg-[#FDEAEA] text-[#D94F4F]', COMPLETED: 'bg-sand text-ink-mid',
  CANCELLED: 'bg-sand text-ink-light',
}
const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation', SUIVI: 'Suivi', URGENCE: 'Urgence',
}
const TYPE_OPTIONS = [
  { value: 'CONSULTATION', label: 'Consultation médicale' },
  { value: 'SUIVI', label: 'Suivi de grossesse' },
  { value: 'URGENCE', label: 'Urgence / Inquiétude' },
]

function formatSlot(dateTime: string) {
  const d = new Date(dateTime)
  return d.toLocaleDateString('fr-MA', { dateStyle: 'long' }) + ' · ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
}

function AppointmentCard({ appt, onComplete, onCancel }: {
  appt: Appointment
  onComplete: (id: string) => void
  onCancel: (id: string) => void
}) {
  const displaySlot = appt.confirmedSlot ?? appt.slots[0]
  const isTerminal = appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'REJECTED'

  return (
    <div className="bg-white rounded-xl border border-sand-mid p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-medium text-ink">{appt.patientFullName ?? appt.patientName ?? '—'}</p>
          <p className="text-xs text-ink-mid mt-0.5">
            {TYPE_LABELS[appt.type] ?? appt.type}
            {appt.location && ` · ${appt.location}`}
            {displaySlot && ` · ${formatSlot(displaySlot.dateTime)}`}
          </p>
          {appt.slots.length > 1 && appt.status === 'PROPOSED' && (
            <p className="text-xs text-ink-light mt-0.5">{appt.slots.length} créneaux proposés — en attente de confirmation</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[appt.status]}`}>
          {STATUS_LABELS[appt.status]}
        </span>
      </div>
      {appt.notes && (
        <p className="text-xs text-ink-mid italic bg-sand rounded-lg px-3 py-2 mb-3">"{appt.notes}"</p>
      )}
      {!isTerminal && (
        <div className="flex gap-2 mt-2">
          {appt.status === 'CONFIRMED' && (
            <button onClick={() => onComplete(appt.id)}
              className="flex-1 h-8 rounded-full bg-sage text-white text-xs font-medium hover:opacity-90">
              Marquer terminé
            </button>
          )}
          <button onClick={() => onCancel(appt.id)}
            className="flex-1 h-8 rounded-full border border-ink-mid text-ink-mid text-xs hover:bg-sand">
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}

export default function DoctorAppointments() {
  const qc = useQueryClient()
  const routerLocation = useLocation()
  const prefilledPatientId = (routerLocation.state as { patientId?: string } | null)?.patientId ?? ''

  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [patientId, setPatientId] = useState(prefilledPatientId)

  useEffect(() => {
    if (prefilledPatientId) setShowForm(true)
  }, [prefilledPatientId])
  const [type, setType] = useState('CONSULTATION')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [slotDate, setSlotDate] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [extraSlots, setExtraSlots] = useState<string[]>([])
  const [extraDate, setExtraDate] = useState('')
  const [extraTime, setExtraTime] = useState('')

  const { data: appts = [], isLoading } = useQuery({ queryKey: ['doctorAppts'], queryFn: getDoctorAppointments })
  const { data: patientsResp, isLoading: isPatientsLoading } = useQuery({ queryKey: ['myPatients'], queryFn: getMyPatients, enabled: showForm })
  const myPatients = patientsResp?.data ?? []

  const mutOpts = { onSuccess: () => qc.invalidateQueries({ queryKey: ['doctorAppts'] }) }
  const { mutate: complete } = useMutation({ mutationFn: completeAppointment, ...mutOpts })
  const { mutate: cancel } = useMutation({ mutationFn: cancelAppointment, ...mutOpts })
  const { mutate: propose, isPending: isProposing } = useMutation({
    mutationFn: () => proposeAppointment({
      patientId,
      slots: [slotDate && slotTime ? `${slotDate}T${slotTime}` : null, ...extraSlots].filter(Boolean) as string[],
      type: type as 'CONSULTATION' | 'SUIVI' | 'URGENCE',
      location,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctorAppts'] })
      setShowForm(false)
      setPatientId(''); setType('CONSULTATION'); setLocation(''); setNotes('')
      setSlotDate(''); setSlotTime(''); setExtraSlots([])
    },
  })

  function addExtraSlot() {
    if (extraDate && extraTime) {
      setExtraSlots((s) => [...s, `${extraDate}T${extraTime}`])
      setExtraDate(''); setExtraTime('')
    }
  }

  const filtered = filter === 'ALL' ? appts : appts.filter((a) => a.status === filter)
  const counts = appts.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status as AppointmentStatus] ?? 0) + 1 }), {} as Record<AppointmentStatus, number>)
  const canSubmit = patientId && slotDate && slotTime && location && !isProposing

  const filters: { id: AppointmentStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Tous' },
    { id: 'PROPOSED', label: `En attente${counts.PROPOSED ? ` (${counts.PROPOSED})` : ''}` },
    { id: 'CONFIRMED', label: 'Confirmés' },
    { id: 'COMPLETED', label: 'Terminés' },
  ]

  const inputCls = 'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink focus:ring-2 focus:ring-mauve focus:border-transparent'

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-serif text-2xl text-ink">Rendez-vous</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="h-9 px-4 rounded-full bg-mauve text-white text-xs font-medium hover:opacity-90">
          + Proposer un RDV
        </button>
      </div>
      <p className="text-xs text-ink-light mb-4">{appts.length} rendez-vous au total</p>

      {showForm && (
        <div className="bg-white rounded-2xl border border-sand-mid p-5 mb-6 space-y-4">
          <h3 className="font-serif text-base text-ink">Proposer un rendez-vous</h3>

          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1">Patient <span className="text-mauve">*</span></label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputCls} disabled={isPatientsLoading}>
              <option value="">{isPatientsLoading ? 'Chargement…' : '— Sélectionner un patient —'}</option>
              {myPatients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1">Type de consultation</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1">Lieu / Établissement <span className="text-mauve">*</span></label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="ex: CHU Ibn Rochd, Casablanca" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1">Créneau principal <span className="text-mauve">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={slotDate} min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSlotDate(e.target.value)} className={inputCls} />
              <input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          {extraSlots.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-ink-mid">Créneaux supplémentaires :</p>
              {extraSlots.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-sand rounded-lg px-3 py-1.5">
                  <span>{formatSlot(s)}</span>
                  <button onClick={() => setExtraSlots((sl) => sl.filter((_, j) => j !== i))}
                    className="text-ink-light hover:text-rose">✕</button>
                </div>
              ))}
            </div>
          )}

          {extraSlots.length < 2 && (
            <div>
              <p className="text-xs text-ink-mid mb-1">Ajouter un créneau alternatif (optionnel)</p>
              <div className="flex gap-2">
                <input type="date" value={extraDate} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExtraDate(e.target.value)} className="flex-1 h-9 px-3 rounded-lg border border-sand-mid bg-white text-xs text-ink" />
                <input type="time" value={extraTime} onChange={(e) => setExtraTime(e.target.value)}
                  className="w-28 h-9 px-3 rounded-lg border border-sand-mid bg-white text-xs text-ink" />
                <button onClick={addExtraSlot} disabled={!extraDate || !extraTime}
                  className="h-9 px-3 rounded-lg border border-sand-mid text-xs text-ink-mid hover:bg-sand disabled:opacity-40">
                  + Ajouter
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1">Notes (optionnel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Instructions ou motif…"
              className="w-full px-3 py-2 rounded-lg border border-sand-mid bg-white text-sm text-ink focus:ring-2 focus:ring-mauve focus:border-transparent resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => propose()} disabled={!canSubmit}
              className="flex-1 h-9 rounded-full bg-mauve text-white text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
              {isProposing && <LoadingSpinner size="sm" />}
              Envoyer la proposition
            </button>
            <button onClick={() => setShowForm(false)}
              className="h-9 px-4 rounded-full border border-sand-mid text-xs text-ink-mid hover:bg-sand">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={['px-4 py-1.5 rounded-full text-xs border transition-colors',
              filter === f.id ? 'bg-mauve text-white border-mauve' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <AppointmentCard key={a.id} appt={a} onComplete={complete} onCancel={cancel} />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-ink-light bg-white rounded-xl border border-sand-mid px-4 py-10 text-center">
              Aucun rendez-vous dans cette catégorie
            </p>
          )}
        </div>
      )}
    </div>
  )
}
