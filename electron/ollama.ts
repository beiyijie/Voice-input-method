import { getWords } from './database'

const OLLAMA_HOST = 'http://127.0.0.1:11434'
const MODEL = 'qwen2.5:7b'

export async function correctText(text: string, systemPrompt?: string): Promise<string> {
  try {
    const words = await getWords()
    const hotwordList = words.map(w => w.word).join('、')
    const basePrompt = systemPrompt || '你是一个语音识别纠错助手。请修正以下文本中的标点符号、大小写和专业术语，不要改变原意。'

    const prompt = `${basePrompt}${hotwordList ? `\n注意以下专业术语：${hotwordList}` : ''}

原始文本：${text}
纠错后：`

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          max_tokens: 512,
        },
      }),
    })

    if (!response.ok) throw new Error(`Ollama returned ${response.status}`)

    const data = await response.json()
    return (data.response || text).trim()
  } catch (err) {
    console.error('Ollama correction failed:', err)
    return text  // Return original text on error
  }
}
