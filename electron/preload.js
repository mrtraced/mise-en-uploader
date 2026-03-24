const { contextBridge, ipcRenderer, webUtils } = require('electron')

// Expose a safe, narrow API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Get full disk path for a File object (Electron 32+)
  getFilePath: (file) => webUtils.getPathForFile(file),

  // Reveal file in Finder / Explorer
  revealInFinder: (filePath) => ipcRenderer.invoke('reveal-in-finder', filePath),

  // Open URL in native browser (keeps user signed in to platforms)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // .mise preset file I/O
  saveMiseFile: (defaultName, content) =>
    ipcRenderer.invoke('save-mise-file', { defaultName, content }),
  openMiseFile: () => ipcRenderer.invoke('open-mise-file'),
})
