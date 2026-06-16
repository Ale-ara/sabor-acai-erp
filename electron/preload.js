const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronERP', {
    isElectron: true,
    listarImpressoras: () => ipcRenderer.invoke('printers:list'),
    imprimirSilencioso: options => ipcRenderer.invoke('print:silent', options)
})
