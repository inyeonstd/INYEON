import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AdminShell,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
} from '../components/admin/Shell'
import { getEvent, updateEvent } from '../lib/store'
import { applyEdit } from '../lib/edit'
import PreviewPane from '../components/admin/PreviewPane'
import ImageInput from '../components/admin/ImageInput'
import { uploadImage } from '../lib/upload'

export default function EventEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const [event, setEvent] = useState(() => getEvent(id))
  const [savedFlash, setSavedFlash] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const scrollFnRef = useRef(null)
  const lastTargetRef = useRef(null)
  const registerScroller = useCallback((fn) => {
    scrollFnRef.current = fn
  }, [])
  const scrollPreviewTo = (target) => {
    if (lastTargetRef.current === target) return
    lastTargetRef.current = target
    scrollFnRef.current?.(target)
  }

  useEffect(() => {
    if (!event) nav('/app', { replace: true })
  }, [event, nav])

  // Migración suave: añade secciones nuevas a eventos creados antes
  useEffect(() => {
    if (!event) return
    const ensure = [
      { type: 'dresscode', order_index: 6, is_visible: true, content: { items: [] } },
    ]
    const missing = ensure.filter((d) => !event.sections?.some((s) => s.type === d.type))
    if (missing.length === 0) return
    const next = updateEvent(event.id, {
      sections: [...(event.sections || []), ...missing],
    })
    setEvent(next)
  }, [event?.id])

  // Mensajes de edición in-place desde la vista previa
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type !== 'edit' || !e.data.path) return
      setEvent((current) => {
        if (!current) return current
        const patch = applyEdit(current, e.data.path, e.data.value ?? '')
        if (!patch) return current
        const next = updateEvent(current.id, patch)
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1200)
        return next
      })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  if (!event) return null

  const save = (patch) => {
    const next = updateEvent(event.id, patch)
    setEvent(next)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const updateSection = (type, patch) => {
    const sections = event.sections.map((s) =>
      s.type === type ? { ...s, ...patch } : s
    )
    save({ sections })
  }

  const setVisibility = (type, isVisible) =>
    updateSection(type, { is_visible: isVisible })

  const updateSectionContent = (type, contentPatch) => {
    const target = event.sections.find((s) => s.type === type)
    const content = { ...(target?.content || {}), ...contentPatch }
    updateSection(type, { content })
  }

  const dateValue = useMemo(() => {
    const d = new Date(event.event_date)
    if (Number.isNaN(d.getTime())) return ''
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d - tz).toISOString().slice(0, 16)
  }, [event.event_date])

  const getSection = (type) => event.sections.find((s) => s.type === type)

  const focusOn = (target) => ({
    onFocusCapture: () => scrollPreviewTo(target),
    onMouseEnter: () => scrollPreviewTo(target),
    'data-preview-target': target,
  })

  return (
    <AdminShell eventTitle={event.title} eventId={event.id}>
      <div
        className={`transition-[padding] duration-300 ${
          showPreview ? 'md:pr-[50%] lg:pr-[55%]' : ''
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/app"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-rust"
          >
            ← Todas las bodas
          </Link>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-rust">
                Guardado
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 hover:text-rust"
            >
              {showPreview ? 'Ocultar preview' : 'Vista previa'}
            </button>
            <Link
              to={`/i/${event.slug}`}
              target="_blank"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 hover:text-rust"
            >
              Abrir ↗
            </Link>
            <Link
              to={`/app/event/${event.id}/guests`}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink hover:text-rust"
            >
              Invitados →
            </Link>
          </div>
        </div>

        <Card className="mb-6 border-rust/30 bg-rust/5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-rust">
            ✎ Edición en vivo
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Haz click sobre cualquier texto, hora o lugar de la vista previa para
            editarlo directamente. Acá abajo solo quedan los ajustes técnicos
            (fecha, URLs, visibilidad).
          </p>
        </Card>

        {/* DATOS PRINCIPALES */}
        <Card className="mb-6" {...focusOn('hero')}>
          <SectionTitle num="·">Datos generales</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Slug (URL)" hint={`/i/${event.slug}`}>
              <Input
                value={event.slug}
                onChange={(e) =>
                  save({
                    slug:
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '') || event.slug,
                  })
                }
              />
            </Field>
            <Field label="Fecha y hora">
              <Input
                type="datetime-local"
                value={dateValue}
                onChange={(e) => {
                  const d = new Date(e.target.value)
                  if (!Number.isNaN(d.getTime())) save({ event_date: d.toISOString() })
                }}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Imagen de portada" hint="Pega un URL o sube un archivo">
                <ImageInput
                  value={event.cover_image_url || ''}
                  onChange={(url) => save({ cover_image_url: url })}
                />
              </Field>
              {event.cover_image_url && (
                <img
                  src={event.cover_image_url}
                  alt=""
                  className="mt-3 h-32 w-full rounded object-cover md:h-40"
                />
              )}
            </div>
            <Field label="Estado">
              <select
                value={event.status}
                onChange={(e) => save({ status: e.target.value })}
                className="w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm focus:border-rust focus:outline-none"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* PADRES — solo visibilidad */}
        <Card className="mb-6" {...focusOn('parents')}>
          <SectionTitle num="01">Padres</SectionTitle>
          <VisibleToggle
            value={getSection('parents')?.is_visible !== false}
            onChange={(v) => setVisibility('parents', v)}
          />
        </Card>

        {/* PROGRAMA — visibilidad + maps_url por evento */}
        <Card className="mb-6" {...focusOn('events')}>
          <SectionTitle num="02">Programa</SectionTitle>
          <PlaceTechFields
            label="Ceremonia"
            section={getSection('ceremony')}
            onContent={(p) => updateSectionContent('ceremony', p)}
            onVisible={(v) => setVisibility('ceremony', v)}
          />
          <div className="my-5 border-t border-ink/10" />
          <PlaceTechFields
            label="Recepción"
            section={getSection('reception')}
            onContent={(p) => updateSectionContent('reception', p)}
            onVisible={(v) => setVisibility('reception', v)}
          />
        </Card>

        {/* ITINERARIO — añadir/quitar items */}
        <Card className="mb-6" {...focusOn('itinerary')}>
          <SectionTitle num="03">Itinerario</SectionTitle>
          <ItineraryAdmin
            section={getSection('itinerary')}
            onUpdate={(content) => updateSectionContent('itinerary', content)}
            onVisible={(v) => setVisibility('itinerary', v)}
          />
        </Card>

        {/* MESA DE REGALOS — añadir/quitar tiendas + URLs */}
        <Card className="mb-6" {...focusOn('registry')}>
          <SectionTitle num="04">Mesa de regalos</SectionTitle>
          <RegistryAdmin
            section={getSection('registry')}
            onUpdate={(content) => updateSectionContent('registry', content)}
            onVisible={(v) => setVisibility('registry', v)}
          />
        </Card>

        {/* HOSPEDAJE — solo visibilidad */}
        <Card className="mb-6" {...focusOn('lodging')}>
          <SectionTitle num="05">Hospedaje</SectionTitle>
          <VisibleToggle
            value={getSection('lodging')?.is_visible !== false}
            onChange={(v) => setVisibility('lodging', v)}
          />
        </Card>

        {/* CÓDIGO DE VESTIMENTA — añadir/quitar referencias */}
        <Card className="mb-6" {...focusOn('dresscode')}>
          <SectionTitle num="06">Código de vestimenta</SectionTitle>
          <DresscodeAdmin
            section={getSection('dresscode')}
            onUpdate={(content) => updateSectionContent('dresscode', content)}
            onVisible={(v) => setVisibility('dresscode', v)}
          />
        </Card>

        {/* GALERÍA — añadir/quitar URLs */}
        <Card className="mb-6" {...focusOn('gallery')}>
          <SectionTitle num="07">Galería</SectionTitle>
          <GalleryAdmin
            gallery={event.gallery || []}
            onChange={(gallery) => save({ gallery })}
          />
        </Card>
      </div>

      {!showPreview && (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cream shadow-lg shadow-ink/20 transition-all hover:bg-rust md:bottom-8 md:right-8"
        >
          Vista previa
          <span aria-hidden>👁</span>
        </button>
      )}

      {showPreview && (
        <PreviewPane
          slug={event.slug}
          registerScroller={registerScroller}
          onClose={() => setShowPreview(false)}
        />
      )}
    </AdminShell>
  )
}

function VisibleToggle({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-rust"
      />
      Visible en la invitación
    </label>
  )
}

function PlaceTechFields({ label, section, onContent, onVisible }) {
  const c = section?.content || {}
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        {label}
      </p>
      <VisibleToggle
        value={section?.is_visible !== false}
        onChange={onVisible}
      />
      <Field label="Link Google Maps">
        <Input
          value={c.maps_url || ''}
          onChange={(e) => onContent({ maps_url: e.target.value })}
          placeholder="https://maps.google.com/..."
        />
      </Field>
    </div>
  )
}

function ItineraryAdmin({ section, onUpdate, onVisible }) {
  const items = section?.content?.items || []
  const setItems = (next) => onUpdate({ items: next })
  return (
    <div className="space-y-4">
      <VisibleToggle
        value={section?.is_visible !== false}
        onChange={onVisible}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        {items.length} {items.length === 1 ? 'momento' : 'momentos'} · edita su
        contenido en la vista previa.
      </p>
      <div className="space-y-1">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center justify-between border border-ink/10 px-3 py-2 text-sm"
          >
            <span className="font-mono text-ink/70">
              {it.time || '—'} · {it.label || '—'}
            </span>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={() => setItems([...items, { time: '00:00', label: 'Nuevo momento' }])}
      >
        + Añadir momento
      </Button>
    </div>
  )
}

function RegistryAdmin({ section, onUpdate, onVisible }) {
  const items = section?.content?.items || []
  const setItems = (next) => onUpdate({ items: next })
  return (
    <div className="space-y-4">
      <VisibleToggle
        value={section?.is_visible !== false}
        onChange={onVisible}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        Edita nombre y código en la vista previa. La URL se queda acá.
      </p>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="border border-ink/10 p-3">
            <p className="mb-2 font-display text-lg italic">
              {it.name || 'Sin nombre'}
            </p>
            <Field label="URL">
              <Input
                placeholder="https://..."
                value={it.url || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...it, url: e.target.value }
                  setItems(next)
                }}
              />
            </Field>
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-rust"
            >
              Eliminar tienda
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={() =>
          setItems([
            ...items,
            { name: 'Nueva tienda', code: 'Núm. ____', url: '' },
          ])
        }
      >
        + Añadir tienda
      </Button>
    </div>
  )
}

function DresscodeAdmin({ section, onUpdate, onVisible }) {
  const items = section?.content?.items || []
  const setItems = (next) => onUpdate({ items: next })
  return (
    <div className="space-y-4">
      <VisibleToggle
        value={section?.is_visible !== false}
        onChange={onVisible}
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
        Edita el título de cada referencia en la vista previa. La imagen y el
        link de inspiración se guardan acá.
      </p>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="border border-ink/10 p-3">
            <p className="mb-2 font-display text-lg italic">
              {it.label || 'Sin título'}
            </p>
            <Field label="Imagen" hint="URL o archivo local">
              <ImageInput
                value={it.image_url || ''}
                onChange={(url) => {
                  const next = [...items]
                  next[i] = { ...it, image_url: url }
                  setItems(next)
                }}
              />
            </Field>
            <div className="mt-2">
              <Field label="Link de referencia (Pinterest, etc.)">
                <Input
                  placeholder="https://..."
                  value={it.url || ''}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = { ...it, url: e.target.value }
                    setItems(next)
                  }}
                />
              </Field>
            </div>
            {it.image_url && (
              <img
                src={it.image_url}
                alt=""
                className="mt-2 h-24 w-full rounded object-cover"
              />
            )}
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-rust"
            >
              Eliminar referencia
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        type="button"
        onClick={() =>
          setItems([
            ...items,
            { label: 'Estilo', url: '', image_url: '' },
          ])
        }
      >
        + Añadir referencia
      </Button>
    </div>
  )
}

function GalleryAdmin({ gallery, onChange }) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const addUrl = () => {
    const url = draft.trim()
    if (!url) return
    onChange([...gallery, url])
    setDraft('')
  }

  const addFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setBusy(true)
    setError('')
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)))
      onChange([...gallery, ...urls])
    } catch (err) {
      setError(err?.message || 'No se pudo cargar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          placeholder="https://..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="button" onClick={addUrl}>
          Añadir URL
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Cargando…' : 'Subir archivo'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={addFiles}
        />
      </div>
      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
          {error}
        </p>
      )}
      {gallery.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
          Sin fotos aún.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {gallery.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-ink/10">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => onChange(gallery.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cream opacity-0 transition-opacity group-hover:opacity-100"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
