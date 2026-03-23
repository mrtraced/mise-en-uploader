import { useState, useRef } from 'react'
import CopyField from './CopyField'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function PlatformHeader({ platform, onUnlock, showHashtagNote }) {
  return (
    <div className="pane-header">
      <span className="ph-emoji">{platform.emoji}</span>
      <span className="ph-name">{platform.name}</span>
      <div className="ph-chips">
        {platform.limits.duration && <span className="limit-chip">{platform.limits.duration}</span>}
        {platform.limits.aspectRatio && <span className="limit-chip">{platform.limits.aspectRatio}</span>}
        {platform.limits.fileSize && <span className="limit-chip">≤ {platform.limits.fileSize}</span>}
      </div>
      {showHashtagNote && platform.suggestedHashtags?.length > 0 && (
        <span className="ph-hashtag-note">hashtags pre-filled with best practices</span>
      )}
      {onUnlock && (
        <button className="btn-edit-sm" onClick={onUnlock}>✏️ Edit</button>
      )}
    </div>
  )
}

export default function ContentPane({ formData, onChange, currentPlatform, isLocked, onLock, onUnlock }) {
  const [hashtagInput, setHashtagInput] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const videoInputRef = useRef(null)
  const thumbInputRef = useRef(null)

  const showField = (field) => {
    if (!currentPlatform) return true
    return currentPlatform.fields.includes(field)
  }

  const fieldLabel = (field) => {
    if (currentPlatform?.fieldLabels?.[field]) return currentPlatform.fieldLabels[field]
    return { title: 'Title', description: 'Description', hashtags: 'Hashtags', video: 'Video', thumbnail: 'Thumbnail' }[field] || field
  }

  // Per-platform hashtags, or global if ALL
  const currentHashtags = currentPlatform
    ? (formData.platformHashtags?.[currentPlatform.id] ?? [])
    : (formData.hashtags ?? [])

  const setCurrentHashtags = (tags) => {
    if (currentPlatform) {
      onChange({ ...formData, platformHashtags: { ...formData.platformHashtags, [currentPlatform.id]: tags } })
    } else {
      onChange({ ...formData, hashtags: tags })
    }
  }

  const addHashtag = (raw) => {
    const tag = raw.trim().replace(/^#+/, '').toLowerCase()
    if (!tag || currentHashtags.includes(tag)) { setHashtagInput(''); return }
    setCurrentHashtags([...currentHashtags, tag])
    setHashtagInput('')
  }

  const removeHashtag = (tag) => setCurrentHashtags(currentHashtags.filter(h => h !== tag))

  const handleHashtagKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && hashtagInput.trim()) {
      e.preventDefault()
      addHashtag(hashtagInput)
    } else if (e.key === 'Backspace' && !hashtagInput && currentHashtags.length > 0) {
      removeHashtag(currentHashtags[currentHashtags.length - 1])
    }
  }

  const handleVideoFile = (file) => {
    if (!file?.type.startsWith('video/')) return
    if (formData.videoFile?._url) URL.revokeObjectURL(formData.videoFile._url)
    onChange({ ...formData, videoFile: Object.assign(file, { _url: URL.createObjectURL(file) }) })
  }

  const handleThumbFile = (file) => {
    if (!file?.type.startsWith('image/')) return
    if (formData.thumbnailFile?._url) URL.revokeObjectURL(formData.thumbnailFile._url)
    onChange({ ...formData, thumbnailFile: Object.assign(file, { _url: URL.createObjectURL(file) }) })
  }

  const hasContent = formData.title?.trim() || formData.videoFile

  // ── POST-LOCK: no platform selected ────────────────────────────
  if (isLocked && !currentPlatform) {
    return (
      <div className="content-pane locked-all">
        <div className="locked-all-inner">
          <div className="locked-icon">🔒</div>
          <h2 className="locked-title">Content locked</h2>
          <p className="locked-sub">Select a platform on the left to see formatted output.</p>
          {formData.title && (
            <div className="locked-preview-title">"{formData.title.length > 70 ? formData.title.slice(0, 70) + '…' : formData.title}"</div>
          )}
          <button className="btn-edit" onClick={onUnlock}>✏️ Edit content</button>
        </div>
      </div>
    )
  }

  // ── POST-LOCK: platform selected ────────────────────────────────
  if (isLocked && currentPlatform) {
    const p = currentPlatform
    const tags = formData.platformHashtags?.[p.id] ?? []
    const hashtagStr = tags.map(h => `#${h}`).join(' ')
    const title = formData.title?.slice(0, p.maxTitleLength || 200) ?? ''
    const desc = formData.description?.slice(0, p.maxDescLength || 5000) ?? ''

    return (
      <div className="content-pane">
        <PlatformHeader platform={p} onUnlock={onUnlock} showHashtagNote={false} />

        <div className="output-body">
          <div className="output-fields">
            {p.fields.includes('title') && (
              <CopyField label={fieldLabel('title')} value={title} />
            )}
            {p.fields.includes('description') && (
              <CopyField label={fieldLabel('description')} value={desc} />
            )}
            {p.fields.includes('hashtags') && (
              <CopyField
                label={fieldLabel('hashtags')}
                value={hashtagStr}
                hint={tags.length > 0 ? `${tags.length} tag${tags.length !== 1 ? 's' : ''} · includes platform best practices` : ''}
              />
            )}
          </div>

          <div className="output-media">
            {p.fields.includes('video') && (
              <div className="media-card">
                <div className="media-card-label">{fieldLabel('video')}</div>
                {formData.videoFile ? (
                  <>
                    <video src={formData.videoFile._url} controls className="output-video" />
                    <div className="media-card-meta">{formData.videoFile.name} · {formatBytes(formData.videoFile.size)}</div>
                  </>
                ) : (
                  <div className="media-card-empty">No video uploaded</div>
                )}
              </div>
            )}
            {p.fields.includes('thumbnail') && formData.thumbnailFile && (
              <div className="media-card">
                <div className="media-card-label">{fieldLabel('thumbnail')}</div>
                <img src={formData.thumbnailFile._url} alt="Thumbnail" className="output-thumb" />
              </div>
            )}
          </div>
        </div>

        {p.tips && <div className="tips-box"><strong>Tips</strong> · {p.tips}</div>}

        <div className="pane-footer">
          <button className="btn-upload" onClick={() => window.open(p.uploadUrl, '_blank')}>
            Open {p.name} ↗
          </button>
        </div>
      </div>
    )
  }

  // ── PRE-LOCK FORM ───────────────────────────────────────────────
  return (
    <div className="content-pane">
      {currentPlatform && (
        <PlatformHeader platform={currentPlatform} showHashtagNote={true} />
      )}

      <div className="pane-body">
        {/* Text fields */}
        <div className="fields-col">
          {showField('title') && (
            <div className="field-group">
              <label className="field-label">{fieldLabel('title')}</label>
              <input
                className="field-input"
                type="text"
                value={formData.title}
                onChange={e => onChange({ ...formData, title: e.target.value })}
                placeholder="Enter title…"
                maxLength={currentPlatform?.maxTitleLength || 200}
              />
              {formData.title && (
                <div className="field-meta">
                  {formData.title.length} chars{currentPlatform?.maxTitleLength ? ` / ${currentPlatform.maxTitleLength}` : ''}
                </div>
              )}
            </div>
          )}

          {showField('description') && (
            <div className="field-group">
              <label className="field-label">{fieldLabel('description')}</label>
              <textarea
                className="field-textarea"
                value={formData.description}
                onChange={e => onChange({ ...formData, description: e.target.value })}
                placeholder="Enter description…"
                rows={5}
              />
              {formData.description && (
                <div className="field-meta">
                  {formData.description.length} chars{currentPlatform?.maxDescLength ? ` / ${currentPlatform.maxDescLength}` : ''}
                </div>
              )}
            </div>
          )}

          {showField('hashtags') && (
            <div className="field-group">
              <label className="field-label">
                {fieldLabel('hashtags')}
                {currentPlatform?.maxHashtags
                  ? <span className="field-label-meta"> · max {currentPlatform.maxHashtags}</span>
                  : null}
              </label>
              <div className="tag-area" onClick={() => document.querySelector('.tag-input')?.focus()}>
                {currentHashtags.map(tag => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button className="tag-remove" onClick={e => { e.stopPropagation(); removeHashtag(tag) }}>×</button>
                  </span>
                ))}
                <input
                  className="tag-input"
                  type="text"
                  value={hashtagInput}
                  onChange={e => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKey}
                  placeholder={currentHashtags.length === 0 ? 'Add hashtag, press Enter…' : ''}
                />
              </div>
              {currentPlatform && currentPlatform.suggestedHashtags?.length > 0 && (
                <div className="suggested-note">Pre-filled with {currentPlatform.shortName} best practices · click × to remove any</div>
              )}
              {!currentPlatform && (
                <div className="suggested-note">Select a platform tab to see pre-filled hashtag suggestions</div>
              )}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="media-col">
          {showField('video') && (
            <div
              className={`media-drop${dragOver === 'video' ? ' media-drop--over' : ''}${formData.videoFile ? ' media-drop--filled' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver('video') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleVideoFile(e.dataTransfer.files[0]) }}
              onClick={() => videoInputRef.current?.click()}
            >
              <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoFile(e.target.files[0])} />
              {formData.videoFile ? (
                <>
                  <video src={formData.videoFile._url} className="media-preview-video" />
                  <div className="media-preview-name">{formData.videoFile.name}</div>
                  <div className="media-preview-meta">{formatBytes(formData.videoFile.size)}</div>
                </>
              ) : (
                <>
                  <div className="media-drop-icon">🎬</div>
                  <div className="media-drop-label">Video</div>
                  <div className="media-drop-hint">Drop or click to upload</div>
                </>
              )}
            </div>
          )}

          {showField('thumbnail') && (
            <div
              className={`media-drop${dragOver === 'thumb' ? ' media-drop--over' : ''}${formData.thumbnailFile ? ' media-drop--filled' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver('thumb') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleThumbFile(e.dataTransfer.files[0]) }}
              onClick={() => thumbInputRef.current?.click()}
            >
              <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleThumbFile(e.target.files[0])} />
              {formData.thumbnailFile ? (
                <>
                  <img src={formData.thumbnailFile._url} alt="Thumbnail" className="media-preview-img" />
                  <div className="media-preview-name">{formData.thumbnailFile.name}</div>
                </>
              ) : (
                <>
                  <div className="media-drop-icon">🖼️</div>
                  <div className="media-drop-label">Thumbnail</div>
                  <div className="media-drop-hint">Drop or click to upload</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pane-footer">
        <button
          className="btn-lock"
          onClick={onLock}
          disabled={!hasContent}
          title={!hasContent ? 'Add a title or video first' : 'Lock content and go to publish view'}
        >
          🔒 Lock &amp; Publish
        </button>
        {!hasContent && <span className="lock-hint">Add a title or video to continue</span>}
      </div>
    </div>
  )
}
