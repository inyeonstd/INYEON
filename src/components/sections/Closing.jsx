import { Reveal } from '../ui'
import { useCountdown, pad } from '../../hooks/useCountdown'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Closing({ event, guest }) {
  const t = useCountdown(event.event_date)
  const d = new Date(event.event_date)
  const day = pad(d.getDate())
  const month = pad(d.getMonth() + 1)
  const year = String(d.getFullYear()).slice(-2)

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
        {guest && (
          <Reveal delay={0.35}>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
              {guest.name} · {guest.passes} {guest.passes === 1 ? 'pase' : 'pases'}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.4}>
          <button className="group mt-14 inline-flex items-center gap-3 bg-ink px-10 py-5 font-mono text-[11px] uppercase tracking-[0.3em] text-cream transition-all hover:bg-rust">
            <Editable path="text:closing_cta">{tx(event, 'closing_cta')}</Editable>
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}
