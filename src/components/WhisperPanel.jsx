import { useState, useRef, useEffect } from 'react'
import { extractAudio } from '../utils/audioExtract'
import { downloadSRT } from '../utils/srt'

function formatTimecode(s) {
  if (s == null) return '??:??'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.round((s % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`
}

export default function WhisperPanel({ videoFile }) {
  const [phase, setPhase]               = useState('idle')
  const [progressText, setProgressText] = useState('')
  const [progressPct, setProgressPct]   = useState(0)
  const [progressPhase, setProgressPhase] = useState('')
  const [chunks, setChunks]             = useState([])
  const workerRef = useRef(null)

  useEffect(() => () => { workerRef.current?.terminate() }, [])

  useEffect(() => {
    setPhase('idle')
    setChunks([])
    setProgressPct(0)
  }, [videoFile?.name])

  const setError = (msg) => {
    setProgressText(msg)
    setPhase('error')
  }

  const handleTranscribe = async () => {
    try {
      setPhase('extracting')
      setProgressText('Reading video file…')
      setProgressPct(0)
      setProgressPhase('extracting')

      let audio
      try {
        audio = await extractAudio(videoFile)
      } catch (err) {
        // Cloud-only files (Google Drive, iCloud) may fail to read if not downloaded
        if (err.message?.includes('network') || err.name === 'NotReadableError' || err.name === 'NetworkError') {
          setError('Could not read file — if it\'s a cloud file (Google Drive, iCloud), download it locally first.')
        } else {
          setError(`Audio extraction failed: ${err.message}`)
        }
        return
      }

      setPhase('working')
      setProgressText('Starting Whisper…')
      setProgressPct(0)

      // Terminate stale worker before creating a new one on re-run
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }

      let worker
      try {
        worker = new Worker(
          new URL('../workers/whisper.worker.js', import.meta.url),
          { type: 'module' }
        )
        workerRef.current = worker
      } catch (err) {
        setError(`Failed to start worker: ${err.message}`)
        return
      }

      // Catch worker-level JS errors (import failures, uncaught exceptions)
      worker.onerror = (e) => {
        setError(`Whisper worker error: ${e.message || 'unknown error'}`)
      }

      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          setProgressText(data.text)
          if (data.pct != null) setProgressPct(data.pct)
          if (data.phase) setProgressPhase(data.phase)
        } else if (data.type === 'result') {
          setChunks(data.chunks)
          setPhase('done')
          setProgressPct(100)
        } else if (data.type === 'error') {
          setError(data.message)
        }
      }

      worker.postMessage({ type: 'transcribe', audio }, [audio.buffer])
    } catch (err) {
      setError(err.message)
    }
  }

  const updateChunk = (i, text) =>
    setChunks(prev => prev.map((c, idx) => idx === i ? { ...c, text } : c))

  const handleDownload = () =>
    downloadSRT(chunks, videoFile?.name || 'captions')

  const busy = phase === 'extracting' || phase === 'working'
  const isIndeterminate = phase === 'extracting' || progressPhase === 'transcribing'

  return (
    <div className="whisper-panel">
      <div className="whisper-header">
        <span className="whisper-title">🎙 Captions</span>
        <div className="whisper-actions">
          {phase === 'idle' && (
            <button className="btn-whisper" onClick={handleTranscribe}>
              Transcribe with Whisper
            </button>
          )}
          {phase === 'done' && (
            <>
              <button className="btn-whisper-sm" onClick={handleTranscribe}>↺ Re-run</button>
              <button className="btn-whisper-dl" onClick={handleDownload}>↓ SRT</button>
            </>
          )}
          {phase === 'error' && (
            <button className="btn-whisper-sm" onClick={handleTranscribe}>↺ Retry</button>
          )}
        </div>
      </div>

      {busy && (
        <div className="whisper-progress-area">
          <div className="whisper-progress-bar">
            <div
              className={`whisper-progress-fill${isIndeterminate ? ' whisper-progress-fill--pulse' : ''}`}
              style={isIndeterminate ? {} : { width: `${progressPct}%` }}
            />
          </div>
          <p className="whisper-status-text">{progressText}</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="whisper-error">⚠ {progressText}</div>
      )}

      {phase === 'done' && chunks.length === 0 && (
        <div className="whisper-empty">No speech detected.</div>
      )}

      {phase === 'done' && chunks.length > 0 && (
        <div className="whisper-segments">
          {chunks.map((chunk, i) => (
            <div key={i} className="whisper-seg">
              <span className="whisper-tc">{formatTimecode(chunk.timestamp?.[0])}</span>
              <textarea
                className="whisper-text"
                value={chunk.text}
                onChange={e => updateChunk(i, e.target.value)}
                rows={2}
              />
            </div>
          ))}
        </div>
      )}

      {phase === 'idle' && (
        <p className="whisper-hint">
          Local · free · private — model downloads once (~75 MB) and is cached.
          {videoFile && <><br /><em style={{ color: '#E5AC39' }}>Note: file must be downloaded locally (not cloud-only) to transcribe.</em></>}
        </p>
      )}
    </div>
  )
}
