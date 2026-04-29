import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Events({ event, items, num = '02', dark = true }) {
  const kindLabels = {
    ceremony: tx(event, 'events_kind_ceremony'),
    reception: tx(event, 'events_kind_reception'),
  }
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const muted = dark ? 'text-cream/50' : 'text-ink/50'
  const subtle = dark ? 'text-cream/60' : 'text-ink/60'
  const border = dark ? 'border-cream/15' : 'border-ink/15'
  const btnBorder = dark ? 'border-cream/30' : 'border-ink/30'
  const btnHoverText = dark ? 'hover:text-cream' : 'hover:text-cream'
  return (
    <section className={`${bg} ${text} px-6 py-24 md:px-10 md:py-40`}>
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:events_label">{tx(event, 'events_label')}</Editable>
          </SectionLabel>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-8 font-display text-5xl font-light italic md:text-7xl">
            <Editable path="text:events_headline">{tx(event, 'events_headline')}</Editable>
          </h2>
        </Reveal>

        <div className="mt-20 space-y-2">
          {items.map((e, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <div className={`grid grid-cols-12 items-baseline gap-4 border-t ${border} py-10 md:py-12`}>
                <span className="col-span-2 font-display text-3xl font-light italic text-rust md:col-span-1 md:text-4xl">
                  {e.content.number || (i === 0 ? 'I' : 'II')}
                </span>
                <div className="col-span-10 md:col-span-5">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                    <Editable path={`text:events_kind_${e.type}`}>
                      {kindLabels[e.type] || e.type}
                    </Editable>
                  </p>
                  <p className="mt-2 font-display text-2xl font-light md:text-4xl">
                    <Editable path={`section:${e.type}:venue`}>{e.content.venue}</Editable>
                  </p>
                  <p className={`mt-2 text-sm ${subtle}`}>
                    <Editable path={`section:${e.type}:address`}>{e.content.address}</Editable>
                  </p>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                    <Editable path="text:events_time_label">
                      {tx(event, 'events_time_label')}
                    </Editable>
                  </p>
                  <p className="mt-2 font-mono text-2xl tabular-nums md:text-3xl">
                    <Editable path={`section:${e.type}:time`}>{e.content.time}</Editable>
                  </p>
                </div>
                <div className="col-span-6 flex justify-end md:col-span-3">
                  <a
                    href={e.content.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group inline-flex items-center gap-2 border ${btnBorder} px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] transition-all duration-300 hover:border-rust hover:bg-rust ${btnHoverText}`}
                  >
                    <span>
                      <Editable path="text:events_cta">{tx(event, 'events_cta')}</Editable>
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
