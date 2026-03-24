const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe, narrow API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  revealInFinder: (filePath) => ipcRenderer.invoke('reveal-in-finder', filePath),
})
