import { useEffect, useState } from 'react'
import { Mic, Square, History, Settings as SettingsIcon } from 'lucide-react'
import SettingsPage from './pages/Settings'
import HistoryPage from './pages/History'
import './App.css'

function App() {
  const [recording, setRecording] = useState(false)
  const [lastText, setLastText] = useState('')
  const [page, setPage] = useState<'home' | 'settings' | 'history'>('home')
  const [currentMode, setCurrentMode] = useState('通用模式')

  useEffect(() => {
    window.electronAPI.onRecordingState((state) => setRecording(state))
    window.electronAPI.onRecognitionResult((result) => setLastText(result.text))
    window.electronAPI.getMode().then(modeId => {
      const modeNames: Record<string, string> = { general: '通用模式', office: '办公模式', programmer: '程序员模式' }
      setCurrentMode(modeNames[modeId] || '通用模式')
    })
  }, [])

  if (page === 'history') {
    return <HistoryPage onBack={() => setPage('home')} />
  }

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('home')} />
  }

  return (
    <div className="container">
      <h1 className="title">AI 智能语音输入助手</h1>
      <div className="mode-label">{currentMode}</div>

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
        <button className="nav-btn" onClick={() => setPage('history')}>
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
