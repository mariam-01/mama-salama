import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminDoctors, setDoctorStatus, sendDoctorInvite, getDoctorInvites, createDoctor } from '../../api/admin'
import type { SendInviteRequest, DoctorInvite } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={['text-xs px-2 py-0.5 rounded-full font-medium',
      enabled ? 'bg-sage-light text-sage' : 'bg-sand text-ink-light'].join(' ')}>
      {enabled ? 'Actif' : 'Inactif'}
    </span>
  )
}

function InviteStatusBadge({ status }: { status: DoctorInvite['status'] }) {
  return (
    <span className={['text-xs px-2 py-0.5 rounded-full font-medium',
      status === 'ACCEPTED' ? 'bg-sage-light text-sage' : 'bg-amber-light text-amber'].join(' ')}>
      {status === 'ACCEPTED' ? 'Accepté' : 'En attente'}
    </span>
  )
}

const EMPTY_INVITE: SendInviteRequest = { email: '', firstName: '', lastName: '', city: '', prefecture: '', hospital: '' }

export default function AdminDoctors() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'list' | 'invites' | 'create'>('list')
  const [inviteForm, setInviteForm] = useState<SendInviteRequest>(EMPTY_INVITE)
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', city: '', prefecture: '', specialty: '' })
  const [inviteSent, setInviteSent] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['adminDoctors', search], queryFn: () => getAdminDoctors(search) })
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['doctorInvites'],
    queryFn: getDoctorInvites,
    enabled: tab === 'invites',
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setDoctorStatus(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminDoctors'] }),
  })

  const { mutate: sendInvite, isPending: isSending } = useMutation({
    mutationFn: () => sendDoctorInvite(inviteForm),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['doctorInvites'] })
      setInviteSent(res.data?.email ?? inviteForm.email)
      setInviteForm(EMPTY_INVITE)
    },
  })

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createDoctor(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminDoctors'] })
      setTab('list')
      setCreateForm({ fullName: '', email: '', city: '', prefecture: '', specialty: '' })
    },
  })

  const doctors = data ?? []
  const invites = invitesData ?? []

  const tabs = [
    { id: 'list', label: 'Liste des médecins' },
    { id: 'invites', label: 'Invitations envoyées' },
    { id: 'create', label: '+ Créer directement' },
  ] as const

  const inputCls = 'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink focus:ring-2 focus:ring-rose focus:border-transparent'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h2 className="font-serif text-2xl text-ink font-semibold mb-1">Médecins</h2>
      <p className="text-xs text-ink-light mb-5">{doctors.length} médecin(s) enregistré(s)</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setInviteSent(null) }}
            className={['px-4 py-1.5 rounded-full text-xs border transition-colors',
              tab === t.id ? 'bg-rose text-white border-rose' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      {tab === 'list' && (
        <>
          <div className="mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom…"
              className="h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink focus:ring-2 focus:ring-rose focus:border-transparent w-72" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-sand-mid overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-sand">
                  <tr>
                    {['Nom', 'Email', 'Ville / Province', 'Spécialité', 'Patients', 'Statut', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-ink-mid font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-mid">
                  {doctors.map((d) => (
                    <tr key={d.id} className="hover:bg-blush transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{d.fullName}</td>
                      <td className="px-4 py-3 text-ink-mid">{d.email}</td>
                      <td className="px-4 py-3 text-ink-mid">{[d.city, d.prefecture].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3 text-ink-mid">{d.specialty ?? '—'}</td>
                      <td className="px-4 py-3 text-center">{d.patientCount}</td>
                      <td className="px-4 py-3"><StatusBadge enabled={d.enabled} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus({ id: d.id, enabled: !d.enabled })}
                          className={['text-xs px-2.5 py-1 rounded-full border transition-colors',
                            d.enabled
                              ? 'border-[#D94F4F] text-[#D94F4F] hover:bg-[#FDEAEA]'
                              : 'border-sage text-sage hover:bg-sage-light'].join(' ')}>
                          {d.enabled ? 'Désactiver' : 'Réactiver'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-light">Aucun médecin trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── INVITATIONS ── */}
      {tab === 'invites' && (
        <div className="space-y-5">
          {/* Send invite form */}
          <div className="bg-white rounded-2xl border border-sand-mid p-5">
            <h3 className="font-serif text-sm text-ink mb-4">Envoyer une invitation par email</h3>

            {inviteSent && (
              <div className="mb-4 bg-sage-light border border-sage rounded-xl px-4 py-3 text-xs text-sage flex items-center gap-2">
                ✅ Invitation envoyée à <strong>{inviteSent}</strong>. Le lien expire dans 48h.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-ink-mid mb-1">Email <span className="text-rose">*</span></label>
                <input value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="medecin@exemple.ma" type="email" className={inputCls} />
              </div>
              {[
                { field: 'firstName', label: 'Prénom', placeholder: 'Fatima' },
                { field: 'lastName', label: 'Nom de famille', placeholder: 'Benali' },
                { field: 'city', label: 'Ville', placeholder: 'Casablanca' },
                { field: 'prefecture', label: 'Préfecture', placeholder: 'Ben M\'sick' },
                { field: 'hospital', label: 'Établissement', placeholder: 'CHU Ibn Rochd' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-ink-mid mb-1">{label}</label>
                  <input value={inviteForm[field as keyof SendInviteRequest] ?? ''}
                    onChange={(e) => setInviteForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
            </div>

            <button onClick={() => sendInvite()} disabled={isSending || !inviteForm.email}
              className="mt-4 h-9 px-5 rounded-full bg-rose text-white text-xs font-medium flex items-center gap-2 hover:bg-rose-dark disabled:opacity-60">
              {isSending && <LoadingSpinner size="sm" />}
              Envoyer l'invitation
            </button>
          </div>

          {/* Invites list */}
          {invitesLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-sand-mid overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead className="bg-sand">
                  <tr>
                    {['Email', 'Nom', 'Établissement', 'Ville', 'Statut', 'Envoyé le', 'Expire le'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-ink-mid font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-mid">
                  {invites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-blush">
                      <td className="px-4 py-3 font-medium text-ink">{inv.email}</td>
                      <td className="px-4 py-3 text-ink-mid">
                        {[inv.firstName, inv.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-mid">{inv.hospital ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-mid">{[inv.city, inv.prefecture].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3"><InviteStatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-ink-mid">{new Date(inv.createdAt).toLocaleDateString('fr-MA')}</td>
                      <td className="px-4 py-3 text-ink-mid">
                        {inv.status === 'PENDING'
                          ? new Date(inv.expiresAt).toLocaleDateString('fr-MA')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-light">Aucune invitation envoyée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE DIRECT ── */}
      {tab === 'create' && (
        <div className="max-w-md bg-white rounded-2xl border border-sand-mid p-6 space-y-4">
          <h3 className="font-serif text-base text-ink">Créer un compte médecin directement</h3>
          <p className="text-xs text-ink-light -mt-2">
            Préférez l'invitation par email — cette option crée un compte sans mot de passe initial.
          </p>
          {[
            { field: 'fullName', label: 'Nom complet', placeholder: 'Dr. Fatima El Mansouri' },
            { field: 'email', label: 'Email', placeholder: 'medecin@exemple.ma' },
            { field: 'city', label: 'Ville', placeholder: 'Casablanca' },
            { field: 'prefecture', label: 'Préfecture', placeholder: 'Ben M\'sick' },
            { field: 'specialty', label: 'Spécialité', placeholder: 'Gynécologue-obstétricien' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-ink-mid mb-1">{label}</label>
              <input value={createForm[field as keyof typeof createForm]}
                onChange={(e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <button onClick={() => create()} disabled={isCreating || !createForm.fullName || !createForm.email}
            className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark disabled:opacity-60">
            {isCreating && <LoadingSpinner size="sm" />}
            Créer le compte
          </button>
        </div>
      )}
    </div>
  )
}
