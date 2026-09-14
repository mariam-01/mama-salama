import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { submitCheckup, getCheckupHistory } from '../api/checkup'
import type { CheckupRequest, CheckupResponse } from '../types'
import TriageBadge from '../components/TriageBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useUILang } from '../context/UILanguageContext'

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-7 px-3 rounded-full text-xs border transition-colors',
        selected
          ? 'bg-rose-light border-rose-mid text-rose-dark font-medium'
          : 'border-sand-mid text-ink-mid hover:bg-sand',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

interface VitalCardProps {
  icon: string
  iconBg: string
  label: string
  unit: string
  children: ReactNode
}

function VitalCard({ icon, iconBg, label, unit, children }: VitalCardProps) {
  return (
    <div className="bg-sand rounded-xl p-3.5 border border-sand-mid">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${iconBg}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-ink-mid">{label}</span>
      </div>
      {children}
      <div className="text-xs text-ink-light mt-1.5">{unit}</div>
    </div>
  )
}

const numInput = 'w-full h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink text-center font-medium placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent'

function toNum(s: string): number | undefined {
  const n = parseFloat(s)
  return s.trim() && !isNaN(n) ? n : undefined
}

export default function CheckupPage() {
  const navigate = useNavigate()
  const { t } = useUILang()
  const [systolicBP, setSystolicBP] = useState('')
  const [diastolicBP, setDiastolicBP] = useState('')
  const [bloodSugar, setBloodSugar] = useState('')
  const [temperature, setTemperature] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<CheckupResponse | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // French values for API; translated labels for display
  const SYMPTOMS_DATA = [
    { value: 'Maux de tête', label: t('symptomHeadache') },
    { value: 'Vision floue', label: t('symptomBlurry') },
    { value: 'Nausées', label: t('symptomNausea') },
    { value: 'Oedèmes', label: t('symptomEdema') },
    { value: 'Douleurs abdominales', label: t('symptomAbdominal') },
    { value: 'Aucun symptôme', label: t('symptomNone') },
  ]

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CheckupRequest) => submitCheckup(payload),
    onSuccess: (res) => {
      if (res.success && res.data) { setResult(res.data); setSubmitted(true) }
    },
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['checkupHistory'],
    queryFn: getCheckupHistory,
  })

  const history = historyData?.data ?? []
  const baseChartData = [...history].reverse().map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' }),
    Systolique: item.systolicBP,
    Diastolique: item.diastolicBP,
    Glycémie: item.bloodSugar,
    Température: item.temperature,
    Pouls: item.heartRate,
  }))
  const bpData = baseChartData.filter((d) => d.Systolique != null || d.Diastolique != null)
  const sugarData = baseChartData.filter((d) => d.Glycémie != null)
  const tempData = baseChartData.filter((d) => d.Température != null)
  const heartData = baseChartData.filter((d) => d.Pouls != null)

  const hasInput =
    systolicBP || diastolicBP || bloodSugar || temperature || heartRate ||
    selectedSymptoms.length > 0 || notes.trim()

  function toggleSymptom(value: string) {
    setSubmitted(false)
    setSelectedSymptoms((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    )
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const payload: CheckupRequest = {
      systolicBP: toNum(systolicBP),
      diastolicBP: toNum(diastolicBP),
      bloodSugar: toNum(bloodSugar),
      temperature: toNum(temperature),
      heartRate: toNum(heartRate),
      symptoms: selectedSymptoms.join(', ') || undefined,
      notes: notes.trim() || undefined,
    }
    mutate(payload)
  }

  const today = new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-serif text-2xl text-ink">{t('checkupTitle')}</h2>
            <p className="text-xs text-ink-light mt-1 capitalize">{today}</p>
          </div>
          {history.length > 0 && (
            <div className="bg-rose-light rounded-lg px-3 py-1.5 text-xs text-rose-dark font-medium">
              {t('checkupNumber')}{history.length + 1}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              <p className="text-xs font-medium text-ink-mid uppercase tracking-wider">{t('checkupVitals')}</p>

              <div className="grid grid-cols-2 gap-3">
                <VitalCard icon="❤️" iconBg="bg-[#FDEAEA]" label={t('checkupBP')} unit={t('checkupBPUnit')}>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={systolicBP} onChange={(e) => { setSystolicBP(e.target.value); setSubmitted(false) }} placeholder="120" className={numInput} />
                    <span className="text-ink-light text-sm">/</span>
                    <input type="number" value={diastolicBP} onChange={(e) => { setDiastolicBP(e.target.value); setSubmitted(false) }} placeholder="80" className={numInput} />
                  </div>
                </VitalCard>

                <VitalCard icon="💧" iconBg="bg-mauve-light" label={t('checkupSugar')} unit={t('checkupSugarUnit')}>
                  <input type="number" step="0.1" value={bloodSugar} onChange={(e) => { setBloodSugar(e.target.value); setSubmitted(false) }} placeholder="5.4" className={numInput} />
                </VitalCard>

                <VitalCard icon="🌡️" iconBg="bg-amber-light" label={t('checkupTemp')} unit={t('checkupTempUnit')}>
                  <input type="number" step="0.1" value={temperature} onChange={(e) => { setTemperature(e.target.value); setSubmitted(false) }} placeholder="37.0" className={numInput} />
                </VitalCard>

                <VitalCard icon="⚡" iconBg="bg-rose-light" label={t('checkupHR')} unit={t('checkupHRUnit')}>
                  <input type="number" value={heartRate} onChange={(e) => { setHeartRate(e.target.value); setSubmitted(false) }} placeholder="72" className={numInput} />
                </VitalCard>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-mid uppercase tracking-wider mb-2">{t('checkupSymptoms')}</p>
                <div className="flex gap-2 flex-wrap">
                  {SYMPTOMS_DATA.map(({ value, label }) => (
                    <Chip key={value} label={label} selected={selectedSymptoms.includes(value)} onClick={() => toggleSymptom(value)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-mid mb-1.5">{t('checkupNotes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setSubmitted(false) }}
                  rows={2}
                  placeholder={t('checkupNotesPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-sand-mid bg-white text-xs text-ink placeholder:text-ink-light focus:ring-2 focus:ring-rose focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {result ? (
                <div className="rounded-xl border border-rose-mid bg-blush p-4 flex gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                    result.triageLevel === 'GREEN' ? 'bg-sage text-white' :
                    result.triageLevel === 'YELLOW' ? 'bg-amber text-white' : 'bg-[#D94F4F] text-white'
                  }`}>
                    {result.triageLevel === 'GREEN' ? '✓' : result.triageLevel === 'YELLOW' ? '⚠' : '🚨'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <TriageBadge level={result.triageLevel} />
                    </div>
                    <p className="text-xs text-ink-mid leading-relaxed">
                      {result.triageLevel === 'GREEN' && t('checkupGreen')}
                      {result.triageLevel === 'YELLOW' && t('checkupYellow')}
                      {result.triageLevel === 'RED' && t('checkupRed')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-sand-mid bg-white p-4 flex flex-col items-center justify-center text-center py-10">
                  <span className="text-3xl mb-3">🩺</span>
                  <p className="text-xs font-medium text-ink-mid">{t('checkupResultEmpty')}</p>
                  <p className="text-xs text-ink-light mt-1">{t('checkupResultEmptyHint')}</p>
                </div>
              )}

              {result && (
                <div>
                  <p className="text-xs font-medium text-ink-mid uppercase tracking-wider mb-3">{t('checkupFactors')}</p>
                  <div className="space-y-2.5">
                    {[
                      { label: t('checkupFactorBP'), pct: systolicBP ? Math.min(100, Math.round((Number(systolicBP) / 160) * 100)) : 0, color: 'bg-amber' },
                      { label: t('checkupFactorSymptoms'), pct: Math.round((selectedSymptoms.length / SYMPTOMS_DATA.length) * 100), color: 'bg-rose' },
                      { label: t('checkupFactorSugar'), pct: bloodSugar ? Math.min(100, Math.round((Number(bloodSugar) / 7) * 100)) : 0, color: 'bg-mauve' },
                      { label: t('checkupFactorTemp'), pct: temperature ? Math.min(100, Math.round(((Number(temperature) - 36) / 2.5) * 100)) : 0, color: 'bg-sage' },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-3">
                        <span className="text-xs text-ink-mid w-32 shrink-0">{f.label}</span>
                        <div className="flex-1 h-1.5 bg-sand-mid rounded-full overflow-hidden">
                          <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${f.pct}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-8 text-right ${f.color.replace('bg-', 'text-')}`}>{f.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending || !hasInput || submitted}
                  className="w-full h-9 rounded-full bg-rose text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-dark transition-colors disabled:opacity-60"
                >
                  {isPending && <LoadingSpinner size="sm" />}
                  {isPending ? t('checkupSubmitting') : t('checkupSubmit')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!result) { navigate('/chat'); return }
                    const lines: string[] = ['Voici mes données de bilan du jour :']
                    if (systolicBP || diastolicBP)
                      lines.push(`- Tension artérielle : ${systolicBP || '?'} / ${diastolicBP || '?'} mmHg`)
                    if (bloodSugar) lines.push(`- Glycémie : ${bloodSugar} mmol/L`)
                    if (temperature) lines.push(`- Température : ${temperature} °C`)
                    if (heartRate) lines.push(`- Fréquence cardiaque : ${heartRate} bpm`)
                    if (selectedSymptoms.length > 0) lines.push(`- Symptômes : ${selectedSymptoms.join(', ')}`)
                    if (notes.trim()) lines.push(`- Notes : ${notes.trim()}`)
                    lines.push('\nPeux-tu analyser ces données et me dire si tout est normal pour ma grossesse ?')
                    navigate('/chat', { state: { autoPrompt: lines.join('\n') } })
                  }}
                  className="w-full h-9 rounded-full border border-rose-mid text-rose-dark text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-light transition-colors"
                >
                  {t('checkupChat')}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* History charts */}
        {historyLoading ? (
          <div className="flex justify-center py-8 mt-8"><LoadingSpinner /></div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-white rounded-2xl border border-sand-mid p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">❤️</span>
                <h3 className="font-serif text-sm text-ink">{t('checkupBP')}</h3>
              </div>
              <p className="text-xs text-ink-light mb-4">mmHg</p>
              {bpData.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-ink-light text-xs">
                  <span className="text-2xl mb-1">📈</span>{t('checkupNoData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={bpData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DC" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#A08898' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#A08898' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 10, borderColor: '#EDE6DC' }} />
                    <Line type="monotone" dataKey="Systolique" stroke="#C2617A" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Diastolique" stroke="#7B5EA7" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-sand-mid p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">💧</span>
                <h3 className="font-serif text-sm text-ink">{t('checkupSugar')}</h3>
              </div>
              <p className="text-xs text-ink-light mb-4">mmol/L</p>
              {sugarData.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-ink-light text-xs">
                  <span className="text-2xl mb-1">📈</span>{t('checkupNoData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={sugarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DC" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#A08898' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#A08898' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 10, borderColor: '#EDE6DC' }} />
                    <Line type="monotone" dataKey="Glycémie" stroke="#7B5EA7" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-sand-mid p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🌡️</span>
                <h3 className="font-serif text-sm text-ink">{t('checkupTemp')}</h3>
              </div>
              <p className="text-xs text-ink-light mb-4">°C</p>
              {tempData.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-ink-light text-xs">
                  <span className="text-2xl mb-1">📈</span>{t('checkupNoData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={tempData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DC" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#A08898' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#A08898' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 10, borderColor: '#EDE6DC' }} />
                    <Line type="monotone" dataKey="Température" stroke="#D4874A" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-sand-mid p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">⚡</span>
                <h3 className="font-serif text-sm text-ink">{t('checkupHR')}</h3>
              </div>
              <p className="text-xs text-ink-light mb-4">bpm</p>
              {heartData.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-ink-light text-xs">
                  <span className="text-2xl mb-1">📈</span>{t('checkupNoData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={heartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE6DC" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#A08898' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#A08898' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 10, borderColor: '#EDE6DC' }} />
                    <Line type="monotone" dataKey="Pouls" stroke="#C2617A" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
