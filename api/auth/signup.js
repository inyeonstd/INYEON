import { admin, readBody } from '../_lib/supa.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await readBody(req)
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Correo inválido.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  }

  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    const message = error.message?.includes('already')
      ? 'Ese correo ya tiene cuenta. Inicia sesión.'
      : error.message
    return res.status(400).json({ error: message })
  }

  return res.status(201).json({ user: { id: data.user.id, email: data.user.email } })
}
