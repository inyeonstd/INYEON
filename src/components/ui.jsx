import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export const Reveal = ({ children, delay = 0, y = 24 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export const SectionLabel = ({ num, children, dark = false }) => (
  <div
    className={`flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.25em] ${
      dark ? 'text-cream/60' : 'text-ink/60'
    }`}
  >
    <span className="tabular-nums">{num}</span>
    <span className={`h-px w-8 ${dark ? 'bg-cream/30' : 'bg-ink/30'}`} />
    <span>{children}</span>
  </div>
)
