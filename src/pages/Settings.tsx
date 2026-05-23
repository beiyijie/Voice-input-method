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
  const [shortcutKey, setShortcutKey] = useState('Alt+V')

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
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="page-title">设置</h2>
      </div>

      {/* Input Mode */}
      <div className="setting-section">
        <div className="setting-label">输入模式</div>
        <div className="setting-card">
          <div className="chip-group">
            {[
              { id: 'general', label: '通用' },
              { id: 'office', label: '办公' },
              { id: 'programmer', label: '编程' },
            ].map((mode) => (
              <button
                key={mode.id}
                className={`chip ${currentMode === mode.id ? 'active' : ''}`}
                onClick={() => handleModeChange(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="setting-section">
        <div className="setting-label">识别语言</div>
        <div className="setting-card">
          <div className="chip-group">
            {[
              { id: 'zh', label: '普通话' },
              { id: 'en', label: 'English' },
              { id: 'yue', label: '粤语' },
            ].map((lang) => (
              <button
                key={lang.id}
                className={`chip ${language === lang.id ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.id)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Correction */}
      <div className="setting-section">
        <div className="setting-card">
          <div className="toggle-row">
            <span className="toggle-label">AI 智能纠错</span>
            <button
              className={`toggle-track ${aiCorrect ? 'on' : 'off'}`}
              onClick={handleAiToggle}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>
      </div>

      {/* Shortcut */}
      <div className="setting-section">
        <div className="setting-label">全局快捷键</div>
        <div className="setting-card">
          <div className="shortcut-display">
            <span className="shortcut-key-display">{shortcutKey}</span>
          </div>
        </div>
      </div>

      {/* Hotwords */}
      <div className="setting-section">
        <div className="setting-label">热词</div>
        <div className="input-row">
          <input
            className="input-field"
            placeholder="输入热词..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            className="input-field"
            style={{ width: 80, flex: 'none' }}
            placeholder="分类"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={handleAdd}>
            <Plus size={16} /> 添加
          </button>
        </div>
      </div>

      <div className="word-list">
        {words.map((w) => (
          <div key={w.id} className="word-item">
            <div>
              <span className="word-text">{w.word}</span>
              {w.category && (
                <span className="word-category">{w.category}</span>
              )}
            </div>
            <button className="word-delete" onClick={() => handleDelete(w.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {words.length === 0 && (
          <p className="empty-state">暂无热词，添加后可提高识别准确率</p>
        )}
      </div>
    </div>
  )
}

export default Settings
