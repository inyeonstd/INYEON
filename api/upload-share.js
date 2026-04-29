// Genera un HTML con meta tags Open Graph y lo sube a Supabase Storage.
// El propósito es bypasear el bloqueo a IPs de Facebook que aplica el team
// `inyeonstds` sobre `*.vercel.app` — Supabase Storage está en otra red y
// los scrapers de WhatsApp / Facebook / iMessage pueden llegar.
//
// Flujo:
//  1) Frontend llama POST /api/upload-share con { slug, guestToken }
//  2) Buscamos el evento en Supabase
//  3) Generamos HTML con <meta og:*> + meta refresh hacia inyeon-lyart...
//  4) Subimos a `media/share/<slug>-<token>.html` (upsert: regenera siempre)
//  5) Devolvemos la URL pública de Supabase
//
// Esa URL es la que se usa para compartir.

import { admin, readBody } from './_lib/supa.js'

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

function buildHtml({ title, description, image, redirectUrl }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const img = escapeHtml(image)
  const r = escapeHtml(redirectUrl)
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Inyeon" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${r}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:secure_url" content="${img}" />
<meta property="og:image:alt" content="${t}" />
<meta property="og:locale" content="es_GT" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${img}" />

<meta http-equiv="refresh" content="0; url=${r}" />
<link rel="canonical" href="${r}" />
<style>
  html,body{margin:0;background:#161514;color:#F2EDE3;font-family:Georgia,serif;height:100%;}
  .wrap{display:flex;align-items:center;justify-content:center;height:100%;text-align:center;padding:32px;}
  a{color:#F2EDE3;}
</style>
</head>
<body>
<div class="wrap">
  <div>
    <p>Cargando invitación…</p>
    <p><a href="${r}">Abrir si no carga automáticamente</a></p>
  </div>
</div>
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</body>
</html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const body = await readBody(req)
    const slug = String(body.slug || '').trim()
    const guestToken = body.guestToken ? String(body.guestToken).trim() : ''
    if (!slug) return res.status(400).json({ error: 'slug required' })

    const supa = admin()
    const { data: event, error } = await supa
      .from('events')
      .select('slug, title, subtitle, event_date, cover_image_url')
      .eq('slug', slug)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    if (!event) return res.status(404).json({ error: 'event not found' })

    const host = req.headers['x-forwarded-host'] || req.headers.host
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const origin = `${proto}://${host}`
    const redirectUrl = guestToken
      ? `${origin}/i/${encodeURIComponent(slug)}?g=${encodeURIComponent(guestToken)}`
      : `${origin}/i/${encodeURIComponent(slug)}`

    const title = event.title || 'Inyeon · Invitación digital'
    const dateStr = formatDate(event.event_date)
    const description =
      event.subtitle ||
      (dateStr ? `Te invitamos · ${dateStr}` : 'Te invitamos a celebrar con nosotros')
    const image = event.cover_image_url || `${origin}/api/og?slug=${encodeURIComponent(slug)}`

    const html = buildHtml({ title, description, image, redirectUrl })
    const path = guestToken
      ? `share/${slug}-${guestToken}.html`
      : `share/${slug}.html`

    const { error: upErr } = await supa.storage
      .from('media')
      .upload(path, Buffer.from(html, 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        cacheControl: '300',
        upsert: true,
      })
    if (upErr) return res.status(500).json({ error: upErr.message })

    const {
      data: { publicUrl },
    } = supa.storage.from('media').getPublicUrl(path)

    return res.status(200).json({ url: publicUrl })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'unexpected' })
  }
}
