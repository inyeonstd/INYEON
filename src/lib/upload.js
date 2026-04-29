// Sube una imagen local. Hoy: comprime y devuelve un data URL (base64) para
// guardar en localStorage. Cuando Supabase Storage esté configurado, este es
// el único punto a cambiar.
export async function uploadImage(file, { maxWidth = 1600, quality = 0.85 } = {}) {
  if (!file) throw new Error('No file')
  if (!file.type?.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }
  return await compressToDataUrl(file, maxWidth, quality)
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

async function compressToDataUrl(file, maxWidth, quality) {
  const img = await loadImage(file)
  const ratio = Math.min(1, maxWidth / img.width)
  const w = Math.max(1, Math.round(img.width * ratio))
  const h = Math.max(1, Math.round(img.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const isPng = file.type === 'image/png'
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality)
}
