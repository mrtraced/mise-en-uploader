import { useState } from 'react'
import { platforms } from './data/platforms'
import ContentPane from './components/ContentPane'
import './App.css'

const INITIAL_FORM = {
  title: '',
  description: '',
  videoFile: null,
  thumbnailFile: null,
  hashtags: [],          // global (ALL view)
  platformHashtags: {},  // { [platformId]: string[] } — seeded on first visit
}

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [selectedPlatform, setSelectedPlatform] = useState(null) // null = ALL
  const [isLocked, setIsLocked] = useState(false)

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId)
    // Seed with suggested hashtags on first visit to a platform
    if (platformId && formData.platformHashtags[platformId] === undefined) {
      const platform = platforms.find(p => p.id === platformId)
      const suggested = platform?.suggestedHashtags || []
      setFormData(prev => ({
        ...prev,
        platformHashtags: {
          ...prev.platformHashtags,
          [platformId]: [...suggested],
        },
      }))
    }
  }

  const currentPlatform = selectedPlatform
    ? platforms.find(p => p.id === selectedPlatform) ?? null
    : null

  return (
    <div className="app-shell">
      {/* ── Left: Platform Nav ── */}
      <nav className="platform-nav">
        <div className="nav-logo">
          <span className="nav-logo-title">mise en</span>
          <span className="nav-logo-sub">uploader</span>
        </div>

        <button
          className={`nav-btn nav-all${!selectedPlatform ? ' nav-active' : ''}`}
          onClick={() => handleSelectPlatform(null)}
        >
          ALL
        </button>

        <div className="nav-divider" />

        {platforms.map(p => (
          <button
            key={p.id}
            className={`nav-btn nav-platform${selectedPlatform === p.id ? ' nav-active' : ''}`}
            style={{ '--pc': p.color }}
            onClick={() => handleSelectPlatform(p.id)}
          >
            <span className="nav-emoji">{p.emoji}</span>
            <span>{p.shortName}</span>
          </button>
        ))}

        <div className="nav-spacer" />

        <div className="nav-footer">
          {isLocked ? (
            <button className="nav-edit-btn" onClick={() => setIsLocked(false)}>
              ✏️ Edit
            </button>
          ) : (
            <span className="nav-status-text">editing</span>
          )}
        </div>
      </nav>

      {/* ── Right: Content ── */}
      <main className="content-area">
        <ContentPane
          formData={formData}
          onChange={setFormData}
          currentPlatform={currentPlatform}
          isLocked={isLocked}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />
      </main>
    </div>
  )
}
