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
    <div style={{ padding: 24, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: 20 }}>历史记录</h2>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 8,
      }}>
        <Search size={18} opacity={0.5} />
        <input
          placeholder="搜索历史记录..."
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div key={item.id} style={{
            padding: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ opacity: 0.5, fontSize: 12 }}>{formatTime(item.created_at)}</span>
              <span style={{ opacity: 0.4, fontSize: 12 }}>{item.duration}秒</span>
            </div>
            <p style={{ margin: '4px 0', lineHeight: 1.5, wordBreak: 'break-all' }}>{item.voice_text}</p>
            {item.optimized_text && (
              <p style={{ margin: '4px 0', lineHeight: 1.5, color: '#7ecf8a', wordBreak: 'break-all' }}>
                ✨ {item.optimized_text}
              </p>
            )}
            <button
              onClick={() => handleCopy(item.optimized_text || item.voice_text, item.id)}
              style={{
                marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
                opacity: 0.5, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 4, transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5' }}
            >
              {copiedId === item.id ? <Check size={14} color="#7ecf8a" /> : <Copy size={14} />}
              {copiedId === item.id ? '已复制' : '复制'}
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 48 }}>暂无历史记录</p>
        )}
      </div>
    </div>
  )
}

export default History
