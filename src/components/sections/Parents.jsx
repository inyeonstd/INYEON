import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Parents({ event, content, num = '01', dark = false }) {
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const muted = dark ? 'text-cream/50' : 'text-ink/50'
  return (
    <section className={`${bg} px-6 py-24 md:px-10 md:py-40`}>
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:parents_label">{tx(event, 'parents_label')}</Editable>
          </SectionLabel>
        </Reveal>

        <Reveal delay={0.1}>
          <p className={`mt-12 max-w-2xl font-display text-2xl font-light italic leading-snug ${text} md:text-4xl`}>
            <Editable path="text:parents_headline" multiline>
              {tx(event, 'parents_headline')}
            </Editable>
          </p>
        </Reveal>

        <div className="mt-20 grid gap-12 md:grid-cols-2 md:gap-20">
          <Reveal delay={0.2}>
            <div>
              <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                <Editable path="text:parents_bride_label">
                  {tx(event, 'parents_bride_label')}
                </Editable>
              </p>
              <div className="mt-4 space-y-2">
                {(content.bride || ['', '']).map((n, i) => (
                  <p key={i} className={`font-display text-xl ${text} md:text-2xl`}>
                    <Editable path={`section:parents:bride.${i}`}>
                      {n || (i === 0 ? 'Madre' : 'Padre')}
                    </Editable>
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div>
              <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${muted}`}>
                <Editable path="text:parents_groom_label">
                  {tx(event, 'parents_groom_label')}
                </Editable>
              </p>
              <div className="mt-4 space-y-2">
                {(content.groom || ['', '']).map((n, i) => (
                  <p key={i} className={`font-display text-xl ${text} md:text-2xl`}>
                    <Editable path={`section:parents:groom.${i}`}>
                      {n || (i === 0 ? 'Madre' : 'Padre')}
                    </Editable>
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
