import { motion, useScroll, useTransform } from 'framer-motion'
import { useCountdown, pad } from '../../hooks/useCountdown'
import { tx, fmt } from '../../lib/texts'
import Editable from '../Editable'

export default function Hero({ event, guest }) {
  const { scrollY } = useScroll()
  const yImg = useTransform(scrollY, [0, 800], [0, 200])
  const yText = useTransform(scrollY, [0, 600], [0, -60])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const t = useCountdown(event.event_date)

  const dateLabel = new Date(event.event_date)
    .toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, ' · ')

  return (
    <section className="relative h-screen w-full overflow-hidden bg-ink">
      <motion.div style={{ y: yImg }} className="absolute inset-0 -top-20 h-[120%]">
        <img
          src={event.cover_image_url}
          alt=""
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/90" />
        <div className="absolute inset-0 mix-blend-overlay opacity-40 [background-image:radial-gradient(rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:3px_3px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5 font-mono text-[10px] uppercase tracking-[0.25em] text-cream/70 md:px-10"
      >
        <Editable path="text:footer_brand">{tx(event, 'footer_brand')}</Editable>
        <span>{dateLabel}</span>
      </motion.div>

      <motion.div
        style={{ y: yText, opacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-cream/60"
        >
          —{' '}
          {guest ? (
            <Editable path="text:hero_label_for_guest">
              {fmt(tx(event, 'hero_label_for_guest'), { name: guest.name })}
            </Editable>
          ) : (
            <Editable path="text:hero_label">{tx(event, 'hero_label')}</Editable>
          )}{' '}
          —
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-display text-[clamp(3.5rem,12vw,9rem)] font-light italic leading-[0.95] text-cream"
        >
          <Editable path="field:title">{event.title}</Editable>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-10 flex items-center gap-4 font-mono text-xs text-cream/80 md:gap-8"
        >
          {[
            [tx(event, 'countdown_days'), t.d],
            [tx(event, 'countdown_hours'), t.h],
            [tx(event, 'countdown_minutes'), t.m],
            [tx(event, 'countdown_seconds'), t.s],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col items-center">
              <span className="text-3xl font-light tabular-nums text-cream md:text-5xl">
                {pad(v)}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-cream/50">
                {k}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-cream/50"
      >
        ↓ <Editable path="text:hero_scroll">{tx(event, 'hero_scroll')}</Editable>
      </motion.div>
    </section>
  )
}
