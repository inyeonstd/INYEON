import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'
import { useEditMode } from '../../lib/edit'
import { trackInteraction } from '../../lib/store'

export default function Registry({ event, content, guestToken, num = '04', dark = true }) {
  const editing = useEditMode()
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
                  onClick={(e) => {
                    if (editing) {
                      e.preventDefault()
                      return
                    }
                    if (!guestToken || !r.url) return
                    trackInteraction({
                      type: 'registry_click',
                      token: guestToken,
                      event_id: event.id,
                      item_index: i,
                      item_label: r.name || r.code || 'Lista de regalo',
                      item_url: r.url,
                    })
                  }}
                  className={`mt-8 inline-flex min-h-12 items-center justify-center border px-5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                    dark
                      ? 'border-rust bg-rust text-cream hover:border-cream hover:bg-cream hover:text-ink'
                      : 'border-ink bg-ink text-cream hover:border-rust hover:bg-rust'
                  }`}
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
