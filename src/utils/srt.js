function pad(n, digits = 2) {
  return String(Math.floor(n)).padStart(digits, '0')
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`
}

/**
 * Convert Whisper chunk array to SRT string.
 * chunks: [{ timestamp: [start, end], text: string }]
 */
export function toSRT(chunks) {
  return chunks
    .filter(c => c.timestamp?.[0] != null && c.timestamp?.[1] != null)
    .map((c, i) =>
      `${i + 1}\n${formatSRTTime(c.timestamp[0])} --> ${formatSRTTime(c.timestamp[1])}\n${c.text.trim()}\n`
    )
    .join('\n')
}

export function downloadSRT(chunks, baseName = 'captions') {
  const srt = toSRT(chunks)
  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName.replace(/\.[^.]+$/, '')}.srt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
