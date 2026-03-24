import { useState, useEffect, useCallback } from 'react'
import { platforms } from './data/platforms'
import ContentPane from './components/ContentPane'
import './App.css'

const DRAFT_KEY    = 'mise-draft-v1'
const PRESETS_KEY  = 'mise-presets-v1'

const INITIAL_FORM = {
  title: '',
  description: '',
  videoFile: null,
  thumbnailFile: null,
  hashtags: [],
  platformHashtags: {},
  platformContent: {},
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) // { title, description, hashtags, platformHashtags, platformContent }
  } catch { return null }
}

function saveDraft(formData) {
  const { videoFile, thumbnailFile, ...serialisable } = formData
  localStorage.setItem(DRAFT_KEY, JSON.stringify(serialisable))
}

function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]') } catch { return [] }
}

function savePresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

export default function App() {
  const [formData, setFormData]       = useState(() => {
    const draft = loadDraft()
    return draft ? { ...INITIAL_FORM, ...draft } : INITIAL_FORM
  })
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [isLocked, setIsLocked]       = useState(false)
  const [completedPlatforms, setCompletedPlatforms] = useState({})
  const [presets, setPresets]         = useState(loadPresets)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(() => !!loadDraft())

  // Auto-save draft on form change (text fields only — files can't be serialised)
  useEffect(() => {
    saveDraft(formData)
  }, [formData])

  // Dismiss the "restored" notice after 4 s
  useEffect(() => {
    if (!restoredDraft) return
    const t = setTimeout(() => setRestoredDraft(false), 4000)
    return () => clearTimeout(t)
  }, [restoredDraft])

  // Clear-confirm timeout
  useEffect(() => {
    if (!clearConfirm) return
    const t = setTimeout(() => setClearConfirm(false), 3000)
    return () => clearTimeout(t)
  }, [clearConfirm])

  const handleSelectPlatform = useCallback((platformId) => {
    setSelectedPlatform(platformId)
    if (platformId && formData.platformHashtags[platformId] === undefined) {
      const platform = platforms.find(p => p.id === platformId)
      const suggested = platform?.suggestedHashtags || []
      setFormData(prev => ({
        ...prev,
        platformHashtags: { ...prev.platformHashtags, [platformId]: [...suggested] },
      }))
    }
  }, [formData.platformHashtags])

  const handleLock = () => {
    setIsLocked(true)
    if (platforms.length > 0) handleSelectPlatform(platforms[0].id)
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setSelectedPlatform(null)
  }

  const handleClear = () => {
    if (!clearConfirm) { setClearConfirm(true); return }
    setFormData(INITIAL_FORM)
    setCompletedPlatforms({})
    setIsLocked(false)
    setSelectedPlatform(null)
    setClearConfirm(false)
    localStorage.removeItem(DRAFT_KEY)
    setRestoredDraft(false)
  }

  const handlePlatformComplete = (platformId) => {
    setCompletedPlatforms(prev => ({ ...prev, [platformId]: true }))
  }

  // ── Presets ──────────────────────────────────────────────────────
  const handleSavePreset = (name) => {
    const preset = {
      id: Date.now().toString(),
      name,
      title: formData.title,
      description: formData.description,
      hashtags: formData.hashtags,
    }
    const updated = [preset, ...presets].slice(0, 20) // max 20
    setPresets(updated)
    savePresets(updated)
  }

  const handleLoadPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      description: preset.description,
      hashtags: preset.hashtags,
    }))
  }

  const handleDeletePreset = (id) => {
    const updated = presets.filter(p => p.id !== id)
    setPresets(updated)
    savePresets(updated)
  }

  const currentPlatform = selectedPlatform
    ? platforms.find(p => p.id === selectedPlatform) ?? null
    : null

  const hasContent = !!(formData.title?.trim() || formData.videoFile)

  return (
    <div className="app-shell">
      <nav className="platform-nav">
        <div className="nav-logo">
          <span className="nav-logo-mise">MISE EN </span><span className="nav-logo-uploader">Uploader</span>
        </div>

        {!isLocked && (
          <>
            <button
              className={`nav-btn nav-all${!selectedPlatform ? ' nav-active' : ''}`}
              onClick={() => handleSelectPlatform(null)}
            >
              ALL
            </button>
            <div className="nav-divider" />
          </>
        )}

        {platforms.map(p => (
          <button
            key={p.id}
            className={`nav-btn nav-platform${selectedPlatform === p.id ? ' nav-active' : ''}${completedPlatforms[p.id] ? ' nav-done' : ''}`}
            style={{ '--pc': p.color }}
            onClick={() => handleSelectPlatform(p.id)}
          >
            <span className="nav-emoji">{p.emoji}</span>
            <span className="nav-label">{p.shortName}</span>
            {completedPlatforms[p.id] && <span className="nav-check">✓</span>}
          </button>
        ))}

        <div className="nav-spacer" />

        <div className="nav-lock-wrap">
          {isLocked ? (
            <button className="nav-lock-btn nav-unlock-btn" onClick={handleUnlock}>
              🔓 Unlock
            </button>
          ) : (
            <button
              className="nav-lock-btn"
              disabled={!hasContent}
              onClick={handleLock}
              title={!hasContent ? 'Add a title or video first' : ''}
            >
              🔒 Lock
            </button>
          )}
        </div>

        <button
          className={`nav-clear-btn${clearConfirm ? ' nav-clear-btn--confirm' : ''}`}
          onClick={handleClear}
          title="Clear all content and start over"
        >
          {clearConfirm ? '⚠ Confirm clear?' : '× Clear'}
        </button>

        <div className="nav-copyright">© Trace Elements Media</div>
      </nav>

      <main className="content-area">
        {restoredDraft && (
          <div className="draft-banner">
            ↩ Restored from last session
          </div>
        )}
        <ContentPane
          formData={formData}
          onChange={setFormData}
          currentPlatform={currentPlatform}
          isLocked={isLocked}
          onLock={handleLock}
          onUnlock={handleUnlock}
          completedPlatforms={completedPlatforms}
          onPlatformComplete={handlePlatformComplete}
          presets={presets}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
        />
      </main>
    </div>
  )
}
