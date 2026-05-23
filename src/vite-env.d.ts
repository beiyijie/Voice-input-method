/// <reference types="vite/client" />

interface ElectronAPI {
  getConfig: (key: string) => Promise<unknown>
  setConfig: (key: string, value: string) => Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
