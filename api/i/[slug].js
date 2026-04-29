import { admin } from '../_lib/supa.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { slug, g: guestToken } = req.query
  if (!slug) return res.status(400).json({ error: 'slug required' })
  const supa = admin()

  const { data: event, error } = await supa
    .from('events')
    .select(
      'id, slug, type, status, title, subtitle, event_date, cover_image_url, palette, texts, sections, gallery, language, timezone'
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!event) return res.status(404).json({ error: 'not_found' })
  // Mientras no tengamos editor "publicar de verdad", también respondemos drafts
  // para que la URL de preview funcione antes de publicar.

  let guest = null
  if (guestToken) {
    const { data } = await supa
      .from('event_guests')
      .select('id, name, kind, passes, note, rsvp')
      .eq('event_id', event.id)
      .eq('token', guestToken)
      .maybeSingle()
    guest = data || null
  }

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60')
  return res.json({ event, guest })
}
