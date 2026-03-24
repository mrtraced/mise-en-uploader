const { app, BrowserWindow, shell, ipcMain, session, dialog } = require('electron')
const fs = require('fs').promises
const path = require('path')

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
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  // Must be registered BEFORE any window loads a URL so COOP/COEP headers
  // arrive with the very first response (SharedArrayBuffer requires this)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['credentialless'],
      },
    })
  })

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
