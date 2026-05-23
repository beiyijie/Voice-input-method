import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
  getHistory: (limit?: number, offset?: number) => ipcRenderer.invoke('get-history', limit, offset),
  searchHistory: (keyword: string) => ipcRenderer.invoke('search-history', keyword),
  onRecordingState: (callback: (recording: boolean) => void) => {
    ipcRenderer.on('recording-state', (_event, state) => callback(state))
  },
  onRecognitionResult: (callback: (result: { text: string }) => void) => {
    ipcRenderer.on('recognition-result', (_event, result) => callback(result))
  },
  onSubtitleUpdate: (callback: (result: { text: string }) => void) => {
    ipcRenderer.on('subtitle-update', (_event, result) => callback(result))
  },
  getWords: () => ipcRenderer.invoke('get-words'),
  addWord: (word: string, weight?: number, category?: string) => ipcRenderer.invoke('add-word', word, weight, category),
  deleteWord: (id: number) => ipcRenderer.invoke('delete-word', id),
})
