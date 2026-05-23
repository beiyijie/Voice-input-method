import { useEffect, useState } from 'react'

function Subtitle() {
  const [text, setText] = useState('')

  useEffect(() => {
    if (window.electronAPI?.onSubtitleUpdate) {
      window.electronAPI.onSubtitleUpdate((result: { text: string }) => setText(result.text))
    }
  }, [])

  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '16px 24px',
      fontSize: 18,
      fontFamily: '"Microsoft YaHei", sans-serif',
      borderRadius: 12,
      textAlign: 'center',
      lineHeight: 1.6,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      {text || '等待语音...'}
    </div>
  )
}

export default Subtitle
