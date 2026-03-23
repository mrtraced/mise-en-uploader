import { useState, useCallback } from 'react'
import CollectForm from './components/CollectForm.jsx'
import PublishView from './components/PublishView.jsx'

const initialVideoData = {
  title: '',
  description: '',
  hashtags: [],
  videoFile: null,
  videoPreviewUrl: null,
  thumbnailFile: null,
  thumbnailPreviewUrl: null,
}

export default function App() {
  const [videoData, setVideoData] = useState(initialVideoData)
  const [mode, setMode] = useState('collect')
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  const updateVideoData = useCallback((updates) => {
    setVideoData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    if (newMode === 'collect') {
      setSelectedPlatform(null)
    }
  }

  const hasContent =
    videoData.title ||
    videoData.description ||
    videoData.hashtags.length > 0 ||
    videoData.videoFile

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-icon">🎬</span>
          <div>
            <h1 className="header-title">Mise en Uploader</h1>
            <p className="header-subtitle">Podcast video upload helper</p>
          </div>
        </div>
        <nav className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'collect' ? 'mode-btn--active' : ''}`}
            onClick={() => handleModeSwitch('collect')}
          >
            <span className="mode-btn-icon">📝</span>
            Collect
          </button>
          <button
            className={`mode-btn ${mode === 'publish' ? 'mode-btn--active' : ''}`}
            onClick={() => handleModeSwitch('publish')}
          >
            <span className="mode-btn-icon">🚀</span>
            Publish
            {!hasContent && mode !== 'publish' && (
              <span className="mode-btn-badge">Fill in data first</span>
            )}
          </button>
        </nav>
      </header>

      <main className="main-content">
        {mode === 'collect' ? (
          <CollectForm videoData={videoData} onChange={updateVideoData} />
        ) : (
          <PublishView
            videoData={videoData}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
          />
        )}
      </main>

      <footer className="footer">
        <p>Mise en Uploader &mdash; upload once, publish everywhere</p>
      </footer>
    </div>
  )
}
