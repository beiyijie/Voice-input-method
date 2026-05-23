import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, Search, Check } from 'lucide-react'

interface HistoryItem {
  id: number
  voice_text: string
  optimized_text: string | null
  duration: number
  created_at: string
}

function History({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory(search?: string) {
    let result: HistoryItem[]
    if (search?.trim()) {
      result = (await window.electronAPI.searchHistory(search.trim())) as HistoryItem[] || []
    } else {
      result = (await window.electronAPI.getHistory(100, 0)) as HistoryItem[] || []
    }
    setItems(result)
  }

  function handleSearch(val: string) {
    setKeyword(val)
    loadHistory(val)
  }

  async function handleCopy(text: string, id: number) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="page-title">历史记录</h2>
      </div>

      <div className="search-bar">
        <Search size={16} opacity={0.4} />
        <input
          placeholder="搜索历史记录..."
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="history-list">
        {items.map((item) => (
          <div key={item.id} className="history-item">
            <div className="history-meta">
              <span className="history-time">{formatTime(item.created_at)}</span>
              <span className="history-duration">{item.duration}秒</span>
            </div>
            <p className="history-text">{item.voice_text}</p>
            {item.optimized_text && (
              <p className="history-text-optimized">{item.optimized_text}</p>
            )}
            <button
              className={`copy-btn ${copiedId === item.id ? 'copied' : ''}`}
              onClick={() => handleCopy(item.optimized_text || item.voice_text, item.id)}
            >
              {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
              {copiedId === item.id ? '已复制' : '复制'}
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="empty-state" style={{ marginTop: 48 }}>暂无历史记录</p>
        )}
      </div>
    </div>
  )
}

export default History
