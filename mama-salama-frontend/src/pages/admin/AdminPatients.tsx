import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminPatients, setPatientStatus } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={['text-xs px-2 py-0.5 rounded-full font-medium',
      enabled ? 'bg-sage-light text-sage' : 'bg-sand text-ink-light'].join(' ')}>
      {enabled ? 'Actif' : 'Inactif'}
    </span>
  )
}

export default function AdminPatients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['adminPatients', search],
    queryFn: () => getAdminPatients(search),
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setPatientStatus(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminPatients'] }),
  })


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h2 className="font-serif text-2xl text-ink font-semibold mb-1">Patients</h2>
      <p className="text-xs text-ink-light mb-5">{patients.length} patient(s) enregistré(s)</p>

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email…"
          className="h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent w-72" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-mid overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead className="bg-sand">
              <tr>
                {['Nom', 'Email', 'Téléphone', 'Inscription', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-ink-mid font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-mid">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-blush transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{p.fullName || '—'}</td>
                  <td className="px-4 py-3 text-ink-mid">{p.email}</td>
                  <td className="px-4 py-3 text-ink-mid">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-ink-mid">
                    {new Date(p.createdAt).toLocaleDateString('fr-MA')}
                  </td>
                  <td className="px-4 py-3"><EnabledBadge enabled={p.enabled} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus({ id: p.id, enabled: !p.enabled })}
                      className={['text-xs px-2.5 py-1 rounded-full border transition-colors',
                        p.enabled
                          ? 'border-[#D94F4F] text-[#D94F4F] hover:bg-[#FDEAEA]'
                          : 'border-sage text-sage hover:bg-sage-light'].join(' ')}>
                      {p.enabled ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-light">
                    Aucun patient trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
