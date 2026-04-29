import { useEditMode } from '../lib/edit'

export default function Editable({ path, children, multiline = false, className = '', as: Tag = 'span' }) {
  const editing = useEditMode()
  if (!editing) return <Tag className={className}>{children}</Tag>

  const onBlur = (e) => {
    // textContent ignora text-transform (uppercase, etc.) y devuelve el dato raw.
    // Para multiline, innerText preserva line-breaks (<br>) que el usuario haya tecleado.
    const raw = multiline
      ? e.currentTarget.innerText || ''
      : e.currentTarget.textContent || ''
    const value = multiline ? raw : raw.replace(/\s+/g, ' ').trim()
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'edit', path, value }, '*')
    }
  }

  const onKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') e.currentTarget.blur()
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-edit-path={path}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={`-mx-0.5 cursor-text rounded px-0.5 outline outline-1 outline-dashed outline-rust/30 transition-[outline-color] hover:outline-rust focus:outline-2 focus:outline-rust ${className}`}
    >
      {children}
    </Tag>
  )
}
