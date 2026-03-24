import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Cross-origin isolation: enables SharedArrayBuffer for faster WASM threads
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Exclude heavy ML packages from pre-bundling
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
})
