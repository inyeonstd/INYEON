import { Reveal, SectionLabel } from '../ui'
import { pad } from '../../hooks/useCountdown'
import { tx } from '../../lib/texts'
import Editable from '../Editable'
import { useState } from 'react'

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

      <div className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {images.map((src, i) => (
          <Reveal key={src + i} delay={i * 0.05}>
            <div
              className={`group relative mb-3 break-inside-avoid overflow-hidden border ${
                dark ? 'border-cream/10 bg-cream/5' : 'border-ink/10 bg-ink/5'
              }`}
            >
              <GalleryImage src={src} dark={dark} />
              <div className={`absolute inset-0 ${dark ? 'bg-ink/20' : 'bg-ink/10'} opacity-0 transition-opacity group-hover:opacity-100`} />
              <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.25em] text-cream opacity-0 transition-opacity group-hover:opacity-100">
                {pad(i + 1)} / {pad(images.length)}
              </span>
            </div>
          </Reveal>
        ))}
        </div>
      </div>
    </section>
  )
}

function GalleryImage({ src, dark }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center border ${
          dark ? 'border-cream/30 bg-cream/5 text-cream/35' : 'border-ink/20 bg-ink/5 text-ink/35'
        } px-4 text-center font-mono text-[10px] uppercase tracking-[0.25em]`}
      >
        Imagen no disponible
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-auto w-full object-contain"
    />
  )
}
