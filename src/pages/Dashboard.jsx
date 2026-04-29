import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AdminShell,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
} from '../components/admin/Shell'
import {
  createEvent,
  deleteEvent,
  getSession,
  listEvents,
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

export default function Dashboard() {
  const nav = useNavigate()
  const session = getSession()
  const [events, setEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')

  const refresh = async () => {
    if (!session?.email) {
      setEvents([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setEvents(await listEvents(session.email))
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las bodas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [session?.email])

  const handleCreate = async (e) => {
    e.preventDefault()
    const t = title.trim() || 'Nombre & Nombre'
    setError('')
    try {
      const ev = await createEvent(session?.email, { title: t })
      setTitle('')
      setCreating(false)
      nav(`/app/event/${ev.id}`)
    } catch (err) {
      setError(err?.message || 'No se pudo crear la boda.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta boda? No se puede deshacer.')) return
    setError('')
    try {
      await deleteEvent(id)
      await refresh()
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar la boda.')
    }
  }

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionTitle num="01">Tus bodas</SectionTitle>
          <p className="font-mono text-xs text-ink/50">
            {events.length} {events.length === 1 ? 'boda' : 'bodas'} · sesión {session?.email}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ Nueva boda</Button>
      </div>

      {error && (
        <Card className="mb-6 border-rust/30 bg-rust/5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-rust">
            {error}
          </p>
        </Card>
      )}

      {creating && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Field label="Título de la boda" hint='Formato: "Nombre & Nombre"'>
                <Input
                  autoFocus
                  placeholder="María & Juan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Crear</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="text-center">
          <p className="font-display text-2xl italic">Cargando bodas...</p>
        </Card>
      ) : events.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-2xl italic">Aún no hay bodas.</p>
          <p className="mt-2 font-mono text-xs text-ink/50">
            Crea la primera con el botón de arriba.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((ev) => {
            const date = new Date(ev.event_date)
            const dateLabel = date.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            const guests = ev.guests || []
            const assignedPasses = guests.reduce((acc, g) => acc + (Number(g.passes) || 1), 0)
            const confirmedAttendees = guests.reduce(
              (acc, g) => acc + getAttendeeCount(g),
              0
            )
            const declinedPasses = guests
              .filter((g) => g.rsvp === 'declined')
              .reduce((acc, g) => acc + (Number(g.passes) || 1), 0)
            return (
              <Card key={ev.id} className="!p-0 overflow-hidden">
                <div
                  className="relative h-36 bg-ink"
                  style={{
                    backgroundImage: `url(${ev.cover_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-ink/10" />
                  <div className="absolute bottom-3 left-4 right-4 text-cream">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/70">
                      {dateLabel} · {ev.status}
                    </p>
                    <p className="mt-1 font-display text-2xl italic">{ev.title}</p>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-3 border border-ink/12 bg-white/45">
                      <div className="border-r border-ink/12 px-4 py-3">
                        <p className="font-display text-2xl italic leading-none text-ink">
                          {assignedPasses}
                        </p>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
                          Pases asignados
                        </p>
                      </div>
                      <div className="border-r border-ink/12 px-4 py-3">
                        <p className="font-display text-2xl italic leading-none text-rust">
                          {confirmedAttendees}
                        </p>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
                          Asistentes confirmados
                        </p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-display text-2xl italic leading-none text-ink/55">
                          {declinedPasses}
                        </p>
                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
                          No asistirán
                        </p>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Link
                      to={`/i/${ev.slug}`}
                      target="_blank"
                      className="inline-flex min-h-11 items-center justify-center border border-ink/15 bg-white/55 px-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-rust hover:text-rust"
                    >
                      Ver invitación
                    </Link>
                    <Link
                      to={`/app/event/${ev.id}/guests`}
                      className="inline-flex min-h-11 items-center justify-center border border-ink/15 bg-white/55 px-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-rust hover:text-rust"
                    >
                      Invitados
                    </Link>
                    <Link
                      to={`/app/event/${ev.id}`}
                      className="inline-flex min-h-11 items-center justify-center bg-ink px-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cream transition-colors hover:bg-rust"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="inline-flex min-h-11 items-center justify-center border border-ink/15 px-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45 transition-colors hover:border-rust hover:text-rust"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
