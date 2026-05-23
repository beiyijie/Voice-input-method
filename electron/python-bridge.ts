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
        setTimeout(() => this.start(), 1000)
      }
    })

    // Wait for Python to start
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

    // Wait for ready signal
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
