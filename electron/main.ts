import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getConfig, setConfig, getHistory, searchHistory, insertHistory, getWords } from './database'
import { PythonBridge } from './python-bridge'
import { typeText } from './auto-type'
import { showSubtitle, hideSubtitle } from './subtitle-window'

let mainWindow: BrowserWindow | null = null
let pythonBridge: PythonBridge | null = null
let isRecording = false
let recordingStartTime = 0

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })
}

async function handleRecordingToggle() {
  if (!pythonBridge || !mainWindow) return

  if (isRecording) {
    pythonBridge.stopRecording()
  } else {
    recordingStartTime = Date.now()
    const words = await getWords()
    const hotwords = words.map(w => w.word)
    pythonBridge.startRecording('zh', hotwords)
    showSubtitle('')
    isRecording = true
    mainWindow.webContents.send('recording-state', true)
  }
}

app.whenReady().then(async () => {
  // Initialize database
  try {
    await initDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database init failed:', err)
  }

  // Start Python bridge
  pythonBridge = new PythonBridge()
  try {
    await pythonBridge.start()
    console.log('Python bridge ready')
  } catch (err) {
    console.error('Python bridge failed:', err)
  }

  // Register global shortcut
  const shortcutKey = 'Ctrl+Space'
  const registered = globalShortcut.register(shortcutKey, handleRecordingToggle)
  if (!registered) {
    console.error(`Failed to register shortcut: ${shortcutKey}`)
  }

  // Handle Python events
  pythonBridge.on('final_result', async (msg) => {
    isRecording = false
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000)
    const text = msg.text || ''

    if (text.trim()) {
      await insertHistory(text, null, duration, 'zh', 'general')
      // Auto-type the recognized text into the currently focused window
      typeText(text)
    }

    hideSubtitle()
    mainWindow?.webContents.send('recognition-result', { text })
    mainWindow?.webContents.send('recording-state', false)
  })

  pythonBridge.on('partial_result', (msg) => {
    showSubtitle(msg.text || '')
  })

  // IPC handlers
  ipcMain.handle('get-config', async (_event, key: string) => {
    try {
      return await getConfig(key)
    } catch {
      return null
    }
  })
  ipcMain.handle('set-config', async (_event, key: string, value: string) => {
    await setConfig(key, value)
  })
  ipcMain.handle('get-history', async (_event, limit?: number, offset?: number) => {
    return await getHistory(limit, offset)
  })
  ipcMain.handle('search-history', async (_event, keyword: string) => {
    return await searchHistory(keyword)
  })

  createWindow()
})

app.on('window-all-closed', async () => {
  await pythonBridge?.shutdown()
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
