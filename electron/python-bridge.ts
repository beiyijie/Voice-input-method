import { spawn, execSync, ChildProcess } from 'child_process'
import path from 'path'
import net from 'net'
import WebSocket from 'ws'

type MessageHandler = (msg: any) => void

export class PythonBridge {
  private process: ChildProcess | null = null
  private ws: WebSocket | null = null
  private handlers = new Map<string, MessageHandler[]>()
  private ready = false
  private restartCount = 0
  private maxRestarts = 3
  private shouldRestart = true

  private isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(true))
      server.once('listening', () => {
        server.close()
        resolve(false)
      })
      server.listen(port, '127.0.0.1')
    })
  }

  async start(): Promise<void> {
    const pythonPath = process.env.PYTHON_PATH || 'python'
    const scriptPath = path.resolve(__dirname, '../python/server.py')
    console.log('[Bridge] Starting Python:', scriptPath)

    // Kill any leftover Python server on our port first
    const inUse = await this.isPortInUse(9877)
    if (inUse) {
      console.log('[Bridge] Port 9877 in use, killing old Python server...')
      try {
        execSync('taskkill /f /im python.exe 2>nul || true', { timeout: 3000 })
        // Wait for port to be released
        await new Promise((r) => setTimeout(r, 1500))
      } catch {
        // Ignore kill errors
      }
    }

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
      if (this.shouldRestart && this.restartCount < this.maxRestarts) {
        this.restartCount++
        setTimeout(() => this.start(), 1000)
      }
    })

    // Retry WebSocket connection until Python is ready
    await this.connectWithRetry()
  }

  private async connectWithRetry(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (!this.process || this.process.killed) break

      try {
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket('ws://127.0.0.1:9877')
          const timeout = setTimeout(() => {
            ws.close()
            reject(new Error('connection timeout'))
          }, 2000)

          ws.on('open', () => {
            clearTimeout(timeout)
            console.log('[Bridge] WebSocket connected')
            this.ws = ws
            this.setupWsHandlers(ws)
            resolve()
          })

          ws.on('error', (err) => {
            clearTimeout(timeout)
            ws.close()
            reject(err)
          })
        })

        // Wait for 'ready' message from Python
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('ready timeout')), 8000)
          const handler = (msg: any) => {
            if (msg.type === 'ready') {
              this.off('ready', handler)
              clearTimeout(timeout)
              this.ready = true
              this.restartCount = 0
              resolve()
            }
          }
          this.on('ready', handler)
        })

        console.log('[Bridge] Python ready')
        return
      } catch {
        // Retry after short delay
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    throw new Error('Python not ready within retry limit')
  }

  private setupWsHandlers(ws: WebSocket): void {
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString())
        const handlers = this.handlers.get(msg.type) || []
        handlers.forEach((h) => h(msg))
      } catch (err) {
        console.error('[WS] parse error:', err)
      }
    })

    ws.on('error', (err) => {
      console.error('[WS] error:', err.message)
    })

    ws.on('close', () => {
      console.log('[WS] disconnected')
      this.ws = null
      this.ready = false
    })
  }

  on(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type) || []
    handlers.push(handler)
    this.handlers.set(type, handlers)
  }

  off(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type) || []
    this.handlers.set(type, handlers.filter(h => h !== handler))
  }

  send(msg: Record<string, any>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    } else {
      console.warn('[Bridge] Cannot send, WebSocket not connected:', msg.type)
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

  isReady(): boolean {
    return this.ready && this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  async shutdown(): Promise<void> {
    this.shouldRestart = false
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
