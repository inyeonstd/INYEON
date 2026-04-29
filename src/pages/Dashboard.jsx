import { useState } from 'react'
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
  ensureSeed,
  getSession,
  listEvents,
} from '../lib/store'

export default function Dashboard() {
  ensureSeed()
  const nav = useNavigate()
  const session = getSession()
  const [events, setEvents] = useState(() => listEvents(session?.email))
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  const refresh = () => setEvents(listEvents(session?.email))

  const handleCreate = (e) => {
    e.preventDefault()
    const t = title.trim() || 'Nombre & Nombre'
    const ev = createEvent(session?.email, { title: t })
    setTitle('')
    setCreating(false)
    nav(`/app/event/${ev.id}`)
  }

  const handleDelete = (id) => {
    if (!confirm('¿Eliminar esta boda? No se puede deshacer.')) return
    deleteEvent(id)
    refresh()
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

      {events.length === 0 ? (
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
                    /{ev.slug} · {ev.guests?.length || 0} invitados
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/i/${ev.slug}`}
                      target="_blank"
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 hover:text-rust"
                    >
                      Ver ↗
                    </Link>
                    <Link
                      to={`/app/event/${ev.id}/guests`}
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 hover:text-rust"
                    >
                      Invitados
                    </Link>
                    <Link
                      to={`/app/event/${ev.id}`}
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink hover:text-rust"
                    >
                      Editar →
                    </Link>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 hover:text-rust"
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
