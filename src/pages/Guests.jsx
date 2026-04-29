import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AdminShell,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
} from '../components/admin/Shell'
import {
  addGuest,
  buildGuestLink,
  getEvent,
  removeGuest,
  updateGuest,
} from '../lib/store'

function getAttendeeCount(guest) {
  if (!guest) return 0
  try {
    const parsed = JSON.parse(guest.note || '{}')
    const attendees = Number(parsed.attendees)
    if (Number.isFinite(attendees)) return Math.max(0, attendees)
  } catch {}
  return guest.rsvp === 'attending' ? Number(guest.passes) || 1 : 0
}

function getGuestNote(guest) {
  try {
    const parsed = JSON.parse(guest?.note || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function getRegistryActivity(guests) {
  const byList = new Map()
  const byGuest = []
  let total = 0

  for (const guest of guests) {
    const clicks = getGuestNote(guest).analytics?.registry_clicks || {}
    let guestTotal = 0
    let lastClick = ''

    for (const item of Object.values(clicks)) {
      const count = Number(item?.count) || 0
      if (!count) continue
      const label = item.label || 'Lista de regalo'
      const key = item.url || label
      const current = byList.get(key) || {
        label,
        url: item.url || '',
        count: 0,
        guests: 0,
        last_clicked_at: '',
        viewers: [],
      }
      current.count += count
      current.guests += 1
      current.viewers.push({
        guest,
        count,
        last_clicked_at: item.last_clicked_at,
      })
      if (!current.last_clicked_at || item.last_clicked_at > current.last_clicked_at) {
        current.last_clicked_at = item.last_clicked_at
      }
      byList.set(key, current)
      total += count
      guestTotal += count
      if (!lastClick || item.last_clicked_at > lastClick) lastClick = item.last_clicked_at
    }

    if (guestTotal > 0) byGuest.push({ guest, count: guestTotal, last_clicked_at: lastClick })
  }

  return {
    total,
    lists: Array.from(byList.values())
      .map((item) => ({
        ...item,
        viewers: item.viewers.sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count),
    guests: byGuest.sort((a, b) => b.count - a.count),
  }
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  try {
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return 'Sin fecha'
  }
}

export default function Guests() {
  const { id } = useParams()
  const nav = useNavigate()
  const [event, setEvent] = useState(null)
  const [draft, setDraft] = useState({ name: '', kind: 'single', passes: 1, note: '' })
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyticsView, setAnalyticsView] = useState('guests')
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({
    name: '',
    kind: 'single',
    passes: 1,
    rsvp: 'pending',
  })
  const [savingId, setSavingId] = useState(null)

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

  if (loading) {
    return (
      <AdminShell>
        <Card className="text-center">
          <p className="font-display text-2xl italic">Cargando invitados...</p>
        </Card>
      </AdminShell>
    )
  }

  if (!event) return null

  const refresh = async () => {
    const next = await getEvent(id)
    if (next) setEvent(next)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    setError('')
    try {
      await addGuest(event.id, draft)
      setDraft({ name: '', kind: 'single', passes: 1, note: '' })
      await refresh()
    } catch (err) {
      setError(err?.message || 'No se pudo añadir el invitado.')
    }
  }

  const buildShareUrl = (slug, token) => buildGuestLink(slug, token)

  const copy = async (g) => {
    const link = buildShareUrl(event.slug, g.token)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(g.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      window.prompt('Copia este link:', link)
    }
  }

  const shareWhatsApp = (g) => {
    const link = buildShareUrl(event.slug, g.token)
    const text = `${event.title || 'Estás invitado/a'}\n${link}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const startEdit = (g) => {
    setEditingId(g.id)
    setEditDraft({
      name: g.name || '',
      kind: g.kind || 'single',
      passes: Number(g.passes) || 1,
      rsvp: g.rsvp || 'pending',
    })
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft({ name: '', kind: 'single', passes: 1, rsvp: 'pending' })
  }

  const saveGuestEdit = async (guestId) => {
    if (!editDraft.name.trim()) return
    setSavingId(guestId)
    setError('')
    try {
      await updateGuest(event.id, guestId, {
        name: editDraft.name.trim(),
        kind: editDraft.kind,
        passes: Math.max(1, Number(editDraft.passes) || 1),
        rsvp: editDraft.rsvp,
        responded_at:
          editDraft.rsvp && editDraft.rsvp !== 'pending'
            ? new Date().toISOString()
            : null,
      })
      cancelEdit()
      await refresh()
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el invitado.')
    } finally {
      setSavingId(null)
    }
  }

  const guests = event.guests || []
  const totalPasses = guests.reduce((acc, g) => acc + (Number(g.passes) || 1), 0)
  const attendingGuests = guests.filter((g) => g.rsvp === 'attending')
  const declinedGuests = guests.filter((g) => g.rsvp === 'declined')
  const pendingGuests = guests.filter((g) => !g.rsvp || g.rsvp === 'pending')
  const attendingPasses = attendingGuests.reduce((acc, g) => acc + getAttendeeCount(g), 0)
  const declinedPasses = declinedGuests.reduce((acc, g) => acc + (Number(g.passes) || 1), 0)
  const pendingPasses = pendingGuests.reduce((acc, g) => acc + (Number(g.passes) || 1), 0)
  const registryActivity = getRegistryActivity(guests)

  return (
    <AdminShell eventTitle={event.title} eventId={event.id}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-rust"
        >
          ← Todas las bodas
        </Link>
        <Link
          to={`/app/event/${event.id}`}
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink hover:text-rust"
        >
          ← Editor
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionTitle num="·">Lista de invitados</SectionTitle>
          <p className="font-mono text-xs text-ink/50">
            {guests.length} {guests.length === 1 ? 'entrada' : 'entradas'} · {totalPasses}{' '}
            pases totales
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="!p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Asistirán
          </p>
          <p className="mt-2 font-display text-3xl italic">{attendingPasses}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            {attendingGuests.length} {attendingGuests.length === 1 ? 'respuesta' : 'respuestas'}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Pendientes
          </p>
          <p className="mt-2 font-display text-3xl italic">{pendingPasses}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            {pendingGuests.length} {pendingGuests.length === 1 ? 'entrada' : 'entradas'}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
            No asistirán
          </p>
          <p className="mt-2 font-display text-3xl italic">{declinedPasses}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
            {declinedGuests.length} {declinedGuests.length === 1 ? 'respuesta' : 'respuestas'}
          </p>
        </Card>
      </div>

      <Card className="mb-8 !p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setAnalyticsOpen((value) => !value)}
          aria-expanded={analyticsOpen}
          className="flex w-full items-center justify-between gap-4 border-b border-ink/10 px-4 py-3 text-left transition-colors hover:bg-white/45"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
              Actividad de listas
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
              {registryActivity.total} aperturas · {registryActivity.guests.length}{' '}
              {registryActivity.guests.length === 1 ? 'invitado' : 'invitados'} ·{' '}
              {registryActivity.lists.length} {registryActivity.lists.length === 1 ? 'lista' : 'listas'}
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-rust">
            {analyticsOpen ? 'Ocultar' : 'Abrir'}
          </span>
        </button>

        {analyticsOpen && (
          <>
            <div className="grid grid-cols-1 border-b border-ink/10 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setAnalyticsView('guests')}
                className={`p-4 text-left transition-colors md:border-r md:border-ink/10 ${
                  analyticsView === 'guests' ? 'bg-rust/5' : 'hover:bg-white/45'
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                  Aperturas
                </p>
                <p className="mt-2 font-display text-3xl italic">{registryActivity.total}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Por invitado
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsView('responses')}
                className={`p-4 text-left transition-colors md:border-r md:border-ink/10 ${
                  analyticsView === 'responses' ? 'bg-rust/5' : 'hover:bg-white/45'
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                  Invitados
                </p>
                <p className="mt-2 font-display text-3xl italic">{registryActivity.guests.length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Con clicks
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsView('lists')}
                className={`p-4 text-left transition-colors ${
                  analyticsView === 'lists' ? 'bg-rust/5' : 'hover:bg-white/45'
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                  Lista más vista
                </p>
                <p className="mt-3 truncate font-display text-xl italic">
                  {registryActivity.lists[0]?.label || 'Sin actividad'}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Por lista
                </p>
              </button>
            </div>
            <AnalyticsPanel activity={registryActivity} view={analyticsView} />
          </>
        )}
      </Card>

      {error && (
        <Card className="mb-6 border-rust/30 bg-rust/5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-rust">
            {error}
          </p>
        </Card>
      )}

      <Card className="mb-8">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <Field label="Nombre / Familia">
              <Input
                placeholder="Familia Cavazos · o · Andrés Pérez"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Tipo">
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
                className="w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm focus:border-rust focus:outline-none"
              >
                <option value="single">Individual</option>
                <option value="group">Grupo / Familia</option>
              </select>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Pases">
              <Input
                type="number"
                min={1}
                value={draft.passes}
                onChange={(e) => setDraft({ ...draft, passes: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              + Añadir
            </Button>
          </div>
        </form>
      </Card>

      {guests.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-2xl italic">Aún no hay invitados.</p>
          <p className="mt-2 font-mono text-xs text-ink/50">
            Añade el primero con el formulario de arriba.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {guests.map((g) => {
            const guestPasses = Number(g.passes) || 1
            const attendeeCount = Math.min(guestPasses, getAttendeeCount(g))
            const isEditing = editingId === g.id
            const guestAnalytics = getGuestNote(g).analytics || {}
            const registryClicks = Number(guestAnalytics.total_registry_clicks) || 0
            return (
            <Card
              key={g.id}
              className={`!p-0 overflow-hidden ${
                isEditing ? 'border-rust/35 bg-rust/5' : ''
              }`}
            >
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl italic">{g.name}</p>
                    <RsvpBadge status={g.rsvp} />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                    {g.kind === 'group' ? 'Grupo' : 'Individual'} · {guestPasses}{' '}
                    {guestPasses === 1 ? 'pase' : 'pases'}
                  </p>
                  {g.rsvp === 'attending' && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
                      {attendeeCount} de {guestPasses}{' '}
                      {guestPasses === 1 ? 'asistente confirmado' : 'asistentes confirmados'}
                    </p>
                  )}
                  {g.rsvp === 'declined' && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                      Respuesta recibida
                    </p>
                  )}
                  {registryClicks > 0 && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                      {registryClicks} {registryClicks === 1 ? 'apertura de lista' : 'aperturas de listas'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-4">
                  <p className="break-all font-mono text-xs text-ink/55">
                    /i/{event.slug}?g={g.token.slice(0, 8)}...
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35">
                    {guestPasses} {guestPasses === 1 ? 'pase asignado' : 'pases asignados'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:col-span-4 md:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => (isEditing ? cancelEdit() : startEdit(g))}
                    className={`inline-flex min-h-10 items-center justify-center border px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                      isEditing
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink/15 bg-white/55 text-ink hover:border-rust hover:text-rust'
                    }`}
                  >
                    {isEditing ? 'Cerrar' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(g)}
                    className="inline-flex min-h-10 items-center justify-center bg-ink px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-rust"
                  >
                    {copiedId === g.id ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => shareWhatsApp(g)}
                    className="inline-flex min-h-10 items-center justify-center border border-ink/15 bg-[#25D366]/90 px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#1ebe57]"
                  >
                    WhatsApp
                  </button>
                  <Link
                    to={`/i/${event.slug}?g=${g.token}`}
                    target="_blank"
                    className="inline-flex min-h-10 items-center justify-center border border-ink/15 bg-white/55 px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-rust hover:text-rust"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => {
                      if (!confirm('¿Eliminar este invitado?')) return
                      removeGuest(event.id, g.id)
                        .then(refresh)
                        .catch((err) =>
                          setError(err?.message || 'No se pudo eliminar el invitado.')
                        )
                    }}
                    className="inline-flex min-h-10 items-center justify-center border border-ink/15 px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45 transition-colors hover:border-rust hover:text-rust"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {isEditing && (
                <div className="border-t border-rust/20 bg-cream/75 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
                      Editar invitado
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
                      Los cambios se guardan en Supabase
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                    <div className="md:col-span-4">
                      <Field label="Nombre / Familia">
                        <Input
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, name: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Tipo">
                        <select
                          value={editDraft.kind}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, kind: e.target.value })
                          }
                          className="w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm focus:border-rust focus:outline-none"
                        >
                          <option value="single">Individual</option>
                          <option value="group">Grupo / Familia</option>
                        </select>
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Pases">
                        <Input
                          type="number"
                          min={1}
                          value={editDraft.passes}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              passes: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Estado">
                        <select
                          value={editDraft.rsvp}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, rsvp: e.target.value })
                          }
                          className="w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm focus:border-rust focus:outline-none"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="attending">Asiste</option>
                          <option value="declined">No asiste</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => saveGuestEdit(g.id)}
                        disabled={savingId === g.id}
                        className="inline-flex min-h-11 items-center justify-center bg-ink px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cream transition-colors hover:bg-rust disabled:opacity-60"
                      >
                        {savingId === g.id ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex min-h-11 items-center justify-center border border-ink/15 px-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-rust hover:text-rust"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}

function RsvpBadge({ status }) {
  const label =
    status === 'attending'
      ? 'Asiste'
      : status === 'declined'
      ? 'No asiste'
      : 'Pendiente'
  const cls =
    status === 'attending'
      ? 'border-rust bg-rust/10 text-rust'
      : status === 'declined'
      ? 'border-ink/20 bg-ink/5 text-ink/50'
      : 'border-ink/15 bg-white/60 text-ink/45'
  return (
    <span className={`inline-flex items-center border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${cls}`}>
      {label}
    </span>
  )
}

function AnalyticsPanel({ activity, view }) {
  if (!activity.total) {
    return (
      <div className="border-t border-ink/10 bg-cream p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
          Sin actividad registrada todavía
        </p>
      </div>
    )
  }

  if (view === 'lists') {
    return (
      <div className="border-t border-ink/10 bg-cream p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
          Listas abiertas
        </p>
        <div className="space-y-3">
          {activity.lists.map((item) => (
            <div key={item.url || item.label} className="border border-ink/10 bg-white/45">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg italic">{item.label}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
                    {item.guests} {item.guests === 1 ? 'invitación' : 'invitaciones'} ·{' '}
                    {formatDateTime(item.last_clicked_at)}
                  </p>
                </div>
                <p className="font-mono text-xs text-rust">
                  {item.count} {item.count === 1 ? 'apertura' : 'aperturas'}
                </p>
              </div>
              <div className="divide-y divide-ink/10">
                {item.viewers.map(({ guest, count, last_clicked_at }) => (
                  <div key={`${item.url || item.label}-${guest.id}`} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-ink">{guest.name}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
                        Última apertura · {formatDateTime(last_clicked_at)}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-ink/55">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'responses') {
    return (
      <div className="border-t border-ink/10 bg-cream p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
            Invitaciones con actividad
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
            Si eliminas una invitación, se elimina esta actividad
          </p>
        </div>
        <div className="space-y-2">
          {activity.guests.map(({ guest, count, last_clicked_at }) => (
            <ActivityGuestRow
              key={guest.id}
              guest={guest}
              count={count}
              lastClickedAt={last_clicked_at}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-ink/10 bg-cream p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
          Invitados que vieron listas
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
          Si eliminas una invitación, se elimina esta actividad
        </p>
      </div>
      <div className="space-y-2">
        {activity.guests.map(({ guest, count, last_clicked_at }) => (
          <ActivityGuestRow
            key={guest.id}
            guest={guest}
            count={count}
            lastClickedAt={last_clicked_at}
          />
        ))}
      </div>
    </div>
  )
}

function ActivityGuestRow({ guest, count, lastClickedAt }) {
  const passes = Number(guest.passes) || 1
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-white/45 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate font-display text-lg italic">{guest.name}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/35">
          {passes} {passes === 1 ? 'pase' : 'pases'} · {rsvpLabel(guest.rsvp)} · Última apertura ·{' '}
          {formatDateTime(lastClickedAt)}
        </p>
      </div>
      <p className="font-mono text-xs text-rust">
        {count} {count === 1 ? 'vez' : 'veces'}
      </p>
    </div>
  )
}

function rsvpLabel(status) {
  if (status === 'attending') return 'Asiste'
  if (status === 'declined') return 'No asiste'
  return 'Pendiente'
}
