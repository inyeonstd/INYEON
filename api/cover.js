// Sirve la portada del evento desde el mismo dominio que la página de share.
// WhatsApp / Facebook / iMessage prefieren og:image same-origin — cuando
// apuntamos directo a Supabase Storage los previews no aparecen consistente.
//
// Toma ?slug=, busca el evento, fetchea la imagen de Supabase y la
// devuelve como image/jpeg con caché agresivo.

import { admin } from './_lib/supa.js'

export default async function handler(req, res) {
  try {
    const slug = (req.query?.slug || '').toString().trim()
    if (!slug) {
      res.status(400).send('slug required')
      return
    }

    const supa = admin()
    const { data: event } = await supa
      .from('events')
      .select('cover_image_url')
      .eq('slug', slug)
      .maybeSingle()

    const url = event?.cover_image_url
    if (!url) {
      res.status(404).send('no cover')
      return
    }

    const upstream = await fetch(url)
    if (!upstream.ok) {
      res.status(502).send(`upstream ${upstream.status}`)
      return
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', String(buf.length))
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800'
    )
    res.status(200).send(buf)
  } catch (err) {
    res.status(500).send(`error: ${err?.message || 'unknown'}`)
  }
}
