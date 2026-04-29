import { createContext, useContext } from 'react'

export const EditModeContext = createContext(false)
export const useEditMode = () => useContext(EditModeContext)

// path examples:
//   text:hero_label
//   field:title
//   section:ceremony:venue
//   section:itinerary:items.0.time
//   section:parents:bride.0
export function applyEdit(event, path, value) {
  const [kind, ...parts] = String(path).split(':')
  if (kind === 'text') {
    return { texts: { ...(event.texts || {}), [parts[0]]: value } }
  }
  if (kind === 'field') {
    return { [parts[0]]: value }
  }
  if (kind === 'section') {
    const [type, propPath] = parts
    const sections = (event.sections || []).map((s) =>
      s.type === type ? { ...s, content: setByPath(s.content || {}, propPath, value) } : s
    )
    return { sections }
  }
  return null
}

function setByPath(obj, path, value) {
  const keys = String(path).split('.')
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) }
  let cursor = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = isNaN(keys[i]) ? keys[i] : Number(keys[i])
    const child = cursor[k]
    cursor[k] = Array.isArray(child) ? [...child] : { ...(child || {}) }
    cursor = cursor[k]
  }
  const last = keys[keys.length - 1]
  cursor[isNaN(last) ? last : Number(last)] = value
  return root
}
