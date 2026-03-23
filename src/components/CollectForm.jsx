import { useState, useRef, useEffect, useCallback } from 'react'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function CollectForm({ videoData, onChange }) {
  const [tagInput, setTagInput] = useState('')
  const tagInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [videoData.description])

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && videoData.hashtags.length > 0) {
      // Remove last tag on backspace when input is empty
      const newTags = videoData.hashtags.slice(0, -1)
      onChange({ hashtags: newTags })
    }
  }

  const addTag = (raw) => {
    const cleaned = raw.replace(/[#,]/g, '').trim().toLowerCase().replace(/\s+/g, '')
    if (!cleaned) return
    if (videoData.hashtags.includes(cleaned)) {
      setTagInput('')
      return
    }
    onChange({ hashtags: [...videoData.hashtags, cleaned] })
    setTagInput('')
  }

  const removeTag = (tag) => {
    onChange({ hashtags: videoData.hashtags.filter((t) => t !== tag) })
  }

  const handleVideoFile = useCallback((file) => {
    if (!file) return
    // Revoke old URL
    if (videoData.videoPreviewUrl) {
      URL.revokeObjectURL(videoData.videoPreviewUrl)
    }
    const url = URL.createObjectURL(file)
    onChange({ videoFile: file, videoPreviewUrl: url })
  }, [videoData.videoPreviewUrl, onChange])

  const handleThumbnailFile = useCallback((file) => {
    if (!file) return
    if (videoData.thumbnailPreviewUrl) {
      URL.revokeObjectURL(videoData.thumbnailPreviewUrl)
    }
    const url = URL.createObjectURL(file)
    onChange({ thumbnailFile: file, thumbnailPreviewUrl: url })
  }, [videoData.thumbnailPreviewUrl, onChange])

  const handleVideoDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoFile(file)
    }
  }

  const handleThumbnailDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleThumbnailFile(file)
    }
  }

  // Progress calculation
  const fields = [
    videoData.title,
    videoData.description,
    videoData.hashtags.length > 0 ? 'x' : '',
    videoData.videoFile ? 'x' : '',
    videoData.thumbnailFile ? 'x' : '',
  ]
  const filled = fields.filter(Boolean).length
  const pct = Math.round((filled / fields.length) * 100)

  const titleLen = videoData.title.length
  const descLen = videoData.description.length

  return (
    <div>
      {/* Progress bar */}
      <div className="collect-progress">
        <span className="collect-progress__label">Completion</span>
        <div className="collect-progress__bar-wrap">
          <div className="collect-progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="collect-progress__pct">{pct}%</span>
      </div>

      <div className="collect-form">
        {/* LEFT COLUMN */}
        <div className="collect-form__left">
          {/* Title */}
          <div className="form-card">
            <p className="form-card__title">Content</p>
            <div className="form-group">
              <label className="form-label">
                Title
                <span
                  className={`form-label__counter${titleLen > 90 ? ' form-label__counter--over' : titleLen > 70 ? ' form-label__counter--warn' : ''}`}
                >
                  {titleLen} chars
                </span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="Episode title or clip title…"
                value={videoData.title}
                onChange={(e) => onChange({ title: e.target.value })}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">
                Description
                <span
                  className={`form-label__counter${descLen > 4000 ? ' form-label__counter--over' : descLen > 2000 ? ' form-label__counter--warn' : ''}`}
                >
                  {descLen} chars
                </span>
              </label>
              <textarea
                ref={textareaRef}
                className="form-input form-textarea"
                placeholder="Write your caption or description here. This will be adapted per platform…"
                value={videoData.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </div>
          </div>

          {/* Hashtags */}
          <div className="form-card">
            <p className="form-card__title">Hashtags</p>
            <div className="form-group">
              <label className="form-label">
                Tags
                <span className="form-label__counter">{videoData.hashtags.length} added</span>
              </label>
              <div
                className="tag-input-wrapper"
                onClick={() => tagInputRef.current?.focus()}
              >
                {videoData.hashtags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    <span className="tag-chip__text">#{tag}</span>
                    <button
                      className="tag-chip__remove"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                      type="button"
                      aria-label={`Remove #${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  className="tag-text-input"
                  type="text"
                  placeholder={videoData.hashtags.length === 0 ? 'podcast, episode1… press Enter or comma to add' : 'Add more…'}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                />
              </div>
              <p className="tag-hint">Type a tag and press Enter or comma. No # needed.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="collect-form__right">
          {/* Video File */}
          <div className="form-card">
            <p className="form-card__title">Video File</p>
            <div className="form-group">
              <div
                className={`file-upload-area${videoData.videoFile ? ' file-upload-area--has-file' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleVideoDrop}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoFile(e.target.files[0])}
                  aria-label="Upload video file"
                />
                {!videoData.videoFile ? (
                  <>
                    <span className="file-upload-icon">🎥</span>
                    <p className="file-upload-text">
                      <strong>Click to upload</strong> or drag & drop
                    </p>
                    <p className="file-upload-text" style={{ marginTop: 4, fontSize: '0.78rem' }}>
                      MP4, MOV, WebM…
                    </p>
                  </>
                ) : (
                  <>
                    <span className="file-upload-icon">✅</span>
                    <div className="file-info">
                      <span>{videoData.videoFile.name}</span>
                      <span className="file-info__size">{formatBytes(videoData.videoFile.size)}</span>
                    </div>
                    <p className="file-upload-text" style={{ marginTop: 6, fontSize: '0.75rem' }}>
                      Click to replace
                    </p>
                  </>
                )}
              </div>

              {videoData.videoPreviewUrl && (
                <div className="video-preview">
                  <video
                    src={videoData.videoPreviewUrl}
                    controls
                    preload="metadata"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="form-card">
            <p className="form-card__title">Thumbnail</p>
            <div className="form-group">
              <div
                className={`file-upload-area${videoData.thumbnailFile ? ' file-upload-area--has-file' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleThumbnailDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbnailFile(e.target.files[0])}
                  aria-label="Upload thumbnail image"
                />
                {!videoData.thumbnailFile ? (
                  <>
                    <span className="file-upload-icon">🖼️</span>
                    <p className="file-upload-text">
                      <strong>Click to upload</strong> thumbnail
                    </p>
                    <p className="file-upload-text" style={{ marginTop: 4, fontSize: '0.78rem' }}>
                      JPG, PNG, WebP — 1080×1920 recommended
                    </p>
                  </>
                ) : (
                  <>
                    <div className="file-info">
                      <span>{videoData.thumbnailFile.name}</span>
                      <span className="file-info__size">{formatBytes(videoData.thumbnailFile.size)}</span>
                    </div>
                    <p className="file-upload-text" style={{ marginTop: 6, fontSize: '0.75rem' }}>
                      Click to replace
                    </p>
                  </>
                )}
              </div>

              {videoData.thumbnailPreviewUrl && (
                <div className="thumbnail-preview">
                  <img
                    src={videoData.thumbnailPreviewUrl}
                    alt="Thumbnail preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
