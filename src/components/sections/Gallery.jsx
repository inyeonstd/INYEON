import { Reveal, SectionLabel } from '../ui'
import { pad } from '../../hooks/useCountdown'
import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Gallery({ event, images = [], num = '07', dark = true }) {
  const bg = dark ? 'bg-ink' : 'bg-cream'
  const text = dark ? 'text-cream' : 'text-ink'
  return (
    <section className={`${bg} py-24 md:py-40`}>
      <div className="px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionLabel num={num} dark={dark}>
              <Editable path="text:gallery_label">{tx(event, 'gallery_label')}</Editable>
            </SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className={`mt-8 font-display text-5xl font-light italic ${text} md:text-7xl`}>
              <Editable path="text:gallery_headline">{tx(event, 'gallery_headline')}</Editable>
            </h2>
          </Reveal>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-1 px-1 md:grid-cols-4">
        {images.map((src, i) => (
          <Reveal key={src + i} delay={i * 0.05}>
            <div
              className={`group relative overflow-hidden ${
                i % 5 === 0
                  ? 'md:col-span-2 md:row-span-2 aspect-square'
                  : 'aspect-[3/4]'
              }`}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 ${dark ? 'bg-ink/20' : 'bg-ink/10'} opacity-0 transition-opacity group-hover:opacity-100`} />
              <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.25em] text-cream opacity-0 transition-opacity group-hover:opacity-100">
                {pad(i + 1)} / {pad(images.length)}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
