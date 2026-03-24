/**
 * Extract mono 16kHz Float32Array from a video/audio File.
 * Uses Web Audio API — no external dependencies.
 */
export async function extractAudio(file) {
  const arrayBuffer = await file.arrayBuffer()

  // Decode original audio at native sample rate
  const decodeCtx = new AudioContext()
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer)
  decodeCtx.close()

  // Resample to 16kHz mono (Whisper requirement)
  const TARGET_RATE = 16000
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * TARGET_RATE),
    TARGET_RATE
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = decoded
  source.connect(offlineCtx.destination)
  source.start(0)

  const rendered = await offlineCtx.startRendering()
  return rendered.getChannelData(0) // Float32Array at 16kHz
}
