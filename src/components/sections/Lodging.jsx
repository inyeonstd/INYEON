import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Lodging({ event, content, num = '05', dark = false }) {
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const muted = dark ? 'text-cream/50' : 'text-ink/50'
  const subtle = dark ? 'text-cream/70' : 'text-ink/70'
  const hint = dark ? 'text-cream/60' : 'text-ink/60'
  const border = dark ? 'border-cream/20' : 'border-ink/20'
  return (
    <section className={`${bg} px-6 py-24 md:px-10 md:py-40`}>
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:lodging_label">{tx(event, 'lodging_label')}</Editable>
          </SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <Reveal delay={0.1}>
              <h2 className={`font-display text-5xl font-light italic ${text} md:text-7xl`}>
                <Editable path="section:lodging:name">{content.name}</Editable>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className={`mt-6 max-w-md text-base leading-relaxed ${subtle}`}>
                <Editable path="section:lodging:address" multiline>
                  {content.address}
                </Editable>
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-5">
            <Reveal delay={0.3}>
              <div className={`border ${border} p-8`}>
                <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                  <Editable path="text:lodging_code_label">
                    {tx(event, 'lodging_code_label')}
                  </Editable>
                </p>
                <p className="mt-3 font-mono text-3xl tabular-nums text-rust md:text-4xl">
                  <Editable path="section:lodging:code">{content.code}</Editable>
                </p>
                <p className={`mt-4 text-xs ${hint}`}>
                  <Editable path="text:lodging_code_hint" multiline>
                    {tx(event, 'lodging_code_hint')}
                  </Editable>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
