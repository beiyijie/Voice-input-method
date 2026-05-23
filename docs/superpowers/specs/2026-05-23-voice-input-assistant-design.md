# AI 智能语音输入助手（PC端）设计文档

版本：V1.0
日期：2026-05-23

## 1. 项目概述

一款面向办公与程序员场景的 AI 语音输入工具，实现"语音转文字 + AI纠错 + 跨应用自动输入"。

## 2. 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│  ┌──────────────┐         ┌──────────────────┐  │
│  │  Renderer     │  IPC    │  Main Process    │  │
│  │  (React UI)   │◄──────►│  (Node.js)       │  │
│  │  - 首页        │         │  - 全局热键       │  │
│  │  - 悬浮字幕窗   │         │  - 自动输入       │  │
│  │  - 设置页      │         │  - 系统托盘       │  │
│  │  - 历史页      │         │  - MySQL 操作     │  │
│  └──────────────┘         └────────┬─────────┘  │
└────────────────────────────────────┼────────────┘
                                     │
           ┌─────────────────────────┼──────────────┐
           │                         │               │
           ▼                         ▼               ▼
   ┌──────────────┐       ┌────────────────┐  ┌──────────┐
   │  Python 进程  │       │  Ollama 本地    │  │  MySQL   │
   │  (FunASR)    │       │  Qwen2.5 7B    │  │  数据库   │
   │  录音+识别    │       │  AI纠错        │  │          │
   └──────────────┘       └────────────────┘  └──────────┘
```

### 技术栈

| 层 | 技术 |
|------|-------|
| 桌面端 | Electron + React + TypeScript + Vite |
| 主进程 | Node.js (Express/Koa HTTP 服务) |
| 语音识别 | Python + FunASR (paraformer) |
| AI纠错 | Ollama + Qwen2.5 7B 本地模型 |
| 数据库 | MySQL |
| 全局热键 | electron-global-shortcut |
| 自动输入 | robotjs 或 uiohook-napi |
| 桌面打包 | electron-builder |

## 3. 项目目录结构

```
voice-input-method/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 入口：热键、托盘、窗口管理
│   ├── auto-type.ts             # 自动输入到焦点窗口
│   ├── database.ts              # MySQL 连接与操作
│   ├── ollama.ts                # 调用 Ollama API
│   └── python-bridge.ts         # 管理 Python 子进程（WebSocket）
├── src/                         # React 渲染进程
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx             # 首页：状态、开始按钮
│   │   ├── Subtitle.tsx         # 悬浮字幕窗
│   │   ├── Settings.tsx         # 设置页
│   │   └── History.tsx          # 历史记录
│   ├── components/
│   │   ├── ModeSelector.tsx     # 模式选择
│   │   ├── HotkeyConfig.tsx     # 快捷键配置
│   │   └── WordList.tsx         # 热词管理
│   └── styles/
├── python/                      # Python 识别服务
│   ├── recognizer.py            # 主识别逻辑
│   ├── server.py                # WebSocket 服务端
│   ├── vad.py                   # 语音活动检测
│   └── hotwords.py              # 热词加载
├── resources/                   # 图标、安装资源
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite 构建
└── electron-builder.yml         # 打包配置
```

## 4. 数据库设计

### 4.1 用户热词表 (user_words)

```sql
CREATE TABLE user_words (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL COMMENT '热词',
    weight INT DEFAULT 50 COMMENT '权重(0-100)',
    category VARCHAR(100) DEFAULT '' COMMENT '分类',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_word (word)
) COMMENT='用户自定义热词';
```

### 4.2 语音识别历史表 (voice_history)

```sql
CREATE TABLE voice_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voice_text TEXT NOT NULL COMMENT '原始识别文本',
    optimized_text TEXT COMMENT 'AI纠错后文本',
    duration INT DEFAULT 0 COMMENT '录音时长(秒)',
    language VARCHAR(20) DEFAULT 'zh' COMMENT '语种',
    mode VARCHAR(50) DEFAULT 'general' COMMENT '输入模式',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) COMMENT='语音识别历史';
```

### 4.3 系统配置表 (system_config)

```sql
CREATE TABLE system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='系统配置';

INSERT INTO system_config (config_key, config_value) VALUES
('shortcut_key', 'Ctrl+Space'),
('language', 'zh'),
('mode', 'general');
```

## 5. UI 页面设计

### 5.1 首页
- 状态显示（就绪/录音中）
- 模式选择下拉框
- 开始录音按钮
- 快捷键提示
- 导航（历史记录、设置）

### 5.2 悬浮字幕窗
- 置顶透明窗口
- 实时显示识别文本
- 录音时长显示
- 暂停按钮
- AI纠错结果显示
- 录音结束时自动关闭

### 5.3 设置页
- 快捷键配置
- 语言选择
- 模式选择（通用/办公/程序员）
- AI纠错开关
- 热词管理入口

### 5.4 历史页
- 按时间排列的识别记录
- 搜索功能
- 原始文本与纠错文本对比
- 复制按钮
- 导出功能

## 6. 核心数据流

```
用户按 Ctrl+Space
      │
      ▼
[1] Electron 捕获快捷键
      │
      ├──→ 检查是否已在录音？
      │    是 → 停止录音 → 进入步骤 4
      │    否 → 进入步骤 2
      │
      ▼
[2] 通知 Python 进程开始录音
      │
      ▼
[3] Python 录音 + FunASR 实时识别
      │  ├──→ 每识别出一段文本 → WebSocket 回传 Electron
      │  └──→ Electron 更新悬浮窗显示
      │  └──→ 识别文本 → Ollama 实时纠错 → 显示纠错结果
      │
      ▼
[4] 录音结束（用户再次按快捷键 / 静音超时 2s）
      │
      ▼
[5] Electron 将最终文本存入 MySQL voice_history
      │
      ▼
[6] Electron 调用 auto-type 将文本输入到当前焦点窗口
      │
      ▼
[7] 关闭悬浮窗，回到就绪状态
```

## 7. 通信协议

### Electron ↔ Python (WebSocket)

Python 监听 `127.0.0.1:9877`

**Electron → Python:**
```json
{"type": "start_recording", "language": "zh", "hotwords": ["Redis", "Nacos"]}
{"type": "stop_recording"}
{"type": "update_hotwords", "hotwords": [...]}
{"type": "shutdown"}
```

**Python → Electron:**
```json
{"type": "ready", "pid": 12345}
{"type": "partial_result", "text": "大家好今天我们"}
{"type": "final_result", "text": "大家好今天我们来讨论一下"}
{"type": "corrected_text", "text": "大家好，今天我们来讨论一下。"}
{"type": "error", "message": "模型加载失败"}
```

### Electron ↔ Ollama (HTTP)

调用 Ollama REST API：
```
POST http://localhost:11434/api/generate
{
  "model": "qwen2.5:7b",
  "prompt": "你是一个语音识别纠错助手...",
  "stream": false
}
```

### AI 纠错 Prompt

```
你是一个语音识别纠错助手。以下是用户语音识别的原始文本，
请修正标点、大小写和专业术语，不要改变原意。
专业术语列表：{{热词列表}}
原始文本：{{识别文本}}
纠错后：
```

## 8. 进程管理

- Electron 启动 → spawn Python 子进程
- Python 启动后监听 WebSocket 端口
- Python 崩溃 → Electron 自动重启（最多 3 次）
- Electron 关闭 → 发送 shutdown 给 Python
- Ollama 假设已在系统后台运行

## 9. 开发阶段

参照文档 4 阶段计划：

| 阶段 | 周期 | 内容 |
|-------|--------|---------|
| 第一阶段 | 2周 | Electron 脚手架 + React UI + Python FunASR 集成 + 全局热键 + 自动输入 |
| 第二阶段 | 1周 | 悬浮字幕窗 + 热词库管理 + 历史记录 |
| 第三阶段 | 1周 | AI纠错集成 + 模式系统 |
| 第四阶段 | 1周 | 语音命令 + UI优化 + electron-builder 打包 |
