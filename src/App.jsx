import { useState, useEffect, useCallback } from 'react'
import { platforms } from './data/platforms'
import ContentPane from './components/ContentPane'
import WhisperPanel from './components/WhisperPanel'
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

// ── .mise file helpers ───────────────────────────────────────────
function presetToMise(preset) {
  return JSON.stringify({
    mise_version: 1,
    name: preset.name,
    title: preset.title,
    description: preset.description,
    hashtags: preset.hashtags,
    savedAt: new Date().toISOString(),
  }, null, 2)
}

function miseToPreset(raw) {
  const data = JSON.parse(raw)
  return {
    id: Date.now().toString(),
    name: data.name || 'Imported',
    title: data.title || '',
    description: data.description || '',
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
  }
}

export default function App() {
  const [formData, setFormData]         = useState(() => { const d = loadDraft(); return d ? { ...INITIAL_FORM, ...d } : INITIAL_FORM })
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [isPopulated, setIsPopulated]   = useState(false)
  const [repopConfirm, setRepopConfirm] = useState(false)
  const [completedPlatforms, setCompletedPlatforms] = useState({})
  const [presets, setPresets]           = useState(loadPresets)
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

  // ── Presets ───────────────────────────────────────────────────
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

  // Export a preset as a .mise file (JSON, plain text, future-proof)
  const handleExportPreset = async (preset) => {
    const content = presetToMise(preset)
    const fileName = `${preset.name.replace(/[/\\?%*:|"<>]/g, '-')}.mise`

    if (window.electronAPI?.saveMiseFile) {
      await window.electronAPI.saveMiseFile(fileName, content)
    } else {
      // Browser fallback
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Import a preset from a .mise file
  const handleImportPreset = async () => {
    if (window.electronAPI?.openMiseFile) {
      const result = await window.electronAPI.openMiseFile()
      if (!result.success) return
      try {
        const preset = miseToPreset(result.content)
        const updated = [preset, ...presets].slice(0, 20)
        setPresets(updated); savePresets(updated)
      } catch { /* invalid file */ }
    } else {
      // Browser fallback
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.mise,.json'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        try {
          const preset = miseToPreset(await file.text())
          const updated = [preset, ...presets].slice(0, 20)
          setPresets(updated); savePresets(updated)
        } catch { /* invalid file */ }
      }
      input.click()
    }
  }

  const currentPlatform = selectedPlatform ? platforms.find(p => p.id === selectedPlatform) ?? null : null
  const hasContent = !!(formData.title?.trim() || formData.videoFile)

  return (
    <div className="app-shell">
      <nav className="platform-nav">
        <div className="nav-logo-area">
          <img src="./logo.png" alt="Mise En Uploader" className="nav-logo-img" />
        </div>

        {/* ALL */}
        <button
          className={`nav-btn nav-all${!selectedPlatform ? ' nav-active' : ''}`}
          onClick={() => handleSelectPlatform(null)}
        >
          <span className="nav-all-icon">⊞</span>
          <span className="nav-label">ALL</span>
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
            <p>Repopulate?<br /><span>Reverts per-platform edits.</span></p>
            <div className="nav-repop-btns">
              <button className="nav-repop-yes" onClick={handleRepopulate}>Yes</button>
              <button className="nav-repop-cancel" onClick={() => setRepopConfirm(false)}>No</button>
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
            title={!isPopulated ? 'Click Populate to enable' : p.name}
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
          {clearConfirm ? '⚠ Sure?' : '× Clear'}
        </button>

        <div className="nav-copyright">© Trace Elements Media</div>
      </nav>

      <div className="main-area">
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
            onExportPreset={handleExportPreset}
            onImportPreset={handleImportPreset}
          />
        </main>

        {/* Whisper panel — persistent across platform views */}
        {formData.videoFile && (
          <WhisperPanel videoFile={formData.videoFile} />
        )}
      </div>
    </div>
  )
}
