import { exec } from 'child_process'
import { shell } from 'electron'

interface Command {
  keywords: string[]
  description: string
  execute: (params: string) => Promise<void>
}

const COMMANDS: Command[] = [
  {
    keywords: ['打开', '启动', '运行'],
    description: '打开应用 打开浏览器',
    execute: async (params: string) => {
      const appMap: Record<string, string> = {
        '浏览器': 'start chrome',
        '记事本': 'notepad',
        '计算器': 'calc',
        '画图': 'mspaint',
        '命令行': 'start cmd',
        '终端': 'start cmd',
        '文件管理器': 'explorer',
        '我的电脑': 'explorer',
        '设置': 'start ms-settings:',
      }
      const cmd = appMap[params] || `start ${params}`
      exec(cmd, (err) => {
        if (err) console.error('Command failed:', err)
      })
    },
  },
  {
    keywords: ['搜索', '查一下', '查'],
    description: '搜索内容 搜索天气预报',
    execute: async (params: string) => {
      const query = encodeURIComponent(params)
      await shell.openExternal(`https://www.baidu.com/s?wd=${query}`)
    },
  },
  {
    keywords: ['创建文件', '新建文件'],
    description: '创建文件 日记.txt',
    execute: async (params: string) => {
      const fs = require('fs')
      const path = require('path')
      const home = require('os').homedir()
      const filePath = path.join(home, 'Desktop', params.trim() || '新文件.txt')
      fs.writeFile(filePath, '', (err: Error | null) => {
        if (err) console.error('Create file failed:', err)
      })
    },
  },
  {
    keywords: ['最小化', '隐藏'],
    description: '隐藏窗口',
    execute: async () => {
      const { BrowserWindow } = require('electron')
      BrowserWindow.getFocusedWindow()?.minimize()
    },
  },
]

export function parseCommand(text: string): { command: Command; params: string } | null {
  for (const cmd of COMMANDS) {
    for (const keyword of cmd.keywords) {
      if (text.startsWith(keyword)) {
        const params = text.slice(keyword.length).trim()
        return { command: cmd, params }
      }
    }
  }
  return null
}

export function getCommandDescriptions(): string[] {
  return COMMANDS.map((c) => c.description)
}
