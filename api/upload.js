import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

const extFromMime = (m) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[
    m
  ] || 'bin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase no configurado' })
  }
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim()
  if (!ALLOWED.includes(contentType)) {
    return res.status(415).json({ error: 'Tipo de imagen no permitido' })
  }

  try {
    const chunks = []
    let total = 0
    for await (const chunk of req) {
      total += chunk.length
      if (total > MAX_BYTES) {
        return res.status(413).json({ error: 'Imagen demasiado grande (máx 10MB)' })
      }
      chunks.push(chunk)
    }
    const buf = Buffer.concat(chunks)
    const supa = createClient(url, key, { auth: { persistSession: false } })
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extFromMime(
      contentType
    )}`
    const { error } = await supa.storage.from('media').upload(path, buf, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) return res.status(500).json({ error: error.message })
    const {
      data: { publicUrl },
    } = supa.storage.from('media').getPublicUrl(path)
    return res.status(200).json({ url: publicUrl })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Error desconocido' })
  }
}
