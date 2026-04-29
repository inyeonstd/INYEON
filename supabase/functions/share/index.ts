// Supabase Edge Function que devuelve un HTML con meta tags Open Graph
// para que WhatsApp / Facebook / iMessage muestren preview con la portada
// y el título de la invitación.
//
// Vive en Supabase porque el team de Vercel del proyecto bloquea las IPs
// de Facebook. Supabase Edge Functions están en Deno Deploy / Cloudflare
// y los scrapers sí pueden alcanzarlas.
//
// URL: https://<project-ref>.supabase.co/functions/v1/share?slug=...&g=...
//
// Para deployar:
//   supabase functions deploy share --no-verify-jwt --project-ref <ref>

// @ts-ignore - Deno globals are provided at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
// @ts-ignore
const SUPABASE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY') ??
  ''

const SITE_ORIGIN = 'https://inyeon-lyart.vercel.app'

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(value: string | null): string {
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

async function getEvent(slug: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const endpoint =
    `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}` +
    `&select=slug,title,subtitle,event_date,cover_image_url`
  const res = await fetch(endpoint, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] ?? null
}

function html({
  title,
  description,
  image,
  redirectUrl,
}: {
  title: string
  description: string
  image: string
  redirectUrl: string
}): string {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const img = escapeHtml(image)
  const r = escapeHtml(redirectUrl)
  const rJson = JSON.stringify(redirectUrl)
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
<script>window.location.replace(${rJson});</script>
</body>
</html>`
}

// @ts-ignore - Deno.serve is provided at runtime
Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url)
    const slug = (url.searchParams.get('slug') || '').trim()
    const guestToken = (url.searchParams.get('g') || '').trim()
    if (!slug) {
      return new Response('slug required', { status: 400 })
    }

    const event = await getEvent(slug)
    const title = event?.title || 'Inyeon · Invitación digital'
    const dateStr = formatDate(event?.event_date ?? null)
    const description =
      event?.subtitle ||
      (dateStr ? `Te invitamos · ${dateStr}` : 'Te invitamos a celebrar con nosotros')
    const image =
      event?.cover_image_url || `${SITE_ORIGIN}/api/og?slug=${encodeURIComponent(slug)}`
    const redirectUrl = guestToken
      ? `${SITE_ORIGIN}/i/${encodeURIComponent(slug)}?g=${encodeURIComponent(guestToken)}`
      : `${SITE_ORIGIN}/i/${encodeURIComponent(slug)}`

    const body = html({ title, description, image, redirectUrl })
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        'access-control-allow-origin': '*',
      },
    })
  } catch (err) {
    return new Response(`error: ${(err as Error).message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
})
