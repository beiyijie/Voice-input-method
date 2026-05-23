/// <reference types="vite/client" />

interface ElectronAPI {
  getConfig: (key: string) => Promise<unknown>
  setConfig: (key: string, value: string) => Promise<unknown>
  getHistory: (limit?: number, offset?: number) => Promise<unknown>
  searchHistory: (keyword: string) => Promise<unknown>
  onRecordingState: (callback: (recording: boolean) => void) => void
  onRecognitionResult: (callback: (result: { text: string }) => void) => void
  onSubtitleUpdate: (callback: (result: { text: string }) => void) => void
  getWords: () => Promise<Array<{ id: number; word: string; weight: number; category: string }>>
  addWord: (word: string, weight?: number, category?: string) => Promise<void>
  deleteWord: (id: number) => Promise<void>
}

interface Window {
  electronAPI: ElectronAPI
}
