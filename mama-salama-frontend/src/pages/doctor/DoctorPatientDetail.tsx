import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPatientDetail } from '../../api/doctor'
import type { CheckupResponse } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-sand-mid p-5">
      <h3 className="font-serif text-sm text-ink mb-4">{title}</h3>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-sand-mid last:border-0">
      <span className="text-xs text-ink-mid">{label}</span>
      <span className="text-xs font-medium text-ink">{value ?? '—'}</span>
    </div>
  )
}

export default function DoctorPatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['patientDetail', id],
    queryFn: () => getPatientDetail(id!),
    enabled: !!id,
  })

  const profile = data?.data?.profile
  const checkupHistory: CheckupResponse[] = data?.data?.checkupHistory ?? []
  const latestCheckup = checkupHistory[0] ?? null

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate('/doctor/patients')}
        className="flex items-center gap-1.5 text-xs text-ink-mid hover:text-ink mb-5">
        ← Retour
      </button>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : !profile ? (
        <p className="text-xs text-ink-light text-center py-20">Patient introuvable</p>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-sand-mid p-5">
            <h2 className="font-serif text-xl text-ink">{profile.fullName}</h2>
            <p className="text-xs text-ink-mid mt-1">{profile.region ?? '—'}</p>
            <p className="text-xs text-ink-light mt-0.5">
              Inscrite le {new Date(profile.createdAt).toLocaleDateString('fr-MA')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pregnancy */}
            <Section title="Grossesse">
              <DataRow label="Semaine d'aménorrhée" value={profile.pregnancyWeek ? `SA ${profile.pregnancyWeek}` : null} />
              <DataRow label="Dernière menstruation" value={profile.lastMenstrualPeriod} />
              <DataRow label="Date prévue d'accouchement" value={profile.dueDate ?? profile.dueDateFromWeek} />
              <DataRow label="Grossesse multiple" value={profile.multiplePregnancy ? 'Oui' : 'Non'} />
            </Section>

            {/* Health */}
            <Section title="Informations de santé">
              <DataRow label="Groupe sanguin" value={profile.bloodType?.replace('_', ' ')} />
              <DataRow label="Poids (kg)" value={profile.weight} />
              <DataRow label="Taille (cm)" value={profile.height} />
              <DataRow label="Grossesses précédentes" value={profile.numberOfPreviousPregnancies} />
              <DataRow label="Nombre d'enfants" value={profile.numberOfChildren} />
            </Section>

            {/* Supplements */}
            <Section title="Suppléments">
              {profile.supplements && profile.supplements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.supplements.map((s) => (
                    <span key={s} className="text-xs bg-sage-light text-sage px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              ) : <p className="text-xs text-ink-light">Aucun supplément déclaré</p>}
            </Section>

            {/* Medical history */}
            <Section title="Antécédents médicaux">
              {profile.medicalHistory ? (
                <p className="text-xs text-ink leading-relaxed">{profile.medicalHistory}</p>
              ) : <p className="text-xs text-ink-light">Aucun antécédent déclaré</p>}
              {profile.allergies && (
                <div className="mt-3">
                  <p className="text-xs text-ink-mid mb-1">Allergies</p>
                  <p className="text-xs text-ink">{profile.allergies}</p>
                </div>
              )}
            </Section>
          </div>

          {/* Latest checkup */}
          {latestCheckup && (
            <Section title="Dernier bilan (auto-reporté)">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tension (sys)', value: latestCheckup.systolicBP ? `${latestCheckup.systolicBP} mmHg` : null },
                  { label: 'Tension (dia)', value: latestCheckup.diastolicBP ? `${latestCheckup.diastolicBP} mmHg` : null },
                  { label: 'Glycémie', value: latestCheckup.bloodSugar ? `${latestCheckup.bloodSugar} g/L` : null },
                  { label: 'Température', value: latestCheckup.temperature ? `${latestCheckup.temperature} °C` : null },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-sand rounded-xl p-3">
                    <p className="text-xs text-ink-mid">{label}</p>
                    <p className="text-sm font-semibold text-ink mt-1">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
              {latestCheckup.symptoms && (
                <div className="mt-3">
                  <p className="text-xs text-ink-mid mb-1.5">Symptômes signalés</p>
                  <p className="text-xs text-ink bg-white border border-sand-mid rounded-lg px-3 py-2">{latestCheckup.symptoms}</p>
                </div>
              )}
              <p className="text-xs text-ink-light mt-3">
                Bilan du {new Date(latestCheckup.createdAt).toLocaleDateString('fr-MA')}
              </p>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}
