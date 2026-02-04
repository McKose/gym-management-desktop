const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    readData: (key) => ipcRenderer.invoke('read-data', key),
    saveData: (key, data) => ipcRenderer.invoke('save-data', { key, data }),
    // Auto-Updater Methods
    checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
    startDownload: () => ipcRenderer.invoke('start-download'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    // Event Listeners
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, ...args) => callback(...args)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, ...args) => callback(...args)),
});
