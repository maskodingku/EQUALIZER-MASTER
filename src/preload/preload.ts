import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on: (...args: Parameters<typeof ipcRenderer.on>) => {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off: (...args: Parameters<typeof ipcRenderer.off>) => {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send: (...args: Parameters<typeof ipcRenderer.send>) => {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    // Custom APIs
    getPresets: () => ipcRenderer.invoke('get-presets'),
    savePreset: (preset: any) => ipcRenderer.invoke('save-preset', preset),
    deletePreset: (name: string) => ipcRenderer.invoke('delete-preset', name),
    updateLiveEQ: (data: any) => ipcRenderer.send('update-live-eq', data),

    // Persistence
    getLastState: () => ipcRenderer.invoke('get-last-state'),
    saveLastState: (state: any) => ipcRenderer.invoke('save-last-state', state),

    // Settings
    selectConfigFile: () => ipcRenderer.invoke('select-config-file'),
    getConfigPath: () => ipcRenderer.invoke('get-config-path'),

    // Visualizer
    getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
})
