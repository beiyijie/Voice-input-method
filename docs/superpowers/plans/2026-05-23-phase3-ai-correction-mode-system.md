# AI 智能语音输入助手 Phase 3 实现计划

**Goal:** AI 纠错 + 多模式系统

---

## PR10: Ollama AI 纠错

**目的：** 集成 Ollama 本地模型，对识别文本进行智能纠错

**Files:**
- Create: `electron/ollama.ts` — Ollama API 调用
- Modify: `electron/main.ts` — 纠错流程接入
- Modify: `electron/subtitle-window.ts` — 显示纠错结果
- Modify: `src/pages/Subtitle.tsx` — 纠错结果展示

## PR11: 多模式系统

**目的：** 通用/办公/程序员三种模式，不同热词和纠错风格

**Files:**
- Modify: `electron/main.ts` — 模式切换逻辑
- Modify: `src/pages/Settings.tsx` — 模式选择UI
- Modify: `electron/preload.ts` — 模式API
- Modify: `src/vite-env.d.ts` — 类型声明

## PR12: 设置页完善

**目的：** 完善设置页，添加快捷键配置、语言选择、AI纠错开关

**Files:**
- Modify: `src/pages/Settings.tsx` — 完整设置页
- Modify: `electron/main.ts` — 配置存储
