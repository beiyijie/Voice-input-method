import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
  getHistory: (limit?: number, offset?: number) => ipcRenderer.invoke('get-history', limit, offset),
  searchHistory: (keyword: string) => ipcRenderer.invoke('search-history', keyword),
})
