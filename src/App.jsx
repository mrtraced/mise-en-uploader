import { useState } from 'react'
import { platforms } from './data/platforms'
import ContentPane from './components/ContentPane'
import './App.css'

const INITIAL_FORM = {
  title: '',
  description: '',
  videoFile: null,
  thumbnailFile: null,
  hashtags: [],           // global user-added hashtags (ALL view)
  platformHashtags: {},   // { [id]: string[] } seeded from suggestedHashtags
  platformContent: {},    // { [id]: { title?, description? } } per-platform overrides
}

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [completedPlatforms, setCompletedPlatforms] = useState({})

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    if (platformId && formData.platformHashtags[platformId] === undefined) {
      const platform = platforms.find(p => p.id === platformId)
      const suggested = platform?.suggestedHashtags || []
      setFormData(prev => ({
        ...prev,
        platformHashtags: { ...prev.platformHashtags, [platformId]: [...suggested] },
      }))
    }
  }

  const handleLock = () => {
    setIsLocked(true)
    // Auto-start publishing flow at first platform
    if (platforms.length > 0) handleSelectPlatform(platforms[0].id)
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setSelectedPlatform(null)
  }

  const handlePlatformComplete = (platformId) => {
    setCompletedPlatforms(prev => ({ ...prev, [platformId]: true }))
  }

  const currentPlatform = selectedPlatform
    ? platforms.find(p => p.id === selectedPlatform) ?? null
    : null

  const hasContent = !!(formData.title?.trim() || formData.videoFile)
  const allDone = isLocked && platforms.every(p => completedPlatforms[p.id])

  return (
    <div className="app-shell">
      {/* ── Left Nav ── */}
      <nav className="platform-nav">
        <div className="nav-logo">
          <span className="nav-logo-mise">Mise En</span>
          <span className="nav-logo-uploader">Uploader</span>
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
              title={!hasContent ? 'Add a title or video first' : 'Lock content and begin publishing'}
            >
              🔒 Lock
            </button>
          )}
        </div>

        <div className="nav-copyright">© Trace Elements Media</div>
      </nav>

      {/* ── Content ── */}
      <main className="content-area">
        <ContentPane
          formData={formData}
          onChange={setFormData}
          currentPlatform={currentPlatform}
          isLocked={isLocked}
          onLock={handleLock}
          onUnlock={handleUnlock}
          completedPlatforms={completedPlatforms}
          onPlatformComplete={handlePlatformComplete}
          allDone={allDone}
        />
      </main>
    </div>
  )
}
