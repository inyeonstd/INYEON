import { Reveal } from '../ui'
import { useCountdown, pad } from '../../hooks/useCountdown'
import { tx } from '../../lib/texts'
import Editable from '../Editable'
import { confirmGuestRsvp } from '../../lib/store'
import { useEffect, useState } from 'react'

function getAttendeeCount(guest) {
  if (!guest) return 0
  try {
    const parsed = JSON.parse(guest.note || '{}')
    const attendees = Number(parsed.attendees)
    if (Number.isFinite(attendees)) return Math.max(0, attendees)
  } catch {}
  return guest.rsvp === 'attending' ? Number(guest.passes) || 1 : 0
}

export default function Closing({ event, guest, guestToken }) {
  const t = useCountdown(event.event_date)
  const [currentGuest, setCurrentGuest] = useState(guest)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [isRsvpOpen, setIsRsvpOpen] = useState(false)
  const [isDeclineOpen, setIsDeclineOpen] = useState(false)
  const activeGuest = currentGuest || guest
  const d = new Date(event.event_date)
  const day = pad(d.getDate())
  const month = pad(d.getMonth() + 1)
  const year = String(d.getFullYear()).slice(-2)
  const passes = Number(activeGuest?.passes) || 1
  const attendeeCount = Math.min(passes, getAttendeeCount(activeGuest))
  const [selectedAttendees, setSelectedAttendees] = useState(
    Math.max(1, attendeeCount || passes)
  )

  useEffect(() => {
    setCurrentGuest(guest)
    setIsRsvpOpen(false)
    setIsDeclineOpen(false)
    setError('')
  }, [guest?.id])

  useEffect(() => {
    setSelectedAttendees(Math.max(1, attendeeCount || passes))
  }, [attendeeCount, passes])

  const respond = async (rsvp, attendees = selectedAttendees) => {
    if (!guestToken) return
    setBusy(rsvp)
    setError('')
    try {
      const next = await confirmGuestRsvp(guestToken, rsvp, attendees)
      setCurrentGuest(next)
      setIsRsvpOpen(false)
      setIsDeclineOpen(false)
    } catch (err) {
      setError(err?.message || 'No se pudo confirmar.')
    } finally {
      setBusy('')
    }
  }

  const openRsvp = () => {
    setSelectedAttendees(Math.max(1, attendeeCount || passes))
    setIsRsvpOpen(true)
  }

  return (
    <section className="relative bg-cream px-6 py-24 md:px-10 md:py-40">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink/50">
            — <Editable path="text:closing_greeting">{tx(event, 'closing_greeting')}</Editable> —
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="mt-10 font-display text-[clamp(3rem,10vw,7rem)] font-light italic leading-none text-ink">
            {day} <span className="font-extralight not-italic">·</span> {month}{' '}
            <span className="font-extralight not-italic">·</span> {year}
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
            <Editable path="text:closing_countdown_prefix">
              {tx(event, 'closing_countdown_prefix')}
            </Editable>{' '}
            {t.d}{' '}
            <Editable path="text:closing_countdown_unit">
              {tx(event, 'closing_countdown_unit')}
            </Editable>
            , {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
          </p>
        </Reveal>
        {activeGuest && (
          <Reveal delay={0.35}>
            <div className="mt-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/45">
                {activeGuest.name}
              </p>
              <p className="mx-auto mt-3 inline-flex border border-rust/30 bg-white/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
                Máximo {passes} {passes === 1 ? 'persona' : 'personas'}
              </p>
              {activeGuest.rsvp === 'attending' && (
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-rust">
                  Confirmado · {attendeeCount} de {passes}{' '}
                  {passes === 1 ? 'asistente' : 'asistentes'}
                </p>
              )}
              {activeGuest.rsvp === 'declined' && (
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
                  No asistirán
                </p>
              )}
            </div>
          </Reveal>
        )}

        {activeGuest && guestToken ? (
          <Reveal delay={0.4}>
            <div className="mt-14 flex flex-col items-center justify-center gap-3 md:flex-row">
              <button
                type="button"
                onClick={openRsvp}
                disabled={!!busy || activeGuest.rsvp === 'declined'}
                className="inline-flex min-h-14 items-center justify-center bg-ink px-8 font-mono text-[11px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-rust disabled:opacity-60"
              >
                {busy === 'attending' ? 'Guardando...' : 'Confirmar asistencia'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeclineOpen(true)}
                disabled={!!busy || activeGuest.rsvp === 'declined'}
                className="inline-flex min-h-14 items-center justify-center border border-ink/20 bg-transparent px-8 font-mono text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:border-rust hover:text-rust disabled:opacity-60"
              >
                {busy === 'declined' ? 'Guardando...' : 'No asistirán'}
              </button>
              {error && (
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
                  {error}
                </p>
              )}
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.4}>
            <button className="group mt-14 inline-flex items-center gap-3 bg-ink px-10 py-5 font-mono text-[11px] uppercase tracking-[0.3em] text-cream transition-all hover:bg-rust">
              <Editable path="text:closing_cta">{tx(event, 'closing_cta')}</Editable>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </Reveal>
        )}
      </div>
      {isRsvpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5">
          <div className="w-full max-w-md border border-ink/15 bg-cream p-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/45">
              Confirmar asistencia
            </p>
            <p className="mt-5 font-display text-3xl italic leading-tight text-ink">
              ¿Cuántas personas asistirán?
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] leading-6 text-ink/55">
              Tienen {passes} {passes === 1 ? 'pase asignado' : 'pases asignados'}. La
              confirmación no puede exceder ese número.
            </p>
            <div className="mx-auto mt-7 flex w-full max-w-xs items-center justify-center border border-ink/15 bg-white/50">
              <button
                type="button"
                onClick={() => setSelectedAttendees((value) => Math.max(1, value - 1))}
                disabled={selectedAttendees <= 1}
                className="h-14 w-16 border-r border-ink/15 font-mono text-xl text-ink transition-colors hover:bg-rust hover:text-cream disabled:opacity-30"
                aria-label="Restar asistente"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={passes}
                value={selectedAttendees}
                onChange={(e) => {
                  const value = Math.round(Number(e.target.value) || 1)
                  setSelectedAttendees(Math.min(passes, Math.max(1, value)))
                }}
                className="h-14 w-full bg-transparent text-center font-display text-3xl italic text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSelectedAttendees((value) => Math.min(passes, value + 1))}
                disabled={selectedAttendees >= passes}
                className="h-14 w-16 border-l border-ink/15 font-mono text-xl text-ink transition-colors hover:bg-rust hover:text-cream disabled:opacity-30"
                aria-label="Sumar asistente"
              >
                +
              </button>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => respond('attending', selectedAttendees)}
                disabled={!!busy}
                className="inline-flex min-h-12 flex-1 items-center justify-center bg-ink px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-rust disabled:opacity-60"
              >
                {busy === 'attending' ? 'Guardando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setIsRsvpOpen(false)}
                disabled={!!busy}
                className="inline-flex min-h-12 flex-1 items-center justify-center border border-ink/20 px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink transition-colors hover:border-rust hover:text-rust disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeclineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5">
          <div className="w-full max-w-md border border-ink/15 bg-cream p-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/45">
              Rechazar invitación
            </p>
            <p className="mt-5 font-display text-3xl italic leading-tight text-ink">
              ¿Confirmas que no asistirán?
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] leading-6 text-ink/55">
              Esta acción no se podrá revertir desde la invitación.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => respond('declined', 0)}
                disabled={!!busy}
                className="inline-flex min-h-12 flex-1 items-center justify-center bg-ink px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-rust disabled:opacity-60"
              >
                {busy === 'declined' ? 'Guardando...' : 'Sí, no asistirán'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeclineOpen(false)}
                disabled={!!busy}
                className="inline-flex min-h-12 flex-1 items-center justify-center border border-ink/20 px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink transition-colors hover:border-rust hover:text-rust disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
