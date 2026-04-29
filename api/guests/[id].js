import { admin, readBody } from '../_lib/supa.js'

const ALLOWED = ['name', 'kind', 'passes', 'note', 'rsvp', 'responded_at']

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })
  const supa = admin()

  if (req.method === 'PATCH') {
    const body = await readBody(req)
    const patch = {}
    for (const k of ALLOWED) if (k in body) patch[k] = body[k]
    if ('passes' in patch) patch.passes = Number(patch.passes) || 1
    const { data, error } = await supa
      .from('event_guests')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ guest: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supa.from('event_guests').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
