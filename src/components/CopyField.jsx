import { useState, useRef } from 'react'

export default function CopyField({ label, value, hint }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  const isEmpty = !value || value.trim() === ''

  const handleClick = async () => {
    if (isEmpty) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement('textarea')
      el.value = value
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`copy-field${copied ? ' copy-field--copied' : ''}${isEmpty ? ' copy-field--empty' : ''}`}
      onClick={handleClick}
      role={isEmpty ? undefined : 'button'}
      tabIndex={isEmpty ? undefined : 0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isEmpty) handleClick() }}
      aria-label={isEmpty ? undefined : `Copy ${label} to clipboard`}
      title={isEmpty ? 'Nothing to copy' : 'Click to copy'}
    >
      <div className="copy-field__header">
        <span className="copy-field__label">{label}</span>
        <span className="copy-field__status">
          {copied ? '✓ Copied!' : isEmpty ? '—' : (
            <><span style={{ fontSize: '0.75rem', marginRight: 2 }}>⎘</span> Click to copy</>
          )}
        </span>
      </div>
      <div className="copy-field__body">
        {isEmpty ? (
          <span className="copy-field__empty-text">Nothing entered yet</span>
        ) : (
          <div className="copy-field__value">{value}</div>
        )}
        {hint && !isEmpty && <div className="copy-field__hint">{hint}</div>}
      </div>
    </div>
  )
}
