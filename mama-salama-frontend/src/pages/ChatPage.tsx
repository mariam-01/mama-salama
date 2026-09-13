import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { askQuestion, askVoice, getChatHistory } from '../api/chat'
import { createAlert, cancelAlert } from '../api/alerts'
import LoadingSpinner from '../components/LoadingSpinner'
import { useUILang } from '../context/UILanguageContext'
import type { Language } from '../types'

interface LocalMessage {
  question: string
  answer: string | null
  transcribedText?: string
  source?: string
  isAlert?: boolean
  isVoice?: boolean
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : part
  )
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  const listItems: string[] = []

  function flushList() {
    if (listItems.length === 0) return
    result.push(
      <ol key={result.length} className="list-decimal space-y-1.5 pl-4 mt-1.5">
        {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ol>
    )
    listItems.length = 0
  }

  for (const line of lines) {
    const m = line.match(/^\d+\.\s+(.+)/)
    if (m) {
      listItems.push(m[1])
    } else {
      flushList()
      if (line.trim()) {
        result.push(<p key={result.length} className="mt-1 first:mt-0">{renderInline(line)}</p>)
      }
    }
  }
  flushList()
  return <>{result}</>
}

const LANG_LABELS: { value: Language; label: string }[] = [
  { value: 'FRENCH', label: 'FR' },
  { value: 'ARABIC', label: 'AR' },
]

function SpeakerIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    )
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0-12L8 9H5a1 1 0 00-1 1v4a1 1 0 001 1h3l4 3V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728" />
    </svg>
  )
}

function MessagePair({
  msg,
  onSpeak,
  isSpeaking,
  speakLabel,
  stopLabel,
}: {
  msg: LocalMessage
  onSpeak: () => void
  isSpeaking: boolean
  speakLabel: string
  stopLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-rose text-white rounded-xl rounded-br-sm px-4 py-2.5 text-xs leading-relaxed">
          {msg.isVoice ? (
            <span className="flex items-start gap-1.5">
              <span className="shrink-0">🎙️</span>
              <span>{msg.question}</span>
            </span>
          ) : msg.question}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="w-6 h-6 rounded-full bg-rose-light flex items-center justify-center text-xs shrink-0">🩺</div>
        <div className="max-w-[70%]">
          {msg.answer === null ? (
            <div className="bg-sand rounded-xl rounded-bl-sm px-4 py-3">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <>
              <div className={[
                'rounded-xl rounded-bl-sm px-4 py-2.5 text-xs leading-relaxed',
                msg.isAlert ? 'bg-amber-light border border-[#FAC775] text-amber' : 'bg-sand text-ink',
              ].join(' ')}>
                {msg.isAlert && <span className="mr-1">⚠️</span>}
                {renderMarkdown(msg.answer)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {msg.source && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-light">
                    <span className="w-1 h-1 rounded-full bg-rose-mid inline-block" />
                    {msg.source}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onSpeak}
                  aria-label={isSpeaking ? stopLabel : speakLabel}
                  title={isSpeaking ? stopLabel : speakLabel}
                  className={[
                    'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors',
                    isSpeaking
                      ? 'border-rose-mid text-rose bg-rose-light'
                      : 'border-sand-mid text-ink-light hover:text-ink hover:bg-sand',
                  ].join(' ')}
                >
                  <SpeakerIcon playing={isSpeaking} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const location = useLocation()
  const { t, uiLang } = useUILang()
  const [sessionMessages, setSessionMessages] = useState<LocalMessage[]>([])
  const [historyMessages, setHistoryMessages] = useState<LocalMessage[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [lang, setLang] = useState<Language>(uiLang === 'AR' ? 'ARABIC' : 'FRENCH')

  useEffect(() => {
    setLang(uiLang === 'AR' ? 'ARABIC' : 'FRENCH')
  }, [uiLang])
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoPromptSent = useRef(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const [speakingKey, setSpeakingKey] = useState<string | null>(null)
  const [sosModal, setSosModal] = useState(false)
  const [sosNote, setSosNote] = useState('')
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null)
  const [sosSuccess, setSosSuccess] = useState(false)

  const { mutate: triggerSos, isPending: isSosPending } = useMutation({
    mutationFn: () => createAlert('MANUAL', sosNote.trim() || undefined),
    onSuccess: (res) => {
      if (res?.id) { setActiveAlertId(res.id); setSosSuccess(true) }
      setSosModal(false)
    },
  })

  const { mutate: cancelSos } = useMutation({
    mutationFn: () => cancelAlert(activeAlertId!),
    onSuccess: () => { setActiveAlertId(null); setSosSuccess(false) },
  })

  function speak(text: string, key: string) {
    if (!('speechSynthesis' in window)) return
    if (speakingKey === key) {
      window.speechSynthesis.cancel()
      setSpeakingKey(null)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = /[؀-ۿ]/.test(text) ? 'ar-MA' : 'fr-FR'
    utterance.rate = 0.95
    utterance.onend = () => setSpeakingKey(null)
    utterance.onerror = () => setSpeakingKey(null)
    setSpeakingKey(key)
    window.speechSynthesis.speak(utterance)
  }

  const QUICK_PROMPTS = [
    t('promptBP'),
    t('promptAlerts'),
    t('promptBirth'),
    t('promptNutrition'),
    t('promptCesarean'),
    t('promptPostpartum'),
  ]

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: getChatHistory,
  })

  useEffect(() => {
    if (historyData?.data) {
      setHistoryMessages(historyData.data.map((item) => ({ question: item.question, answer: item.answer, source: item.source })))
    }
  }, [historyData])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionMessages])

  useEffect(() => {
    const autoPrompt = (location.state as { autoPrompt?: string } | null)?.autoPrompt
    if (autoPrompt && !autoPromptSent.current) {
      autoPromptSent.current = true
      send(autoPrompt)
      window.history.replaceState({}, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { mutate: send, isPending } = useMutation({
    mutationFn: (question: string) => askQuestion({ question, language: lang }),
    onMutate: (question) => {
      setSessionMessages((prev) => [...prev, { question, answer: null }])
    },
    onSuccess: (res) => {
      setSessionMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findLastIndex((m) => m.answer === null)
        if (idx !== -1) {
          const answer = res.data?.answer ?? t('chatNoAnswer')
          const source = res.data?.source
          const lower = answer.toLowerCase()
          const isAlert = lower.includes('urgence') || lower.includes('immédiatement') || lower.includes('appelez le 15') || lower.includes('samu') || lower.includes('appel d\'urgence') || lower.includes('عاجل') || lower.includes('فوراً') || (lower.includes('urgent') && !lower.includes('pas urgent'))
          updated[idx] = { ...updated[idx], answer, source, isAlert }
        }
        return updated
      })
    },
    onError: () => {
      setSessionMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findLastIndex((m) => m.answer === null)
        if (idx !== -1) updated[idx] = { ...updated[idx], answer: t('chatError') }
        return updated
      })
    },
  })

  const { mutate: sendVoice, isPending: isVoicePending } = useMutation({
    mutationFn: (blob: Blob) => askVoice(blob, lang),
    onMutate: () => {
      setSessionMessages((prev) => [...prev, { question: t('chatVoiceMessage'), answer: null, isVoice: true }])
    },
    onSuccess: (res) => {
      setSessionMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findLastIndex((m) => m.answer === null)
        if (idx !== -1) {
          const answer = res.data?.answer ?? t('chatNoAnswer')
          const transcribedText =
            res.data?.transcribedText ??
            res.data?.transcription ??
            res.data?.question ??
            undefined
          const source = res.data?.source
          const lower = answer.toLowerCase()
          const isAlert = lower.includes('urgence') || lower.includes('immédiatement') || lower.includes('appelez le 15') || lower.includes('samu') || lower.includes('appel d\'urgence') || lower.includes('عاجل') || lower.includes('فوراً') || (lower.includes('urgent') && !lower.includes('pas urgent'))
          updated[idx] = { question: transcribedText ?? t('chatVoiceMessage'), answer, transcribedText, source, isAlert, isVoice: true }
        }
        return updated
      })
    },
    onError: () => {
      setSessionMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findLastIndex((m) => m.answer === null)
        if (idx !== -1) updated[idx] = { ...updated[idx], answer: t('chatError') }
        return updated
      })
    },
  })

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
        sendVoice(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch {
      // microphone permission denied or API not available
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

  function handleSend(question?: string) {
    const q = (question ?? input).trim()
    if (!q || isPending) return
    setInput('')
    send(q)
  }

  function handleKeyDown(e: { key: string; shiftKey: boolean; preventDefault(): void }) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex md:flex-col w-52 bg-sand border-r border-sand-mid shrink-0">
        <div className="px-4 py-3 border-b border-sand-mid">
          <p className="text-xs font-medium text-ink">{t('chatSidebarTitle')}</p>
          <p className="text-xs text-ink-light mt-0.5">{t('chatSidebarSub')}</p>
        </div>

        <div className="flex gap-1.5 px-3 py-2 border-b border-sand-mid">
          {LANG_LABELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={[
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                lang === l.value
                  ? 'bg-rose-light border-rose-mid text-rose-dark font-medium'
                  : 'border-sand-mid text-ink-mid hover:bg-white',
              ].join(' ')}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="text-xs text-ink-light px-2 py-1.5 font-medium">{t('chatFrequent')}</p>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className={[
                'w-full text-left px-2.5 py-2 rounded-lg mb-1 text-xs leading-snug border transition-colors',
                'border-transparent text-ink-mid hover:bg-rose-light hover:border-rose-mid hover:text-rose-dark',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-sand-mid shrink-0">
          <div className="w-7 h-7 rounded-full bg-rose-light flex items-center justify-center text-sm">
            🩺
          </div>
          <div>
            <p className="text-xs font-medium text-ink">{t('chatHeaderTitle')}</p>
            <p className="flex items-center gap-1.5 text-xs text-sage mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
              {t('chatOnline')}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowHistory((v) => !v)}
              className={['flex items-center gap-1 text-xs transition-colors',
                showHistory ? 'text-rose font-medium' : 'text-ink-light hover:text-ink'].join(' ')}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('chatHistory')}
            </button>
            <button onClick={() => setSosModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-white bg-[#D94F4F] hover:bg-[#b93e3e] px-2.5 py-1 rounded-full transition-colors">
              🆘 SOS
            </button>
          </div>
        </div>

        {/* SOS confirmation modal */}
        {sosModal && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setSosModal(false); setSosNote('') }}>
            <div className="bg-white rounded-2xl border border-[#D94F4F] p-6 max-w-xs mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🚨</div>
                <h3 className="font-serif text-base text-ink">Signaler une urgence ?</h3>
                <p className="text-xs text-ink-mid mt-2 leading-relaxed">
                  Un médecin dans votre zone sera immédiatement alerté et prendra en charge votre situation.
                </p>
              </div>
              <div className="mb-4">
                <textarea
                  value={sosNote}
                  onChange={(e) => setSosNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Décrivez brièvement votre situation (optionnel)…"
                  className="w-full px-3 py-2 rounded-xl border border-sand-mid text-sm text-ink placeholder:text-ink-light focus:ring-2 focus:ring-[#D94F4F] focus:border-transparent resize-none"
                />
                <p className="text-[10px] text-ink-light text-right mt-0.5">{sosNote.length}/500</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => triggerSos()} disabled={isSosPending}
                  className="flex-1 h-9 rounded-full bg-[#D94F4F] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#b93e3e] disabled:opacity-60">
                  {isSosPending && <LoadingSpinner size="sm" />}
                  Confirmer l'urgence
                </button>
                <button onClick={() => { setSosModal(false); setSosNote('') }}
                  className="h-9 px-4 rounded-full border border-sand-mid text-xs text-ink-mid hover:bg-sand">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active SOS banner */}
        {sosSuccess && activeAlertId && (
          <div className="bg-[#D94F4F] text-white px-4 py-2 flex items-center justify-between text-xs">
            <span>🚨 Alerte envoyée · Un médecin prend en charge votre situation</span>
            <button onClick={() => cancelSos()} className="underline ml-3 hover:no-underline shrink-0">
              Annuler
            </button>
          </div>
        )}


        {/* Mobile: language + quick prompts (horizontal scroll) */}
        <div className="md:hidden border-b border-sand-mid bg-sand">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sand-mid">
            {LANG_LABELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLang(l.value)}
                className={[
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  lang === l.value
                    ? 'bg-rose-light border-rose-mid text-rose-dark font-medium'
                    : 'border-sand-mid text-ink-mid',
                ].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-sand-mid text-ink-mid bg-white hover:bg-rose-light hover:border-rose-mid hover:text-rose-dark transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : (
            <>
              {showHistory && historyMessages.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-sand-mid" />
                    <span className="text-xs text-ink-light px-2">{t('chatPrevious')}</span>
                    <div className="flex-1 h-px bg-sand-mid" />
                  </div>
                  {historyMessages.map((msg, i) => (
                    <MessagePair key={`h-${i}`} msg={msg}
                      onSpeak={() => msg.answer && speak(msg.answer, `h-${i}`)}
                      isSpeaking={speakingKey === `h-${i}`}
                      speakLabel={t('chatSpeak')} stopLabel={t('chatStopSpeaking')} />
                  ))}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-sand-mid" />
                    <span className="text-xs text-ink-light px-2">{t('chatCurrent')}</span>
                    <div className="flex-1 h-px bg-sand-mid" />
                  </div>
                </>
              )}
              {showHistory && historyMessages.length === 0 && (
                <div className="text-center text-xs text-ink-light py-4">{t('chatNoHistory')}</div>
              )}

              {sessionMessages.length === 0 && !showHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-rose-light flex items-center justify-center text-2xl mb-4">🩺</div>
                  <p className="text-sm font-medium text-ink">{t('chatEmptyTitle')}</p>
                  <p className="text-xs text-ink-light mt-2 max-w-xs leading-relaxed">
                    {t('chatEmptySubtitle')}
                  </p>
                </div>
              ) : (
                sessionMessages.map((msg, i) => (
                  <MessagePair key={`s-${i}`} msg={msg}
                    onSpeak={() => msg.answer && speak(msg.answer, `s-${i}`)}
                    isSpeaking={speakingKey === `s-${i}`}
                    speakLabel={t('chatSpeak')} stopLabel={t('chatStopSpeaking')} />
                ))
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-1.5 bg-blush border-t border-sand-mid text-center">
          <p className="text-xs text-ink-light">{t('chatDisclaimer')}</p>
        </div>

        <div className="px-3 sm:px-5 py-3 border-t border-sand-mid flex items-center gap-2 sm:gap-3 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            disabled={isPending || isVoicePending || isRecording}
            className="flex-1 h-9 px-4 rounded-full border border-sand-mid bg-sand text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isPending || isVoicePending}
            aria-label={isRecording ? t('chatStopRecording') : t('chatStartRecording')}
            className={[
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50',
              isRecording
                ? 'bg-rose text-white animate-pulse'
                : 'text-ink-light hover:text-ink hover:bg-sand',
            ].join(' ')}
          >
            {isVoicePending ? (
              <LoadingSpinner size="sm" />
            ) : isRecording ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleSend()}
            disabled={isPending || isVoicePending || isRecording || !input.trim()}
            className="w-9 h-9 rounded-full bg-rose text-white flex items-center justify-center disabled:opacity-50 hover:bg-rose-dark transition-colors"
            aria-label={t('chatSend')}
          >
            {isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
