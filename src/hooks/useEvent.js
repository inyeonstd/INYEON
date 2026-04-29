import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_EVENT } from '../data/mockEvent'
import { ensureSeed, getEventBySlug } from '../lib/store'

const HAS_SUPABASE = !!supabase

export function useEvent(slug) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false

    const reloadFromStore = () => {
      const local = getEventBySlug(slug)
      if (local && !cancel) setEvent(local)
    }

    const onStorage = (e) => {
      if (!e.key || e.key === 'inyeon_events_v1') reloadFromStore()
    }
    window.addEventListener('storage', onStorage)

    async function load() {
      // 1. Primero intenta leer del store local (las bodas creadas en /app)
      ensureSeed()
      const local = getEventBySlug(slug)
      if (local) {
        await new Promise((r) => setTimeout(r, 150))
        if (!cancel) {
          setEvent(local)
          setLoading(false)
        }
        return
      }

      // 2. Sin Supabase configurado → mock estático como último fallback
      if (!HAS_SUPABASE) {
        await new Promise((r) => setTimeout(r, 150))
        if (!cancel) {
          if (slug === MOCK_EVENT.slug || !slug) {
            setEvent(MOCK_EVENT)
          } else {
            setError(new Error('not_found'))
          }
          setLoading(false)
        }
        return
      }

      // 3. Con Supabase configurado → fetch real
      try {
        const { data: ev, error: e1 } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single()
        if (e1) throw e1

        const { data: sections, error: e2 } = await supabase
          .from('event_sections')
          .select('*')
          .eq('event_id', ev.id)
          .eq('is_visible', true)
          .order('order_index')
        if (e2) throw e2

        const { data: gallery, error: e3 } = await supabase
          .from('gallery_images')
          .select('image_url, order_index')
          .eq('event_id', ev.id)
          .order('order_index')
        if (e3) throw e3

        if (!cancel) {
          setEvent({
            ...ev,
            sections: sections || [],
            gallery: (gallery || []).map((g) => g.image_url),
          })
          setLoading(false)
        }
      } catch (err) {
        if (!cancel) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancel = true
      window.removeEventListener('storage', onStorage)
    }
  }, [slug])

  return { event, loading, error }
}
