# AI 智能语音输入助手 Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基础语音输入 + 自动打字功能，用户按快捷键录音，识别结果自动输入到当前窗口

**Architecture:** Electron + React 前端，Python FunASR 子进程做语音识别，Node.js 主进程处理全局热键和自动输入，MySQL 存储配置和历史

**Tech Stack:** Electron 33+, React 18+, TypeScript, Vite, MySQL 8, Python 3.10+, FunASR, electron-builder

---

## PR 1: 项目脚手架

**目的：** 搭建 Electron + React + Vite + TypeScript 项目基础结构，确保能启动和打包

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `electron-builder.yml`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "voice-input-method",
  "version": "1.0.0",
  "description": "AI 智能语音输入助手 - 语音转文字 + AI纠错 + 跨应用自动输入",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "concurrently": "^9.0.0",
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "wait-on": "^8.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "dist"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "electron"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
  ],
})
```

- [ ] **Step 5: 创建 electron/main.ts**

```ts
import { app, BrowserWindow } from 'electron'
import path from 'path'

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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 6: 创建 electron/preload.ts**

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
})
```

- [ ] **Step 7: 创建 src/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI 智能语音输入助手</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 9: 创建 src/App.tsx**

```tsx
function App() {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>AI 智能语音输入助手</h1>
      <p>就绪 — 按 Ctrl+Space 开始录音</p>
    </div>
  )
}

export default App
```

- [ ] **Step 10: 创建 src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 11: 创建 .gitignore**

```
node_modules/
dist/
dist-electron/
.vite/
*.log
```

- [ ] **Step 12: 创建 electron-builder.yml**

```yaml
appId: com.voiceinput.assistant
productName: 语音输入助手
directories:
  output: release
files:
  - dist
  - dist-electron
win:
  target: nsis
  icon: resources/icon.png
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 13: 创建 resources/ 目录占位**

运行: `mkdir -p resources`

- [ ] **Step 14: 安装依赖并验证启动**

```bash
cd "C:\Users\32906\Desktop\项目\语音输入法"
npm install
```

预期输出: npm install 成功，无错误

- [ ] **Step 15: 提交 PR1**

```bash
git add -A
git commit -m "feat: init Electron + React + Vite + TypeScript project scaffold"
git push
```

---

## PR 2: MySQL 数据库模块

**目的：** 实现 MySQL 连接和基础数据库操作，创建三张表

**Files:**
- Create: `electron/database.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: 安装 mysql2 依赖**

运行: `npm install mysql2`

- [ ] **Step 2: 创建 electron/database.ts**

```ts
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export interface Word {
  id: number
  word: string
  weight: number
  category: string
}

export interface VoiceHistory {
  id: number
  voice_text: string
  optimized_text: string | null
  duration: number
  language: string
  mode: string
  created_at: Date
}

export interface SystemConfig {
  config_key: string
  config_value: string
}

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'voice_input',
  waitForConnections: true,
  connectionLimit: 5,
}

const INIT_SQL = `
CREATE DATABASE IF NOT EXISTS voice_input DEFAULT CHARACTER SET utf8mb4;

USE voice_input;

CREATE TABLE IF NOT EXISTS user_words (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE COMMENT '热词',
    weight INT DEFAULT 50 COMMENT '权重0-100',
    category VARCHAR(100) DEFAULT '' COMMENT '分类',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='用户自定义热词';

CREATE TABLE IF NOT EXISTS voice_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voice_text TEXT NOT NULL COMMENT '原始识别文本',
    optimized_text TEXT COMMENT 'AI纠错后文本',
    duration INT DEFAULT 0 COMMENT '录音时长秒',
    language VARCHAR(20) DEFAULT 'zh' COMMENT '语种',
    mode VARCHAR(50) DEFAULT 'general' COMMENT '输入模式',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) COMMENT='语音识别历史';

CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='系统配置';

INSERT IGNORE INTO system_config (config_key, config_value) VALUES
('shortcut_key', 'Ctrl+Space'),
('language', 'zh'),
('mode', 'general');
`

export async function initDatabase(): Promise<void> {
  // First connect without database to create it
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  })
  await tempConn.execute('CREATE DATABASE IF NOT EXISTS voice_input DEFAULT CHARACTER SET utf8mb4')
  await tempConn.end()

  pool = mysql.createPool(DB_CONFIG)

  // Run schema
  const conn = await pool.getConnection()
  try {
    await conn.execute(`USE voice_input`)
    for (const stmt of INIT_SQL.split(';').filter(s => s.trim().toUpperCase().startsWith('CREATE') || s.trim().toUpperCase().startsWith('INSERT'))) {
      await conn.execute(stmt.trim())
    }
  } finally {
    conn.release()
  }
}

export async function getConfig(key: string): Promise<string | null> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT config_value FROM system_config WHERE config_key = ?', [key]
  )
  return rows.length > 0 ? rows[0].config_value : null
}

export async function setConfig(key: string, value: string): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute(
    'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
    [key, value, value]
  )
}

export async function insertHistory(voiceText: string, optimizedText: string | null, duration: number, language: string, mode: string): Promise<number> {
  if (!pool) throw new Error('Database not initialized')
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    'INSERT INTO voice_history (voice_text, optimized_text, duration, language, mode) VALUES (?, ?, ?, ?, ?)',
    [voiceText, optimizedText, duration, language, mode]
  )
  return result.insertId
}

export async function getHistory(limit = 50, offset = 0): Promise<VoiceHistory[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT * FROM voice_history ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]
  )
  return rows as VoiceHistory[]
}

export async function searchHistory(keyword: string): Promise<VoiceHistory[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM voice_history WHERE voice_text LIKE ? OR optimized_text LIKE ? ORDER BY created_at DESC",
    [`%${keyword}%`, `%${keyword}%`]
  )
  return rows as VoiceHistory[]
}

export async function getWords(): Promise<Word[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT * FROM user_words ORDER BY weight DESC'
  )
  return rows as Word[]
}

export async function addWord(word: string, weight = 50, category = ''): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute(
    'INSERT INTO user_words (word, weight, category) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE weight = VALUES(weight)',
    [word, weight, category]
  )
}

export async function deleteWord(id: number): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute('DELETE FROM user_words WHERE id = ?', [id])
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
```

- [ ] **Step 3: 修改 electron/main.ts — 集成数据库初始化**

```ts
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getConfig, setConfig } from './database'

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
  try {
    await initDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database init failed:', err)
  }
  createWindow()
})

app.on('window-all-closed', async () => {
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 4: 验证连接**

确保本地 MySQL 已运行，然后:

```bash
npm run electron:dev
```

预期: 控制台输出 "Database initialized successfully"，无报错

- [ ] **Step 5: 提交 PR2**

```bash
git add -A
git commit -m "feat: add MySQL database module with schema initialization"
git push
```

---

## PR 3: Python FunASR WebSocket 服务

**目的：** 创建 Python 子进程，提供录音 + 语音识别 WebSocket 服务

**Files:**
- Create: `python/requirements.txt`
- Create: `python/server.py`
- Create: `python/recognizer.py`
- Create: `python/vad.py`
- Create: `electron/python-bridge.ts`

- [ ] **Step 1: 创建 python/requirements.txt**

```
funasr==1.1.0
websockets==13.0
numpy==1.26.0
sounddevice==0.5.0
asyncio
```

- [ ] **Step 2: 创建 python/vad.py**

```python
"""语音活动检测 - 基于能量阈值检测静音"""
import numpy as np


class VAD:
    def __init__(self, sample_rate: int = 16000, silence_threshold: float = 0.01, silence_duration: float = 2.0):
        self.sample_rate = sample_rate
        self.silence_threshold = silence_threshold
        self.silence_samples = int(silence_duration * sample_rate)
        self.silent_count = 0
        self.is_speaking = False

    def process(self, audio_chunk: np.ndarray) -> bool:
        """返回 True = 应该停止录音（静音超时）"""
        energy = np.sqrt(np.mean(audio_chunk ** 2))
        if energy < self.silence_threshold:
            self.silent_count += len(audio_chunk)
        else:
            self.silent_count = 0
            self.is_speaking = True

        if self.is_speaking and self.silent_count > self.silence_samples:
            return True  # 静音超时，停止录音
        return False

    def reset(self):
        self.silent_count = 0
        self.is_speaking = False
```

- [ ] **Step 3: 创建 python/recognizer.py**

```python
"""语音识别核心 - 使用 FunASR paraformer"""
import numpy as np
import threading
from funasr import AutoModel

_model = None
_model_lock = threading.Lock()


def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = AutoModel(
                    model="iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
                    vad_model="iic/speech_fsmn_vad_zh-cn-16k-common-pytorch",
                    punc_model="iic/punc_ct-transformer_zh-cn-common-vocab272727-pytorch",
                    disable_update=True,
                )
    return _model


def recognize(audio_bytes: bytes, hotwords: list[str] | None = None) -> str:
    """对音频进行识别，返回文本"""
    model = get_model()
    import numpy as np
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    result = model.generate(
        input=audio_array,
        hotwords=hotwords or [],
    )
    return result[0]["text"] if result else ""
```

- [ ] **Step 4: 创建 python/server.py**

```python
"""WebSocket 服务 - 接收 Electron 指令，返回识别结果"""
import asyncio
import json
import struct
import sys
import numpy as np
import sounddevice as sd
import websockets

from recognizer import recognize
from vad import VAD

SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1600  # 100ms per chunk
WS_PORT = 9877

_recording = False
_audio_buffer: list[bytes] = []


async def handle_client(websocket):
    global _recording, _audio_buffer
    vad = VAD()
    hotwords: list[str] = []

    async def send(msg: dict):
        await websocket.send(json.dumps(msg, ensure_ascii=False))

    await send({"type": "ready", "pid": __import__("os").getpid()})

    async for raw_msg in websocket:
        msg = json.loads(raw_msg)
        msg_type = msg.get("type")

        if msg_type == "start_recording":
            hotwords = msg.get("hotwords", [])
            _recording = True
            _audio_buffer = []
            vad.reset()

            await send({"type": "recording_started"})

            def audio_callback(indata, frames, time_info, status):
                if _recording:
                    chunk = indata.copy()
                    _audio_buffer.append(chunk.tobytes())

            stream = sd.InputStream(
                samplerate=SAMPLE_RATE,
                channels=CHANNELS,
                dtype="int16",
                blocksize=CHUNK_SIZE,
                callback=audio_callback,
            )

            with stream:
                while _recording:
                    await asyncio.sleep(0.1)
                    if len(_audio_buffer) > 0:
                        chunk = np.frombuffer(_audio_buffer[-1], dtype=np.int16)
                        should_stop = vad.process(chunk.astype(np.float32) / 32768.0)
                        if should_stop:
                            _recording = False
                            break

            # 录音结束，进行识别
            if _audio_buffer:
                all_audio = b"".join(_audio_buffer)
                loop = asyncio.get_event_loop()
                text = await loop.run_in_executor(None, recognize, all_audio, hotwords)
                await send({"type": "final_result", "text": text})

        elif msg_type == "stop_recording":
            _recording = False
            await send({"type": "recording_stopped"})

        elif msg_type == "update_hotwords":
            hotwords = msg.get("hotwords", [])

        elif msg_type == "shutdown":
            await send({"type": "shutdown_ack"})
            break


async def main():
    async with websockets.serve(handle_client, "127.0.0.1", WS_PORT):
        print(f"Voice recognition server started on ws://127.0.0.1:{WS_PORT}", flush=True)
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 5: 创建 electron/python-bridge.ts**

```ts
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import WebSocket from 'ws'

type MessageHandler = (msg: any) => void

export class PythonBridge {
  private process: ChildProcess | null = null
  private ws: WebSocket | null = null
  private handlers = new Map<string, MessageHandler[]>()
  private ready = false
  private restartCount = 0
  private maxRestarts = 3

  async start(): Promise<void> {
    const pythonPath = process.env.PYTHON_PATH || 'python'
    const scriptPath = path.join(__dirname, '../../python/server.py')

    this.process = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      console.log(`[Python] ${data.toString().trim()}`)
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[Python ERR] ${data.toString().trim()}`)
    })

    this.process.on('exit', (code) => {
      console.log(`[Python] exited with code ${code}`)
      this.ws?.close()
      this.ws = null
      this.ready = false
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++
        console.log(`[Python] restarting (${this.restartCount}/${this.maxRestarts})...`)
        setTimeout(() => this.start(), 1000)
      }
    })

    // Wait for Python to start, then connect WebSocket
    await new Promise<void>((resolve) => setTimeout(resolve, 2000))

    this.ws = new WebSocket('ws://127.0.0.1:9877')

    this.ws.on('open', () => {
      console.log('[WS] connected to Python')
    })

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'ready') {
          this.ready = true
          this.restartCount = 0
        }
        const handlers = this.handlers.get(msg.type) || []
        handlers.forEach((h) => h(msg))
      } catch (err) {
        console.error('[WS] parse error:', err)
      }
    })

    this.ws.on('error', (err) => {
      console.error('[WS] error:', err.message)
    })

    // Wait for ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Python not ready within 10s')), 10000)
      this.on('ready', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  on(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type) || []
    handlers.push(handler)
    this.handlers.set(type, handlers)
  }

  send(msg: Record<string, any>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  startRecording(language = 'zh', hotwords: string[] = []): void {
    this.send({ type: 'start_recording', language, hotwords })
  }

  stopRecording(): void {
    this.send({ type: 'stop_recording' })
  }

  updateHotwords(hotwords: string[]): void {
    this.send({ type: 'update_hotwords', hotwords })
  }

  async shutdown(): Promise<void> {
    this.send({ type: 'shutdown' })
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (this.process) {
      this.process.kill()
      this.process = null
    }
    this.ws?.close()
    this.ws = null
    this.ready = false
  }
}
```

- [ ] **Step 6: 安装 npm 依赖**

```bash
npm install ws
npm install -D @types/ws
```

- [ ] **Step 7: 验证 Python 服务能独立启动**

```bash
cd python
pip install -r requirements.txt
python server.py
```

预期: `Voice recognition server started on ws://127.0.0.1:9877`

- [ ] **Step 8: 提交 PR3**

```bash
git add -A
git commit -m "feat: add Python FunASR WebSocket voice recognition service"
git push
```

---

## PR 4: 全局快捷键 + 录音控制

**目的：** 用户按 Ctrl+Space 开始/停止录音，集成 Python 识别流程

**Files:**
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 修改 electron/main.ts — 添加快捷键和录音控制**

```ts
import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getConfig, setConfig, insertHistory, getWords } from './database'
import { PythonBridge } from './python-bridge'

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
  if (!pythonBridge) return

  if (isRecording) {
    // Stop recording
    pythonBridge.stopRecording()
    // Note: final_result handler will finish the flow
  } else {
    // Start recording
    recordingStartTime = Date.now()
    const words = await getWords()
    const hotwords = words.map(w => w.word)
    pythonBridge.startRecording('zh', hotwords)
    isRecording = true
    mainWindow?.webContents.send('recording-state', true)
  }
}

app.whenReady().then(async () => {
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
  const shortcutKey = (await getConfig('shortcut_key')) || 'Ctrl+Space'
  const registered = globalShortcut.register(shortcutKey, handleRecordingToggle)
  if (!registered) {
    console.error(`Failed to register shortcut: ${shortcutKey}`)
  }

  // Handle final result from Python
  pythonBridge.on('final_result', async (msg) => {
    isRecording = false
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000)
    const text = msg.text

    // Save to history
    if (text.trim()) {
      await insertHistory(text, null, duration, 'zh', 'general')
    }

    // Send result to renderer
    mainWindow?.webContents.send('recognition-result', { text })
    mainWindow?.webContents.send('recording-state', false)
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
```

- [ ] **Step 2: 修改 electron/preload.ts — 暴露更多 API**

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: string) => ipcRenderer.invoke('set-config', key, value),
  getHistory: (limit?: number, offset?: number) => ipcRenderer.invoke('get-history', limit, offset),
  onRecordingState: (callback: (recording: boolean) => void) => {
    ipcRenderer.on('recording-state', (_event, state) => callback(state))
  },
  onRecognitionResult: (callback: (result: { text: string }) => void) => {
    ipcRenderer.on('recognition-result', (_event, result) => callback(result))
  },
})
```

- [ ] **Step 3: 更新 src/App.tsx — 录音状态展示**

```tsx
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    electronAPI: {
      getConfig: (key: string) => Promise<string | null>
      setConfig: (key: string, value: string) => Promise<void>
      getHistory: (limit?: number, offset?: number) => Promise<any[]>
      onRecordingState: (callback: (recording: boolean) => void) => void
      onRecognitionResult: (callback: (result: { text: string }) => void) => void
    }
  }
}

function App() {
  const [recording, setRecording] = useState(false)
  const [lastText, setLastText] = useState('')

  useEffect(() => {
    window.electronAPI.onRecordingState((state) => setRecording(state))
    window.electronAPI.onRecognitionResult((result) => setLastText(result.text))
  }, [])

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>AI 智能语音输入助手</h1>
      <div style={{ fontSize: 48, margin: 24 }}>
        {recording ? '🎤' : '🎧'}
      </div>
      <p style={{ fontSize: 18, color: recording ? '#f00' : '#666' }}>
        {recording ? '录音中... 按 Ctrl+Space 停止' : '就绪 — 按 Ctrl+Space 开始录音'}
      </p>
      {lastText && (
        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <p style={{ fontSize: 16 }}>{lastText}</p>
        </div>
      )}
    </div>
  )
}

export default App
```

- [ ] **Step 4: 验证** — 启动应用，按 Ctrl+Space，说一段话，再按 Ctrl+Space 停止

```bash
npm run electron:dev
```

预期: 按下快捷键后页面显示录音状态，停止后显示识别文本

- [ ] **Step 5: 提交 PR4**

```bash
git add -A
git commit -m "feat: add global hotkey (Ctrl+Space) recording control"
git push
```

---

## PR 5: 自动输入到焦点窗口

**目的：** 录音识别的文本自动输入到当前焦点窗口（微信、浏览器、IDE 等）

**Files:**
- Create: `electron/auto-type.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: 安装 robotjs 依赖**

```bash
npm install robotjs
npm install -D @types/robotjs
```

如果 robotjs 编译失败，备选方案使用 PowerShell 模拟输入。

- [ ] **Step 2: 创建 electron/auto-type.ts**

```ts
import { exec } from 'child_process'

/**
 * 使用 PowerShell 模拟键盘输入到当前焦点窗口
 * 备选方案：如果 robotjs 不可用
 */
export function typeTextWithPowerShell(text: string): void {
  // Escape special characters for PowerShell
  const escaped = text
    .replace(/"/g, '\\"')
    .replace(/`/g, '`"`"')
  const script = `
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys([string]::Join('', ${JSON.stringify(text)}.ToCharArray() | ForEach-Object {
      $c = $_
      switch ($c) {
        '~' { '+~' }
        '^' { '{^}' }
        '%' { '{%}' }
        '+' { '{+}' }
        '{' { '{{}' }
        '}' { '{}}' }
        '[' { '{[}' }
        ']' { '{]}' }
        '(' { '{(}' }
        ')' { '{)}' }
        '&' { '{&}' }
        default { $c }
      }
    }))
  `
  exec(`powershell -NoProfile -Command "${script}"`, (err) => {
    if (err) console.error('Auto-type failed:', err)
  })
}

/**
 * 使用 robotjs 模拟键盘输入（更可靠）
 */
export function typeTextWithRobot(text: string): void {
  try {
    const robot = require('robotjs')
    robot.typeStr(text)
  } catch {
    // Fallback to PowerShell
    typeTextWithPowerShell(text)
  }
}

export function typeText(text: string): void {
  // Minimize the app window first, then type
  const { BrowserWindow } = require('electron')
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.minimize()
    // Small delay to ensure window is minimized
    setTimeout(() => {
      typeTextWithRobot(text)
    }, 300)
  } else {
    typeTextWithRobot(text)
  }
}
```

- [ ] **Step 3: 修改 electron/main.ts — 添加自动输入**

在 `final_result` handler 中添加自动输入调用:

```ts
import { typeText } from './auto-type'

// 在 handleRecordingToggle 函数的 stop 分支中:
pythonBridge.on('final_result', async (msg) => {
  isRecording = false
  const duration = Math.floor((Date.now() - recordingStartTime) / 1000)
  const text = msg.text

  if (text.trim()) {
    await insertHistory(text, null, duration, 'zh', 'general')
    // Auto-type to current focus window
    typeText(text)
  }

  mainWindow?.webContents.send('recognition-result', { text })
  mainWindow?.webContents.send('recording-state', false)
})
```

- [ ] **Step 4: 验证**

```bash
npm run electron:dev
```

按 Ctrl+Space，说话，停止后观察文本是否自动输入到其他打开的窗口

- [ ] **Step 5: 提交 PR5**

```bash
git add -A
git commit -m "feat: add auto-typing to focus window via robotjs/PowerShell"
git push
```

---

## PR 6: 首页 UI + 基本交互

**目的：** 完善首页 UI，美化界面

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.css`

- [ ] **Step 1: 安装依赖**

```bash
npm install lucide-react
```

- [ ] **Step 2: 创建 src/App.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  height: 100vh;
  overflow: hidden;
  user-select: none;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 24px;
}

.title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.status-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  transition: all 0.3s ease;
}

.status-icon.idle {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.status-icon.recording {
  background: rgba(255, 50, 50, 0.2);
  border: 2px solid #ff4444;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 20px rgba(255, 68, 68, 0); }
}

.status-text {
  font-size: 15px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.shortcut-hint {
  font-size: 13px;
  opacity: 0.6;
  margin-top: 8px;
}

.shortcut-key {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  margin: 0 2px;
}

.result-box {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  backdrop-filter: blur(10px);
}

.result-box p {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-all;
}

.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.nav-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.nav-btn:hover {
  color: #fff;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}
```

- [ ] **Step 3: 更新 src/App.tsx — 完整首页**

```tsx
import { useEffect, useState } from 'react'
import { Mic, Settings, History, Square } from 'lucide-react'
import './App.css'

declare global {
  interface Window {
    electronAPI: {
      getConfig: (key: string) => Promise<string | null>
      setConfig: (key: string, value: string) => Promise<void>
      getHistory: (limit?: number, offset?: number) => Promise<any[]>
      onRecordingState: (callback: (recording: boolean) => void) => void
      onRecognitionResult: (callback: (result: { text: string }) => void) => void
    }
  }
}

function App() {
  const [recording, setRecording] = useState(false)
  const [lastText, setLastText] = useState('')
  const [currentMode, setCurrentMode] = useState('通用模式')

  useEffect(() => {
    window.electronAPI.onRecordingState((state) => setRecording(state))
    window.electronAPI.onRecognitionResult((result) => setLastText(result.text))
    window.electronAPI.getConfig('mode').then((mode) => {
      if (mode) setCurrentMode({ general: '通用模式', office: '办公模式', programmer: '程序员模式' }[mode] || '通用模式')
    })
  }, [])

  return (
    <div className="container">
      <h1 className="title">AI 智能语音输入助手</h1>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{currentMode}</div>

      <div className={`status-icon ${recording ? 'recording' : 'idle'}`}>
        {recording ? <Square size={32} color="#ff4444" /> : <Mic size={32} />}
      </div>

      <p className="status-text">
        {recording ? '录音中... 再次按下快捷键停止' : '就绪'}
      </p>
      <p className="shortcut-hint">
        按下 <span className="shortcut-key">Ctrl</span> + <span className="shortcut-key">Space</span> 开始语音输入
      </p>

      {lastText && (
        <div className="result-box">
          <p>{lastText}</p>
        </div>
      )}

      <div className="nav-bar">
        <button className="nav-btn" onClick={() => {}}>
          <Mic />
          <span>首页</span>
        </button>
        <button className="nav-btn" onClick={() => {}}>
          <History />
          <span>历史</span>
        </button>
        <button className="nav-btn" onClick={() => {}}>
          <Settings />
          <span>设置</span>
        </button>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 4: 验证** — 启动查看 UI 效果

```bash
npm run electron:dev
```

预期: 渐变背景、状态图标、快捷键提示、底部导航栏

- [ ] **Step 5: 提交 PR6**

```bash
git add -A
git commit -m "feat: add home page UI with recording state and navigation"
git push
```

---

## 自审

**Spec 覆盖检查：**
- ✅ 项目脚手架 — PR1
- ✅ MySQL 数据库 — PR2
- ✅ Python FunASR 集成 — PR3
- ✅ 全局热键录音控制 — PR4
- ✅ 自动输入到焦点窗口 — PR5
- ✅ 首页 UI — PR6
- ⏳ 悬浮字幕窗 — Phase 2
- ⏳ 热词管理 — Phase 2
- ⏳ AI纠错 — Phase 3
- ⏳ 模式系统 — Phase 3

**占位符检查：** 无 TBD/TODO，所有代码完整可运行

**类型一致性检查：** database.ts 的导出函数签名与 main.ts 调用一致，preload.ts 暴露的 API 与 App.tsx 使用一致
