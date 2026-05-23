# AI 智能语音输入助手 Phase 2 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement.

**Goal:** 悬浮字幕窗 + 热词管理 + 历史记录页

**架构：** Electron 渲染进程管理 UI，主进程管理附加窗口和 IPC

---

## PR7: 悬浮字幕窗

**目的：** 录音时显示透明置顶字幕窗口，实时展示识别文本

**Files:**
- Create: `electron/subtitle-window.ts` — 管理字幕窗口创建/销毁
- Modify: `electron/main.ts` — 集成字幕窗口
- Modify: `python/server.py` — 添加实时中间结果发送
- Modify: `electron/python-bridge.ts` — 添加 partial_result 事件

## PR8: 热词管理设置页

**目的：** 设置页中添加热词管理功能，用户可添加/删除专业术语

**Files:**
- Create: `src/pages/Settings.tsx`
- Create: `src/pages/Settings.css`
- Create: `src/components/WordList.tsx`
- Modify: `electron/preload.ts` — 暴露热词 API
- Modify: `electron/main.ts` — 添加热词 IPC handlers
- Modify: `src/vite-env.d.ts` — 更新类型声明

## PR9: 历史记录页面

**目的：** 展示语音识别历史记录，支持搜索和复制

**Files:**
- Create: `src/pages/History.tsx`
- Create: `src/pages/History.css`
- Modify: `src/App.tsx` — 添加页面路由/导航
