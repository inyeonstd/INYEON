import { MOCK_EVENT } from '../data/mockEvent'

const KEY_EVENTS = 'inyeon_events_v1'
const KEY_SESSION = 'inyeon_session_v1'

const uid = () => Math.random().toString(36).slice(2, 10)
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'boda'

function read() {
  try {
    const raw = localStorage.getItem(KEY_EVENTS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function write(events) {
  localStorage.setItem(KEY_EVENTS, JSON.stringify(events))
}

export function ensureSeed() {
  const events = read()
  if (events.length === 0) {
    const seed = {
      ...JSON.parse(JSON.stringify(MOCK_EVENT)),
      id: uid(),
      slug: 'demo-sofia-roberto',
      owner: '__seed__',
      guests: [
        { id: uid(), token: uid() + uid(), name: 'Familia Cavazos', kind: 'group', passes: 4 },
        { id: uid(), token: uid() + uid(), name: 'Andrés Pérez', kind: 'single', passes: 1 },
      ],
    }
    write([seed])
  }
}

export function listEvents(owner) {
  return read().filter((e) => !owner || e.owner === owner || e.owner === '__seed__')
}

export function getEvent(id) {
  return read().find((e) => e.id === id) || null
}

export function getEventBySlug(slug) {
  return read().find((e) => e.slug === slug) || null
}

export function createEvent(owner, partial = {}) {
  const events = read()
  const title = partial.title || 'Nombre & Nombre'
  const slugBase = slugify(title)
  let slug = slugBase
  let i = 2
  while (events.some((e) => e.slug === slug)) slug = `${slugBase}-${i++}`

  const now = new Date()
  const future = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 19, 0, 0)

  const ev = {
    id: uid(),
    owner,
    slug,
    type: 'wedding',
    status: 'draft',
    title,
    subtitle: 'Una unión',
    event_date: future.toISOString(),
    cover_image_url:
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
    palette: { primary: '#161514', secondary: '#B8593A', accent: '#F2EDE3' },
    sections: [
      { type: 'parents', order_index: 0, is_visible: true, content: { bride: ['', ''], groom: ['', ''] } },
      { type: 'ceremony', order_index: 1, is_visible: true, content: { number: 'I', venue: '', address: '', time: '19:00', maps_url: '' } },
      { type: 'reception', order_index: 2, is_visible: true, content: { number: 'II', venue: '', address: '', time: '21:00', maps_url: '' } },
      { type: 'itinerary', order_index: 3, is_visible: true, content: { items: [] } },
      { type: 'registry', order_index: 4, is_visible: false, content: { items: [] } },
      { type: 'lodging', order_index: 5, is_visible: false, content: { name: '', address: '', code: '' } },
      { type: 'dresscode', order_index: 6, is_visible: true, content: { items: [] } },
    ],
    gallery: [],
    guests: [],
    ...partial,
  }
  events.push(ev)
  write(events)
  return ev
}

export function updateEvent(id, patch) {
  const events = read()
  const idx = events.findIndex((e) => e.id === id)
  if (idx < 0) return null
  const next = { ...events[idx], ...patch }
  if (patch.title && !patch.slug) {
    const newSlug = slugify(patch.title)
    if (!events.some((e) => e.slug === newSlug && e.id !== id)) next.slug = newSlug
  }
  events[idx] = next
  write(events)
  return next
}

export function deleteEvent(id) {
  write(read().filter((e) => e.id !== id))
}

export function upsertSection(eventId, type, content, isVisible = true) {
  const ev = getEvent(eventId)
  if (!ev) return null
  const sections = [...(ev.sections || [])]
  const idx = sections.findIndex((s) => s.type === type)
  if (idx >= 0) {
    sections[idx] = { ...sections[idx], content, is_visible: isVisible }
  } else {
    sections.push({ type, order_index: sections.length, is_visible: isVisible, content })
  }
  return updateEvent(eventId, { sections })
}

export function setSectionVisibility(eventId, type, isVisible) {
  const ev = getEvent(eventId)
  if (!ev) return null
  const sections = (ev.sections || []).map((s) =>
    s.type === type ? { ...s, is_visible: isVisible } : s
  )
  return updateEvent(eventId, { sections })
}

// Guests
export function addGuest(eventId, guest) {
  const ev = getEvent(eventId)
  if (!ev) return null
  const g = {
    id: uid(),
    token: uid() + uid(),
    name: guest.name || 'Invitado',
    kind: guest.kind || 'single',
    passes: Number(guest.passes) || 1,
    note: guest.note || '',
    rsvp: 'pending',
  }
  return updateEvent(eventId, { guests: [...(ev.guests || []), g] })
}

export function updateGuest(eventId, guestId, patch) {
  const ev = getEvent(eventId)
  if (!ev) return null
  const guests = (ev.guests || []).map((g) => (g.id === guestId ? { ...g, ...patch } : g))
  return updateEvent(eventId, { guests })
}

export function removeGuest(eventId, guestId) {
  const ev = getEvent(eventId)
  if (!ev) return null
  return updateEvent(eventId, { guests: (ev.guests || []).filter((g) => g.id !== guestId) })
}

export function getGuestByToken(eventSlug, token) {
  const ev = getEventBySlug(eventSlug)
  if (!ev) return null
  return (ev.guests || []).find((g) => g.token === token) || null
}

// Session
export function getSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(email) {
  const s = { email, since: Date.now() }
  localStorage.setItem(KEY_SESSION, JSON.stringify(s))
  return s
}

export function clearSession() {
  localStorage.removeItem(KEY_SESSION)
}

export function buildGuestLink(slug, token) {
  const base = `${window.location.origin}/i/${slug}`
  return token ? `${base}?g=${token}` : base
}
