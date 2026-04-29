import { useEffect, useState } from 'react'
import { getEventBySlug } from '../lib/store'

export function useEvent(slug, guestToken) {
  const [event, setEvent] = useState(null)
  const [guest, setGuest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    getEventBySlug(slug, guestToken)
      .then(({ event, guest }) => {
        if (cancel) return
        if (!event) setError(new Error('not_found'))
        setEvent(event)
        setGuest(guest)
        setLoading(false)
      })
      .catch((err) => {
        if (cancel) return
        setError(err)
        setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [slug, guestToken])

  // Live-update vía postMessage del editor padre (sin refetch ni remount)
  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === 'event-updated' && e.data.event) {
        setEvent(e.data.event)
      }
      if (e?.data?.type === 'guest-updated' && e.data.guest) {
        setGuest(e.data.guest)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  return { event, guest, loading, error }
}
