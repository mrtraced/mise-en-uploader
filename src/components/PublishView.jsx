import platforms from '../data/platforms.js'
import CopyField from './CopyField.jsx'

function formatHashtags(tags, platformId) {
  if (!tags || tags.length === 0) return ''
  if (platformId === 'youtube') {
    // YouTube uses comma-separated tags without #
    return tags.join(', ')
  }
  // Instagram, TikTok, Facebook: #tag space-separated
  return tags.map((t) => `#${t}`).join(' ')
}

function truncate(text, maxLen) {
  if (!text || text.length <= maxLen) return { text: text || '', truncated: false }
  return { text: text.slice(0, maxLen), truncated: true }
}

function PlatformCard({ platform, onClick }) {
  return (
    <div
      className="platform-card"
      style={{ '--platform-color': platform.color }}
      onClick={() => onClick(platform.id)}
    >
      <span className="platform-card__emoji">{platform.emoji}</span>
      <span className="platform-card__name">{platform.name}</span>
      <div className="platform-card__limits">
        <div>⏱ {platform.limits.duration}</div>
        <div>📁 {platform.limits.fileSize}</div>
        <div>📐 {platform.limits.aspectRatio}</div>
      </div>
    </div>
  )
}

function LimitsBar({ limits }) {
  return (
    <div className="limits-bar">
      <div className="limits-bar__item">
        <span className="limits-bar__item-icon">⏱</span>
        <span>{limits.duration}</span>
        <span className="limits-bar__item-label">max duration</span>
      </div>
      <div className="limits-bar__item">
        <span className="limits-bar__item-icon">📁</span>
        <span>{limits.fileSize}</span>
        <span className="limits-bar__item-label">max file size</span>
      </div>
      <div className="limits-bar__item">
        <span className="limits-bar__item-icon">📐</span>
        <span>{limits.aspectRatio}</span>
        <span className="limits-bar__item-label">aspect ratio</span>
      </div>
      <div className="limits-bar__item">
        <span className="limits-bar__item-icon">🖥</span>
        <span>{limits.resolution}</span>
        <span className="limits-bar__item-label">resolution</span>
      </div>
      {limits.notes && (
        <div className="limits-bar__item" style={{ flexBasis: '100%', color: '#AAA' }}>
          <span className="limits-bar__item-icon">💡</span>
          <span>{limits.notes}</span>
        </div>
      )}
    </div>
  )
}

function PlatformView({ platform, videoData, onBack }) {
  const labels = platform.fieldLabels || {}

  // Format description
  const rawDesc = videoData.description || ''
  const { text: descText, truncated: descTruncated } = truncate(rawDesc, platform.maxDescLength)

  // Format hashtags
  const hashtagStr = formatHashtags(videoData.hashtags, platform.id)

  // Build title for YouTube (append #Shorts hint)
  let titleValue = videoData.title || ''
  let titleHint = null
  if (platform.id === 'youtube' && titleValue && !titleValue.toLowerCase().includes('#shorts')) {
    titleHint = 'Consider adding #Shorts to the title or description'
  }

  return (
    <div className="platform-view" style={{ '--platform-color': platform.color }}>
      {/* Header */}
      <div className="platform-view__header">
        <div className="platform-view__header-left">
          <span className="platform-view__emoji">{platform.emoji}</span>
          <div>
            <div className="platform-view__name">{platform.name}</div>
            <div className="platform-view__tagline">Click any field to copy it to clipboard</div>
          </div>
        </div>
        <button className="back-btn" onClick={onBack}>← All Platforms</button>
      </div>

      {/* Limits */}
      <LimitsBar limits={platform.limits} />

      {/* Copy Fields */}
      <div className="copy-fields">
        {platform.fields.includes('title') && (
          <CopyField
            label={labels.title || 'Title'}
            value={titleValue}
            hint={titleHint}
          />
        )}

        {platform.fields.includes('description') && (
          <>
            <CopyField
              label={labels.description || 'Description'}
              value={descText}
            />
            {descTruncated && (
              <div className="copy-field__truncated-note" style={{ marginTop: -8, paddingLeft: 4 }}>
                ⚠ Description trimmed to {platform.maxDescLength.toLocaleString()} characters for {platform.name}
              </div>
            )}
          </>
        )}

        {platform.fields.includes('hashtags') && (
          <CopyField
            label={labels.hashtags || 'Hashtags'}
            value={hashtagStr}
            hint={
              platform.maxHashtags > 0 && videoData.hashtags.length > platform.maxHashtags
                ? `⚠ ${platform.name} recommends max ${platform.maxHashtags} hashtags — you have ${videoData.hashtags.length}`
                : platform.id === 'youtube'
                ? 'YouTube uses comma-separated tags (no # needed)'
                : null
            }
          />
        )}

        {platform.fields.includes('thumbnail') && (
          <CopyField
            label={labels.thumbnail || 'Thumbnail'}
            value={videoData.thumbnailFile ? videoData.thumbnailFile.name : ''}
          />
        )}
      </div>

      {/* Tips */}
      <div className="tips-box">
        <div className="tips-box__label">✨ {platform.name} Tips</div>
        <p className="tips-box__text">{platform.tips}</p>
      </div>

      {/* Open Uploader Button */}
      <button
        className="open-uploader-btn"
        style={{ '--platform-color': platform.color }}
        onClick={() => window.open(platform.uploadUrl, '_blank', 'noopener,noreferrer')}
      >
        <span className="open-uploader-btn__icon">{platform.emoji}</span>
        Open {platform.name} Uploader
        <span className="open-uploader-btn__icon">↗</span>
      </button>
    </div>
  )
}

export default function PublishView({ videoData, selectedPlatform, onSelectPlatform }) {
  const platform = platforms.find((p) => p.id === selectedPlatform)

  const hasContent =
    videoData.title || videoData.description || videoData.hashtags.length > 0 || videoData.videoFile

  if (platform) {
    return (
      <PlatformView
        platform={platform}
        videoData={videoData}
        onBack={() => onSelectPlatform(null)}
      />
    )
  }

  return (
    <div className="publish-view">
      <div className="publish-view__intro">
        <h2>Choose a Platform</h2>
        <p>
          {hasContent
            ? 'Your content is ready. Pick a platform to see formatted fields and open the uploader.'
            : 'Fill in your content in Collect mode first, then come back to publish.'}
        </p>
      </div>

      {!hasContent && (
        <div className="empty-state">
          <span className="empty-state__icon">📝</span>
          <p className="empty-state__title">No content yet</p>
          <p className="empty-state__text">
            Switch to Collect mode and fill in your video title, description, and hashtags.
          </p>
        </div>
      )}

      {hasContent && (
        <div className="platform-grid">
          {platforms.map((p) => (
            <PlatformCard key={p.id} platform={p} onClick={onSelectPlatform} />
          ))}
        </div>
      )}
    </div>
  )
}
