// Store API-backed. Todas las funciones que mutan o leen del servidor son async.
// La sesión sigue en localStorage (auth real más adelante).

const KEY_SESSION = 'inyeon_session_v1'

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    let err
    try {
      err = (await res.json()).error
    } catch {}
    throw new Error(err || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// =================== EVENTS ===================

export async function listEvents(owner) {
  if (!owner) return []
  const { events } = await jsonFetch(`/api/events?owner=${encodeURIComponent(owner)}`)
  return events || []
}

export async function getEvent(id) {
  try {
    const { event } = await jsonFetch(`/api/events/${id}`)
    return event
  } catch {
    return null
  }
}

export async function getEventBySlug(slug, guestToken) {
  try {
    const qs = guestToken ? `?g=${encodeURIComponent(guestToken)}` : ''
    const { event, guest } = await jsonFetch(`/api/i/${encodeURIComponent(slug)}${qs}`)
    return { event, guest }
  } catch (err) {
    if (String(err.message).includes('not_found')) return { event: null, guest: null }
    throw err
  }
}

export async function createEvent(owner, partial = {}) {
  const { event } = await jsonFetch(`/api/events`, {
    method: 'POST',
    body: { owner_email: owner, ...partial },
  })
  return event
}

export async function updateEvent(id, patch) {
  const { event } = await jsonFetch(`/api/events/${id}`, {
    method: 'PATCH',
    body: patch,
  })
  return event
}

export async function deleteEvent(id) {
  await jsonFetch(`/api/events/${id}`, { method: 'DELETE' })
}

// =================== GUESTS ===================

export async function addGuest(eventId, guest) {
  const { guest: created } = await jsonFetch(`/api/events/${eventId}/guests`, {
    method: 'POST',
    body: guest,
  })
  return created
}

export async function updateGuest(_eventId, guestId, patch) {
  const { guest } = await jsonFetch(`/api/guests/${guestId}`, {
    method: 'PATCH',
    body: patch,
  })
  return guest
}

export async function removeGuest(_eventId, guestId) {
  await jsonFetch(`/api/guests/${guestId}`, { method: 'DELETE' })
}

// =================== SESSION ===================

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
