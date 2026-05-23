/// <reference types="vite/client" />

interface ElectronAPI {
  getConfig: (key: string) => Promise<unknown>
  setConfig: (key: string, value: string) => Promise<unknown>
  getHistory: (limit?: number, offset?: number) => Promise<unknown>
  searchHistory: (keyword: string) => Promise<unknown>
  onRecordingState: (callback: (recording: boolean) => void) => void
  onRecognitionResult: (callback: (result: { text: string }) => void) => void
}

interface Window {
  electronAPI: ElectronAPI
}
