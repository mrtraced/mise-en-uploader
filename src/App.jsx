import { useState, useEffect, useCallback } from 'react'
import { platforms } from './data/platforms'
import ContentPane from './components/ContentPane'
import './App.css'

const DRAFT_KEY   = 'mise-draft-v1'
const PRESETS_KEY = 'mise-presets-v1'

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
  try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function saveDraft(formData) {
  const { videoFile, thumbnailFile, ...s } = formData
  localStorage.setItem(DRAFT_KEY, JSON.stringify(s))
}
function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]') } catch { return [] }
}
function savePresets(p) { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)) }

export default function App() {
  const [formData, setFormData]     = useState(() => { const d = loadDraft(); return d ? { ...INITIAL_FORM, ...d } : INITIAL_FORM })
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [isPopulated, setIsPopulated]   = useState(false)
  const [repopConfirm, setRepopConfirm] = useState(false)
  const [completedPlatforms, setCompletedPlatforms] = useState({})
  const [presets, setPresets]       = useState(loadPresets)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(() => !!loadDraft())

  // Auto-save text fields
  useEffect(() => { saveDraft(formData) }, [formData])

  // Dismiss restored banner
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

  // Repopulate-confirm timeout
  useEffect(() => {
    if (!repopConfirm) return
    const t = setTimeout(() => setRepopConfirm(false), 5000)
    return () => clearTimeout(t)
  }, [repopConfirm])

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

  const handlePopulate = () => {
    setIsPopulated(true)
    setRepopConfirm(false)
    if (platforms.length > 0) handleSelectPlatform(platforms[0].id)
  }

  const handleRepopulate = () => {
    // Reset per-platform overrides and re-seed
    setFormData(prev => ({ ...prev, platformContent: {}, platformHashtags: {} }))
    setCompletedPlatforms({})
    setRepopConfirm(false)
    if (platforms.length > 0) handleSelectPlatform(platforms[0].id)
  }

  const handleClear = () => {
    if (!clearConfirm) { setClearConfirm(true); return }
    setFormData(INITIAL_FORM)
    setCompletedPlatforms({})
    setIsPopulated(false)
    setSelectedPlatform(null)
    setClearConfirm(false)
    setRepopConfirm(false)
    localStorage.removeItem(DRAFT_KEY)
    setRestoredDraft(false)
  }

  const handlePlatformComplete = (platformId) => {
    setCompletedPlatforms(prev => ({ ...prev, [platformId]: true }))
  }

  // ── Presets ──────────────────────────────────────────────────────
  const handleSavePreset = (name) => {
    const preset = { id: Date.now().toString(), name, title: formData.title, description: formData.description, hashtags: formData.hashtags }
    const updated = [preset, ...presets].slice(0, 20)
    setPresets(updated); savePresets(updated)
  }
  const handleLoadPreset = (preset) => {
    setFormData(prev => ({ ...prev, title: preset.title, description: preset.description, hashtags: preset.hashtags }))
  }
  const handleDeletePreset = (id) => {
    const updated = presets.filter(p => p.id !== id); setPresets(updated); savePresets(updated)
  }

  const currentPlatform = selectedPlatform ? platforms.find(p => p.id === selectedPlatform) ?? null : null
  const hasContent = !!(formData.title?.trim() || formData.videoFile)

  return (
    <div className="app-shell">
      <nav className="platform-nav">
        <div className="nav-logo">
          <span className="nav-logo-mise">MISE EN </span><span className="nav-logo-uploader">Uploader</span>
        </div>

        {/* ALL */}
        <button
          className={`nav-btn nav-all${!selectedPlatform ? ' nav-active' : ''}`}
          onClick={() => handleSelectPlatform(null)}
        >
          ALL
        </button>

        {/* POPULATE / REPOPULATE */}
        {!isPopulated ? (
          <button
            className="nav-populate-btn"
            disabled={!hasContent}
            onClick={handlePopulate}
            title={!hasContent ? 'Add a title or video first' : 'Copy content to all platforms'}
          >
            ▼ Populate
          </button>
        ) : repopConfirm ? (
          <div className="nav-repop-confirm">
            <p>Repopulate from Original?<br /><span>Will revert any changes made to individual posts.</span></p>
            <div className="nav-repop-btns">
              <button className="nav-repop-yes" onClick={handleRepopulate}>Yes, repopulate</button>
              <button className="nav-repop-cancel" onClick={() => setRepopConfirm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="nav-populate-btn nav-repopulate-btn" onClick={() => setRepopConfirm(true)}>
            ↺ Repopulate
          </button>
        )}

        <div className="nav-divider nav-divider--spaced" />

        {/* Platforms — disabled until populated */}
        {platforms.map(p => (
          <button
            key={p.id}
            className={`nav-btn nav-platform${selectedPlatform === p.id ? ' nav-active' : ''}${completedPlatforms[p.id] ? ' nav-done' : ''}`}
            style={{ '--pc': p.color }}
            disabled={!isPopulated}
            onClick={() => handleSelectPlatform(p.id)}
            title={!isPopulated ? 'Click Populate to enable' : ''}
          >
            <span className="nav-emoji">{p.emoji}</span>
            <span className="nav-label">{p.shortName}</span>
            {completedPlatforms[p.id] && <span className="nav-check">✓</span>}
          </button>
        ))}

        <div className="nav-spacer" />

        <button
          className={`nav-clear-btn${clearConfirm ? ' nav-clear-btn--confirm' : ''}`}
          onClick={handleClear}
        >
          {clearConfirm ? '⚠ Confirm clear?' : '× Clear'}
        </button>

        <div className="nav-copyright">© Trace Elements Media</div>
      </nav>

      <main className="content-area">
        {restoredDraft && <div className="draft-banner">↩ Restored from last session</div>}
        <ContentPane
          formData={formData}
          onChange={setFormData}
          currentPlatform={currentPlatform}
          isPopulated={isPopulated}
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
