import { createClient } from '@supabase/supabase-js'

let _client = null
export function admin() {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'boda'

export async function uniqueSlug(base, ignoreId = null) {
  const supa = admin()
  let candidate = slugify(base)
  let i = 2
  while (true) {
    const q = supa.from('events').select('id').eq('slug', candidate).limit(1)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length || (ignoreId && data[0].id === ignoreId)) return candidate
    candidate = `${slugify(base)}-${i++}`
    if (i > 200) return `${slugify(base)}-${Date.now()}`
  }
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body)
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}
