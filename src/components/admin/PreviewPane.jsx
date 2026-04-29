import { useEffect, useRef, useState } from 'react'

const SIZES = {
  mobile: { w: 390, label: 'Móvil' },
  tablet: { w: 768, label: 'Tablet' },
  desktop: { w: 1280, label: 'Desktop' },
}

export default function PreviewPane({ slug, event, registerScroller, onClose }) {
  const [size, setSize] = useState('mobile')
  const [guestParam, setGuestParam] = useState('')
  const iframeRef = useRef(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Expone función imperativa al editor — sin estado, sin re-render
  useEffect(() => {
    if (!registerScroller) return
    const scroll = (section) => {
      if (!readyRef.current) return
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'scrollToSection', section },
        '*'
      )
    }
    registerScroller(scroll)
    return () => registerScroller(null)
  }, [registerScroller])

  useEffect(() => {
    if (!event || !readyRef.current) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'event-updated', event }, '*')
  }, [event])

  const params = new URLSearchParams()
  params.set('edit', '1')
  if (guestParam) params.set('g', guestParam)
  const url = `/i/${slug}?${params.toString()}`
  const w = SIZES[size].w

  return (
    <aside className="fixed inset-x-0 top-0 z-40 flex h-screen flex-col border-l border-ink/10 bg-ink/95 text-cream backdrop-blur md:left-auto md:right-0 md:w-1/2 lg:w-[55%]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/60">
            En vivo
          </span>
          <span className="truncate font-mono text-xs text-cream/80">/i/{slug}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(SIZES).map(([key, v]) => (
            <button
              key={key}
              onClick={() => setSize(key)}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                size === key
                  ? 'bg-cream text-ink'
                  : 'border border-cream/20 text-cream/70 hover:border-rust hover:text-rust'
              }`}
            >
              {v.label}
            </button>
          ))}
          <input
            placeholder="Token invitado"
            value={guestParam}
            onChange={(e) => setGuestParam(e.target.value)}
            className="hidden w-32 border border-cream/20 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cream placeholder:text-cream/40 focus:border-rust focus:outline-none lg:block"
          />
          <button
            onClick={onClose}
            className="rounded-full border border-cream/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-cream/70 hover:border-rust hover:text-rust"
            title="Cerrar (Esc)"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-auto bg-ink/40 p-3 md:p-5">
        <div
          className="h-full w-full overflow-hidden rounded-lg bg-cream shadow-2xl"
          style={{ maxWidth: w }}
        >
          <iframe
            ref={iframeRef}
            src={url}
            title="Vista previa"
            className="h-full w-full border-0"
            onLoad={() => {
              readyRef.current = true
              if (event) {
                iframeRef.current?.contentWindow?.postMessage(
                  { type: 'event-updated', event },
                  '*'
                )
              }
            }}
          />
        </div>
      </div>
    </aside>
  )
}
