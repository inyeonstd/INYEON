import { admin, readBody } from '../../_lib/supa.js'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })
  const supa = admin()

  if (req.method === 'POST') {
    const body = await readBody(req)
    const row = {
      event_id: id,
      name: (body.name || 'Invitado').trim(),
      kind: body.kind === 'group' ? 'group' : 'single',
      passes: Number(body.passes) || 1,
      note: body.note || null,
    }
    const { data, error } = await supa
      .from('event_guests')
      .insert(row)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ guest: data })
  }

  if (req.method === 'GET') {
    const { data, error } = await supa
      .from('event_guests')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ guests: data })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
