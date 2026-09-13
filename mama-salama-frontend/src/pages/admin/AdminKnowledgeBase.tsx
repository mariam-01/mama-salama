import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKBDocuments, uploadKBDocument, deleteKBDocument } from '../../api/admin'
import type { KBDocument } from '../../api/admin'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_LABELS: Record<KBDocument['status'], string> = {
  PENDING: 'En attente', PROCESSING: 'Traitement…', DONE: 'Indexé', FAILED: 'Échec',
}
const STATUS_COLORS: Record<KBDocument['status'], string> = {
  PENDING: 'bg-amber-light text-amber', PROCESSING: 'bg-mauve-light text-mauve',
  DONE: 'bg-sage-light text-sage', FAILED: 'bg-[#FDEAEA] text-[#D94F4F]',
}
const LANG_LABELS: Record<KBDocument['language'], string> = { FRENCH: 'Français', ARABIC: 'Arabe', ENGLISH: 'Anglais' }

export default function AdminKnowledgeBase() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [lang, setLang] = useState<KBDocument['language']>('FRENCH')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['kbDocs'], queryFn: getKBDocuments })
  const docs = data ?? []

  const { mutate: upload, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadKBDocument(file, lang),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kbDocs'] }); if (fileRef.current) fileRef.current.value = '' },
  })

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteKBDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kbDocs'] }); setDeletingId(null) },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h2 className="font-serif text-2xl text-ink mb-1">Base de connaissances</h2>
      <p className="text-xs text-ink-light mb-6">{docs.length} document(s) indexé(s) dans ChromaDB</p>

      <div className="bg-white rounded-2xl border border-sand-mid p-5 mb-6">
        <h3 className="font-serif text-sm text-ink mb-4">Importer un document</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={lang} onChange={(e) => setLang(e.target.value as KBDocument['language'])}
            className="h-9 px-3 rounded-lg border border-sand-mid bg-white text-sm text-ink">
            {Object.entries(LANG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className={['h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors',
            isUploading ? 'bg-sand text-ink-light' : 'bg-rose text-white hover:bg-rose-dark'].join(' ')}>
            {isUploading ? <><LoadingSpinner size="sm" />Traitement en cours…</> : '📤 Choisir un fichier (PDF / TXT / DOCX)'}
            <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={handleFile} disabled={isUploading} />
          </label>
        </div>
        <p className="text-xs text-ink-light mt-2">Le fichier sera découpé, vectorisé et stocké dans ChromaDB automatiquement.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-mid overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-sand">
              <tr>
                {['Fichier', 'Langue', 'Statut', 'Chunks', 'Importé le', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-ink-mid font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-mid">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-blush transition-colors">
                  <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{doc.filename}</td>
                  <td className="px-4 py-3 text-ink-mid">{LANG_LABELS[doc.language]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-mid text-center">{doc.chunkCount ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-mid">{new Date(doc.uploadedAt).toLocaleDateString('fr-MA')}</td>
                  <td className="px-4 py-3">
                    {deletingId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[#D94F4F]">Confirmer ?</span>
                        <button onClick={() => remove(doc.id)} className="text-xs text-[#D94F4F] font-medium hover:underline">Oui</button>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-ink-mid hover:underline">Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(doc.id)}
                        className="text-xs text-[#D94F4F] hover:underline">Supprimer</button>
                    )}
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-light">Aucun document importé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
