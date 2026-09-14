import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { TRANSLATIONS, type UILang, type TranslationKey } from '../i18n/translations'

interface UILanguageContextType {
  uiLang: UILang
  setUiLang: (lang: UILang) => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}

const UILanguageContext = createContext<UILanguageContextType>({
  uiLang: 'FR',
  setUiLang: () => {},
  t: (key) => key as string,
  isRTL: false,
})

export function UILanguageProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLangState] = useState<UILang>(() => {
    return (localStorage.getItem('uiLang') as UILang | null) ?? 'FR'
  })

  const isRTL = uiLang === 'AR'

  function setUiLang(lang: UILang) {
    setUiLangState(lang)
    localStorage.setItem('uiLang', lang)
  }

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = isRTL ? 'ar' : 'fr'
  }, [isRTL])

  function t(key: TranslationKey): string {
    return TRANSLATIONS[uiLang][key]
  }

  return (
    <UILanguageContext.Provider value={{ uiLang, setUiLang, t, isRTL }}>
      {children}
    </UILanguageContext.Provider>
  )
}

export function useUILang() {
  return useContext(UILanguageContext)
}
