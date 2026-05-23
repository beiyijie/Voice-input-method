import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Word {
  id: number
  word: string
  weight: number
  category: string
}

function Settings({ onBack }: { onBack: () => void }) {
  const [words, setWords] = useState<Word[]>([])
  const [newWord, setNewWord] = useState('')
  const [category, setCategory] = useState('')
  const [currentMode, setCurrentMode] = useState('general')

  useEffect(() => {
    loadWords()
    window.electronAPI.getMode().then(m => setCurrentMode(m || 'general'))
  }, [])

  async function handleModeChange(modeId: string) {
    setCurrentMode(modeId)
    await window.electronAPI.setMode(modeId)
  }

  async function loadWords() {
    const list = await window.electronAPI.getWords()
    setWords(list || [])
  }

  async function handleAdd() {
    if (!newWord.trim()) return
    await window.electronAPI.addWord(newWord.trim(), 50, category)
    setNewWord('')
    loadWords()
  }

  async function handleDelete(id: number) {
    await window.electronAPI.deleteWord(id)
    loadWords()
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: 20 }}>设置 - 热词管理</h2>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8, opacity: 0.8 }}>输入模式</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'general', label: '通用模式' },
            { id: 'office', label: '办公模式' },
            { id: 'programmer', label: '程序员模式' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: currentMode === mode.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 13, fontWeight: currentMode === mode.id ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        <input
          placeholder="输入热词..."
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none',
          }}
        />
        <input
          placeholder="分类（可选）"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={handleAdd} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.2)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Plus size={18} /> 添加
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {words.map((w) => (
          <div key={w.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 8,
          }}>
            <div>
              <span style={{ fontSize: 15 }}>{w.word}</span>
              {w.category && (
                <span style={{
                  marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.1)',
                }}>{w.category}</span>
              )}
            </div>
            <button onClick={() => handleDelete(w.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', padding: 4,
            }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {words.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 24 }}>暂无热词，添加专业术语提高识别准确率</p>
        )}
      </div>
    </div>
  )
}

export default Settings
