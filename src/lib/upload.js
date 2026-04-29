// Sube una imagen. Camino preferido: /api/upload (Supabase Storage vía serverless).
// Si el endpoint no responde (vite dev, sin Supabase, etc.) cae a base64 local.
export async function uploadImage(file, { maxWidth = 1600, quality = 0.85 } = {}) {
  if (!file) throw new Error('No file')
  if (!file.type?.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }
  const blob = await compressToBlob(file, maxWidth, quality)
  const remote = await tryRemoteUpload(blob)
  if (remote) return remote
  return await blobToDataUrl(blob)
}

async function tryRemoteUpload(blob) {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': blob.type },
      body: blob,
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return null
    const data = await res.json()
    return data?.url || null
  } catch {
    return null
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

async function compressToBlob(file, maxWidth, quality) {
  const img = await loadImage(file)
  const ratio = Math.min(1, maxWidth / img.width)
  const w = Math.max(1, Math.round(img.width * ratio))
  const h = Math.max(1, Math.round(img.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  const isPng = file.type === 'image/png'
  const mime = isPng ? 'image/png' : 'image/jpeg'
  return await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, quality)
  )
}
