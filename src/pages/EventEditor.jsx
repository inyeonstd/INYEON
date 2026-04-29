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
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [slugDraft, setSlugDraft] = useState('')
  const scrollFnRef = useRef(null)
  const lastTargetRef = useRef(null)
  const eventRef = useRef(null)
  const saveVersionRef = useRef(0)
  const registerScroller = useCallback((fn) => {
    scrollFnRef.current = fn
  }, [])
  const scrollPreviewTo = (target) => {
    if (lastTargetRef.current === target) return
    lastTargetRef.current = target
    scrollFnRef.current?.(target)
  }

  useEffect(() => {
    eventRef.current = event
  }, [event])

  useEffect(() => {
    if (event?.slug) setSlugDraft(event.slug)
  }, [event?.id, event?.slug])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getEvent(id)
      .then((found) => {
        if (!active) return
        if (!found) {
          nav('/app', { replace: true })
          return
        }
        setEvent(found)
      })
      .catch((err) => {
        if (active) setError(err?.message || 'No se pudo cargar la boda.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, nav])

  const save = useCallback(async (patch) => {
    const current = eventRef.current
    if (!current) return null
    const version = saveVersionRef.current + 1
    saveVersionRef.current = version
    const optimistic = { ...current, ...patch }
    eventRef.current = optimistic
    setEvent(optimistic)
    setError('')
    try {
      const saved = await updateEvent(current.id, patch)
      if (saveVersionRef.current === version) {
        eventRef.current = saved
        setEvent(saved)
      }
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1200)
      return saved
    } catch (err) {
      setError(err?.message || 'No se pudo guardar.')
      return null
    }
  }, [])

  // Migración suave: añade secciones nuevas a eventos creados antes
  useEffect(() => {
    if (!event) return
    const ensure = [
      { type: 'dresscode', order_index: 6, is_visible: true, content: { items: [] } },
    ]
    const missing = ensure.filter((d) => !event.sections?.some((s) => s.type === d.type))
    if (missing.length === 0) return
    save({ sections: [...(event.sections || []), ...missing] })
  }, [event?.id, save])

  // Mensajes de edición in-place desde la vista previa
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type !== 'edit' || !e.data.path) return
      const current = eventRef.current
      if (!current) return
      const patch = applyEdit(current, e.data.path, e.data.value ?? '')
      if (patch) save(patch)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [save])

  const dateValue = useMemo(() => {
    if (!event?.event_date) return ''
    const d = new Date(event.event_date)
    if (Number.isNaN(d.getTime())) return ''
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d - tz).toISOString().slice(0, 16)
  }, [event?.event_date])

  if (loading) {
    return (
      <AdminShell>
        <Card className="text-center">
          <p className="font-display text-2xl italic">Cargando editor...</p>
        </Card>
      </AdminShell>
    )
  }

  if (!event) return null

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

  const getSection = (type) => event.sections.find((s) => s.type === type)

  const commitSlug = () => {
    const nextSlug = slugDraft || event.slug
    if (nextSlug !== event.slug) save({ slug: nextSlug })
  }

  const focusOn = (target) => ({
    onFocusCapture: () => scrollPreviewTo(target),
    onMouseEnter: () => scrollPreviewTo(target),
    'data-preview-target': target,
  })

  return (
    <AdminShell eventTitle={event.title} eventId={event.id} fullWidth={showPreview}>
      <div
        className={`transition-[width] duration-200 ${
          showPreview ? 'md:w-[50%] md:pr-6 lg:w-[45%]' : 'mx-auto max-w-6xl'
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/app"
            className="inline-flex min-h-10 items-center border border-ink/15 bg-white/70 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70 transition-colors hover:border-rust hover:text-rust"
          >
            Regresar
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {savedFlash && (
              <span className="px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
                Guardado
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex min-h-10 items-center border border-ink/15 bg-white/70 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70 transition-colors hover:border-rust hover:text-rust"
            >
              {showPreview ? 'Ocultar preview' : 'Vista previa'}
            </button>
            <Link
              to={`/i/${event.slug}`}
              target="_blank"
              className="inline-flex min-h-10 items-center border border-ink/15 bg-white/70 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70 transition-colors hover:border-rust hover:text-rust"
            >
              Abrir
            </Link>
            <Link
              to={`/app/event/${event.id}/guests`}
              className="inline-flex min-h-10 items-center border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-cream transition-colors hover:border-rust hover:bg-rust"
            >
              Invitados
            </Link>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-rust/30 bg-rust/5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-rust">
              {error}
            </p>
          </Card>
        )}

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
                value={slugDraft}
                onChange={(e) =>
                  setSlugDraft(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '')
                  )
                }
                onBlur={commitSlug}
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
          event={event}
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
              <img
                src={src}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
                className="relative z-10 h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center border border-ink/15 bg-white/50 px-3 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40">
                Imagen no disponible
              </div>
              <button
                onClick={() => onChange(gallery.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 z-20 bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cream opacity-0 transition-opacity group-hover:opacity-100"
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
