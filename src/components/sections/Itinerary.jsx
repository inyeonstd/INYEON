import { Reveal, SectionLabel } from '../ui'
import { pad } from '../../hooks/useCountdown'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Itinerary({ event, content, num = '03', dark = false }) {
  const items = content.items || []
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const subtle = dark ? 'text-cream/40' : 'text-ink/40'
  const border = dark ? 'border-cream/15' : 'border-ink/15'
  return (
    <section className={`${bg} px-6 py-24 md:px-10 md:py-40`}>
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:itinerary_label">{tx(event, 'itinerary_label')}</Editable>
          </SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className={`mt-8 font-display text-5xl font-light italic ${text} md:text-7xl`}>
            <Editable path="text:itinerary_headline_top">
              {tx(event, 'itinerary_headline_top')}
            </Editable>{' '}
            <br />
            <span className="text-rust">
              <Editable path="text:itinerary_headline_bottom">
                {tx(event, 'itinerary_headline_bottom')}
              </Editable>
            </span>
          </h2>
        </Reveal>

        <div className={`mt-20 border-t ${border}`}>
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className={`grid grid-cols-12 items-baseline gap-4 border-b ${border} py-6`}>
                <span className={`col-span-2 font-mono text-xs tabular-nums ${subtle} md:col-span-1`}>
                  {pad(i + 1)}
                </span>
                <span className={`col-span-4 font-mono text-2xl tabular-nums ${text} md:col-span-3 md:text-3xl`}>
                  <Editable path={`section:itinerary:items.${i}.time`}>{it.time}</Editable>
                </span>
                <span className={`col-span-6 font-display text-2xl font-light italic ${text} md:col-span-8 md:text-3xl`}>
                  <Editable path={`section:itinerary:items.${i}.label`}>{it.label}</Editable>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
