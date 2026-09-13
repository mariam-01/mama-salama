import { useUILang } from '../context/UILanguageContext'
import type { UILang } from '../i18n/translations'

export default function LangToggle() {
  const { uiLang, setUiLang } = useUILang()
  return (
    <div className="flex rounded-full border border-sand-mid overflow-hidden shrink-0">
      {(['FR', 'AR'] as UILang[]).map((l) => (
        <button
          key={l}
          onClick={() => setUiLang(l)}
          className={[
            'px-2.5 py-1 text-xs font-medium transition-colors',
            uiLang === l ? 'bg-rose text-white' : 'text-ink-mid hover:bg-sand',
          ].join(' ')}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
