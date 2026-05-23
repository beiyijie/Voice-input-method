export interface ModeConfig {
  id: string
  name: string
  defaultHotwords: string[]
  correctionPrompt: string
}

export const MODES: Record<string, ModeConfig> = {
  general: {
    id: 'general',
    name: '通用模式',
    defaultHotwords: [],
    correctionPrompt: '你是一个语音识别纠错助手。请修正文本中的标点符号和常见口语错误，保持原意不变。',
  },
  office: {
    id: 'office',
    name: '办公模式',
    defaultHotwords: ['会议', '纪要', '待办', '截止日期', '项目进度', '周报', '汇报'],
    correctionPrompt: '你是一个办公语音识别纠错助手。请修正文本中的标点符号，将口语转化为书面表达，保持正式办公语气。',
  },
  programmer: {
    id: 'programmer',
    name: '程序员模式',
    defaultHotwords: [
      'API', 'Git', 'PR', 'Bug', 'Debug', 'Deploy', 'Config',
      'TypeScript', 'JavaScript', 'React', 'Node.js', 'MySQL',
      'Docker', 'Kubernetes', 'Linux', 'GitHub',
    ],
    correctionPrompt: '你是一个程序员语音识别纠错助手。请修正文本中标点符号，自动将技术术语转为正确的大小写格式（如 API, Git, TypeScript），保持技术准确性。',
  },
}

export function getModeConfig(modeId: string): ModeConfig {
  return MODES[modeId] || MODES.general
}
