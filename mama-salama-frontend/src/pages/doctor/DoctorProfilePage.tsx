import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctorProfile, updateDoctorProfile } from '../../api/doctor'
import LoadingSpinner from '../../components/LoadingSpinner'

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'Tanger-Tétouan-Al Hoceïma':  ['Al Hoceïma', 'Chefchaouen', 'Fahs-Anjra', 'Larache', "M'diq-Fnideq", 'Ouezzane', 'Tanger-Asilah', 'Tétouan'],
  'Oriental':                    ['Berkane', 'Driouch', 'Figuig', 'Guercif', 'Jerada', 'Nador', 'Oujda-Angad', 'Taourirt'],
  'Fès-Meknès':                  ['Boulemane', 'El Hajeb', 'Fès', 'Ifrane', 'Meknès', 'Moulay Yacoub', 'Sefrou', 'Taounate', 'Taza'],
  'Rabat-Salé-Kénitra':          ['Kénitra', 'Khmisset', 'Rabat', 'Salé', 'Sidi Kacem', 'Sidi Slimane', 'Skhirate-Témara'],
  'Béni Mellal-Khénifra':        ['Azilal', 'Béni Mellal', 'El Fquih Ben Salah', 'Khénifra', 'Khouribga'],
  'Casablanca-Settat':           ['Ben Slimane', 'Berrechid', 'Casablanca', 'El Jadida', 'Médiouna', 'Mohammedia', 'Nouaceur', 'Settat', 'Sidi Bennour'],
  'Marrakech-Safi':              ['Al Haouz', 'Chichaoua', 'El Kelâa des Sraghna', 'Essaouira', 'Marrakech', 'Rehamna', 'Safi', 'Youssoufia'],
  'Drâa-Tafilalet':              ['Errachidia', 'Midelt', 'Ouarzazate', 'Tinghir', 'Zagora'],
  'Souss-Massa':                 ['Agadir-Ida-Ou-Tanane', 'Chtouka-Aït Baha', 'Inezgane-Aït Melloul', 'Taroudant', 'Tata', 'Tiznit'],
  'Guelmim-Oued Noun':           ['Assa-Zag', 'Guelmim', 'Sidi Ifni', 'Tan-Tan'],
  'Laâyoune-Sakia El Hamra':     ['Boujdour', 'Es-Semara', 'Laâyoune', 'Tarfaya'],
  'Dakhla-Oued Ed-Dahab':        ['Aousserd', 'Oued Ed-Dahab'],
}

const ALL_PROVINCES = Object.values(PROVINCES_BY_REGION).flat().sort()

const ARRONDISSEMENTS_BY_PROVINCE: Record<string, string[]> = {
  'Casablanca':             ['Aïn Chock', 'Aïn Sebaa-Hay Mohammadi', 'Al Fida-Mers Sultan', 'Anfa', "Ben M'sick", 'Hay Hassani', 'Hay Moulay Rachid', 'Moulay Rachid', 'Sidi Bernoussi', 'Sidi Moumen'],
  'Rabat':                  ['Agdal-Riyad', 'Hassan', 'Océan', 'Souissi', 'Yacoub El Mansour', 'Youssoufia'],
  'Salé':                   ['Bettana-Tabriquet', 'Laâyoune', 'Sidi Moussa', 'Tabriquet'],
  'Skhirate-Témara':        ['Ain Attig', 'Harhoura', 'Mers El Kheir', 'Oued Ykem', 'Skhirate', 'Témara'],
  'Fès':                    ['Aïn Bida', 'Aïn Chkef', 'Bensouda', 'Fès-Médina', 'Jnane El Ouard', 'Mechouar-Stinia', 'Mont Fleuri', 'Saïss', 'Seffah', 'Zouagha'],
  'Meknès':                 ['Al Hamria', 'Berrima', 'El Ismaïlia', 'Marjane', 'Meknès-El Menzeh', 'Rouamzine', 'Touarga'],
  'Marrakech':              ['Annakhil', 'Guéliz', 'Mechouar-Kasbah', 'Médina', 'Menara', 'Sidi Youssef Ben Ali'],
  'Tanger-Asilah':          ['Beni Makada', 'Charf-Mghogha', 'Tanger-Médina'],
  'Oujda-Angad':            ['Isly', 'Oujda-Médina', 'Sidi Yahia'],
  'Agadir-Ida-Ou-Tanane':   ['Agadir', 'Bensergao', 'Tikiouine'],
  'Inezgane-Aït Melloul':   ['Aït Melloul', 'Biougra', 'Dcheira El Jihadia', 'Inezgane', 'Lqliâa'],
  'Kénitra':                ['Kénitra-Médina', 'Kénitra-Saknia', 'Nzalat Lalla Mimouna'],
}

const REGIONS = Object.keys(PROVINCES_BY_REGION)

const schema = z.object({
  fullName: z.string().min(2),
  specialty: z.string().optional(),
  hospital: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  prefecture: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputClass = 'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-mauve focus:border-transparent transition-shadow'

export default function DoctorProfilePage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['doctorProfile'], queryFn: getDoctorProfile })
  const profile = data?.data

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedRegion = watch('region', '')
  const selectedVille = watch('city', '')
  const prefectures = selectedVille ? (ARRONDISSEMENTS_BY_PROVINCE[selectedVille] ?? []) : []

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName ?? '',
        specialty: profile.specialty ?? '',
        hospital: profile.hospital ?? '',
        region: profile.region ?? '',
        city: profile.city ?? '',
        prefecture: profile.prefecture ?? '',
      })
    }
  }, [profile, reset])

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: (d: FormData) => updateDoctorProfile({
      fullName: d.fullName,
      specialty: d.specialty || undefined,
      hospital: d.hospital || undefined,
      region: d.region || undefined,
      city: d.city || undefined,
      prefecture: d.prefecture || undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctorProfile'] }),
  })

  if (isLoading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="font-serif text-2xl text-ink mb-1">Mon profil</h2>
      <p className="text-xs text-ink-light mb-6">Ces informations sont utilisées pour vous mettre en relation avec les patientes de votre zone.</p>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="bg-white rounded-2xl border border-sand-mid p-5 sm:p-6 space-y-4">

        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1.5">Nom complet <span className="text-mauve">*</span></label>
            <input {...register('fullName')} className={inputClass} placeholder="Dr. Prénom Nom" />
            {errors.fullName && <p className="text-xs text-[#D94F4F] mt-1">Champ requis</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1.5">Spécialité</label>
            <input {...register('specialty')} className={inputClass} placeholder="ex: Gynécologie-obstétrique" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-mid mb-1.5">Établissement / Hôpital</label>
          <input {...register('hospital')} className={inputClass} placeholder="ex: CHU Ibn Rochd, Casablanca" />
        </div>

        <hr className="border-sand-mid" />

        {/* Location */}
        <p className="text-xs font-semibold text-ink-mid uppercase tracking-wide">Localisation</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1.5">Région</label>
            <select {...register('region')} className={inputClass}>
              <option value="">— Choisir —</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1.5">Ville</label>
            <select {...register('city')} className={inputClass}>
              <option value="">— Choisir —</option>
              {(selectedRegion && PROVINCES_BY_REGION[selectedRegion]
                ? PROVINCES_BY_REGION[selectedRegion]
                : ALL_PROVINCES
              ).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {prefectures.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-ink-mid mb-1.5">Préfecture</label>
            <select {...register('prefecture')} className={inputClass}>
              <option value="">— Choisir —</option>
              {prefectures.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isPending || !isDirty}
            className="h-9 px-6 rounded-full bg-mauve text-white text-xs font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
            {isPending && <LoadingSpinner size="sm" />}
            Enregistrer
          </button>
          {isSuccess && <span className="text-xs text-sage">✓ Profil mis à jour</span>}
          {isError && <span className="text-xs text-[#D94F4F]">Erreur — réessayez</span>}
        </div>
      </form>
    </div>
  )
}
