import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getConfig, setConfig, getHistory, searchHistory, insertHistory, getWords, addWord, deleteWord } from './database'
import { PythonBridge } from './python-bridge'
import { typeText, replaceText } from './auto-type'
import { correctText } from './ollama'
import { parseCommand } from './commands'
import { getModeConfig } from './modes'
import { showSubtitle, hideSubtitle } from './subtitle-window'

let mainWindow: BrowserWindow | null = null
let pythonBridge: PythonBridge | null = null
let isRecording = false
let recordingStartTime = 0
let currentMode = 'general'
let lastTypedText = ''
let cachedUserWords: string[] = []
let cachedLanguage = 'zh'
let cachedAiCorrect = true
/** generation-based approach: Tag each recording with a gen number.
 *  When final_result arrives with a gen that doesn't match the current
 *  recordingGen, it's stale and gets discarded. */
let recordingGen = 0
let processingQueue: Promise<void> = Promise.resolve()

function enqueue(fn: () => Promise<void>) {
  processingQueue = processingQueue.then(fn).catch(err => console.error('Processing error:', err))
}

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
    // Stop immediately — don't block on recognition/typing
    pythonBridge.stopRecording()
    isRecording = false
    mainWindow.webContents.send('recording-state', false)
    hideSubtitle()
  } else {
    recordingGen++
    lastTypedText = ''
    recordingStartTime = Date.now()
    const mode = getModeConfig(currentMode)
    const hotwords = [...mode.defaultHotwords, ...cachedUserWords]
    pythonBridge.send({ type: 'start_recording', language: cachedLanguage, hotwords, gen: recordingGen })
    showSubtitle('')
    isRecording = true
    mainWindow.webContents.send('recording-state', true)
  }
}

async function processResult(text: string, gen: number) {
  if (!text.trim() || !mainWindow) return

  const duration = Math.floor((Date.now() - recordingStartTime) / 1000)

  // Check for voice commands first
  const parsed = parseCommand(text)
  if (parsed) {
    await parsed.command.execute(parsed.params)
    mainWindow.webContents.send('recognition-result', { text: `🎯 执行命令: ${text}` })
    hideSubtitle()
    mainWindow.webContents.send('recording-state', false)
    return
  }

  // AI correction (only if enabled)
  let corrected: string | null = null
  if (cachedAiCorrect) {
    try {
      const mode = getModeConfig(currentMode)
      corrected = await correctText(text, mode.correctionPrompt)
    } catch (err) {
      console.error('AI correction failed:', err)
    }
  }

  // Type final text via clipboard paste
  const finalText = corrected || text
  await typeText(finalText)
  lastTypedText = ''

  // Save to history
  insertHistory(text, corrected, duration, cachedLanguage, currentMode).catch((err) =>
    console.error('Save history failed:', err)
  )

  // Update UI
  if (gen === recordingGen) {
    mainWindow.webContents.send('recognition-result', { text })
    if (corrected) {
      mainWindow.webContents.send('corrected-text', { text: corrected })
    }
    hideSubtitle()
    mainWindow.webContents.send('recording-state', false)
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
  const shortcutKey = 'Alt+V'
  const registered = globalShortcut.register(shortcutKey, handleRecordingToggle)
  if (!registered) {
    console.error(`Failed to register shortcut: ${shortcutKey}`)
  }

  // Load user words cache & language
  try {
    const words = await getWords()
    cachedUserWords = words.map(w => w.word)
    console.log(`Loaded ${cachedUserWords.length} user words`)
  } catch (err) {
    console.error('Failed to load user words:', err)
  }
  try {
    const lang = await getConfig('language')
    if (lang) cachedLanguage = lang
  } catch (err) {
    console.error('Failed to load language:', err)
  }
  try {
    const ai = await getConfig('ai_correct')
    if (ai !== null) cachedAiCorrect = ai === 'true'
  } catch (err) {
    console.error('Failed to load ai_correct:', err)
  }

  // Single final_result handler — uses gen to discard stale results
  pythonBridge.on('final_result', (msg) => {
    const resultGen = (msg as any).gen || 0
    if (resultGen !== recordingGen) return // Stale result from previous recording
    const text = msg.text || ''
    if (text.trim()) {
      enqueue(() => processResult(text, resultGen))
    } else {
      hideSubtitle()
      mainWindow?.webContents.send('recording-state', false)
    }
  })

  pythonBridge.on('partial_result', (msg) => {
    const partialText = msg.text || ''
    showSubtitle(partialText)
    // When AI correction is off, stream partial results into the target app in real-time
    if (!cachedAiCorrect && partialText.trim()) {
      replaceText(partialText).catch(() => {})
    }
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
    if (key === 'shortcut_key') {
      globalShortcut.unregisterAll()
      globalShortcut.register(value, handleRecordingToggle)
    } else if (key === 'language') {
      cachedLanguage = value
    } else if (key === 'ai_correct') {
      cachedAiCorrect = value === 'true'
    }
  })
  ipcMain.handle('get-history', async (_event, limit?: number, offset?: number) => {
    return await getHistory(limit, offset)
  })
  ipcMain.handle('search-history', async (_event, keyword: string) => {
    return await searchHistory(keyword)
  })
  ipcMain.handle('get-words', async () => {
    return await getWords()
  })
  ipcMain.handle('add-word', async (_event, word: string, weight?: number, category?: string) => {
    await addWord(word, weight, category)
    const words = await getWords()
    cachedUserWords = words.map(w => w.word)
  })
  ipcMain.handle('delete-word', async (_event, id: number) => {
    await deleteWord(id)
    const words = await getWords()
    cachedUserWords = words.map(w => w.word)
  })
  ipcMain.handle('set-mode', async (_event, modeId: string) => {
    currentMode = modeId
    await setConfig('mode', modeId)
    // Update hotwords in Python bridge
    const mode = getModeConfig(modeId)
    const allWords = [...mode.defaultHotwords]
    const userWords = await getWords()
    const userWordTexts = userWords.map(w => w.word)
    allWords.push(...userWordTexts)
    pythonBridge?.updateHotwords(allWords)
  })
  ipcMain.handle('get-mode', async () => {
    const saved = await getConfig('mode')
    return saved || 'general'
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
