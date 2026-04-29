import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useEvent } from '../hooks/useEvent'
import { EditModeContext } from '../lib/edit'

import Hero from '../components/sections/Hero'
import Parents from '../components/sections/Parents'
import Events from '../components/sections/Events'
import Itinerary from '../components/sections/Itinerary'
import Registry from '../components/sections/Registry'
import Lodging from '../components/sections/Lodging'
import Dresscode from '../components/sections/Dresscode'
import Gallery from '../components/sections/Gallery'
import Closing from '../components/sections/Closing'
import Footer from '../components/sections/Footer'

export default function InvitationPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params.slug
  const [searchParams] = useSearchParams()
  const guestToken = searchParams.get('g')
  const editMode = searchParams.get('edit') === '1'
  const { event, guest, loading, error } = useEvent(slug, guestToken)

  useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type !== 'scrollToSection') return
      const target = document.getElementById(`section-${e.data.section}`)
      if (!target) return
      const top = target.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'auto' })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cream/60">
          Cargando ·
        </p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
          Error 404
        </p>
        <h1 className="font-display text-5xl font-light italic text-ink">
          Invitación no encontrada
        </h1>
      </div>
    )
  }

  // Helper para encontrar sección por type
  const getSection = (type) =>
    event.sections?.find((s) => s.type === type && s.is_visible !== false)

  const parents = getSection('parents')
  const ceremony = getSection('ceremony')
  const reception = getSection('reception')
  const itinerary = getSection('itinerary')
  const registry = getSection('registry')
  const lodging = getSection('lodging')
  const dresscode = getSection('dresscode')

  const eventItems = [ceremony, reception].filter(Boolean)

  return (
    <EditModeContext.Provider value={editMode}>
    <main>
      <div id="section-hero"><Hero event={event} guest={guest} /></div>
      {(() => {
        const blocks = [
          parents && {
            id: 'parents',
            render: (p) => <Parents {...p} event={event} content={parents.content} />,
          },
          eventItems.length > 0 && {
            id: 'events',
            render: (p) => <Events {...p} event={event} items={eventItems} />,
          },
          itinerary && {
            id: 'itinerary',
            render: (p) => (
              <Itinerary {...p} event={event} content={itinerary.content} />
            ),
          },
          registry && {
            id: 'registry',
            render: (p) => (
              <Registry
                {...p}
                event={event}
                content={registry.content}
                guestToken={guestToken}
              />
            ),
          },
          lodging && {
            id: 'lodging',
            render: (p) => (
              <Lodging {...p} event={event} content={lodging.content} />
            ),
          },
          dresscode && {
            id: 'dresscode',
            render: (p) => (
              <Dresscode {...p} event={event} content={dresscode.content} />
            ),
          },
          event.gallery?.length > 0 && {
            id: 'gallery',
            render: (p) => <Gallery {...p} event={event} images={event.gallery} />,
          },
        ].filter(Boolean)
        return blocks.map((b, i) => {
          const num = String(i + 1).padStart(2, '0')
          const dark = i % 2 === 1
          return (
            <div key={b.id} id={`section-${b.id}`}>
              {b.render({ num, dark })}
            </div>
          )
        })
      })()}
      <div id="section-closing">
        <Closing
          key={`${event.id}:${guestToken || 'public'}`}
          event={event}
          guest={guest}
          guestToken={guestToken}
        />
      </div>
      <div id="section-footer"><Footer event={event} /></div>
    </main>
    </EditModeContext.Provider>
  )
}
