import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getConfig, setConfig, getHistory, searchHistory } from './database'

let mainWindow: BrowserWindow | null = null

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

app.whenReady().then(async () => {
  // Initialize database
  try {
    await initDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database init failed:', err)
  }

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
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
