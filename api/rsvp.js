import { admin, readBody } from './_lib/supa.js'

function parseNote(note) {
  if (!note) return {}
  try {
    const parsed = JSON.parse(note)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return { text: String(note) }
  }
}

function clampAttendees(value, passes, rsvp) {
  if (rsvp === 'declined') return 0
  const max = Math.max(1, Number(passes) || 1)
  const next = Math.round(Number(value) || max)
  return Math.min(max, Math.max(1, next))
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await readBody(req)
  const token = String(body.token || '').trim()
  const rsvp = body.rsvp === 'attending' ? 'attending' : body.rsvp === 'declined' ? 'declined' : ''

  if (!token) return res.status(400).json({ error: 'token required' })
  if (!rsvp) return res.status(400).json({ error: 'rsvp invalid' })

  const { data: existing, error: fetchError } = await admin()
    .from('event_guests')
    .select('id, passes, note, rsvp')
    .eq('token', token)
    .single()

  if (fetchError) return res.status(500).json({ error: fetchError.message })
  if (existing.rsvp === 'declined' && rsvp !== 'declined') {
    return res
      .status(409)
      .json({ error: 'La invitación rechazada no se puede volver a confirmar.' })
  }

  const attendees = clampAttendees(body.attendees, existing.passes, rsvp)
  const note = JSON.stringify({ ...parseNote(existing.note), attendees })

  const { data, error } = await admin()
    .from('event_guests')
    .update({ rsvp, note, responded_at: new Date().toISOString() })
    .eq('token', token)
    .select('id, name, kind, passes, note, rsvp, responded_at')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ guest: data })
}
