import { useRef, useState } from 'react'
import { Input } from './Shell'
import { uploadImage } from '../../lib/upload'

export default function ImageInput({ value, onChange, placeholder = 'https://...' }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = () => fileRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-elegir el mismo archivo
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la imagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="flex-1">
          <Input
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 border border-ink/20 bg-white/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-ink hover:border-rust hover:text-rust disabled:opacity-50"
        >
          {busy ? 'Cargando…' : 'Subir archivo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
          {error}
        </p>
      )}
    </div>
  )
}
