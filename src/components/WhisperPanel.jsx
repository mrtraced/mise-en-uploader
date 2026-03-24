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
  const [phase, setPhase]   = useState('idle') // idle | extracting | working | done | error
  const [progress, setProgress] = useState('')
  const [chunks, setChunks] = useState([])
  const workerRef = useRef(null)

  // Clean up worker on unmount
  useEffect(() => () => { workerRef.current?.terminate() }, [])

  // Reset if video changes
  useEffect(() => {
    setPhase('idle')
    setChunks([])
  }, [videoFile?.name])

  const handleTranscribe = async () => {
    try {
      setPhase('extracting')
      setProgress('Extracting audio…')

      const audio = await extractAudio(videoFile)

      setPhase('working')
      setProgress('Starting Whisper…')

      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/whisper.worker.js', import.meta.url),
          { type: 'module' }
        )
      }

      workerRef.current.onmessage = ({ data }) => {
        if (data.type === 'progress') setProgress(data.text)
        else if (data.type === 'result') {
          setChunks(data.chunks)
          setPhase('done')
        }
        else if (data.type === 'error') {
          setProgress(data.message)
          setPhase('error')
        }
      }

      workerRef.current.postMessage({ type: 'transcribe', audio }, [audio.buffer])
    } catch (err) {
      setProgress(err.message)
      setPhase('error')
    }
  }

  const updateChunk = (i, text) =>
    setChunks(prev => prev.map((c, idx) => idx === i ? { ...c, text } : c))

  const handleDownload = () =>
    downloadSRT(chunks, videoFile?.name || 'captions')

  const busy = phase === 'extracting' || phase === 'working'

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
          {(phase === 'error') && (
            <button className="btn-whisper-sm" onClick={handleTranscribe}>↺ Retry</button>
          )}
        </div>
      </div>

      {busy && (
        <div className="whisper-progress">
          <div className="whisper-spinner" />
          <span className="whisper-progress-text">{progress}</span>
        </div>
      )}

      {phase === 'error' && (
        <div className="whisper-error">⚠ {progress}</div>
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
        </p>
      )}
    </div>
  )
}
