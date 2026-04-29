import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createAccount, signIn } from '../lib/store'
import { Field, Input, Button } from '../components/admin/Shell'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) return
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        await createAccount(cleanEmail, password)
      } else {
        await signIn(cleanEmail, password)
      }
      nav('/app', { replace: true })
    } catch (err) {
      setError(err?.message || 'No se pudo entrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center font-display text-3xl italic md:text-4xl">
          Inyeon
        </Link>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
          Invitaciones digitales
        </p>

        <form onSubmit={submit} className="mt-12 space-y-5">
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.25em]">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`border px-3 py-2 ${
                mode === 'login'
                  ? 'border-ink bg-ink text-cream'
                  : 'border-ink/15 text-ink/50'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
              }}
              className={`border px-3 py-2 ${
                mode === 'signup'
                  ? 'border-ink bg-ink text-cream'
                  : 'border-ink/15 text-ink/50'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <Field label="Correo">
            <Input
              type="email"
              required
              autoFocus
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label="Contraseña"
            hint={mode === 'signup' ? 'Mínimo 6 caracteres.' : undefined}
          >
            <Input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
          Acceso privado
        </p>
      </div>
    </div>
  )
}
