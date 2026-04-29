import { Reveal, SectionLabel } from '../ui'
import { tx } from '../../lib/texts'
import Editable from '../Editable'
import { useState } from 'react'

export default function Dresscode({ event, content, num = '06', dark = false }) {
  const items = content?.items || []
  const [openItem, setOpenItem] = useState(null)
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  const subtle = dark ? 'text-cream/70' : 'text-ink/70'
  const placeholderBg = dark ? 'bg-cream/10' : 'bg-ink/10'
  const placeholderText = dark ? 'text-cream/30' : 'text-ink/30'
  return (
    <section className={`${bg} px-6 py-24 md:px-10 md:py-40`}>
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionLabel num={num} dark={dark}>
            <Editable path="text:dresscode_label">
              {tx(event, 'dresscode_label')}
            </Editable>
          </SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className={`mt-8 font-display text-5xl font-light italic ${text} md:text-7xl`}>
            <Editable path="text:dresscode_headline">
              {tx(event, 'dresscode_headline')}
            </Editable>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className={`mt-6 max-w-xl text-base leading-relaxed ${subtle}`}>
            <Editable path="text:dresscode_intro" multiline>
              {tx(event, 'dresscode_intro')}
            </Editable>
          </p>
        </Reveal>

        {items.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((it, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="group block">
                  <button
                    type="button"
                    onClick={() => it.image_url && setOpenItem(it)}
                    className={`block aspect-[3/4] w-full overflow-hidden text-left ${placeholderBg}`}
                    aria-label={`Ampliar ${it.label || 'referencia'}`}
                  >
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] ${placeholderText}`}>
                        Sin imagen
                      </div>
                    )}
                  </button>
                  <p className={`mt-3 font-display text-xl italic ${text}`}>
                    <Editable path={`section:dresscode:items.${i}.label`}>
                      {it.label || 'Sin título'}
                    </Editable>
                  </p>
                  {it.url && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-rust hover:text-ink"
                    >
                      <Editable path="text:dresscode_cta">
                        {tx(event, 'dresscode_cta')}
                      </Editable>
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
      {openItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-4 py-6">
          <button
            type="button"
            onClick={() => setOpenItem(null)}
            className="absolute right-4 top-4 border border-cream/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cream transition-colors hover:border-rust hover:text-rust"
          >
            Cerrar
          </button>
          <div className="max-h-full w-full max-w-5xl">
            <img
              src={openItem.image_url}
              alt=""
              className="mx-auto max-h-[82vh] w-auto max-w-full object-contain"
            />
            <p className="mt-4 text-center font-display text-2xl italic text-cream">
              {openItem.label || 'Referencia'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
