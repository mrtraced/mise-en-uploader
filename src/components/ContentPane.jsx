import { useState, useRef, useMemo } from 'react'
import { platforms as allPlatforms } from '../data/platforms'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#6B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#F97316', '#8B5CF6']
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${(i * 1.63 + 1) % 97}%`,
      color: colors[i % colors.length],
      delay: `${((i * 0.033) % 0.65).toFixed(3)}s`,
      duration: `${(0.85 + (i % 8) * 0.1).toFixed(2)}s`,
      w: 6 + (i % 5) * 2,
      h: 7 + (i % 4) * 3,
      radius: i % 3 === 0 ? '50%' : '3px',
    }))
  }, [])

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left,
          background: p.color,
          animationDelay: p.delay,
          animationDuration: p.duration,
          width: p.w,
          height: p.h,
          borderRadius: p.radius,
        }} />
      ))}
    </div>
  )
}

const BP_DATA = [
  {
    id: 'instagram',
    title: { text: 'Not shown in feed', note: '200 max' },
    desc:  { text: 'First 125 chars before "more"', note: 'put hook here' },
    tags:  { text: '5–15 sweet spot', note: 'max 30' },
  },
  {
    id: 'youtube',
    title: { text: '≤ 60 chars for search', note: '100 max' },
    desc:  { text: 'First 100 chars in feed', note: 'keywords early' },
    tags:  { text: 'Use as keywords', note: 'max 15' },
  },
  {
    id: 'tiktok',
    title: { text: 'Caption = title — first 150 matter', note: '2200 max' },
    desc:  { text: '—', note: '' },
    tags:  { text: '3–8 focused + #fyp', note: 'max 20' },
  },
  {
    id: 'spotify',
    title: { text: 'Match episode title exactly', note: '200 max' },
    desc:  { text: 'Same as episode description', note: '4000 max' },
    tags:  { text: 'Not supported', note: '' },
  },
  {
    id: 'facebook',
    title: { text: 'Same as Instagram', note: '500 max' },
    desc:  { text: 'First 125 chars visible', note: '2200 max' },
    tags:  { text: '5–15 sweet spot', note: 'max 30' },
  },
]

const UNIVERSAL_TIPS = [
  { icon: '🎬', tip: 'Hook in first 3 seconds — all platforms penalise early drop-off' },
  { icon: '📝', tip: 'Front-load keywords in titles and captions' },
  { icon: '🔤', tip: 'Burned-in captions increase watch time 30–40%' },
  { icon: '📐', tip: '9:16 vertical (1080×1920) for all short-form platforms' },
  { icon: '📣', tip: 'End with a call-to-action — "Follow for more" or "Listen to the full episode"' },
]

function BestPracticesPanel() {
  return (
    <div className="bp-panel">
      <div className="bp-title">Platform Quick Reference</div>

      <div className="bp-table-wrap">
        <table className="bp-table">
          <thead>
            <tr>
              <th></th>
              <th>Title / Caption</th>
              <th>Description</th>
              <th>Hashtags</th>
            </tr>
          </thead>
          <tbody>
            {BP_DATA.map(row => {
              const p = allPlatforms.find(p => p.id === row.id)
              return (
                <tr key={row.id}>
                  <td className="bp-platform-cell">
                    <span className="bp-emoji">{p.emoji}</span>
                    <span>{p.shortName}</span>
                  </td>
                  <td>
                    <span className="bp-main">{row.title.text}</span>
                    {row.title.note && <span className="bp-note"> · {row.title.note}</span>}
                  </td>
                  <td>
                    <span className={row.desc.text === '—' ? 'bp-na' : 'bp-main'}>{row.desc.text}</span>
                    {row.desc.note && <span className="bp-note"> · {row.desc.note}</span>}
                  </td>
                  <td>
                    <span className={row.tags.text === 'Not supported' ? 'bp-na' : 'bp-main'}>{row.tags.text}</span>
                    {row.tags.note && <span className="bp-note"> · {row.tags.note}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bp-tips">
        {UNIVERSAL_TIPS.map((t, i) => (
          <div key={i} className="bp-tip-row">
            <span className="bp-tip-icon">{t.icon}</span>
            <span>{t.tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlatformHeader({ platform }) {
  return (
    <div className="pane-header">
      <span className="ph-emoji">{platform.emoji}</span>
      <span className="ph-name">{platform.name}</span>
      <div className="ph-chips">
        {platform.limits.duration && <span className="limit-chip">{platform.limits.duration}</span>}
        {platform.limits.aspectRatio && <span className="limit-chip">{platform.limits.aspectRatio}</span>}
        {platform.limits.fileSize && <span className="limit-chip">≤ {platform.limits.fileSize}</span>}
      </div>
    </div>
  )
}

export default function ContentPane({
  formData, onChange, currentPlatform, isLocked,
  completedPlatforms = {}, onPlatformComplete,
}) {
  const [hashtagInput, setHashtagInput] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const videoInputRef = useRef(null)
  const thumbInputRef = useRef(null)

  // ── helpers ──────────────────────────────────────────────────────
  const showField = (field) => !currentPlatform || currentPlatform.fields.includes(field)

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
      e.preventDefault(); addHashtag(hashtagInput)
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

  const doCopy = async (field, value) => {
    await copyText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(f => f === field ? null : f), 2000)
  }

  // ── POST-LOCK: no platform ──────────────────────────────────────
  if (isLocked && !currentPlatform) {
    return (
      <div className="content-pane locked-pick">
        <div className="locked-pick-inner">
          <div className="locked-pick-icon">🔒</div>
          <h2 className="locked-pick-title">Content locked</h2>
          <p className="locked-pick-sub">Select a platform from the left to begin publishing.</p>
        </div>
      </div>
    )
  }

  // ── POST-LOCK: platform selected ─────────────────────────────────
  if (isLocked && currentPlatform) {
    const p = currentPlatform
    const overrides = formData.platformContent?.[p.id] ?? {}
    const isCompleted = !!completedPlatforms[p.id]

    // Effective values — per-platform overrides take precedence
    const titleVal = overrides.title !== undefined
      ? overrides.title
      : (formData.title?.slice(0, p.maxTitleLength || 200) ?? '')
    const descVal = overrides.description !== undefined
      ? overrides.description
      : (formData.description?.slice(0, p.maxDescLength || 5000) ?? '')

    // User global tags prepend to platform-specific tags
    const globalTags = formData.hashtags ?? []
    const platformTags = formData.platformHashtags?.[p.id] ?? []
    const allTags = [...globalTags, ...platformTags.filter(t => !globalTags.includes(t))]
    const hashtagStr = allTags.map(h => `#${h}`).join(' ')

    const updateOverride = (field, value) => {
      onChange({
        ...formData,
        platformContent: {
          ...formData.platformContent,
          [p.id]: { ...(formData.platformContent?.[p.id] ?? {}), [field]: value },
        },
      })
    }

    const handleComplete = () => {
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        onPlatformComplete(p.id)
      }, 1800)
    }

    return (
      <div className="content-pane">
        {showConfetti && <Confetti />}
        <PlatformHeader platform={p} />

        <div className="output-body">
          <div className="output-fields">
            {p.fields.includes('title') && (
              <div className="publish-group">
                <div className="publish-group-header">
                  <span className="publish-group-label">{fieldLabel('title').toUpperCase()}</span>
                  <button
                    className={`btn-copy-sm${copiedField === 'title' ? ' btn-copy-sm--done' : ''}`}
                    onClick={() => doCopy('title', titleVal)}
                  >
                    {copiedField === 'title' ? '✓ Copied' : '⎘ Copy'}
                  </button>
                </div>
                <input
                  className="field-input"
                  value={titleVal}
                  onChange={e => updateOverride('title', e.target.value)}
                  maxLength={p.maxTitleLength || 200}
                />
                <div className="field-meta">{titleVal.length}{p.maxTitleLength ? ` / ${p.maxTitleLength}` : ''}</div>
              </div>
            )}

            {p.fields.includes('description') && (
              <div className="publish-group">
                <div className="publish-group-header">
                  <span className="publish-group-label">{fieldLabel('description').toUpperCase()}</span>
                  <button
                    className={`btn-copy-sm${copiedField === 'description' ? ' btn-copy-sm--done' : ''}`}
                    onClick={() => doCopy('description', descVal)}
                  >
                    {copiedField === 'description' ? '✓ Copied' : '⎘ Copy'}
                  </button>
                </div>
                <textarea
                  className="field-textarea"
                  value={descVal}
                  onChange={e => updateOverride('description', e.target.value)}
                  rows={6}
                  maxLength={p.maxDescLength || 5000}
                />
                <div className="field-meta">{descVal.length}{p.maxDescLength ? ` / ${p.maxDescLength}` : ''}</div>
              </div>
            )}

            {p.fields.includes('hashtags') && (
              <div className="publish-group">
                <div className="publish-group-header">
                  <span className="publish-group-label">
                    {fieldLabel('hashtags').toUpperCase()}
                    <span className="publish-group-count"> · {allTags.length}</span>
                    {p.maxHashtags > 0 && <span className="publish-group-count"> / {p.maxHashtags}</span>}
                  </span>
                  <button
                    className={`btn-copy-sm${copiedField === 'hashtags' ? ' btn-copy-sm--done' : ''}`}
                    onClick={() => doCopy('hashtags', hashtagStr)}
                  >
                    {copiedField === 'hashtags' ? '✓ Copied' : '⎘ Copy all'}
                  </button>
                </div>
                <div className="hashtag-display">
                  {allTags.map(tag => (
                    <span
                      key={tag}
                      className={`tag-chip${globalTags.includes(tag) ? ' tag-chip--universal' : ''}`}
                      title={globalTags.includes(tag) ? 'Your universal tag' : 'Platform tag'}
                    >
                      #{tag}
                    </span>
                  ))}
                  {allTags.length === 0 && <span className="output-empty">No hashtags</span>}
                </div>
                {globalTags.length > 0 && (
                  <div className="field-meta">
                    {globalTags.length} universal tag{globalTags.length !== 1 ? 's' : ''} prepended · {allTags.length - globalTags.length} platform-specific
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="output-media">
            {p.fields.includes('video') && (
              <div className="media-card">
                <div className="media-card-label">VIDEO</div>
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
                <div className="media-card-label">THUMBNAIL</div>
                <img src={formData.thumbnailFile._url} alt="Thumbnail" className="output-thumb" />
              </div>
            )}
          </div>
        </div>

        {p.tips && <div className="tips-box"><strong>Tips</strong> · {p.tips}</div>}

        <div className="pane-footer">
          <button className="btn-upload" onClick={() => window.open(p.uploadUrl, '_blank')}>
            Open {p.shortName} ↗
          </button>
          <button
            className={`btn-complete${isCompleted ? ' btn-complete--done' : ''}`}
            onClick={!isCompleted ? handleComplete : undefined}
            disabled={isCompleted}
          >
            {isCompleted ? '✓ Done' : '🎉 Upload Complete'}
          </button>
        </div>
      </div>
    )
  }

  // ── PRE-LOCK FORM ────────────────────────────────────────────────
  return (
    <div className="content-pane">
      {currentPlatform && <PlatformHeader platform={currentPlatform} />}

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
              {!currentPlatform && (
                <div className="suggested-note">Tags added here will appear first on every platform</div>
              )}
              {currentPlatform && currentPlatform.suggestedHashtags?.length > 0 && (
                <div className="suggested-note">Pre-filled with {currentPlatform.shortName} best practices · click × to remove any</div>
              )}
            </div>
          )}

          {!currentPlatform && <BestPracticesPanel />}
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
                  <div className="media-preview-name" title={formData.videoFile.name}>{formData.videoFile.name}</div>
                  <div className="media-preview-meta">{formatBytes(formData.videoFile.size)}</div>
                  <div className="media-replace-overlay">↑ Replace</div>
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
              className={`media-drop media-drop--thumb${dragOver === 'thumb' ? ' media-drop--over' : ''}${formData.thumbnailFile ? ' media-drop--filled' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver('thumb') }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleThumbFile(e.dataTransfer.files[0]) }}
              onClick={() => thumbInputRef.current?.click()}
            >
              <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleThumbFile(e.target.files[0])} />
              {formData.thumbnailFile ? (
                <>
                  <img src={formData.thumbnailFile._url} alt="Thumbnail" className="media-preview-img" />
                  <div className="media-preview-name" title={formData.thumbnailFile.name}>{formData.thumbnailFile.name}</div>
                  <div className="media-replace-overlay">↑ Replace</div>
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
    </div>
  )
}
