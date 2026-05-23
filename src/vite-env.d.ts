/// <reference types="vite/client" />

interface ElectronAPI {
  getConfig: (key: string) => Promise<unknown>
  setConfig: (key: string, value: string) => Promise<unknown>
  getHistory: (limit?: number, offset?: number) => Promise<unknown>
  searchHistory: (keyword: string) => Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
