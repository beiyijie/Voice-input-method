import { useEffect, useState } from 'react'

function Subtitle() {
  const [text, setText] = useState('')
  const [corrected, setCorrected] = useState('')

  useEffect(() => {
    if (window.electronAPI?.onSubtitleUpdate) {
      window.electronAPI.onSubtitleUpdate((result: { text: string }) => {
        setText(result.text)
      })
    }
    if (window.electronAPI?.onCorrectedText) {
      window.electronAPI.onCorrectedText((result: { text: string }) => {
        setCorrected(result.text)
      })
    }
  }, [])

  return (
    <div style={{
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      padding: '12px 20px',
      fontSize: 16,
      fontFamily: '"Microsoft YaHei", sans-serif',
      borderRadius: 12,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ lineHeight: 1.5, opacity: corrected ? 0.6 : 1 }}>
        {text || '等待语音...'}
      </div>
      {corrected && (
        <div style={{ lineHeight: 1.5, marginTop: 6, color: '#7ecf8a' }}>
          ✨ {corrected}
        </div>
      )}
    </div>
  )
}

export default Subtitle
