import { admin, readBody, uniqueSlug } from '../_lib/supa.js'

const DEFAULT_SECTIONS = [
  { type: 'parents', order_index: 0, is_visible: true, content: { bride: ['', ''], groom: ['', ''] } },
  { type: 'ceremony', order_index: 1, is_visible: true, content: { number: 'I', venue: '', address: '', time: '19:00', maps_url: '' } },
  { type: 'reception', order_index: 2, is_visible: true, content: { number: 'II', venue: '', address: '', time: '21:00', maps_url: '' } },
  { type: 'itinerary', order_index: 3, is_visible: true, content: { items: [] } },
  { type: 'registry', order_index: 4, is_visible: false, content: { items: [] } },
  { type: 'lodging', order_index: 5, is_visible: false, content: { name: '', address: '', code: '' } },
  { type: 'dresscode', order_index: 6, is_visible: true, content: { items: [] } },
]

export default async function handler(req, res) {
  const supa = admin()

  if (req.method === 'GET') {
    const owner = req.query.owner
    if (!owner) return res.status(400).json({ error: 'owner required' })
    const { data, error } = await supa
      .from('events')
      .select('id, slug, title, status, event_date, cover_image_url, updated_at, sections')
      .eq('owner_email', owner)
      .order('updated_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ events: data })
  }

  if (req.method === 'POST') {
    const body = await readBody(req)
    const owner = body.owner_email
    if (!owner) return res.status(400).json({ error: 'owner_email required' })
    const title = body.title || 'Nombre & Nombre'
    const slug = await uniqueSlug(title)
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const row = {
      owner_email: owner,
      slug,
      type: 'wedding',
      status: 'draft',
      title,
      subtitle: 'Una unión',
      event_date: body.event_date || future.toISOString(),
      cover_image_url:
        body.cover_image_url ||
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
      texts: body.texts || {},
      sections: body.sections || DEFAULT_SECTIONS,
      gallery: body.gallery || [],
    }
    const { data, error } = await supa.from('events').insert(row).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ event: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
