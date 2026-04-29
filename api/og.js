import React from 'react'
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const colors = {
  cream: '#F2EDE3',
  ink: '#161514',
  rust: '#B8593A',
}

async function getEvent(slug) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || !slug) return null

  try {
    const endpoint = `${url}/rest/v1/events?slug=eq.${encodeURIComponent(
      slug
    )}&select=title,subtitle,event_date,cover_image_url`
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0] || null
  } catch {
    return null
  }
}

async function loadFont(origin, file) {
  try {
    const res = await fetch(`${origin}/fonts/${file}`)
    if (!res.ok) return null
    return res.arrayBuffer()
  } catch {
    return null
  }
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function renderImage({ title, dateStr, cover, slug, fontRegular, fontItalic }) {
  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: colors.ink,
          color: colors.cream,
          fontFamily: 'Fraunces, serif',
          overflow: 'hidden',
        },
      },
      cover
        ? React.createElement('img', {
            src: cover,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          })
        : null,
      React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(22, 21, 20, 0.55)',
          display: 'flex',
        },
      }),
      React.createElement('div', {
        style: {
          position: 'absolute',
          top: 48,
          left: 48,
          right: 48,
          bottom: 48,
          border: `2px solid ${colors.cream}`,
          opacity: 0.72,
          display: 'flex',
        },
      }),
      React.createElement(
        'div',
        {
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px 84px',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 28,
              letterSpacing: 8,
              textTransform: 'uppercase',
              opacity: 0.82,
            },
          },
          React.createElement('span', null, 'Inyeon'),
          React.createElement('span', null, 'Invitación')
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 860,
            },
          },
          React.createElement('div', {
            style: {
              width: 120,
              height: 2,
              background: colors.rust,
              marginBottom: 22,
              display: 'flex',
            },
          }),
          React.createElement(
            'div',
            {
              style: {
                fontSize: title.length > 26 ? 84 : 104,
                lineHeight: 1,
                fontStyle: 'italic',
                fontWeight: 600,
                display: 'flex',
              },
            },
            title
          ),
          React.createElement(
            'div',
            {
              style: {
                marginTop: 22,
                fontSize: 30,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: colors.cream,
                opacity: 0.86,
                display: 'flex',
              },
            },
            dateStr || 'Invitación digital'
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 24,
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: 0.75,
            },
          },
          React.createElement('span', null, 'Hecha con Inyeon'),
          React.createElement('span', null, slug ? `/${slug}` : '')
        )
      )
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        fontRegular && {
          name: 'Fraunces',
          data: fontRegular,
          style: 'normal',
          weight: 400,
        },
        fontItalic && {
          name: 'Fraunces',
          data: fontItalic,
          style: 'italic',
          weight: 600,
        },
      ].filter(Boolean),
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}

export default async function handler(req) {
  const requestUrl = new URL(req.url)
  const slug = requestUrl.searchParams.get('slug') || ''
  const debug = requestUrl.searchParams.get('debug') === '1'
  const noCover = requestUrl.searchParams.get('nocover') === '1'

  try {
    const event = await getEvent(slug)
    const title = event?.title || (slug ? slug.replace(/-/g, ' ') : 'Inyeon')
    const cover = noCover ? '' : event?.cover_image_url || ''
    const dateStr = formatDate(event?.event_date)
    const origin = requestUrl.origin

    const [fontRegular, fontItalic] = await Promise.all([
      loadFont(origin, 'fraunces-latin-400-normal.woff2'),
      loadFont(origin, 'fraunces-latin-600-italic.woff2'),
    ])

    if (debug) {
      return new Response(
        JSON.stringify(
          {
            slug,
            hasEvent: !!event,
            title,
            cover,
            dateStr,
            fontRegular: fontRegular ? fontRegular.byteLength : 0,
            fontItalic: fontItalic ? fontItalic.byteLength : 0,
            envSupabaseUrl: !!process.env.SUPABASE_URL,
            envSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
          },
          null,
          2
        ),
        { headers: { 'content-type': 'application/json; charset=utf-8' } }
      )
    }

    return renderImage({ title, dateStr, cover, slug, fontRegular, fontItalic })
  } catch (err) {
    return new Response(
      `OG render failed: ${err?.message || err}\n${err?.stack || ''}`,
      {
        status: 500,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    )
  }
}
