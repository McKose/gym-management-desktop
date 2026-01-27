const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    readData: (key) => ipcRenderer.invoke('read-data', key),
    saveData: (key, data) => ipcRenderer.invoke('save-data', { key, data }),
});
