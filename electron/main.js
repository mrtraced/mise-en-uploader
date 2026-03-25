const { app, BrowserWindow, shell, ipcMain, session, dialog, protocol, net } = require('electron')
const fs = require('fs').promises
const path = require('path')
const { pathToFileURL } = require('url')

// Must be called before app is ready — registers app:// as a secure standard
// scheme so the renderer treats it like https:// (enables SharedArrayBuffer etc.)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 920,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // macOS native title bar — traffic lights sit inside the window chrome
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 16 },
    backgroundColor: '#333436',
    show: false,
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    // Use app:// so the protocol handler can inject COOP/COEP headers.
    // file:// responses cannot be intercepted for header injection in Electron.
    win.loadURL('app://localhost/index.html')
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  if (isDev) {
    // Dev: inject COOP/COEP into Vite dev-server responses
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Cross-Origin-Opener-Policy': ['same-origin'],
          'Cross-Origin-Embedder-Policy': ['credentialless'],
        },
      })
    })
  } else {
    // Production: serve dist/ via app:// with COOP/COEP headers so
    // SharedArrayBuffer is available (file:// can't carry these headers)
    const distPath = path.join(__dirname, '../dist')
    protocol.handle('app', async (request) => {
      const { pathname } = new URL(request.url)
      const filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname)

      try {
        const response = await net.fetch(pathToFileURL(filePath).toString())
        const headers = Object.fromEntries(response.headers.entries())
        return new Response(response.body, {
          status: response.status,
          headers: {
            ...headers,
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'credentialless',
          },
        })
      } catch {
        // SPA fallback — unknown paths serve index.html
        const indexUrl = pathToFileURL(path.join(distPath, 'index.html')).toString()
        const response = await net.fetch(indexUrl)
        return new Response(response.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'credentialless',
          },
        })
      }
    })
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── IPC handlers ─────────────────────────────────────────────────

// Reveal a file in Finder / Explorer
ipcMain.handle('reveal-in-finder', (_, filePath) => {
  shell.showItemInFolder(filePath)
})

// Open a URL in the system default browser (preserves user auth/sessions)
ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url)
})

// Save preset as a .mise file — asks user where to save
ipcMain.handle('save-mise-file', async (_, { defaultName, content }) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Save Preset',
    defaultPath: defaultName,
    filters: [
      { name: 'Mise Preset', extensions: ['mise'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    buttonLabel: 'Save Preset',
  })
  if (canceled || !filePath) return { success: false }
  await fs.writeFile(filePath, content, 'utf8')
  return { success: true, filePath }
})

// Open a .mise preset file
ipcMain.handle('open-mise-file', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: 'Open Preset',
    filters: [
      { name: 'Mise Preset', extensions: ['mise', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
    buttonLabel: 'Open Preset',
  })
  if (canceled || !filePaths.length) return { success: false }
  const content = await fs.readFile(filePaths[0], 'utf8')
  return { success: true, content, filePath: filePaths[0] }
})
