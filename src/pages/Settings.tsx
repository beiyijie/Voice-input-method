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
  const [language, setLanguage] = useState('zh')
  const [aiCorrect, setAiCorrect] = useState(true)
  const [shortcutKey, setShortcutKey] = useState('Ctrl+Space')

  useEffect(() => {
    loadWords()
    loadConfig()
  }, [])

  async function loadConfig() {
    const mode = await window.electronAPI.getConfig('mode')
    if (mode) setCurrentMode(mode as string)
    const lang = await window.electronAPI.getConfig('language')
    if (lang) setLanguage(lang as string)
    const ai = await window.electronAPI.getConfig('ai_correct')
    if (ai !== null) setAiCorrect(ai === 'true')
    const key = await window.electronAPI.getConfig('shortcut_key')
    if (key) setShortcutKey(key as string)
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

  async function handleModeChange(modeId: string) {
    setCurrentMode(modeId)
    await window.electronAPI.setMode(modeId)
  }

  async function handleLanguageChange(lang: string) {
    setLanguage(lang)
    await window.electronAPI.setConfig('language', lang)
  }

  async function handleAiToggle() {
    const newVal = !aiCorrect
    setAiCorrect(newVal)
    await window.electronAPI.setConfig('ai_correct', String(newVal))
  }

  return (
    <div style={{ padding: 24, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: 20 }}>设置</h2>
      </div>

      {/* Input Mode */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8, opacity: 0.8 }}>输入模式</h3>
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
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8, opacity: 0.8 }}>识别语言</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'zh', label: '普通话' },
            { id: 'en', label: '英语' },
            { id: 'yue', label: '粤语' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: language === lang.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 13,
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Correction Toggle */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 14, opacity: 0.8 }}>AI 智能纠错</h3>
        <button
          onClick={handleAiToggle}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: aiCorrect ? '#4caf50' : 'rgba(255,255,255,0.2)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3, left: aiCorrect ? 23 : 3,
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Shortcut info */}
      <div style={{ marginBottom: 20, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>全局快捷键</div>
        <div style={{ fontSize: 13, opacity: 0.5 }}>{shortcutKey}</div>
      </div>

      {/* Hotwords */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, opacity: 0.8 }}>热词管理</h3>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
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
          placeholder="分类"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
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

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {words.map((w) => (
          <div key={w.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8,
          }}>
            <div>
              <span style={{ fontSize: 14 }}>{w.word}</span>
              {w.category && (
                <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>
                  {w.category}
                </span>
              )}
            </div>
            <button onClick={() => handleDelete(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', padding: 4 }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {words.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.4, fontSize: 13, marginTop: 16 }}>暂无热词，添加后可提高识别准确率</p>
        )}
      </div>
    </div>
  )
}

export default Settings
