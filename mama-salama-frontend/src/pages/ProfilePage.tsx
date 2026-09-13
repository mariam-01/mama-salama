import { useState, useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { getProfile, createProfile, updateProfile } from '../api/profile'
import { useUILang } from '../context/UILanguageContext'
import type { ProfileRequest, BloodType, FollowUpType, Supplement } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

const BLOOD_TYPES: { value: BloodType; label: string }[] = [
  { value: 'A_POSITIVE', label: 'A+' }, { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' }, { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' }, { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' }, { value: 'O_NEGATIVE', label: 'O-' },
]

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
  'Témara':                 ['Ain Attig', 'Harhoura', 'Témara'],
}

const REGIONS: { value: string; labelAR: string }[] = [
  { value: 'Casablanca-Settat',          labelAR: 'الدار البيضاء-سطات' },
  { value: 'Rabat-Salé-Kénitra',         labelAR: 'الرباط-سلا-القنيطرة' },
  { value: 'Marrakech-Safi',             labelAR: 'مراكش-آسفي' },
  { value: 'Fès-Meknès',                 labelAR: 'فاس-مكناس' },
  { value: 'Tanger-Tétouan-Al Hoceïma',  labelAR: 'طنجة-تطوان-الحسيمة' },
  { value: 'Souss-Massa',                labelAR: 'سوس-ماسة' },
  { value: 'Oriental',                   labelAR: 'الشرق' },
  { value: 'Béni Mellal-Khénifra',       labelAR: 'بني ملال-خنيفرة' },
  { value: 'Drâa-Tafilalet',             labelAR: 'درعة-تافيلالت' },
  { value: 'Guelmim-Oued Noun',          labelAR: 'كلميم-واد نون' },
  { value: 'Laâyoune-Sakia El Hamra',    labelAR: 'العيون-الساقية الحمراء' },
  { value: 'Dakhla-Oued Ed-Dahab',       labelAR: 'الداخلة-وادي الذهب' },
]

const schema = z.object({
  fullName: z.string().min(2, 'Nom complet requis (min. 2 caractères)'),
  age: z.string().min(1, 'Âge requis'),
  weight: z.string().optional(),
  height: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  prefecture: z.string().optional(),
  lastMenstrualPeriod: z.string().optional(),
  numberOfPreviousPregnancies: z.string().optional(),
  numberOfChildren: z.string().optional(),
  allergies: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputClass =
  'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent transition-shadow'


function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-ink-mid mb-1.5">
      {children}{required && <span className="text-rose ml-1">*</span>}
    </label>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick(): void }) {
  return (
    <button type="button" onClick={onClick}
      className={['h-7 px-3 rounded-full text-xs border transition-colors',
        selected ? 'bg-rose-light border-rose-mid text-rose-dark font-medium' : 'border-sand-mid text-ink-mid hover:bg-sand'].join(' ')}>
      {label}
    </button>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function calcWeekFromLmp(lmp: string): number {
  const days = Math.floor((Date.now() - new Date(lmp).getTime()) / 86_400_000)
  return Math.min(40, Math.max(1, Math.round(days / 7)))
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t, isRTL } = useUILang()
  const [apiError, setApiError] = useState<string | null>(null)
  const [bloodType, setBloodType] = useState<BloodType | ''>('')
  const [followUpType, setFollowUpType] = useState<FollowUpType | ''>('')
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [multiplePregnancy, setMultiplePregnancy] = useState(false)
  const [pregnancyWeek, setPregnancyWeek] = useState(20)
  const [milieu, setMilieu] = useState<'Rural' | 'Urbain'>('Urbain')

  // Translated data — French values kept for API consistency, labels translated
  const CONDITIONS_DATA = [
    { value: 'Diabète gestationnel', label: t('condDiabetes') },
    { value: 'Hypertension artérielle', label: t('condHypertension') },
    { value: 'Pré-éclampsie antérieure', label: t('condPreeclampsia') },
    { value: 'Prématurité', label: t('condPremature') },
    { value: 'Fausse couche', label: t('condMiscarriage') },
    { value: 'Césarienne précédente', label: t('condCesarean') },
    { value: 'Anémie', label: t('condAnemia') },
    { value: 'Thyroïde', label: t('condThyroid') },
    { value: 'Aucun antécédent', label: t('condNone') },
  ]

  const FOLLOW_UP_TYPES: { value: FollowUpType; label: string }[] = [
    { value: 'GYNECOLOGIST', label: t('followGyneco') },
    { value: 'MIDWIFE', label: t('followMidwife') },
    { value: 'GENERAL_PRACTITIONER', label: t('followGP') },
    { value: 'NONE', label: t('followNone') },
  ]

  const SUPPLEMENTS_DATA: { value: Supplement; label: string }[] = [
    { value: 'FOLIC_ACID', label: t('suppFolicAcid') },
    { value: 'IRON', label: t('suppIron') },
    { value: 'VITAMIN_D', label: t('suppVitD') },
    { value: 'CALCIUM', label: t('suppCalcium') },
    { value: 'IODINE', label: t('suppIodine') },
    { value: 'OMEGA_3', label: t('suppOmega3') },
    { value: 'MAGNESIUM', label: t('suppMagnesium') },
    { value: 'VITAMIN_B12', label: t('suppB12') },
    { value: 'VITAMIN_C', label: t('suppVitC') },
    { value: 'ZINC', label: t('suppZinc') },
  ]

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: (_n, err) => !(axios.isAxiosError(err) && err.response?.status === 404),
  })

  const isNotFound = axios.isAxiosError(error) && error.response?.status === 404
  const existingProfile = !isNotFound && data?.success ? data.data : null

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const selectedRegion = watch('region', '')
  const selectedVille = watch('city', '')
  const lmpValue = watch('lastMenstrualPeriod', '')

  useEffect(() => {
    if (lmpValue) {
      setPregnancyWeek(calcWeekFromLmp(lmpValue))
    }
  }, [lmpValue])

  useEffect(() => {
    if (existingProfile) {
      reset({
        fullName: existingProfile.fullName,
        age: String(existingProfile.age),
        weight: existingProfile.weight ? String(existingProfile.weight) : '',
        height: existingProfile.height ? String(existingProfile.height) : '',
        region: existingProfile.region ?? '',
        city: existingProfile.city ?? '',
        prefecture: existingProfile.prefecture ?? '',
        lastMenstrualPeriod: existingProfile.lastMenstrualPeriod ?? '',
        numberOfPreviousPregnancies: existingProfile.numberOfPreviousPregnancies != null ? String(existingProfile.numberOfPreviousPregnancies) : '',
        numberOfChildren: existingProfile.numberOfChildren != null ? String(existingProfile.numberOfChildren) : '',
        allergies: existingProfile.allergies ?? '',
      })
      if (existingProfile.milieu === 'Rural' || existingProfile.milieu === 'Urbain') setMilieu(existingProfile.milieu)
      if (existingProfile.bloodType) setBloodType(existingProfile.bloodType)
      if (existingProfile.followUpType) setFollowUpType(existingProfile.followUpType)
      if (existingProfile.supplements) setSupplements(existingProfile.supplements)
      if (existingProfile.multiplePregnancy != null) setMultiplePregnancy(existingProfile.multiplePregnancy)
      if (existingProfile.pregnancyWeek) setPregnancyWeek(existingProfile.pregnancyWeek)
      if (existingProfile.medicalHistory) setConditions(existingProfile.medicalHistory.split(', ').filter(Boolean))
    }
  }, [existingProfile, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: ProfileRequest) =>
      existingProfile ? updateProfile(payload) : createProfile(payload),
    onSuccess: (res) => {
      if (res.success) {
        void queryClient.invalidateQueries({ queryKey: ['profile'] })
        setApiError(null)
        setTimeout(() => navigate('/checkup'), 800)
      } else {
        setApiError(res.message)
      }
    },
    onError: () => setApiError("Une erreur s'est produite. Veuillez réessayer."),
  })

  function onSubmit(d: FormData) {
    setApiError(null)
    const parseNum = (v?: string) => (v && v !== '' ? parseInt(v, 10) : undefined)
    mutate({
      fullName: d.fullName,
      age: parseInt(d.age, 10),
      region: d.region || undefined,
      milieu: milieu || undefined,
      city: d.city || undefined,
      prefecture: d.prefecture || undefined,
      pregnancyWeek,
      lastMenstrualPeriod: d.lastMenstrualPeriod || undefined,
      bloodType: bloodType || undefined,
      weight: parseNum(d.weight),
      height: parseNum(d.height),
      numberOfPreviousPregnancies: parseNum(d.numberOfPreviousPregnancies),
      numberOfChildren: parseNum(d.numberOfChildren),
      followUpType: followUpType || undefined,
      supplements: supplements.length > 0 ? supplements : undefined,
      multiplePregnancy,
      medicalHistory: conditions.join(', ') || undefined,
      allergies: d.allergies || undefined,
    })
  }

  function toggleCondition(c: string) {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }

  function toggleSupplement(s: Supplement) {
    setSupplements((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  const trimester = pregnancyWeek <= 13 ? t('profileTrimester1') : pregnancyWeek <= 26 ? t('profileTrimester2') : t('profileTrimester3')
  const calculatedWeek = lmpValue
    ? calcWeekFromLmp(lmpValue)
    : (existingProfile?.pregnancyWeekCalculated ?? null)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-ink">
            {existingProfile ? t('profileTitle') : t('profileNewTitle')}
          </h2>
          <p className="text-xs text-ink-light mt-1">{t('profileSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left column */}
            <div className="space-y-5">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>{t('profileFullName')}</Label>
                  <input type="text" {...register('fullName')} placeholder={t('profileNamePlaceholder')} className={inputClass} />
                  {errors.fullName && <p className="text-rose text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label required>{t('profileAge')}</Label>
                  <input type="number" min={15} max={60} {...register('age')} placeholder={t('profileAgePlaceholder')} className={inputClass} />
                  {errors.age && <p className="text-rose text-xs mt-1">{errors.age.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('profileWeight')}</Label>
                  <input type="number" min={30} max={200} {...register('weight')} placeholder={t('profileWeightPlaceholder')} className={inputClass} />
                </div>
                <div>
                  <Label>{t('profileHeight')}</Label>
                  <input type="number" min={100} max={220} {...register('height')} placeholder={t('profileHeightPlaceholder')} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('profileRegion')}</Label>
                  <select {...register('region')} className={inputClass}>
                    <option value="">{t('profileRegionPlaceholder')}</option>
                    {REGIONS.map((r) => <option key={r.value} value={r.value}>{isRTL ? r.labelAR : r.value}</option>)}
                  </select>
                </div>
                <div>
                  <Label>{t('profileVille')}</Label>
                  <select {...register('city')} className={inputClass}>
                    <option value="">{t('profileVillePlaceholder')}</option>
                    {(selectedRegion && PROVINCES_BY_REGION[selectedRegion]
                      ? PROVINCES_BY_REGION[selectedRegion]
                      : ALL_PROVINCES
                    ).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {selectedVille && ARRONDISSEMENTS_BY_PROVINCE[selectedVille] && (
                <div>
                  <Label>{t('profilePrefecture')}</Label>
                  <select {...register('prefecture')} className={inputClass}>
                    <option value="">{t('profilePrefecturePlaceholder')}</option>
                    {ARRONDISSEMENTS_BY_PROVINCE[selectedVille].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>{t('profileMilieu')}</Label>
                <div className="flex gap-2 mt-0.5">
                  <Chip label={t('profileRural')} selected={milieu === 'Rural'} onClick={() => setMilieu('Rural')} />
                  <Chip label={t('profileUrban')} selected={milieu === 'Urbain'} onClick={() => setMilieu('Urbain')} />
                </div>
              </div>

              <div>
                <Label>{t('profileLMP')}</Label>
                <input type="date" {...register('lastMenstrualPeriod')} className={inputClass} />
                {existingProfile?.lastMenstrualPeriod && existingProfile.dueDate && (
                  <p className="text-xs text-mauve flex items-center gap-1 mt-1.5">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('profileDPAFromLMP')} : <span className="font-medium">{formatDate(existingProfile.dueDate)}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>{t('profilePregnancyWeek')}</Label>
                  {calculatedWeek !== null && (
                    <span className="flex items-center gap-1.5 text-xs bg-mauve-light text-mauve px-2.5 py-1 rounded-full border border-mauve-mid font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('profileWeekComputed')} : {calculatedWeek}
                    </span>
                  )}
                </div>
                <div className="bg-blush rounded-xl p-4 border border-rose-light">
                  <div className="flex justify-between items-center mb-3 text-xs">
                    <span className="text-ink-light">SA 1</span>
                    <span className="font-semibold text-rose text-sm">{t('profileWeekPrefix')} {pregnancyWeek}</span>
                    <span className="text-ink-light">SA 40</span>
                  </div>
                  <input type="range" min={1} max={40} value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-xs text-ink-light mt-2">
                    <span>{t('profileTrimester1')}</span>
                    <span className="text-rose-dark font-medium">{trimester}</span>
                    <span>{t('profileTrimester3')}</span>
                  </div>
                </div>
                {calculatedWeek !== null && calculatedWeek !== pregnancyWeek && (
                  <p className="text-xs text-ink-light mt-1.5">
                    {t('profileWeekDiffNote').replace('{calc}', String(calculatedWeek)).replace('{manual}', String(pregnancyWeek))}
                  </p>
                )}
                {existingProfile?.pregnancyWeek && existingProfile.dueDateFromWeek && (
                  <p className="text-xs text-mauve flex items-center gap-1 mt-1.5">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('profileDPAFromWeek')} : <span className="font-medium">{formatDate(existingProfile.dueDateFromWeek)}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('profilePreviousPreg')}</Label>
                  <input type="number" min={0} max={20} {...register('numberOfPreviousPregnancies')} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <Label>{t('profileChildren')}</Label>
                  <input type="number" min={0} max={20} {...register('numberOfChildren')} placeholder="0" className={inputClass} />
                </div>
              </div>

              <div className="flex items-center justify-between bg-blush rounded-xl px-4 py-3 border border-rose-light">
                <span className="text-xs font-medium text-ink-mid">{t('profileMultiplePreg')}</span>
                <button type="button" onClick={() => setMultiplePregnancy((v) => !v)}
                  className={['w-10 h-6 rounded-full transition-colors relative', multiplePregnancy ? 'bg-rose' : 'bg-sand-mid'].join(' ')}>
                  <span className={['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    multiplePregnancy ? 'translate-x-5' : 'translate-x-1'].join(' ')} />
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              <div>
                <Label>{t('profileMedicalHistory')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITIONS_DATA.map(({ value, label }) => (
                    <Chip key={value} label={label} selected={conditions.includes(value)} onClick={() => toggleCondition(value)} />
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('profileFollowUp')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {FOLLOW_UP_TYPES.map((f) => (
                    <Chip key={f.value} label={f.label} selected={followUpType === f.value} onClick={() => setFollowUpType(f.value)} />
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('profileBloodType')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {BLOOD_TYPES.map((b) => (
                    <Chip key={b.value} label={b.label} selected={bloodType === b.value} onClick={() => setBloodType(b.value)} />
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('profileSupplements')}</Label>
                <div className="flex gap-2 flex-wrap">
                  {SUPPLEMENTS_DATA.map((s) => (
                    <Chip key={s.value} label={s.label} selected={supplements.includes(s.value)} onClick={() => toggleSupplement(s.value)} />
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('profileAllergies')}</Label>
                <textarea {...register('allergies')} rows={2}
                  placeholder={t('profileAllergiesPlaceholder')}
                  className={inputClass + ' h-auto py-2 resize-none'} />
              </div>

              {apiError && (
                <div className="rounded-lg bg-[#FDEAEA] border border-[#D94F4F] px-4 py-3 text-xs text-[#D94F4F]">
                  {apiError}
                </div>
              )}

              <button type="submit" disabled={isPending}
                className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60">
                {isPending && <LoadingSpinner size="sm" />}
                {isPending ? t('profileSaving') : existingProfile ? t('profileUpdate') : t('profileSaveNew')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
