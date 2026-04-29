import { admin, readBody, uniqueSlug } from '../../_lib/supa.js'

const ALLOWED_FIELDS = [
  'title',
  'subtitle',
  'event_date',
  'status',
  'slug',
  'cover_image_url',
  'palette',
  'texts',
  'sections',
  'gallery',
]

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })
  const supa = admin()

  if (req.method === 'GET') {
    const { data: event, error: e1 } = await supa
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (e1) return res.status(404).json({ error: e1.message })
    const { data: guests } = await supa
      .from('event_guests')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true })
    return res.json({ event: { ...event, guests: guests || [] } })
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req)
    const patch = {}
    for (const k of ALLOWED_FIELDS) if (k in body) patch[k] = body[k]
    if (patch.title && !patch.slug) {
      patch.slug = await uniqueSlug(patch.title, id)
    }
    if (patch.status === 'published' && !body.published_at) {
      patch.published_at = new Date().toISOString()
    }
    const { data, error } = await supa
      .from('events')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ event: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supa.from('events').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
