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
      background: 'rgba(10, 10, 15, 0.75)',
      color: '#e8e8ed',
      padding: '14px 22px',
      fontSize: 15,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
      borderRadius: 12,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        lineHeight: 1.5,
        opacity: corrected ? 0.5 : 1,
        fontSize: corrected ? 14 : 15,
        transition: 'all 0.3s',
      }}>
        {text || (
          <span style={{ opacity: 0.3, fontStyle: 'italic' }}>等待语音...</span>
        )}
      </div>
      {corrected && (
        <div style={{
          lineHeight: 1.5,
          marginTop: 8,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(129, 140, 248, 0.85)',
          fontSize: 15,
        }}>
          {corrected}
        </div>
      )}
    </div>
  )
}

export default Subtitle
