import { BrowserWindow, screen } from 'electron'
import path from 'path'

let subtitleWindow: BrowserWindow | null = null

export function showSubtitle(text: string): void {
  if (!subtitleWindow || subtitleWindow.isDestroyed()) {
    subtitleWindow = createSubtitleWindow()
  }

  subtitleWindow.webContents.send('subtitle-update', { text })
  subtitleWindow.showInactive()
}

export function hideSubtitle(): void {
  if (subtitleWindow && !subtitleWindow.isDestroyed()) {
    subtitleWindow.close()
    subtitleWindow = null
  }
}

function createSubtitleWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 120,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  // Position at bottom-center of screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const x = Math.round((screenWidth - 600) / 2)
  const y = screenHeight - 160
  win.setPosition(x, y)

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/subtitle`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/subtitle' })
  }

  win.once('ready-to-show', () => {
    win.showInactive() // Show without stealing focus
  })

  return win
}
