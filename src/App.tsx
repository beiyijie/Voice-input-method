import { useEffect, useState } from 'react'

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
        {recording ? '🔴' : '🎤'}
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
