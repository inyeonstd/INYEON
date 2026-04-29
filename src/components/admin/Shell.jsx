import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../../lib/store'

export function AdminShell({ children, eventTitle, eventId, fullWidth = false }) {
  const nav = useNavigate()
  const session = getSession()

  const logout = async () => {
    await clearSession()
    nav('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link to="/app" className="font-display text-xl italic md:text-2xl">
            Inyeon
          </Link>
          <nav className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] md:gap-3 md:text-[11px]">
            {eventId && (
              <>
                <NavTab to={`/app/event/${eventId}`} end label="Editor" />
                <NavTab to={`/app/event/${eventId}/guests`} label="Invitados" />
                <span className="hidden text-ink/30 md:inline">·</span>
              </>
            )}
            <span className="hidden text-ink/50 md:inline">{session?.email}</span>
            <button
              onClick={logout}
              className="rounded-full border border-ink/20 px-3 py-1.5 text-ink/70 transition-colors hover:border-rust hover:text-rust"
            >
              Salir
            </button>
          </nav>
        </div>
        {eventTitle && (
          <div className="mx-auto max-w-6xl px-4 pb-3 md:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
              Editando
            </p>
            <p className="font-display text-2xl italic md:text-3xl">{eventTitle}</p>
          </div>
        )}
      </header>
      <main
        className={
          fullWidth
            ? 'px-4 py-8 md:px-8 md:py-10'
            : 'mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12'
        }
      >
        {children}
      </main>
    </div>
  )
}

function NavTab({ to, end, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-full px-3 py-1.5 transition-colors ${
          isActive
            ? 'bg-ink text-cream'
            : 'text-ink/60 hover:text-ink'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint && (
        <span className="mt-1 block font-mono text-[10px] text-ink/40">{hint}</span>
      )}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30 focus:border-rust focus:outline-none ${props.className || ''}`}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full border border-ink/15 bg-white/60 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30 focus:border-rust focus:outline-none ${props.className || ''}`}
    />
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.25em] transition-all'
  const styles =
    variant === 'primary'
      ? 'bg-ink text-cream hover:bg-rust'
      : variant === 'ghost'
      ? 'border border-ink/20 text-ink hover:border-rust hover:text-rust'
      : 'text-ink/60 hover:text-rust'
  return <button {...props} className={`${base} ${styles} ${className}`} />
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div
      {...rest}
      className={`border border-ink/10 bg-white/50 p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ num, children }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      {num && (
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
          {num}
        </span>
      )}
      <h2 className="font-display text-2xl font-light italic md:text-3xl">{children}</h2>
    </div>
  )
}
