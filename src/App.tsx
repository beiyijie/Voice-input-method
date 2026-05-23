import { useEffect, useState } from 'react'
import { Mic, Square, History, Settings as SettingsIcon } from 'lucide-react'
import SettingsPage from './pages/Settings'
import './App.css'

function App() {
  const [recording, setRecording] = useState(false)
  const [lastText, setLastText] = useState('')
  const [page, setPage] = useState<'home' | 'settings'>('home')

  useEffect(() => {
    window.electronAPI.onRecordingState((state) => setRecording(state))
    window.electronAPI.onRecognitionResult((result) => setLastText(result.text))
  }, [])

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('home')} />
  }

  return (
    <div className="container">
      <h1 className="title">AI 智能语音输入助手</h1>

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
        <button className="nav-btn" onClick={() => setPage('home')}>
          <Mic />
          <span>首页</span>
        </button>
        <button className="nav-btn" onClick={() => {}}>
          <History />
          <span>历史</span>
        </button>
        <button className="nav-btn" onClick={() => setPage('settings')}>
          <SettingsIcon />
          <span>设置</span>
        </button>
      </div>
    </div>
  )
}

export default App
