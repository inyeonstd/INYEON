import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setSession } from '../lib/store'
import { Field, Input, Button } from '../components/admin/Shell'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSession(email.trim())
    nav('/app', { replace: true })
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
          <Field label="Contraseña" hint="Demo: cualquier valor entra.">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>

        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
          Modo demo · sin verificación
        </p>
      </div>
    </div>
  )
}
