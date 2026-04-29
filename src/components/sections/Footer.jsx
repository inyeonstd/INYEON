import { tx } from '../../lib/texts'
import Editable from '../Editable'

export default function Footer({ event }) {
  const dateLabel = new Date(event.event_date)
    .toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, ' · ')

  return (
    <footer className="border-t border-ink/10 bg-cream px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50 md:flex-row md:items-center">
        <span>{dateLabel}</span>
        <span>
          {tx(event, 'footer_signature')}{' '}
          <Editable path="text:footer_brand">{tx(event, 'footer_brand')}</Editable>
        </span>
      </div>
    </footer>
  )
}
