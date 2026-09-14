import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyPatients, searchPatients, assignPatientToSelf } from '../../api/doctor'
import LoadingSpinner from '../../components/LoadingSpinner'
import TriageBadge from '../../components/TriageBadge'

export default function DoctorPatients() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'my' | 'search'>('my')
  const [query, setQuery] = useState('')

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['myPatients'],
    queryFn: getMyPatients,
    enabled: tab === 'my',
  })

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['searchPatients', query],
    queryFn: () => searchPatients(query),
    enabled: tab === 'search' && query.length >= 2,
  })

  const { mutate: assign, isPending: isAssigning, variables: assigningId } = useMutation({
    mutationFn: (id: string) => assignPatientToSelf(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myPatients'] }); qc.invalidateQueries({ queryKey: ['searchPatients'] }) },
  })

  const myPatients = myData?.data ?? []
  const searchResults = searchData?.data ?? []
  const isLoading = tab === 'my' ? myLoading : searchLoading

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h2 className="font-serif text-2xl text-ink mb-1">Mes patients</h2>

      <div className="flex gap-2 mb-6">
        {[{ id: 'my', label: 'Mes patients' }, { id: 'search', label: 'Trouver un patient' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as 'my' | 'search')}
            className={['px-4 py-1.5 rounded-full text-xs border transition-colors',
              tab === t.id ? 'bg-mauve text-white border-mauve' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou email"
            className="h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink focus:ring-2 focus:ring-mauve focus:border-transparent w-80" />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-2">
          {(tab === 'my' ? myPatients : searchResults).map((p) => (
            <div key={p.id}
              className="bg-white rounded-xl border border-sand-mid px-4 py-3 flex items-center justify-between gap-4 hover:bg-blush transition-colors">
              <button className="flex-1 text-left" onClick={() => navigate(`/doctor/patients/${p.id}`)}>
                <p className="text-sm font-medium text-ink">{p.fullName}</p>
                <p className="text-xs text-ink-mid mt-0.5">
                  {[p.pregnancyWeek ? `SA ${p.pregnancyWeek}` : null, p.city].filter(Boolean).join(' · ')}
                </p>
              </button>
              <div className="flex items-center gap-3 shrink-0">
                {p.triageLevel && <TriageBadge level={p.triageLevel} />}
                {tab === 'search' && (
                  <button onClick={() => assign(p.id)} disabled={isAssigning && assigningId === p.id}
                    className="h-7 px-3 rounded-full border border-mauve text-mauve text-xs hover:bg-mauve-light disabled:opacity-50 flex items-center gap-1">
                    {isAssigning && assigningId === p.id && <LoadingSpinner size="sm" />}
                    + Assigner
                  </button>
                )}
                <button onClick={() => navigate(`/doctor/patients/${p.id}`)}
                  className="text-xs text-ink-mid hover:text-ink">
                  Voir →
                </button>
              </div>
            </div>
          ))}
          {(tab === 'my' ? myPatients : searchResults).length === 0 && (
            <p className="text-xs text-ink-light bg-white rounded-xl border border-sand-mid px-4 py-10 text-center">
              {tab === 'my' ? 'Aucun patient assigné' : query.length < 2 ? 'Saisissez au moins 2 caractères pour rechercher' : 'Aucun résultat'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
