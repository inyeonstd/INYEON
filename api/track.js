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

function registryKey(index, url, label) {
  if (Number.isFinite(Number(index))) return `item_${Number(index)}`
  if (url) return `url_${String(url).slice(0, 160)}`
  return `label_${String(label || 'lista').slice(0, 80)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await readBody(req)
  const token = String(body.token || '').trim()
  const type = String(body.type || '').trim()
  if (!token) return res.status(400).json({ error: 'token required' })
  if (type !== 'registry_click') return res.status(400).json({ error: 'type invalid' })

  const supa = admin()
  const { data: guest, error: fetchError } = await supa
    .from('event_guests')
    .select('id, note')
    .eq('token', token)
    .maybeSingle()

  if (fetchError) return res.status(500).json({ error: fetchError.message })
  if (!guest) return res.status(404).json({ error: 'guest_not_found' })

  const now = new Date().toISOString()
  const label = String(body.item_label || 'Lista de regalo').trim()
  const url = String(body.item_url || '').trim()
  const index = Number(body.item_index)
  const key = registryKey(index, url, label)
  const note = parseNote(guest.note)
  const analytics = note.analytics && typeof note.analytics === 'object' ? note.analytics : {}
  const registryClicks =
    analytics.registry_clicks && typeof analytics.registry_clicks === 'object'
      ? analytics.registry_clicks
      : {}
  const previous = registryClicks[key] || {}

  registryClicks[key] = {
    label,
    url,
    item_index: Number.isFinite(index) ? index : null,
    count: (Number(previous.count) || 0) + 1,
    first_clicked_at: previous.first_clicked_at || now,
    last_clicked_at: now,
  }

  const nextNote = {
    ...note,
    analytics: {
      ...analytics,
      registry_clicks: registryClicks,
      total_registry_clicks: (Number(analytics.total_registry_clicks) || 0) + 1,
      last_registry_click_at: now,
    },
  }

  const { error } = await supa
    .from('event_guests')
    .update({ note: JSON.stringify(nextNote) })
    .eq('id', guest.id)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(204).end()
}
