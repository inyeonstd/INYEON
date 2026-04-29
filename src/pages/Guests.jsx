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

export default function Guests() {
  const { id } = useParams()
  const nav = useNavigate()
  const [event, setEvent] = useState(null)
  const [draft, setDraft] = useState({ name: '', kind: 'single', passes: 1, note: '' })
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const copy = async (g) => {
    const link = buildGuestLink(event.slug, g.token)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(g.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      window.prompt('Copia este link:', link)
    }
  }

  const guests = event.guests || []
  const totalPasses = guests.reduce((acc, g) => acc + (Number(g.passes) || 1), 0)

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
          {guests.map((g) => (
            <Card key={g.id} className="!p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="font-display text-xl italic">{g.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                    {g.kind === 'group' ? 'Grupo' : 'Individual'} · {g.passes}{' '}
                    {g.passes === 1 ? 'pase' : 'pases'}
                  </p>
                </div>
                <div className="font-mono text-xs text-ink/60 md:col-span-5 break-all">
                  /i/{event.slug}?g={g.token.slice(0, 8)}…
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end">
                  <Button variant="primary" type="button" onClick={() => copy(g)}>
                    {copiedId === g.id ? '✓ Copiado' : 'Copiar link'}
                  </Button>
                  <Link
                    to={`/i/${event.slug}?g=${g.token}`}
                    target="_blank"
                    className="inline-flex items-center justify-center px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-rust"
                  >
                    Ver ↗
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
                    className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 hover:text-rust"
                  >
                    ×
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
