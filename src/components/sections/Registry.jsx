import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Registry({ event, content, num = '04', dark = true }) {
  const items = content.items || []
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const muted = dark ? 'text-cream/50' : 'text-ink/50'
  const cardBg = dark ? 'bg-ink' : 'bg-cream'
  const dividerBg = dark ? 'bg-cream/15' : 'bg-ink/15'
  const decoTextColor = dark ? 'text-cream/[0.04]' : 'text-ink/[0.04]'
  return (
    <section className={`relative overflow-hidden ${bg} ${text} px-6 py-24 md:px-10 md:py-40`}>
      <div className={`absolute -right-20 top-1/2 -z-0 -translate-y-1/2 select-none font-display text-[20rem] font-light italic ${decoTextColor} md:text-[28rem]`}>
        {num}
      </div>
      <div className="relative mx-auto max-w-5xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:registry_label">{tx(event, 'registry_label')}</Editable>
          </SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-12 max-w-2xl font-display text-2xl font-light italic leading-snug md:text-4xl">
            <Editable path="text:registry_headline" multiline>
              {tx(event, 'registry_headline')}
            </Editable>
          </p>
        </Reveal>

        <div className={`mt-16 grid gap-px ${dividerBg} md:grid-cols-2`}>
          {items.map((r, i) => (
            <Reveal key={i}>
              <div className={`block ${cardBg} p-10 md:p-14`}>
                <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                  <Editable path={`section:registry:items.${i}.code`}>{r.code}</Editable>
                </p>
                <p className="mt-3 font-display text-4xl font-light md:text-5xl">
                  <Editable path={`section:registry:items.${i}.name`}>{r.name}</Editable>
                </p>
                <a
                  href={r.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-rust ${dark ? 'hover:text-cream' : 'hover:text-ink'}`}
                >
                  <Editable path="text:registry_cta">{tx(event, 'registry_cta')}</Editable>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
