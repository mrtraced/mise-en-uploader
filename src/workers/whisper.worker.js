import { pipeline, env } from '@xenova/transformers'

// Load models from Hugging Face Hub
env.allowLocalModels = false

let transcriber = null

// Catch any unhandled promise rejections in the worker and surface them
self.addEventListener('unhandledrejection', (e) => {
  self.postMessage({ type: 'error', message: `Worker unhandled error: ${e.reason?.message || e.reason || 'unknown'}` })
})

self.onmessage = async ({ data }) => {
  if (data.type !== 'transcribe') return

  try {
    if (!transcriber) {
      self.postMessage({ type: 'progress', text: 'Downloading Whisper model (~75 MB, cached after first run)…', pct: 0, phase: 'downloading' })
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-base',
        {
          progress_callback: (p) => {
            if (p.status === 'initiate') {
              self.postMessage({ type: 'progress', text: 'Initialising model…', pct: 0, phase: 'downloading' })
            } else if (p.status === 'downloading') {
              const pct = Math.round(p.progress ?? 0)
              self.postMessage({ type: 'progress', text: `Downloading model… ${pct}%`, pct, phase: 'downloading' })
            } else if (p.status === 'loading') {
              self.postMessage({ type: 'progress', text: 'Loading model weights…', pct: 95, phase: 'loading' })
            } else if (p.status === 'ready') {
              self.postMessage({ type: 'progress', text: 'Model ready', pct: 100, phase: 'loading' })
            }
          },
        }
      )
    }

    self.postMessage({ type: 'progress', text: 'Transcribing audio…', pct: 0, phase: 'transcribing' })

    const result = await transcriber(data.audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    })

    self.postMessage({ type: 'result', chunks: result.chunks })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message })
  }
}

