import { pipeline, env } from '@xenova/transformers'

// Load models from Hugging Face Hub (avoids local WASM path issues in Vite)
env.allowLocalModels = false

let transcriber = null

self.onmessage = async ({ data }) => {
  if (data.type !== 'transcribe') return

  try {
    if (!transcriber) {
      self.postMessage({ type: 'progress', text: 'Downloading Whisper model (~75 MB, cached after first run)…' })
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          progress_callback: (p) => {
            if (p.status === 'downloading') {
              const pct = Math.round(p.progress ?? 0)
              self.postMessage({ type: 'progress', text: `Downloading model… ${pct}%` })
            }
          },
        }
      )
    }

    self.postMessage({ type: 'progress', text: 'Transcribing audio…' })

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
